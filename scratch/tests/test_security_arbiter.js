// test_security_arbiter.js - Árbitro 1: Seguridad y Zero-Trust (OWASP 2025)
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

async function runSecurityArbiterTests() {
  const rootDir = path.resolve(__dirname, '../..');
  const html = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
  const js = fs.readFileSync(path.join(rootDir, 'app.js'), 'utf8');

  const dom = new JSDOM(html, {
    url: 'http://localhost:8000/',
    runScripts: 'dangerously',
    resources: 'usable'
  });

  const { window } = dom;
  const { document } = window;
  window.localStorage.clear();
  window.speechSynthesis = { cancel: () => {}, speak: () => {}, getVoices: () => [] };
  window.SpeechSynthesisUtterance = function(t) { this.text = t; };

  const results = [];

  function assert(condition, message, target = 'SecurityZeroTrust') {
    results.push({
      testName: message,
      target,
      passed: !!condition,
      method: 'OWASP 2025 Zero-Trust & XSS/SSRF Penetration Assertion'
    });
    if (!condition) {
      console.error(`❌ FAILS: ${message}`);
    } else {
      console.log(`✅ PASS: ${message}`);
    }
  }

  window.eval(js);
  window.isFirebaseEnabled = false;
  if (typeof window.initMainFormListeners === 'function') {
    window.initMainFormListeners();
  }

  // 1. Prueba de sanitización XSS en escapeHtml()
  const maliciousPayload = `<img src=x onerror="window.__xss_triggered=true"><script>alert(1)</script>"'&`;
  const escaped = window.escapeHtml(maliciousPayload);
  assert(
    !escaped.includes('<script>') && !escaped.includes('<img') && escaped.includes('&lt;script&gt;'),
    "Seguridad XSS: La función escapeHtml neutraliza etiquetas HTML, atributos y vectores de inyección DOM",
    "escapeHtml()"
  );

  // 2. Prueba de inyección XSS en Selector de Idioma Objetivo (Nuevo Idioma con payload XSS)
  const langInput = document.getElementById('new-target-lang-input');
  const addLangBtn = document.getElementById('btn-add-target-lang');
  const xssLang = `<svg onload="window.__xss_lang=1">Klingon`;
  langInput.value = xssLang;
  addLangBtn.click();

  const gridHtml = document.getElementById('target-languages-grid').innerHTML;
  const settingsLangHtml = document.getElementById('settings-target-langs-list').innerHTML;
  assert(
    !gridHtml.includes('<svg onload=') && !settingsLangHtml.includes('<svg onload=') && !window.__xss_lang,
    "Seguridad XSS: El grid y listado de idiomas objetivo escapan nombres de idioma maliciosos sin ejecutar scripts",
    "#target-languages-grid"
  );

  window.appState.targetLanguages = window.appState.targetLanguages.filter(l => l !== xssLang);
  window.setActiveTargetLanguage('Inglés');

  // 3. Prueba de inyección XSS en Creación de Categorías (Topics)
  const xssTopicName = `<b onmouseover="window.__xss_topic=1">FinanzasXSS</b>`;
  const createdTopic = window.createTopic(xssTopicName);
  window.renderTopicManagerList();
  window.renderIslandSelectors();
  const topicListHtml = document.getElementById('topics-manager-list').innerHTML;
  assert(
    !topicListHtml.includes('<b onmouseover=') && !window.__xss_topic,
    "Seguridad XSS: El gestor de categorías y carpetas laterales escapan nombres de temas maliciosos",
    "#topics-manager-list"
  );
  if (createdTopic && createdTopic.id) {
    window.appState.topics = window.appState.topics.filter(t => t.id !== createdTopic.id);
    window.saveAppState();
  }

  // 4. Prueba de Aislamiento de Llaves API BYOK (Zero-Trust Cloud Sync)
  const testSettings = {
    theme: 'dark',
    apiProvider: 'openai',
    apiKey: 'sk-test-secret-key-do-not-sync-123456',
    apiTtsKey: 'sk-tts-secret-key-do-not-sync-789012',
    apiUrl: 'https://api.openai.com/v1'
  };
  const cloudSafe = window.getCloudSafeSettings(testSettings);
  assert(
    cloudSafe.apiKey === undefined && cloudSafe.apiTtsKey === undefined && cloudSafe.apiProvider === 'openai',
    "Seguridad BYOK: getCloudSafeSettings elimina estrictamente apiKey y apiTtsKey antes de sincronizar con Firestore",
    "getCloudSafeSettings()"
  );

  // 5. Prueba de Prevención SSRF y Protocolos Inseguros en validateSafeApiUrl()
  let blockedJavascriptUrl = false;
  let blockedHttpExternalUrl = false;
  try {
    window.validateSafeApiUrl('javascript:alert(1)', 'https://api.openai.com/v1');
  } catch (e) {
    blockedJavascriptUrl = true;
  }
  try {
    window.validateSafeApiUrl('http://evil-attacker.example.com/v1', 'https://api.openai.com/v1');
  } catch (e) {
    blockedHttpExternalUrl = true;
  }
  const allowedHttps = window.validateSafeApiUrl('https://api.openai.com/v1/', 'https://api.openai.com/v1');
  const allowedLocalhost = window.validateSafeApiUrl('http://127.0.0.1:11434/v1', 'https://api.openai.com/v1');

  assert(
    blockedJavascriptUrl && blockedHttpExternalUrl && allowedHttps === 'https://api.openai.com/v1' && allowedLocalhost === 'http://127.0.0.1:11434/v1',
    "Seguridad SSRF: validateSafeApiUrl bloquea esquemas javascript:/http: externos y permite solo HTTPS o loopback 127.0.0.1",
    "validateSafeApiUrl()"
  );

  // 6. Auditoría estática de dev_server.py y api/tts.py
  const devServerCode = fs.readFileSync(path.join(rootDir, 'dev_server.py'), 'utf8');
  const apiTtsCode = fs.readFileSync(path.join(rootDir, 'api/tts.py'), 'utf8');
  assert(
    devServerCode.includes('DEFAULT_HOST = "127.0.0.1"') &&
    devServerCode.includes('SAFE_VOICE_RE') &&
    devServerCode.includes('SAFE_EXPORT_FILENAME_RE') &&
    devServerCode.includes('MAX_EXPORT_BYTES') &&
    !devServerCode.includes("expanduser('~'), 'Downloads'") &&
    apiTtsCode.includes('SAFE_VOICE_RE'),
    "Seguridad Backend: dev_server.py y api/tts.py aplican escucha 127.0.0.1, whitelist de voces, límite de payload y bloqueo de escritura arbitraria",
    "dev_server.py & api/tts.py"
  );

  // 7. Auditoría de .gitignore, .dockerignore y cabeceras en firebase.json / vercel.json
  const gitignoreContent = fs.readFileSync(path.join(rootDir, '.gitignore'), 'utf8');
  const dockerignoreContent = fs.readFileSync(path.join(rootDir, '.dockerignore'), 'utf8');
  const firebaseJson = fs.readFileSync(path.join(rootDir, 'firebase.json'), 'utf8');
  const vercelJson = fs.readFileSync(path.join(rootDir, 'vercel.json'), 'utf8');

  assert(
    gitignoreContent.includes('token.json') &&
    gitignoreContent.includes('credentials.json') &&
    gitignoreContent.includes('.env') &&
    dockerignoreContent.includes('token.json') &&
    firebaseJson.includes('X-Content-Type-Options') &&
    vercelJson.includes('X-Frame-Options'),
    "Seguridad Infraestructura: .gitignore, .dockerignore, firebase.json y vercel.json cumplen con el blindaje OWASP 2025",
    "InfraConfig"
  );

  return results;
}

if (require.main === module) {
  runSecurityArbiterTests().then(res => {
    console.log(`\n--- RESULTADOS ÁRBITRO DE SEGURIDAD (${res.filter(r=>r.passed).length}/${res.length} PASS) ---`);
  });
}

module.exports = { runSecurityArbiterTests };
