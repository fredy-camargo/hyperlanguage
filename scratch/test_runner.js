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
  assert(htmlContent.includes('topbar-logout-btn'), 'index.html contiene el botón de cerrar sesión en topbar (#topbar-logout-btn)');
  assert(htmlContent.includes('sidebar-logout-btn'), 'index.html contiene el botón de cerrar sesión en sidebar (#sidebar-logout-btn)');
  assert(htmlContent.includes('target-lang-modal'), 'index.html contiene el modal de idiomas objetivo (#target-lang-modal)');
  assert(htmlContent.includes('export-txt-doc-modal'), 'index.html contiene el modal de exportación TXT/DOC (#export-txt-doc-modal)');

  // 2. Validar index.css
  const cssPath = path.join(__dirname, '..', 'index.css');
  const cssContent = fs.readFileSync(cssPath, 'utf8');

  assert(cssContent.includes('.brand-letter.letter-p'), 'index.css define los colores de letra por letra');
  assert(cssContent.includes('.app-brand-name'), 'index.css define la tipografía .app-brand-name');

  // 3. Validar app.js
  const jsPath = path.join(__dirname, '..', 'app.js');
  const jsContent = fs.readFileSync(jsPath, 'utf8');

  assert(jsContent.includes('function executeLogout'), 'app.js implementa la función executeLogout()');
  assert(jsContent.includes('function setActiveTargetLanguage'), 'app.js implementa setActiveTargetLanguage()');
  assert(jsContent.includes('function updateTargetLanguageUI'), 'app.js implementa updateTargetLanguageUI()');
  assert(jsContent.includes('function exportIslandTxtDoc'), 'app.js implementa exportIslandTxtDoc()');
  assert(jsContent.includes('frase idioma origen | frase idioma objetivo | palabra clave idioma objetivo'), 'app.js conserva el formato estricto de exportación');
  assert(jsContent.includes('topic-folder-card'), 'app.js renderiza carpetas visuales para agrupación de islas por temas');

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
