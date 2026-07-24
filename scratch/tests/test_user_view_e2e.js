// test_user_view_e2e.js - Agente de Pruebas de la Vista del Usuario (End-to-End User Journey)
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

async function runUserViewE2ETests() {
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

  function assert(condition, message, target = 'UserViewE2E') {
    results.push({
      testName: message,
      target,
      passed: !!condition,
      method: 'End-to-End User Journey Simulation'
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

  // PASO 1: Inicio Limpio sin Sesión (App Startup)
  window.appState.profile = null;
  window.checkOnboarding();

  const onboarding = document.getElementById('onboarding-screen');
  assert(!onboarding.classList.contains('hidden'), "PASO 1: Al iniciar la app sin sesión previa, la pantalla de Login/Registro se despliega obligatoriamente", "#onboarding-screen");

  // PASO 2: Completar Inicio de Sesión
  document.getElementById('profile-first-name').value = 'Andrés';
  document.getElementById('profile-last-name').value = 'Camargo';
  document.getElementById('profile-email').value = 'andres@polyglotlab.local';
  document.getElementById('profile-l1').value = 'Español';

  const form = document.getElementById('onboarding-form');
  form.dispatchEvent(new window.Event('submit', { cancelable: true, bubbles: true }));
  await new Promise(r => setTimeout(r, 100));

  assert(onboarding.classList.contains('hidden'), "PASO 2: Al registrarse / iniciar sesión, se concede acceso al área de trabajo", "#onboarding-screen");
  assert(window.appState.profile && window.appState.profile.firstName === 'Andrés', "El perfil del usuario autenticado se almacena correctamente", "appState.profile");

  // PASO 3: Navegación e Isla de Karaoke
  window.switchMainTab('learn');
  const playerIslandName = document.getElementById('player-island-name').textContent;
  assert(playerIslandName.length > 0, "PASO 3: El reproductor de Karaoke carga y muestra el nombre de la isla activa", "#player-island-name");

  // PASO 4: Mover Isla de Categoría
  window.renderIslandSelectors();
  const topicSelect = document.querySelector('.change-island-topic-select');
  if (topicSelect) {
    topicSelect.value = 'topic_general';
    topicSelect.dispatchEvent(new window.Event('change', { bubbles: true }));
    assert(window.appState.islands[0].topicId === 'topic_general', "PASO 4: Cambiar la categoría de la isla modifica exitosamente la agrupación en el panel lateral", "island.topicId");
  }

  // PASO 5: Cierre de Sesión y Retorno a Login
  window.executeLogout();
  assert(!onboarding.classList.contains('hidden'), "PASO 5: Al presionar 'Cerrar Sesión', el usuario retorna a la pantalla de Login y se borra la sesión", "#sidebar-logout-btn");
  assert(window.appState.profile === null, "El estado del perfil vuelve a ser nulo", "appState.profile");

  return results;
}

if (require.main === module) {
  runUserViewE2ETests().then(res => {
    console.log(`\n--- RESULTADOS AGENTE VISTA DE USUARIO E2E (${res.filter(r=>r.passed).length}/${res.length} PASS) ---`);
  });
}

module.exports = { runUserViewE2ETests };
