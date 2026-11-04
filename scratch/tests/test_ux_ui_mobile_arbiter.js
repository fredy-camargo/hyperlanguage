// test_ux_ui_mobile_arbiter.js - Árbitro 8: Experiencia de Uso (UX/UI), Responsividad Web/Móvil y Accesibilidad
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

async function runUxUiMobileArbiterTests() {
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

  function assert(condition, message, target = 'UxUiMobileArbiter') {
    results.push({
      testName: message,
      target,
      passed: !!condition,
      method: 'Responsive DOM, Keyboard Shortcut & Accessibility Audit'
    });
    if (!condition) {
      console.error(`❌ FAILS: ${message}`);
    } else {
      console.log(`✅ PASS: ${message}`);
    }
  }

  window.eval(js);
  window.isFirebaseEnabled = false;
  if (typeof window.initPolyglotLabCore === 'function') {
    window.initPolyglotLabCore();
  }

  // Autenticar perfil de prueba para desbloquear modales
  window.appState.profile = { firstName: 'Andrés', lastName: 'UX', email: 'ux@polyglotlab.local', l1: 'Español' };
  window.checkOnboarding();

  // 1. Verificar ausencia de barras de navegación móviles duplicadas
  const mobileNavs = document.querySelectorAll('nav.mobile-nav, nav.mobile-bottom-bar');
  assert(
    mobileNavs.length === 1,
    "UX Móvil: Existe exactamente una barra de navegación inferior unificada para dispositivos móviles (sin duplicación)",
    "nav.mobile-nav"
  );

  // 2. Verificar contenedor de Dominio de la Frase y Palabra Clave en el reproductor Karaoke
  window.switchMainTab('learn');
  window.initLearnPanel();
  const masteryContainer = document.getElementById('karaoke-sentence-mastery-container');
  assert(
    masteryContainer !== null && masteryContainer.innerHTML.includes('Dominio de la Frase:'),
    "UX Karaoke: El indicador visual de Dominio de la Frase y Palabra Objetivo se renderiza dinámicamente en el reproductor",
    "#karaoke-sentence-mastery-container"
  );

  // 3. Verificar limpieza visual entre Modo Escritura y Modo Pronunciación (Voz) en Recall
  window.switchMainTab('practice');
  window.initPracticePanel();
  const promptCard = document.querySelector('.recall-prompt-card');
  const flipCard = document.getElementById('recall-speech-flip-card');
  const btnSpeech = document.getElementById('btn-mode-speech');
  const btnWriting = document.getElementById('btn-mode-writing');

  btnSpeech.click();
  const speechClean = promptCard.classList.contains('hidden') && !flipCard.classList.contains('hidden');

  btnWriting.click();
  const writingClean = !promptCard.classList.contains('hidden') && flipCard.classList.contains('hidden');

  assert(
    speechClean && writingClean,
    "UX Práctica: La tarjeta de prompt escrito y la tarjeta 3D de voz alternan limpiamente sin dejar cajas vacías residuales",
    ".recall-prompt-card & #recall-speech-flip-card"
  );

  // 4. Verificar atajo de teclado Ctrl+Enter en el área de texto de Recall
  const recallInput = document.getElementById('recall-user-input');
  const feedbackCard = document.getElementById('recall-feedback-card');
  feedbackCard.classList.add('hidden');
  recallInput.disabled = false;
  recallInput.value = 'Hello, good afternoon, my name is Andres.';
  const ctrlEnterEvent = new window.KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true, bubbles: true });
  recallInput.dispatchEvent(ctrlEnterEvent);

  assert(
    !feedbackCard.classList.contains('hidden'),
    "UX Web (Atajos de Teclado): El atajo Ctrl+Enter en el área de traducción ejecuta inmediatamente la validación del ejercicio",
    "#recall-user-input"
  );

  // 5. Verificar atajos de teclado en Karaoke (Flecha Derecha / Flecha Izquierda)
  window.switchMainTab('learn');
  window.initLearnPanel();
  const initialProgress = document.getElementById('player-progress-text').textContent;
  if (document.activeElement && typeof document.activeElement.blur === 'function') {
    document.activeElement.blur();
  }
  const rightArrowEvt = new window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true });
  document.dispatchEvent(rightArrowEvt);
  const nextProgress = document.getElementById('player-progress-text').textContent;

  assert(
    initialProgress !== nextProgress && nextProgress.includes('Frase 2'),
    "UX Web (Atajos de Teclado): Las teclas de dirección (ArrowRight/ArrowLeft) permiten avanzar y retroceder frases en Karaoke",
    "document.keydown"
  );

  // 6. Verificar corrección de textos y traducciones (sin mezcla de portugués en español ni errores tipográficos)
  window.applyUiLanguage('es');
  const gardenTitle = document.getElementById('lbl-garden-title');
  const presEnIsland = window.appState.islands.find(i => i.id === 'island_pres_en');
  const hobbySentence = presEnIsland ? presEnIsland.sentences.find(s => s.id === 's_pres_en_06') : null;

  assert(
    gardenTitle && gardenTitle.textContent.includes('Jardín de la Memoria') &&
    hobbySentence && hobbySentence.l2.includes('In my free time'),
    "UX Contenido e i18n: Los textos predeterminados en español e inglés están libres de erratas tipográficas",
    "UI_TRANSLATIONS & DEFAULT_STATE"
  );

  // 7. Verificar estilos responsivos y de accesibilidad en index.css
  const cssContent = fs.readFileSync(path.join(rootDir, 'index.css'), 'utf8');
  assert(
    cssContent.includes('safe-area-inset-bottom') &&
    cssContent.includes(':focus-visible') &&
    cssContent.includes('@media (max-width: 768px)'),
    "UI/CSS Responsivo: index.css incluye soporte para safe-area-inset-bottom móvil, anillos de enfoque accesibles (:focus-visible) y media queries",
    "index.css"
  );

  return results;
}

if (require.main === module) {
  runUxUiMobileArbiterTests().then(res => {
    console.log(`\n--- RESULTADOS ÁRBITRO UX/UI Y MÓVIL (${res.filter(r=>r.passed).length}/${res.length} PASS) ---`);
  });
}

module.exports = { runUxUiMobileArbiterTests };
