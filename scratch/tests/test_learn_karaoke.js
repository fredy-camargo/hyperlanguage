// test_learn_karaoke.js - Agente de Pruebas de la vista Aprender (Bucle Karaoke & Islas)
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

async function runLearnKaraokeTests() {
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
  window.SpeechSynthesisUtterance = function(text) { this.text = text; };

  const results = [];

  function assert(condition, message, target = 'KaraokeModule') {
    results.push({
      testName: message,
      target,
      passed: !!condition,
      method: 'DOM Element Event & State Mutator'
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

  // PRUEBA 1: Renderizado de la lista de islas
  window.renderIslandSelectors();
  const islandItems = document.querySelectorAll('.island-item');
  assert(islandItems.length > 0, "La lista de islas en el sidebar (#island-selector-list) renderiza correctamente las tarjetas de isla", ".island-item");

  // PRUEBA 2: Cambio de Categoría directo en tarjeta de isla
  const topicSelect = document.querySelector('.change-island-topic-select');
  assert(topicSelect !== null, "El selector de categoría (.change-island-topic-select) está presente en cada tarjeta de isla", ".change-island-topic-select");

  if (topicSelect) {
    const firstIsland = window.appState.islands[0];
    
    topicSelect.value = 'topic_general';
    topicSelect.dispatchEvent(new window.Event('change', { bubbles: true }));

    assert(firstIsland.topicId === 'topic_general', 
      "Cambiar la opción en el selector desplegable actualiza reactivamente la propiedad 'topicId' de la isla", 
      "island.topicId");
  }

  // PRUEBA 3: Abrir y Editar Isla desde el modal
  const editModalBtn = document.getElementById('btn-edit-active-island');
  assert(editModalBtn !== null, "El botón 'Editar' (#btn-edit-active-island) existe en la barra de herramientas del reproductor", "#btn-edit-active-island");

  window.openEditActiveIslandModal();
  const editScreen = document.getElementById('edit-island-screen');
  assert(!editScreen.classList.contains('hidden'), "Abrir el modal de edición desplega el modal (#edit-island-screen)", "#edit-island-screen");

  const editTopicInput = document.getElementById('edit-island-topic-input');
  assert(editTopicInput !== null, "El modal de edición incluye un selector de Categoría/Tema (#edit-island-topic-input)", "#edit-island-topic-input");

  // PRUEBA 4: Controladores del reproductor (Speed Reset & Next/Prev)
  const speedResetBtn = document.getElementById('btn-speed-reset');
  const speedInput = document.getElementById('tts-speed');
  speedInput.value = '1.5';
  speedResetBtn.click();
  assert(speedInput.value === '1.0' || speedInput.value === '1', "El botón '1.0x' (#btn-speed-reset) restablece la velocidad de reproducción a 1.0x", "#btn-speed-reset");

  const prevBtn = document.getElementById('btn-prev-sentence');
  const nextBtn = document.getElementById('btn-next-sentence');
  assert(prevBtn !== null && nextBtn !== null, "Los botones de navegación de oraciones (#btn-prev-sentence y #btn-next-sentence) están correctamente vinculados", ".controls-row");

  return results;
}

if (require.main === module) {
  runLearnKaraokeTests().then(res => {
    console.log(`\n--- RESULTADOS AGENTE KARAOKE (${res.filter(r=>r.passed).length}/${res.length} PASS) ---`);
  });
}

module.exports = { runLearnKaraokeTests };
