// test_methodology_and_guide.js - Agente de Pruebas de la vista Metodología y Guía con Doblaje Neuronal
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

async function runMethodologyTests() {
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

  function assert(condition, message, target = 'MethodologyModule') {
    results.push({
      testName: message,
      target,
      passed: !!condition,
      method: 'Interactive Video & Neural Audio Assertion'
    });
    if (!condition) {
      console.error(`❌ FAILS: ${message}`);
    } else {
      console.log(`✅ PASS: ${message}`);
    }
  }

  window.eval(js);
  window.isFirebaseEnabled = false;
  if (typeof window.initMethodologyPanel === 'function') {
    window.initMethodologyPanel();
  }

  window.appState.profile = { firstName: 'Test', lastName: 'User', email: 'test@local', l1: 'Español' };
  window.checkOnboarding();

  window.switchMainTab('methodology');

  // PRUEBA 1: Los 4 contenedores de video tutoriales existen
  const vKaraoke = document.getElementById('video-container-karaoke');
  const vPractice = document.getElementById('video-container-practice');
  const vCreate = document.getElementById('video-container-create_islands');
  const vCategories = document.getElementById('video-container-categories');

  assert(vKaraoke !== null && vPractice !== null && vCreate !== null && vCategories !== null, 
    "Los 4 contenedores de video tutoriales (Karaoke, Práctica, Creación de Islas, Categorías) están presentes en la interfaz", 
    ".tutorial-video-container");

  // PRUEBA 2: Controles de video (Play, Stop, Reiniciar)
  const playBtn = document.querySelector('.btn-play[data-target="karaoke"]');
  assert(playBtn !== null, "El botón 'Reproducir' (.btn-play) está presente y configurado para el video de Karaoke", ".btn-play");

  if (playBtn) {
    playBtn.click();
    const placeholder = document.getElementById('video-placeholder-karaoke');
    assert(placeholder && placeholder.classList.contains('hidden'), "Reproducir el video remueve el overlay de pausa (#video-placeholder-karaoke)", "#video-placeholder-karaoke");
  }

  // PRUEBA 3: Cambio de idioma de doblaje por voz
  const langSelect = document.querySelector('.narration-lang[data-tutorial="categories"]');
  const narrationText = document.getElementById('narration-categories-text');

  assert(langSelect !== null && narrationText !== null, "El selector de idioma de doblaje (.narration-lang) y el texto de narración (#narration-categories-text) existen", ".narration-controls");

  if (langSelect && narrationText) {
    langSelect.value = 'Inglés';
    const changeEvt = new window.Event('change', { bubbles: true });
    langSelect.dispatchEvent(changeEvt);

    assert(narrationText.textContent.includes('In this tutorial you will learn how to organize your islands'), 
      "Cambiar el idioma a 'Inglés' actualiza el texto de la narración al inglés de forma instantánea", 
      "#narration-categories-text");
  }

  // PRUEBA 4: Botón de reproducción de doblaje por voz neuronal
  const playNarrationBtn = document.querySelector('.btn-play-narration[data-tutorial="karaoke"]');
  assert(playNarrationBtn !== null, "El botón 'Reproducir Doblaje' (.btn-play-narration) está presente en la interfaz", ".btn-play-narration");

  return results;
}

if (require.main === module) {
  runMethodologyTests().then(res => {
    console.log(`\n--- RESULTADOS AGENTE METODOLOGÍA (${res.filter(r=>r.passed).length}/${res.length} PASS) ---`);
  });
}

module.exports = { runMethodologyTests };
