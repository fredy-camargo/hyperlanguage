// test_auth_and_session.js - Agente de Pruebas de Autenticación, Sesión y Control de Acceso
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

async function runAuthTests() {
  const html = fs.readFileSync(path.join(__dirname, '../../index.html'), 'utf8');
  const js = fs.readFileSync(path.join(__dirname, '../../app.js'), 'utf8');

  const dom = new JSDOM(html, {
    url: 'http://localhost:8000/',
    runScripts: 'dangerously',
    resources: 'usable'
  });

  const { window } = dom;
  const { document } = window;

  window.localStorage.clear();

  window.speechSynthesis = { cancel: () => {}, speak: () => {}, getVoices: () => [] };
  window.SpeechSynthesisUtterance = function(text) { this.text = text; };

  const results = [];

  function assert(condition, message, target = 'AuthSystem') {
    results.push({
      testName: message,
      target,
      passed: !!condition,
      method: 'DOM Assertion & State Validation'
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

  // PRUEBA 1: Sin sesión activa (profile === null), onboarding-screen DEBE ser visible
  window.appState.profile = null;
  window.checkOnboarding();

  const onboarding = document.getElementById('onboarding-screen');
  assert(onboarding && !onboarding.classList.contains('hidden'), 
    "Sin sesión activa, el modal de Login/Onboarding (#onboarding-screen) se muestra visible de forma obligatoria", 
    "#onboarding-screen");

  // PRUEBA 2: Envío de formulario de registro / inicio de sesión
  document.getElementById('profile-first-name').value = 'TestUser';
  document.getElementById('profile-last-name').value = 'Polyglot';
  document.getElementById('profile-email').value = 'test@polyglotlab.local';
  document.getElementById('profile-l1').value = 'Español';

  const form = document.getElementById('onboarding-form');
  const submitEvent = new window.Event('submit', { cancelable: true, bubbles: true });
  form.dispatchEvent(submitEvent);

  await new Promise(r => setTimeout(r, 100));

  assert(onboarding.classList.contains('hidden'), 
    "Tras completar el formulario de acceso, el modal de Login se oculta exitosamente", 
    "#onboarding-form");

  const nameBadge = document.getElementById('user-display-name').textContent;
  assert(nameBadge.includes('TestUser Polyglot'), 
    "El badge del perfil de usuario en el sidebar se actualiza con el nombre completo ('TestUser Polyglot')", 
    "#user-display-name");

  // PRUEBA 3: Ejecución de Logout
  const sidebarLogoutBtn = document.getElementById('sidebar-logout-btn');
  assert(sidebarLogoutBtn !== null, "El botón de cerrar sesión en el sidebar (#sidebar-logout-btn) existe y está vinculado", "#sidebar-logout-btn");

  window.executeLogout();

  assert(!onboarding.classList.contains('hidden'), 
    "Al cerrar sesión (Logout), el modal de Login (#onboarding-screen) vuelve a desplegarse y bloquea la interfaz", 
    "#sidebar-logout-btn");

  assert(window.appState.profile === null, 
    "El estado del perfil de usuario (appState.profile) se restablece a null", 
    "window.appState.profile");

  return results;
}

if (require.main === module) {
  runAuthTests().then(res => {
    console.log(`\n--- RESULTADOS AGENTE DE AUTENTICACIÓN (${res.filter(r=>r.passed).length}/${res.length} PASS) ---`);
  });
}

module.exports = { runAuthTests };
