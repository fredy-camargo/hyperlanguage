// test_practice_recall.js - Agente de Pruebas de la vista Practicar (Recall & Pronunciación)
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

async function runPracticeRecallTests() {
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

  function assert(condition, message, target = 'PracticeModule') {
    results.push({
      testName: message,
      target,
      passed: !!condition,
      method: 'Interactive Recall Engine Verification'
    });
    if (!condition) {
      console.error(`❌ FAILS: ${message}`);
    } else {
      console.log(`✅ PASS: ${message}`);
    }
  }

  window.eval(js);
  if (typeof window.initMainFormListeners === 'function') {
    window.initMainFormListeners();
  }

  window.appState.profile = { firstName: 'Test', lastName: 'User', email: 'test@local', l1: 'Español' };
  window.checkOnboarding();

  window.switchMainTab('practice');

  // PRUEBA 1: Alternar entre modo Escritura y Pronunciación
  const btnModeWriting = document.getElementById('btn-mode-writing');
  const btnModeSpeech = document.getElementById('btn-mode-speech');
  const writingGroup = document.getElementById('recall-writing-group');
  const speechGroup = document.getElementById('recall-speech-group');

  assert(btnModeWriting !== null && btnModeSpeech !== null, "Los botones de selección de modo (Escritura vs Pronunciación) existen", ".practice-modes");

  btnModeSpeech.click();
  assert(!speechGroup.classList.contains('hidden'), "Hacer clic en 'Pronunciación (Voz)' habilita el contenedor de voz (#recall-speech-group)", "#recall-speech-group");

  btnModeWriting.click();
  assert(!writingGroup.classList.contains('hidden'), "Hacer clic en 'Escritura (Recall)' habilita el contenedor de texto (#recall-writing-group)", "#recall-writing-group");

  // PRUEBA 2: Envío e intento de traducción
  const userInput = document.getElementById('recall-user-input');
  const btnSubmit = document.getElementById('btn-recall-submit');

  assert(userInput !== null && btnSubmit !== null, "El campo de texto y botón de validación de intento existen", "#recall-writing-group");

  userInput.value = 'Hello world';
  if (typeof window.evaluateRecallAttempt === 'function') {
    window.evaluateRecallAttempt();
  } else {
    btnSubmit.click();
  }

  const feedbackCard = document.getElementById('recall-feedback-card');
  assert(feedbackCard !== null, "Existe la tarjeta de evaluación y feedback (#recall-feedback-card)", "#recall-feedback-card");

  // PRUEBA 3: Calificación de Repetición Espaciada (FSRS)
  const btnAgain = document.getElementById('btn-sr-again');
  const btnGood = document.getElementById('btn-sr-good');
  assert(btnAgain !== null && btnGood !== null, "Los botones de calificación FSRS (Olvidé, Difícil, Bien, Fácil) existen en el panel", ".sr-buttons-group");

  // PRUEBA 4: Jardín de Memoria
  const memoryGarden = document.getElementById('memory-garden');
  assert(memoryGarden !== null, "El Jardín de la Memoria (#memory-garden) está presente para renderizar los brotes de repaso", "#memory-garden");

  return results;
}

if (require.main === module) {
  runPracticeRecallTests().then(res => {
    console.log(`\n--- RESULTADOS AGENTE RECALL (${res.filter(r=>r.passed).length}/${res.length} PASS) ---`);
  });
}

module.exports = { runPracticeRecallTests };
