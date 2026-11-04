# dev_server.py - Servidor local ligero y blindado (Zero-Trust OWASP 2025) para PolyglotLab PWA
import http.server
import socketserver
import socket
import sys
import urllib.parse
import tempfile
import os
import re
import asyncio
import edge_tts
import base64
import json

PORT = 8000
DEFAULT_HOST = "127.0.0.1"
MAX_TEXT_LENGTH = 1000
MAX_EXPORT_BYTES = 50 * 1024 * 1024  # 50 MB límite estricto contra DoS

# Expresión regular estricta para validar voces Neurales de Edge-TTS (evita inyección SSML)
SAFE_VOICE_RE = re.compile(r"^[a-zA-Z]{2,3}-[a-zA-Z]{2,4}-[a-zA-Z0-9]+Neural$")
# Expresión regular estricta para nombres de archivo de exportación
SAFE_EXPORT_FILENAME_RE = re.compile(r"^[a-zA-Z0-9_\-\.]{1,120}\.zip$")

# Extensiones y rutas bloqueadas para evitar exposición de código fuente o dotfiles
BLOCKED_EXTENSIONS = {".py", ".pyc", ".sh", ".ps1", ".bat", ".env", ".db", ".sqlite", ".log"}
BLOCKED_DIRS = {".git", ".venv", ".harness", ".gemini", ".system_generated", "node_modules", "scratch", "__pycache__", "api"}


def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
        return local_ip
    except Exception:
        return "127.0.0.1"


def sanitize_voice(voice_raw: str) -> str:
    voice = (voice_raw or "").strip()
    if SAFE_VOICE_RE.match(voice):
        return voice
    return "en-US-JennyNeural"


def sanitize_export_filename(filename_raw: str, default_name: str = "export.zip") -> str:
    base = os.path.basename((filename_raw or "").strip())
    base = re.sub(r"[^a-zA-Z0-9_\-\.]", "_", base)
    if not base.lower().endswith(".zip"):
        base += ".zip"
    if not SAFE_EXPORT_FILENAME_RE.match(base) or ".." in base:
        return default_name
    return base


