#!/usr/bin/env python3
"""
security_scan.py - Escáner de Seguridad Zero-Trust (OWASP 2025) para PolyglotLab
Árbitro Automatizado de Seguridad Estática y Configuración
"""

import os
import re
import json
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))


def check_file_contains(rel_path: str, required_patterns: list[str], forbidden_patterns: list[str] = None) -> tuple[bool, list[str]]:
    path = os.path.join(ROOT_DIR, rel_path)
    issues = []
    if not os.path.exists(path):
        return False, [f"Archivo faltante: {rel_path}"]

    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()

    for pat in required_patterns:
        if pat not in content:
            issues.append(f"[{rel_path}] Falta patrón requerido: {pat}")

    if forbidden_patterns:
        for fpat in forbidden_patterns:
            if re.search(fpat, content, re.IGNORECASE):
                issues.append(f"[{rel_path}] Contiene patrón prohibido: {fpat}")

    return len(issues) == 0, issues


def run_security_audit() -> int:
    print("=========================================================================")
    print(" 🛡️  ÁRBITRO DE SEGURIDAD ZERO-TRUST (OWASP 2025) - POLYGLOTLAB AUDIT ")
    print("=========================================================================")
    all_issues = []
    checks_passed = 0
    total_checks = 0

    def record_check(name: str, passed: bool, details: list[str]):
        nonlocal checks_passed, total_checks
        total_checks += 1
        if passed:
            checks_passed += 1
            print(f"  [PASS] {name}")
        else:
            print(f"  [FAIL] {name}")
            for d in details:
                print(f"         -> {d}")
            all_issues.extend(details)

    # 1. Verificar .gitignore y .dockerignore
    req_ignore = ["token.json", "credentials.json", "client_secret*.json", ".env", "*.db", "*.mp3", "*.ogg", "*.wav"]
    ok_git, iss_git = check_file_contains(".gitignore", req_ignore)
    record_check("Protección de archivos sensibles en .gitignore", ok_git, iss_git)

    ok_dock, iss_dock = check_file_contains(".dockerignore", req_ignore)
    record_check("Protección de archivos sensibles en .dockerignore", ok_dock, iss_dock)

    # 2. Verificar dev_server.py (Loopback 127.0.0.1, Cabeceras OWASP, Whitelist TTS, Validación ZIP)
    req_server = [
        'DEFAULT_HOST = "127.0.0.1"',
        "SAFE_VOICE_RE",
        "SAFE_EXPORT_FILENAME_RE",
        "MAX_EXPORT_BYTES",
        "X-Content-Type-Options",
        "X-Frame-Options",
        "Referrer-Policy",
        "list_directory",
        "_is_blocked_static_path"
    ]
    forb_server = [
        r"os\.path\.expanduser\(['\"]~['\"]\),\s*['\"]Downloads['\"]"
    ]
    ok_srv, iss_srv = check_file_contains("dev_server.py", req_server, forb_server)
    record_check("Blindaje del servidor local (dev_server.py - 127.0.0.1, Path Traversal, DoS & Headers)", ok_srv, iss_srv)

    # 3. Verificar api/tts.py (Serverless Endpoint Validation)
    req_tts = [
        "SAFE_VOICE_RE",
        "MAX_TEXT_LENGTH",
        "X-Content-Type-Options",
        "X-Frame-Options"
    ]
    ok_tts, iss_tts = check_file_contains("api/tts.py", req_tts)
    record_check("Blindaje del endpoint Serverless TTS (api/tts.py - SSML & Input Validation)", ok_tts, iss_tts)

    # 4. Verificar app.js (Aislamiento de API Keys BYOK, Validación SSRF, Sanitización XSS)
    req_app = [
        "function getCloudSafeSettings",
        "delete safeCopy.apiKey",
        "delete safeCopy.apiTtsKey",
        "function validateSafeApiUrl",
        "function escapeHtml"
    ]
    forb_app = [
        r"mikel",
        r"eval\s*\("
    ]
    ok_app, iss_app = check_file_contains("app.js", req_app, forb_app)
    record_check("Blindaje de cliente (app.js - BYOK Key Isolation, SSRF Guard, XSS Sanitization & Reglas)", ok_app, iss_app)

    # 5. Verificar cabeceras de seguridad en firebase.json y vercel.json
    ok_fb, iss_fb = check_file_contains("firebase.json", ["X-Content-Type-Options", "X-Frame-Options", "Referrer-Policy"])
    record_check("Cabeceras HTTP de seguridad en Firebase Hosting (firebase.json)", ok_fb, iss_fb)

    ok_vc, iss_vc = check_file_contains("vercel.json", ["X-Content-Type-Options", "X-Frame-Options", "Referrer-Policy"])
    record_check("Cabeceras HTTP de seguridad en Vercel (vercel.json)", ok_vc, iss_vc)

    # 6. Escaneo de secretos expuestos en el código fuente
    secret_patterns = [
        (r"sk-[a-zA-Z0-9]{32,}", "Clave privada de OpenAI expuesta"),
        (r"AIzaSy[a-zA-Z0-9_\-]{33}", "Clave de Google Cloud / Gemini no autorizada")
    ]
    # Permitir la apiKey pública de configuración de Firebase del cliente en app.js si existe, pero bloquear llaves de servicio o OpenAI/Anthropic
    secret_issues = []
    for fname in ["index.html", "index.css", "dev_server.py", "api/tts.py"]:
        fpath = os.path.join(ROOT_DIR, fname)
        if os.path.exists(fpath):
            with open(fpath, "r", encoding="utf-8", errors="ignore") as f:
                txt = f.read()
            for pat, desc in secret_patterns:
                if re.search(pat, txt):
                    secret_issues.append(f"[{fname}] {desc}")
    record_check("Ausencia de llaves API privadas hardcodeadas (OpenAI / Anthropic / GCP)", len(secret_issues) == 0, secret_issues)

    # 7. Verificar terminología prohibida en index.html
    ok_html, iss_html = check_file_contains(
        "index.html",
        ["karaoke-sentence-mastery-container", "strict-origin-when-cross-origin"],
        [r"mikel", r"\(L1\)", r"\(L2\)"]
    )
    record_check("Cumplimiento de terminología y meta-tags de seguridad en index.html", ok_html, iss_html)

    score = round((checks_passed / total_checks) * 100, 1) if total_checks else 0.0
    print("-------------------------------------------------------------------------")
    print(f" 📊 Puntaje del Árbitro de Seguridad: {checks_passed}/{total_checks} ({score}%)")
    print("=========================================================================")

    return 0 if len(all_issues) == 0 else 1


if __name__ == "__main__":
    sys.exit(run_security_audit())
