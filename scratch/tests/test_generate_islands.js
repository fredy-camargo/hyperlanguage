// test_generate_islands.js - Agente de Pruebas de la vista Generar Islas (IA, Manual & Archivo Plano)
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

async function runGenerateIslandsTests() {
  const html = fs.readFileSync(path.join(__dirname, '../../index.html'), 'utf8');
  const js = fs.readFileSync(path.join(__dirname, '../../app.js'), 'utf8');

  const dom = new JSDOM(html, {
    url: 'http://localhost:8000/',
    runScripts: 'dangerously',
    resources: 'usable'
  });

  const { window } = dom;
  const { document } = window;

  window.speechSynthesis = { cancel: () => {}, speak: () => {}, getVoices: () => [] };
  window.SpeechSynthesisUtterance = function(t) { this.text = t; };

  const results = [];

  function assert(condition, message, target = 'GeneratorModule') {
    results.push({
      testName: message,
      target,
      passed: !!condition,
      method: 'Subtab Navigation & Form Processing Assertion'
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

  window.appState.profile = { firstName: 'Test', lastName: 'User', email: 'test@local', l1: 'Español' };
  window.checkOnboarding();

  window.switchMainTab('generate');

  // PRUEBA 1: Subpestañas de modo (IA vs Manual vs Importar)
  const btnModeAi = document.getElementById('btn-mode-ai');
  const btnModeManual = document.getElementById('btn-mode-manual');
  const btnModeImport = document.getElementById('btn-mode-import');

  const panelAi = document.getElementById('panel-gen-ai');
  const panelManual = document.getElementById('panel-gen-manual');
  const panelImport = document.getElementById('panel-gen-import');

  assert(btnModeAi !== null && btnModeManual !== null && btnModeImport !== null, "Las subpestañas de modo (IA, Manual, Archivo Plano) están presentes", ".sub-tabs-container");

  window.toggleGenerateMode('manual');
  assert(!panelManual.classList.contains('hidden'), "Hacer clic en 'Crear Manualmente' activa el panel manual (#panel-gen-manual)", "#panel-gen-manual");

  window.toggleGenerateMode('import');
  assert(!panelImport.classList.contains('hidden'), "Hacer clic en 'Cargar Archivo Plano' activa el panel de importación (#panel-gen-import)", "#panel-gen-import");

  window.toggleGenerateMode('ai');
  assert(!panelAi.classList.contains('hidden'), "Hacer clic en 'Generar con IA' retorna al panel principal de IA (#panel-gen-ai)", "#panel-gen-ai");

  // PRUEBA 2: Creador Manual de Oraciones
  window.toggleGenerateMode('manual');
  document.getElementById('manual-island-name').value = 'Isla Manual de Prueba';
  document.getElementById('manual-sentence-l1').value = 'Hola mundo';
  document.getElementById('manual-sentence-l2').value = 'Hello world';
  document.getElementById('manual-sentence-word').value = 'world';

  window.addManualSentence();

  const previewArea = document.getElementById('manual-list-preview-area');
  assert(!previewArea.classList.contains('hidden'), "Añadir oración en modo manual despliega la tabla de vista previa (#manual-list-preview-area)", "#manual-list-preview-area");

  // PRUEBA 3: Importador de Archivos Planos por Textarea
  window.toggleGenerateMode('import');
  const importTextarea = document.getElementById('import-textarea');
  importTextarea.value = "Hola | Hello | hello\nGracias | Thank you | thanks";

  window.processImportInput();

  const importPreview = document.getElementById('import-preview-area');
  assert(!importPreview.classList.contains('hidden'), "Pegar texto delimitado procesa y muestra la vista previa de importación (#import-preview-area)", "#import-preview-area");

  return results;
}

if (require.main === module) {
  runGenerateIslandsTests().then(res => {
    console.log(`\n--- RESULTADOS AGENTE GENERADOR (${res.filter(r=>r.passed).length}/${res.length} PASS) ---`);
  });
}

module.exports = { runGenerateIslandsTests };