class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Cabeceras de seguridad Zero-Trust (OWASP 2025)
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "DENY")
        self.send_header("Referrer-Policy", "strict-origin-when-cross-origin")
        self.send_header("Permissions-Policy", "geolocation=(), camera=(), payment=(), usb=()")
        self.send_header("Cross-Origin-Opener-Policy", "same-origin-allow-popups")
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def list_directory(self, path):
        # Deshabilitar listado de directorios por seguridad
        self.send_error(403, "Directory listing is disabled")
        return None

    def _is_blocked_static_path(self, raw_path: str) -> bool:
        parsed_path = urllib.parse.unquote(urllib.parse.urlparse(raw_path).path)
        parts = [p for p in parsed_path.split("/") if p]
        for part in parts:
            if part.startswith(".") or part in BLOCKED_DIRS:
                return True
        _, ext = os.path.splitext(parsed_path.lower())
        if ext in BLOCKED_EXTENSIONS:
            return True
        return False

    def do_GET(self):
        if self.path.startswith("/api/tts"):
            self.handle_api_tts()
        elif self.path.startswith("/api/silence"):
            self.handle_api_silence()
        elif self.path.startswith("/exports/"):
            self.handle_get_export()
        else:
            if self._is_blocked_static_path(self.path):
                self.send_error(403, "Forbidden resource")
                return
            super().do_GET()

    def handle_get_export(self):
        try:
            raw_name = os.path.basename(urllib.parse.urlparse(self.path).path)
            filename = sanitize_export_filename(raw_name, default_name="")
            if not filename:
                self.send_error(400, "Invalid export filename")
                return

            exports_dir = os.path.abspath(os.path.join(os.getcwd(), "exports"))
            file_path = os.path.abspath(os.path.join(exports_dir, filename))

            if os.path.commonpath([exports_dir, file_path]) != exports_dir:
                self.send_error(403, "Access denied")
                return

            if not os.path.exists(file_path):
                self.send_error(404, "Export file not found")
                return

            with open(file_path, "rb") as f:
                zip_data = f.read()

            self.send_response(200)
            self.send_header("Content-Type", "application/zip")
            self.send_header("Content-Disposition", f'attachment; filename="{filename}"')
            self.send_header("Content-Length", str(len(zip_data)))
            self.end_headers()
            self.wfile.write(zip_data)
        except Exception as e:
            print(f"Error serving export: {e}")
            self.send_error(500, "Internal error serving export file")

    def handle_api_tts(self):
        query = urllib.parse.urlparse(self.path).query
        params = urllib.parse.parse_qs(query)

        text = params.get("text", [""])[0].strip()
        voice = sanitize_voice(params.get("voice", ["en-US-JennyNeural"])[0])
        speed_str = params.get("speed", ["1.0"])[0]

        if not text:
            self.send_error(400, "Text parameter is required")
            return

        if len(text) > MAX_TEXT_LENGTH:
            text = text[:MAX_TEXT_LENGTH]

        try:
            speed_val = float(speed_str)
        except ValueError:
            speed_val = 1.0
        speed_val = max(0.5, min(2.0, speed_val))

        rate_percent = int((speed_val - 1.0) * 100)
        rate_str = f"{rate_percent:+}%"

        temp_fd, temp_path = tempfile.mkstemp(suffix=".mp3")
        os.close(temp_fd)

        try:
            async def main_tts():
                communicate = edge_tts.Communicate(text, voice, rate=rate_str)
                await communicate.save(temp_path)

            asyncio.run(main_tts())

            with open(temp_path, "rb") as f:
                mp3_data = f.read()

            self.send_response(200)
            self.send_header("Content-Type", "audio/mpeg")
            self.send_header("Content-Length", str(len(mp3_data)))
            self.end_headers()
            self.wfile.write(mp3_data)

        except Exception as e:
            print(f"Error en TTS de Azure: {e}")
            self.send_error(500, "Error generating speech")
        finally:
            if os.path.exists(temp_path):
                try:
                    os.remove(temp_path)
                except Exception:
                    pass

    def handle_api_silence(self):
        query = urllib.parse.urlparse(self.path).query
        params = urllib.parse.parse_qs(query)
        duration_str = params.get("duration", ["3.5"])[0]

        try:
            duration = float(duration_str)
        except ValueError:
            duration = 3.5
        duration = max(0.5, min(10.0, duration))

        assets_dir = os.path.join(os.getcwd(), "assets")
        s25_path = os.path.join(assets_dir, "silence_2_5s.mp3")
        s10_path = os.path.join(assets_dir, "silence_1s.mp3")
        s05_path = os.path.join(assets_dir, "silence_500ms.mp3")

        mp3_data = b""

        # Intentar responder con silencios digitales puros si están disponibles en assets
        if duration == 3.5 and os.path.exists(s25_path) and os.path.exists(s10_path):
            try:
                with open(s25_path, "rb") as f:
                    mp3_data += f.read()
                with open(s10_path, "rb") as f:
                    mp3_data += f.read()
            except Exception as e:
                print(f"Error leyendo silencios de assets: {e}")
                mp3_data = b""
        elif duration == 3.0 and os.path.exists(s25_path) and os.path.exists(s05_path):
            try:
                with open(s25_path, "rb") as f:
                    mp3_data += f.read()
                with open(s05_path, "rb") as f:
                    mp3_data += f.read()
            except Exception as e:
                print(f"Error leyendo silencios de assets: {e}")
                mp3_data = b""
        elif os.path.exists(s10_path):
            try:
                with open(s10_path, "rb") as f:
                    mp3_data = f.read()
            except Exception:
                mp3_data = b""

        # Fallback seguro a Edge TTS si no hay archivos locales de silencio
        if not mp3_data:
            voice = sanitize_voice(params.get("voice", ["en-US-JennyNeural"])[0])
            temp_fd, temp_path = tempfile.mkstemp(suffix=".mp3")
            os.close(temp_fd)

            try:
                async def main_silence():
                    communicate = edge_tts.Communicate(text="...", voice=voice)
                    await communicate.save(temp_path)

                asyncio.run(main_silence())

                with open(temp_path, "rb") as f:
                    mp3_data = f.read()
            except Exception as e:
                print(f"Error generando silencio dinámico: {e}")
                self.send_error(500, "Error generating silence")
                return
            finally:
                if os.path.exists(temp_path):
                    try:
                        os.remove(temp_path)
                    except Exception:
                        pass

        try:
            self.send_response(200)
            self.send_header("Content-Type", "audio/mpeg")
            self.send_header("Content-Length", str(len(mp3_data)))
            self.end_headers()
            self.wfile.write(mp3_data)
        except Exception as e:
            print(f"Error enviando silencio: {e}")

    def do_POST(self):
        if self.path.startswith("/api/download-helper"):
            self.handle_api_download_helper()
        elif self.path.startswith("/api/save-export"):
            self.handle_api_save_export()
        else:
            self.send_error(501, "Unsupported method")

    def handle_api_save_export(self):
        try:
            query = urllib.parse.urlparse(self.path).query
            params = urllib.parse.parse_qs(query)
            raw_filename = params.get("filename", ["export.zip"])[0]
            filename = sanitize_export_filename(raw_filename, default_name="export.zip")

            content_length = int(self.headers.get("Content-Length", "0"))
            if content_length <= 0 or content_length > MAX_EXPORT_BYTES:
                self.send_error(413, "Payload size invalid or exceeds maximum allowed limit")
                return

            binary_data = self.rfile.read(content_length)

            # Validar firma mágica ZIP (PK\x03\x04 o PK\x05\x06)
            if len(binary_data) < 4 or not (binary_data.startswith(b"PK\x03\x04") or binary_data.startswith(b"PK\x05\x06")):
                self.send_error(400, "Invalid ZIP archive format")
                return

            exports_dir = os.path.abspath(os.path.join(os.getcwd(), "exports"))
            os.makedirs(exports_dir, exist_ok=True)

            file_path = os.path.abspath(os.path.join(exports_dir, filename))
            if os.path.commonpath([exports_dir, file_path]) != exports_dir:
                self.send_error(403, "Access denied")
                return

            with open(file_path, "wb") as f:
                f.write(binary_data)

            response_data = json.dumps({
                "success": True,
                "url": f"/exports/{filename}",
                "filename": filename
            })

            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(response_data)))
            self.end_headers()
            self.wfile.write(response_data.encode("utf-8"))
        except Exception as e:
            print(f"Error en save-export: {e}")
            self.send_error(500, "Internal error saving export")

    def handle_api_download_helper(self):
        try:
            content_length = int(self.headers.get("Content-Length", "0"))
            if content_length <= 0 or content_length > MAX_EXPORT_BYTES:
                self.send_error(413, "Payload size invalid or exceeds maximum allowed limit")
                return

            post_data = self.rfile.read(content_length)
            params = urllib.parse.parse_qs(post_data.decode("utf-8", errors="ignore"))

            raw_filename = params.get("filename", ["download.zip"])[0]
            filename = sanitize_export_filename(raw_filename, default_name="download.zip")
            base64_data = params.get("data", [""])[0]

            zip_bytes = base64.b64decode(base64_data)
            if len(zip_bytes) > MAX_EXPORT_BYTES:
                self.send_error(413, "Decoded archive exceeds maximum allowed limit")
                return

            self.send_response(200)
            self.send_header("Content-Type", "application/zip")
            self.send_header("Content-Disposition", f'attachment; filename="{filename}"')
            self.send_header("Content-Length", str(len(zip_bytes)))
            self.end_headers()
            self.wfile.write(zip_bytes)
        except Exception as e:
            print(f"Error en download-helper: {e}")
            self.send_error(500, "Internal error processing download")


def main():
    host = DEFAULT_HOST
    if "--lan" in sys.argv:
        host = "0.0.0.0"
    local_ip = get_local_ip()
    handler = CustomHandler

    handler.extensions_map.update({
        ".html": "text/html",
        ".css": "text/css",
        ".js": "application/javascript",
        ".json": "application/json",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".zip": "application/zip",
    })

    print("==================================================================")
    print("            POLYGLOTLAB - SERVIDOR LOCAL DE DESARROLLO            ")
    print("==================================================================")
    print(f"Servidor iniciado de forma segura en: http://{host}:{PORT}")
    if host == "0.0.0.0":
        print(f"Acceso LAN habilitado: http://{local_ip}:{PORT}")
    else:
        print("Modo Zero-Trust activo (solo escucha en 127.0.0.1). Usa --lan si deseas abrir en red local.")
    print("==================================================================")
    print("Presiona Ctrl+C para detener el servidor.")

    try:
        with socketserver.ThreadingTCPServer((host, PORT), handler) as httpd:
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor detenido por el usuario.")
        sys.exit(0)
    except Exception as e:
        print(f"\nError al iniciar el servidor: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
