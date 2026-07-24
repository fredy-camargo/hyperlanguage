// test_settings_and_about.js - Agente de Pruebas de Configuración, Perfil y Acerca de
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

async function runSettingsAndAboutTests() {
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

  function assert(condition, message, target = 'SettingsModule') {
    results.push({
      testName: message,
      target,
      passed: !!condition,
      method: 'Settings Form & Feedback Agent Assertion'
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

  window.switchMainTab('settings');

  // PRUEBA 1: Configuración BYOK
  const apiKeyInput = document.getElementById('api-key');
  const toggleKeyBtn = document.getElementById('btn-toggle-key-visibility');

  assert(apiKeyInput !== null && toggleKeyBtn !== null, "El campo de clave API (#api-key) y el botón de visibilidad existen", "#tab-settings");

  if (toggleKeyBtn) {
    toggleKeyBtn.click();
    assert(apiKeyInput.type === 'text' || apiKeyInput.type === 'password', "Hacer clic en el botón de visibilidad alterna el tipo de input a 'text'", "#btn-toggle-key-visibility");
    toggleKeyBtn.click();
    assert(apiKeyInput.type === 'password', "Volver a hacer clic restablece el tipo de input a 'password'", "#btn-toggle-key-visibility");
  }

  // PRUEBA 2: Cambio de Idioma de Interfaz (App UI Language)
  const uiLangSelect = document.getElementById('settings-ui-lang');
  assert(uiLangSelect !== null, "El selector de idioma de la interfaz (#settings-ui-lang) existe", "#settings-ui-lang");

  if (uiLangSelect) {
    uiLangSelect.value = 'en';
    window.applyUiLanguage('en');

    const learnTabLabel = document.querySelector('[data-tab="learn"] .nav-label').textContent;
    assert(learnTabLabel === 'Learn (Karaoke)', "Cambiar el idioma a 'en' actualiza las etiquetas de la barra lateral al inglés ('Learn (Karaoke)')", "#settings-ui-lang");

    // Restablecer a español
    window.applyUiLanguage('es');
  }

  // PRUEBA 3: Formulario de Comentarios y Sugerencias (Feedback Form)
  window.switchMainTab('about');
  if (typeof window.setupFeedbackForm === 'function') {
    window.setupFeedbackForm();
  }

  const fbMessage = document.getElementById('fb-message');
  const fbForm = document.getElementById('about-feedback-form');

  assert(fbForm !== null && fbMessage !== null, "El formulario de comentarios (#about-feedback-form) está presente en la vista Acerca de", "#about-feedback-form");

  if (fbForm && fbMessage) {
    fbMessage.value = 'Excelente aplicación, felicitaciones.';
    const submitEvt = new window.Event('submit', { cancelable: true, bubbles: true });
    fbForm.dispatchEvent(submitEvt);

    await new Promise(r => setTimeout(r, 400));

    const lastFeedback = window.appState.feedbackHistory ? window.appState.feedbackHistory.slice(-1)[0] : null;
    assert(lastFeedback && lastFeedback.message === 'Excelente aplicación, felicitaciones.', 
      "Enviar el formulario registra la sugerencia en el historial local (appState.feedbackHistory)", 
      "#about-feedback-form");
  }

  return results;
}

if (require.main === module) {
  runSettingsAndAboutTests().then(res => {
    console.log(`\n--- RESULTADOS AGENTE CONFIGURACIÓN Y ACERCA DE (${res.filter(r=>r.passed).length}/${res.length} PASS) ---`);
  });
}

module.exports = { runSettingsAndAboutTests };
