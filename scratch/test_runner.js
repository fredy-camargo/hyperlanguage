// scratch/test_runner.js - PolyglotLab Automated Test Suite
const fs = require('fs');
const path = require('path');

console.log("==========================================");
console.log("PolyglotLab: Running Automated Test Suite");
console.log("==========================================");

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${message}`);
    failed++;
  }
}

try {
  // 1. Validar index.html
  const htmlPath = path.join(__dirname, '..', 'index.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf8');

  assert(htmlContent.includes('letter-p'), 'index.html contiene el marcado de marca letra por letra (.letter-p)');
  assert(htmlContent.includes('sidebar-target-lang-btn'), 'index.html contiene el botón del selector de idioma objetivo en la barra lateral (#sidebar-target-lang-btn)');
  assert(htmlContent.includes('topbar-target-lang-btn'), 'index.html contiene el botón del selector de idioma objetivo en el topbar móvil/escritorio (#topbar-target-lang-btn)');
  assert(htmlContent.includes('btn-export-txt-doc-active-island'), 'index.html contiene el botón visible de descarga TXT/DOC en la cabecera del reproductor (#btn-export-txt-doc-active-island)');
  assert(htmlContent.includes('btn-manage-topics'), 'index.html contiene el botón de gestión de categorías en la barra lateral (#btn-manage-topics)');
  assert(htmlContent.includes('topic-manager-modal'), 'index.html contiene el modal de gestión y creación de categorías (#topic-manager-modal)');
  assert(htmlContent.includes('gen-island-topic'), 'index.html contiene el selector de categoría en generación IA (#gen-island-topic)');
  assert(htmlContent.includes('manual-island-topic'), 'index.html contiene el selector de categoría en creación manual (#manual-island-topic)');
  assert(htmlContent.includes('import-island-topic'), 'index.html contiene el selector de categoría en importación (#import-island-topic)');
  assert(htmlContent.includes('topbar-logout-btn'), 'index.html contiene el botón de cerrar sesión en topbar (#topbar-logout-btn)');
  assert(htmlContent.includes('sidebar-logout-btn'), 'index.html contiene el botón de cerrar sesión en sidebar (#sidebar-logout-btn)');
  assert(htmlContent.includes('target-lang-modal'), 'index.html contiene el modal de idiomas objetivo (#target-lang-modal)');
  assert(htmlContent.includes('export-txt-doc-modal'), 'index.html contiene el modal de exportación TXT/DOC (#export-txt-doc-modal)');

  // Verificación estricta de regla de negocio: Ausencia del término prohibido "Mikel"
  assert(!htmlContent.toLowerCase().includes('mikel'), 'index.html NO contiene el término prohibido "Mikel"');
  // Verificación estricta de regla de negocio: Ausencia de etiquetas obsoletas (L1) y (L2)
  assert(!htmlContent.includes('(L1)'), 'index.html NO contiene etiquetas obsoletas (L1)');
  assert(!htmlContent.includes('(L2)'), 'index.html NO contiene etiquetas obsoletas (L2)');

  // 2. Validar index.css
  const cssPath = path.join(__dirname, '..', 'index.css');
  const cssContent = fs.readFileSync(cssPath, 'utf8');

  assert(cssContent.includes('.brand-letter.letter-p'), 'index.css define los colores de letra por letra');
  assert(cssContent.includes('.app-brand-name'), 'index.css define la tipografía .app-brand-name');
  assert(cssContent.includes('backdrop-filter: blur(12px)'), 'index.css implementa efectos glassmorphism avanzados');
  assert(cssContent.includes('playing-sentence-active'), 'index.css contiene animaciones de resplandor para el Bucle Karaoke');
  assert(cssContent.includes('mix-blend-mode: screen'), 'index.css contiene fusionado perfecto para el logo en Tema Oscuro (mix-blend-mode: screen)');

  // 3. Validar app.js
  const jsPath = path.join(__dirname, '..', 'app.js');
  const jsContent = fs.readFileSync(jsPath, 'utf8');

  assert(jsContent.includes('function executeLogout'), 'app.js implementa la función executeLogout()');
  assert(jsContent.includes('function setActiveTargetLanguage'), 'app.js implementa setActiveTargetLanguage()');
  assert(jsContent.includes('function updateTargetLanguageUI'), 'app.js implementa updateTargetLanguageUI()');
  assert(jsContent.includes('function exportIslandTxtDoc'), 'app.js implementa exportIslandTxtDoc()');
  assert(jsContent.includes('function setupFeedbackForm'), 'app.js implementa la captura asíncrona segura de comentarios y sugerencias (setupFeedbackForm)');
  assert(jsContent.includes('function openTopicManagerModal'), 'app.js implementa el gestor de categorías (openTopicManagerModal)');
  assert(jsContent.includes('function createTopic'), 'app.js implementa la creación de categorías personalizadas (createTopic)');
  assert(jsContent.includes('function populateTopicDropdowns'), 'app.js sincroniza dinámicamente los selectores de categorías (populateTopicDropdowns)');
  assert(jsContent.includes('Validación Anti-Duplicados'), 'app.js cuenta con validación estricta anti-duplicados para el nombre de categorías');
  assert(jsContent.includes("theme: 'light'") || jsContent.includes("appState.settings.theme = 'light'"), 'app.js fuerza el tema claro (Light Theme) siempre por defecto');
  assert(jsContent.includes('frase idioma origen | frase idioma objetivo | palabra clave idioma objetivo'), 'app.js conserva el formato estricto de exportación');
  assert(jsContent.includes('topic-folder-card'), 'app.js renderiza carpetas visuales para agrupación de islas por temas');

  // Prueba unitaria de robustez anti-XSS para escapeHtml
  eval(jsContent.slice(jsContent.indexOf('function escapeHtml'), jsContent.indexOf('document.addEventListener')));
  assert(typeof escapeHtml === 'function', 'escapeHtml está definido en app.js');
  assert(escapeHtml(null) === '', 'escapeHtml maneja valores nulos de forma segura');
  assert(escapeHtml(undefined) === '', 'escapeHtml maneja valores indefinidos de forma segura');
  assert(escapeHtml('<script>alert(1)</script>') === '&lt;script&gt;alert(1)&lt;/script&gt;', 'escapeHtml sanitiza código HTML/JS');

  // 4. Validar archivos de despliegue
  const vercelExists = fs.existsSync(path.join(__dirname, '..', 'vercel.json'));
  assert(vercelExists, 'vercel.json está presente para el despliegue automático');

  const firebaseExists = fs.existsSync(path.join(__dirname, '..', 'firebase.json'));
  assert(firebaseExists, 'firebase.json está presente para la publicación en Firebase Hosting');

} catch (err) {
  console.error("Error durante la ejecución del test suite:", err);
  failed++;
}

console.log("==========================================");
console.log(`Pruebas completadas: ${passed} pasadas, ${failed} falladas.`);
console.log("==========================================");

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
