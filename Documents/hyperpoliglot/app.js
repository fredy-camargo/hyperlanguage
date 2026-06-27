// app.js - Client-Side State, TTS Karaoke Loop & LLM BYOK Integrator

// 1. STATE & ALMACENAMIENTO LOCAL
const DEFAULT_STATE = {
  profile: null, // { firstName, lastName, email, l1 }
  settings: {
    theme: 'system',
    apiProvider: 'openai',
    apiKey: '',
    apiUrl: ''
  },
  islands: [
    {
      id: 'island_default_01',
      name: 'Finanzas Corporativas y Datos',
      language: 'Inglés',
      sentences: [
        { id: 's_01', l1: 'Los ajustes de transición bajo IFRS 17 afectarán las ganancias acumuladas iniciales.', l2: 'Transition adjustments under IFRS 17 will impact the opening retained earnings.', word_targeted: 'transition' },
        { id: 's_02', l1: 'Necesitamos conciliar el libro mayor con el sistema de flujo de caja antes de la auditoría.', l2: 'We need to reconcile the general ledger with the cash flow system prior to the audit.', word_targeted: 'reconcile' },
        { id: 's_03', l1: 'El script de Python procesa los datos financieros utilizando concurrencia para optimizar el rendimiento.', l2: 'The Python script parses the financial data using concurrency to optimize performance.', word_targeted: 'parses' },
        { id: 's_04', l1: 'Debemos imputar los gastos indirectos a los grupos de contratos de seguros correspondientes.', l2: 'We must impute indirect expenses to the corresponding groups of insurance contracts.', word_targeted: 'impute' },
        { id: 's_05', l1: 'Pronosticar los flujos de efectivo netos requiere un modelo robusto de análisis de varianza.', l2: 'Forecasting net cash flows requires a robust variance analysis model.', word_targeted: 'forecasting' }
      ]
    }
  ],
  metrics: {
    sessionsCompleted: 0,
    accuracySum: 0,
    totalAttempts: 0
  }
};

let appState = { ...DEFAULT_STATE };

// Cargar estado de localStorage
function loadAppState() {
  const localData = localStorage.getItem('hyperpolyglot_harness_state');
  if (localData) {
    try {
      appState = JSON.parse(localData);
      // Garantizar estructuras básicas en caso de actualizaciones
      if (!appState.islands) appState.islands = [...DEFAULT_STATE.islands];
      if (!appState.metrics) appState.metrics = { ...DEFAULT_STATE.metrics };
      if (!appState.settings) appState.settings = { ...DEFAULT_STATE.settings };
    } catch (e) {
      console.error("Error cargando estado local:", e);
      appState = { ...DEFAULT_STATE };
    }
  } else {
    appState = { ...DEFAULT_STATE };
  }
}

// Guardar estado en localStorage
function saveAppState() {
  localStorage.setItem('hyperpolyglot_harness_state', JSON.stringify(appState));
}

// 2. SISTEMA DE TEMAS (MD3)
function initTheme() {
  const theme = appState.settings.theme || 'system';
  applyTheme(theme);
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const themeIcon = document.getElementById('theme-icon');
  
  let currentActualTheme = theme;
  if (theme === 'system') {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    currentActualTheme = isDark ? 'dark' : 'light';
  }
  
  if (themeIcon) {
    themeIcon.textContent = currentActualTheme === 'dark' ? 'light_mode' : 'dark_mode';
  }
}

// Escuchador de cambios en el tema del sistema
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (appState.settings.theme === 'system') {
    applyTheme('system');
  }
});

// Alternar temas secuencialmente: System -> Light -> Dark
function rotateTheme() {
  const current = appState.settings.theme || 'system';
  let next = 'system';
  if (current === 'system') next = 'light';
  else if (current === 'light') next = 'dark';
  
  appState.settings.theme = next;
  saveAppState();
  applyTheme(next);
}

// 3. NAVEGACIÓN Y PANELES
function initNavigation() {
  const tabs = document.querySelectorAll('[data-tab]');
  tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      const targetTab = tab.getAttribute('data-tab');
      switchTab(targetTab);
    });
  });
  
  // Soporte para navegación móvil
  const mobileLinks = document.querySelectorAll('.mobile-nav-link');
  mobileLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetTab = link.getAttribute('data-tab');
      switchTab(targetTab);
    });
  });

  // Manejo de hashes en URL al cargar
  const hash = window.location.hash.substring(1);
  if (['learn', 'practice', 'generate', 'settings'].includes(hash)) {
    switchTab(hash);
  }
}

function switchTab(tabId) {
  // Detener TTS activo si cambiamos de pestaña
  stopTTS();
  
  // Ocultar todos los paneles
  document.querySelectorAll('.tab-panel').forEach(panel => {
    panel.classList.add('hidden');
  });
  
  // Desactivar todos los links de navegación
  document.querySelectorAll('[data-tab], .mobile-nav-link').forEach(link => {
    link.classList.remove('active');
  });
  
  // Mostrar panel seleccionado
  const activePanel = document.getElementById(`tab-${tabId}`);
  if (activePanel) {
    activePanel.classList.remove('hidden');
  }
  
  // Activar links correspondientes
  document.querySelectorAll(`[data-tab="${tabId}"], .mobile-nav-link[data-tab="${tabId}"]`).forEach(link => {
    link.classList.add('active');
  });
  
  // Actualizar título
  const titleMap = {
    learn: 'Aprender (Karaoke)',
    practice: 'Practicar (Recall Loop)',
    generate: 'Generar Contexto Inteligente',
    settings: 'Configuración del Arnés'
  };
  document.getElementById('view-title').textContent = titleMap[tabId] || 'Hyperpolyglot Harness';
  
  // Ejecutar inicializadores específicos de paneles
  if (tabId === 'learn') initLearnPanel();
  if (tabId === 'practice') initPracticePanel();
  if (tabId === 'settings') loadSettingsPanel();
}

// 4. MOTOR TTS Y SINOPSIS KARAOKE
let currentIslandIndex = 0;
let currentSentenceIndex = 0;
let isPlaying = false;
let currentUtterance = null;
let wordRanges = []; // Mapeo de caracteres para el Karaoke

// Diccionario de códigos de idioma para TTS
const LANG_CODES = {
  'Inglés': 'en-US',
  'Portugués': 'pt-BR',
  'Francés': 'fr-FR',
  'Español': 'es-ES',
  'Alemán': 'de-DE',
  'Italiano': 'it-IT'
};

function initLearnPanel() {
  renderIslandSelectors();
  loadCurrentSentence();
}

function renderIslandSelectors() {
  const container = document.getElementById('island-selector-list');
  container.innerHTML = '';
  
  if (appState.islands.length === 0) {
    container.innerHTML = '<p class="text-secondary small">No tienes islas de aprendizaje. Genera una en la pestaña de Inteligencia Artificial.</p>';
    return;
  }
  
  appState.islands.forEach((island, index) => {
    const item = document.createElement('div');
    item.className = `island-item ${index === currentIslandIndex ? 'active' : ''}`;
    item.innerHTML = `
      <div class="island-info">
        <div class="island-title font-semibold">${escapeHtml(island.name)}</div>
        <div class="island-meta text-secondary small">${island.sentences.length} oraciones • ${escapeHtml(island.language)}</div>
      </div>
      <span class="material-symbols-rounded text-primary">play_arrow</span>
    `;
    item.addEventListener('click', () => {
      stopTTS();
      currentIslandIndex = index;
      currentSentenceIndex = 0;
      renderIslandSelectors();
      loadCurrentSentence();
    });
    container.appendChild(item);
  });
}

function loadCurrentSentence() {
  const island = appState.islands[currentIslandIndex];
  if (!island || island.sentences.length === 0) {
    document.getElementById('karaoke-l1').textContent = "Crea una isla lingüística para comenzar.";
    document.getElementById('karaoke-l2').innerHTML = '<span class="placeholder-text">Ninguna oración cargada.</span>';
    return;
  }
  
  const sentence = island.sentences[currentSentenceIndex];
  document.getElementById('player-island-name').textContent = island.name;
  document.getElementById('player-lang-badge').textContent = island.language;
  document.getElementById('karaoke-l1').textContent = sentence.l1;
  
  // Procesar L2 para el Karaoke: dividir en palabras y registrar rangos de caracteres
  const textL2 = sentence.l2;
  const words = textL2.split(/(\s+)/); // Preservar espacios
  
  let currentCharacterIndex = 0;
  wordRanges = [];
  
  const containerL2 = document.getElementById('karaoke-l2');
  containerL2.innerHTML = '';
  
  words.forEach(chunk => {
    if (chunk.trim() === '') {
      // Espacios
      containerL2.appendChild(document.createTextNode(chunk));
      currentCharacterIndex += chunk.length;
    } else {
      // Palabra
      const span = document.createElement('span');
      span.className = 'karaoke-word';
      span.textContent = chunk;
      
      const start = currentCharacterIndex;
      const end = currentCharacterIndex + chunk.length;
      span.setAttribute('data-start', start);
      span.setAttribute('data-end', end);
      
      // Limpiar signos de puntuación para emparejar con onboundary
      const cleanWord = chunk.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, "");
      
      wordRanges.push({
        word: cleanWord,
        start: start,
        end: end,
        element: span
      });
      
      containerL2.appendChild(span);
      currentCharacterIndex += chunk.length;
    }
  });
}

function playTTS() {
  if (isPlaying) {
    stopTTS();
    return;
  }
  
  const island = appState.islands[currentIslandIndex];
  if (!island) return;
  const sentence = island.sentences[currentSentenceIndex];
  if (!sentence) return;
  
  isPlaying = true;
  document.getElementById('play-pause-icon').textContent = 'pause';
  
  const langCode = LANG_CODES[island.language] || 'en-US';
  const speed = parseFloat(document.getElementById('tts-speed').value) || 0.9;
  
  currentUtterance = new SpeechSynthesisUtterance(sentence.l2);
  currentUtterance.lang = langCode;
  currentUtterance.rate = speed;
  
  // Seleccionar voz adecuada para el idioma si está disponible en el navegador
  const voices = window.speechSynthesis.getVoices();
  const matchedVoice = voices.find(voice => voice.lang.startsWith(langCode));
  if (matchedVoice) {
    currentUtterance.voice = matchedVoice;
  }
  
  // Karaoke: Resaltado en tiempo real con onboundary
  currentUtterance.onboundary = (event) => {
    if (event.name === 'word') {
      const charIndex = event.charIndex;
      highlightWord(charIndex);
    }
  };
  
  currentUtterance.onend = () => {
    clearHighlights();
    isPlaying = false;
    document.getElementById('play-pause-icon').textContent = 'play_arrow';
    
    // Control de bucles y avance
    const repeatPhrase = document.getElementById('toggle-infinite-phrase').checked;
    if (repeatPhrase) {
      // Repetir la misma frase
      setTimeout(playTTS, 600);
    } else {
      // Avanzar a la siguiente oración
      setTimeout(() => {
        advanceSentence(1);
        playTTS();
      }, 800);
    }
  };
  
  currentUtterance.onerror = (e) => {
    console.error("Error en la reproducción de síntesis de voz:", e);
    clearHighlights();
    isPlaying = false;
    document.getElementById('play-pause-icon').textContent = 'play_arrow';
  };
  
  window.speechSynthesis.speak(currentUtterance);
}

function stopTTS() {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  isPlaying = false;
  const icon = document.getElementById('play-pause-icon');
  if (icon) icon.textContent = 'play_arrow';
  clearHighlights();
}

function highlightWord(charIndex) {
  clearHighlights();
  
  // Encontrar la palabra activa según el charIndex
  // Buscamos la palabra cuya posición de inicio sea la más cercana pero menor o igual a charIndex
  let activeRange = null;
  for (let i = 0; i < wordRanges.length; i++) {
    const range = wordRanges[i];
    if (charIndex >= range.start && charIndex < range.end) {
      activeRange = range;
      break;
    }
  }
  
  // Si no se encuentra exactamente (por discrepancias de puntuación), buscar la más cercana
  if (!activeRange) {
    activeRange = wordRanges.reduce((prev, curr) => {
      return (Math.abs(curr.start - charIndex) < Math.abs(prev.start - charIndex) ? curr : prev);
    }, wordRanges[0]);
  }
  
  if (activeRange && activeRange.element) {
    activeRange.element.classList.add('active');
  }
}

function clearHighlights() {
  document.querySelectorAll('.karaoke-word').forEach(el => {
    el.classList.remove('active');
  });
}

function advanceSentence(offset) {
  const island = appState.islands[currentIslandIndex];
  if (!island || island.sentences.length === 0) return;
  
  const wasPlaying = isPlaying;
  stopTTS();
  
  currentSentenceIndex = (currentSentenceIndex + offset + island.sentences.length) % island.sentences.length;
  loadCurrentSentence();
  
  if (wasPlaying) {
    setTimeout(playTTS, 200);
  }
}

// 5. EVALUACIÓN Y RETROALIMENTACIÓN (RECALL LOOP)
let practiceSentences = [];
let currentPracticeIndex = 0;

function initPracticePanel() {
  // Consolidar todas las oraciones de todas las islas para la práctica
  practiceSentences = [];
  appState.islands.forEach(island => {
    island.sentences.forEach(s => {
      practiceSentences.push({
        ...s,
        language: island.language
      });
    });
  });
  
  currentPracticeIndex = 0;
  loadPracticeExercise();
  renderMetrics();
}

function loadPracticeExercise() {
  const container = document.getElementById('recall-prompt-l1');
  const indexEl = document.getElementById('recall-index');
  const domainEl = document.getElementById('recall-domain');
  const inputEl = document.getElementById('recall-user-input');
  const feedbackCard = document.getElementById('recall-feedback-card');
  
  feedbackCard.classList.add('hidden');
  inputEl.value = '';
  inputEl.disabled = false;
  
  if (practiceSentences.length === 0) {
    container.textContent = "No tienes oraciones cargadas para practicar. Genera oraciones mediante la Inteligencia Artificial.";
    indexEl.textContent = "0 / 0";
    domainEl.textContent = "Ningún dominio";
    document.getElementById('btn-recall-submit').disabled = true;
    return;
  }
  
  document.getElementById('btn-recall-submit').disabled = false;
  const sentence = practiceSentences[currentPracticeIndex];
  container.textContent = sentence.l1;
  indexEl.textContent = `${currentPracticeIndex + 1} / ${practiceSentences.length}`;
  domainEl.textContent = `Idioma de Estudio: ${sentence.language} | Palabra objetivo: ${sentence.word_targeted || 'General'}`;
}

function evaluateRecallAttempt() {
  const inputEl = document.getElementById('recall-user-input');
  const userAttempt = inputEl.value.trim();
  if (!userAttempt) return;
  
  const sentence = practiceSentences[currentPracticeIndex];
  const correctAnswer = sentence.l2;
  
  // Calcular porcentaje de precisión basado en similitud de texto (distancia simplificada)
  const accuracy = Math.round(calculateSimilarity(userAttempt.toLowerCase(), correctAnswer.toLowerCase()) * 100);
  
  // Mostrar panel de retroalimentación
  const feedbackCard = document.getElementById('recall-feedback-card');
  const feedbackScore = document.getElementById('feedback-score');
  const feedbackTitle = document.getElementById('feedback-title');
  const feedbackUser = document.getElementById('feedback-user-attempt');
  const feedbackCorrect = document.getElementById('feedback-correct-answer');
  
  feedbackCard.classList.remove('hidden');
  inputEl.disabled = true;
  
  feedbackScore.textContent = `${accuracy}%`;
  feedbackUser.textContent = userAttempt;
  feedbackCorrect.textContent = correctAnswer;
  
  if (accuracy >= 85) {
    feedbackTitle.textContent = "¡Excelente traducción!";
    feedbackTitle.className = "text-success";
    feedbackCard.style.borderColor = "hsl(142, 60%, 60%)";
  } else if (accuracy >= 50) {
    feedbackTitle.textContent = "Casi correcto. Revisa los detalles.";
    feedbackTitle.className = "text-secondary";
    feedbackCard.style.borderColor = "hsl(215, 15%, 70%)";
  } else {
    feedbackTitle.textContent = "Inténtalo de nuevo.";
    feedbackTitle.className = "text-error";
    feedbackCard.style.borderColor = "red";
  }
  
  // Actualizar métricas del estado local
  appState.metrics.totalAttempts += 1;
  appState.metrics.accuracySum += accuracy;
  if (currentPracticeIndex === practiceSentences.length - 1) {
    appState.metrics.sessionsCompleted += 1;
  }
  saveAppState();
  renderMetrics();
}

// Algoritmo de similitud de cadenas (Sørensen–Dice / Levenshtein)
function calculateSimilarity(s1, s2) {
  let longer = s1;
  let shorter = s2;
  if (s1.length < s2.length) {
    longer = s2;
    shorter = s1;
  }
  const longerLength = longer.length;
  if (longerLength === 0) {
    return 1.0;
  }
  return (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength);
}

function editDistance(s1, s2) {
  s1 = s1.toLowerCase();
  s2 = s2.toLowerCase();
  const costs = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) costs[j] = j;
      else {
        if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          }
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}

function showHint() {
  const sentence = practiceSentences[currentPracticeIndex];
  if (!sentence) return;
  
  const inputEl = document.getElementById('recall-user-input');
  // Proveer las dos primeras letras de cada palabra como pista
  const words = sentence.l2.split(' ');
  const hint = words.map(w => w.length > 2 ? w.substring(0, 2) + '.'.repeat(w.length - 2) : w).join(' ');
  
  inputEl.placeholder = `Pista: ${hint}`;
}

function renderMetrics() {
  document.getElementById('metric-sessions').textContent = appState.metrics.sessionsCompleted;
  
  const avgAccuracy = appState.metrics.totalAttempts > 0 
    ? Math.round(appState.metrics.accuracySum / appState.metrics.totalAttempts) 
    : 0;
    
  document.getElementById('metric-accuracy').textContent = `${avgAccuracy}%`;
  
  // Rellenar barra de progreso
  const progressFill = document.getElementById('metric-progress-fill');
  progressFill.style.width = `${Math.min(avgAccuracy, 100)}%`;
}

// 6. GENERADOR DE CONTEXTO (LLM CON BYOK)
let generatedIslandTemp = null;

async function handleGenerateIsland(e) {
  e.preventDefault();
  
  const apiProvider = appState.settings.apiProvider;
  const apiKey = appState.settings.apiKey;
  const customUrl = appState.settings.apiUrl;
  
  if (!apiKey) {
    alert("Por favor, ingresa tu clave API (API Key) en la pestaña de Ajustes antes de usar el generador.");
    switchTab('settings');
    return;
  }
  
  const islandName = document.getElementById('gen-island-name').value.trim();
  const targetLang = document.getElementById('gen-target-lang').value;
  const category = document.getElementById('gen-island-category').value;
  const sentenceCount = parseInt(document.getElementById('gen-sentence-count').value) || 10;
  const wordList = document.getElementById('gen-word-list').value.trim();
  
  const l1 = appState.profile ? appState.profile.l1 : 'Español';
  const l2 = targetLang;
  
  const systemPrompt = `You are a professional linguistic coach for financial specialists and data scientists. 
Given the following L1 language: ${l1} and Target L2 language: ${l2}.
Generate a 'Language Island' composed of ${sentenceCount} highly practical sentences using these words: ${wordList}.
The context MUST strictly involve ${category}.
Return strictly a raw valid JSON array matching this schema: [{"l1": "...", "l2": "...", "word_targeted": "..."}]. Do not include markdown wraps or any explanatory text.`;

  // UI state: loading
  document.getElementById('btn-submit-generate').disabled = true;
  document.getElementById('gen-loading').classList.remove('hidden');
  document.getElementById('gen-preview-area').classList.add('hidden');
  
  try {
    let resultJson = null;
    
    if (apiProvider === 'openai') {
      resultJson = await callOpenAI(apiKey, customUrl, systemPrompt);
    } else if (apiProvider === 'google') {
      resultJson = await callGemini(apiKey, customUrl, systemPrompt);
    } else if (apiProvider === 'anthropic') {
      resultJson = await callAnthropic(apiKey, customUrl, systemPrompt);
    }
    
    if (resultJson) {
      displayGeneratedPreview(resultJson, targetLang, islandName);
    } else {
      alert("Error al procesar la respuesta del modelo. Asegúrate de ingresar una API Key válida.");
    }
  } catch (error) {
    console.error("Error en la llamada de API:", error);
    alert(`Ocurrió un error en la comunicación con la IA: ${error.message}`);
  } finally {
    document.getElementById('btn-submit-generate').disabled = false;
    document.getElementById('gen-loading').classList.add('hidden');
  }
}

// Clientes API BYOK
async function callOpenAI(apiKey, customUrl, prompt) {
  const url = (customUrl || 'https://api.openai.com/v1') + '/chat/completions';
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'user', content: prompt }
      ],
      temperature: 0.3
    })
  });
  
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || response.statusText);
  }
  
  const data = await response.json();
  const text = data.choices[0].message.content.trim();
  return parseCleanJson(text);
}

async function callGemini(apiKey, customUrl, prompt) {
  // Endpoints oficiales v1beta
  const baseUrl = customUrl || 'https://generativelanguage.googleapis.com';
  const url = `${baseUrl}/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.2
      }
    })
  });
  
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || response.statusText);
  }
  
  const data = await response.json();
  const text = data.candidates[0].content.parts[0].text.trim();
  return parseCleanJson(text);
}

async function callAnthropic(apiKey, customUrl, prompt) {
  const url = (customUrl || 'https://api.anthropic.com/v1') + '/messages';
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'dangerously-allow-browser': 'true' // Para llamadas del lado del cliente directas
    },
    body: JSON.stringify({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 1500,
      messages: [
        { role: 'user', content: prompt }
      ],
      temperature: 0.2
    })
  });
  
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || response.statusText);
  }
  
  const data = await response.json();
  const text = data.content[0].text.trim();
  return parseCleanJson(text);
}

function parseCleanJson(text) {
  // Limpiar posibles etiquetas markdown como ```json ... ```
  let cleanText = text;
  if (cleanText.includes("```")) {
    const matches = cleanText.match(/```(?:json)?([\s\S]*?)```/);
    if (matches && matches[1]) {
      cleanText = matches[1].trim();
    }
  }
  
  try {
    return JSON.parse(cleanText);
  } catch (e) {
    console.error("Error al parsear el JSON de respuesta:", e, cleanText);
    return null;
  }
}

function displayGeneratedPreview(sentencesArray, targetLang, islandName) {
  const area = document.getElementById('gen-preview-area');
  const container = document.getElementById('gen-preview-sentences');
  container.innerHTML = '';
  
  area.classList.remove('hidden');
  
  // Guardamos temporalmente en memoria la isla generada
  generatedIslandTemp = {
    id: 'island_' + Date.now(),
    name: islandName || `Isla Generada`,
    language: targetLang,
    sentences: sentencesArray.map((item, index) => ({
      id: `s_gen_${index}_${Date.now()}`,
      l1: item.l1,
      l2: item.l2,
      word_targeted: item.word_targeted || ''
    }))
  };
  
  generatedIslandTemp.sentences.forEach(item => {
    const div = document.createElement('div');
    div.className = 'preview-item';
    div.innerHTML = `
      <div class="preview-l2">${escapeHtml(item.l2)}</div>
      <div class="preview-l1 text-secondary">${escapeHtml(item.l1)}</div>
      ${item.word_targeted ? `<span class="preview-tag">${escapeHtml(item.word_targeted)}</span>` : ''}
    `;
    container.appendChild(div);
  });
  
  // Hacer scroll automático hacia los resultados
  area.scrollIntoView({ behavior: 'smooth' });
}

function saveGeneratedIsland() {
  if (!generatedIslandTemp) return;
  
  // Agregar al estado e inicializar
  appState.islands.push(generatedIslandTemp);
  currentIslandIndex = appState.islands.length - 1;
  currentSentenceIndex = 0;
  
  saveAppState();
  generatedIslandTemp = null;
  
  // Resetear interfaz de generación
  document.getElementById('gen-preview-area').classList.add('hidden');
  document.getElementById('gen-word-list').value = '';
  document.getElementById('gen-island-name').value = '';
  
  // Ir al Karaoke
  switchTab('learn');
}

// LÓGICA DE CREACIÓN MANUAL DE ISLAS
let manualSentencesTemp = [];

function toggleGenerateMode(mode) {
  const btnAi = document.getElementById('btn-mode-ai');
  const btnManual = document.getElementById('btn-mode-manual');
  const panelAi = document.getElementById('panel-gen-ai');
  const panelManual = document.getElementById('panel-gen-manual');
  
  if (mode === 'ai') {
    btnAi.classList.add('active');
    btnManual.classList.remove('active');
    panelAi.classList.remove('hidden');
    panelManual.classList.add('hidden');
  } else {
    btnAi.classList.remove('active');
    btnManual.classList.add('active');
    panelAi.classList.add('hidden');
    panelManual.classList.remove('hidden');
  }
}

function addManualSentence() {
  const l1Input = document.getElementById('manual-sentence-l1');
  const l2Input = document.getElementById('manual-sentence-l2');
  const wordInput = document.getElementById('manual-sentence-word');
  
  const l1 = l1Input.value.trim();
  const l2 = l2Input.value.trim();
  const word = wordInput.value.trim();
  
  if (!l1 || !l2) {
    alert("Por favor, completa los campos de oración L1 y L2.");
    return;
  }
  
  const newSentence = {
    id: `s_man_${Date.now()}_${manualSentencesTemp.length}`,
    l1: l1,
    l2: l2,
    word_targeted: word
  };
  
  manualSentencesTemp.push(newSentence);
  renderManualSentencesList();
  
  // Limpiar campos individuales
  l1Input.value = '';
  l2Input.value = '';
  wordInput.value = '';
  l1Input.focus();
}

function removeManualSentence(index) {
  manualSentencesTemp.splice(index, 1);
  renderManualSentencesList();
}

function renderManualSentencesList() {
  const container = document.getElementById('manual-sentences-list-body');
  const countEl = document.getElementById('manual-sentences-count');
  const previewArea = document.getElementById('manual-list-preview-area');
  const saveBtn = document.getElementById('btn-save-manual-island');
  
  container.innerHTML = '';
  countEl.textContent = manualSentencesTemp.length;
  
  if (manualSentencesTemp.length === 0) {
    previewArea.classList.add('hidden');
    saveBtn.disabled = true;
    return;
  }
  
  previewArea.classList.remove('hidden');
  saveBtn.disabled = false;
  
  manualSentencesTemp.forEach((item, index) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><p>${escapeHtml(item.l1)}</p></td>
      <td><p><strong>${escapeHtml(item.l2)}</strong></p></td>
      <td><span class="preview-tag">${escapeHtml(item.word_targeted || 'General')}</span></td>
      <td>
        <button type="button" class="btn-danger-text" data-index="${index}">
          <span class="material-symbols-rounded">delete</span>
          <span>Eliminar</span>
        </button>
      </td>
    `;
    
    // Bind click en botón eliminar
    tr.querySelector('.btn-danger-text').addEventListener('click', () => removeManualSentence(index));
    container.appendChild(tr);
  });
}

function saveManualIsland() {
  const nameInput = document.getElementById('manual-island-name');
  const name = nameInput.value.trim();
  const lang = document.getElementById('manual-target-lang').value;
  
  if (!name) {
    alert("Por favor, proporciona un nombre para tu isla lingüística.");
    nameInput.focus();
    return;
  }
  
  if (manualSentencesTemp.length === 0) {
    alert("Agrega al menos una oración antes de guardar la isla.");
    return;
  }
  
  const newIsland = {
    id: 'island_manual_' + Date.now(),
    name: name,
    language: lang,
    sentences: [...manualSentencesTemp]
  };
  
  appState.islands.push(newIsland);
  currentIslandIndex = appState.islands.length - 1;
  currentSentenceIndex = 0;
  
  saveAppState();
  
  // Limpiar cola temporal e interfaz
  manualSentencesTemp = [];
  nameInput.value = '';
  renderManualSentencesList();
  
  alert("Isla creada manualmente y guardada con éxito.");
  
  // Ir al Karaoke
  switchTab('learn');
}

// 7. PANEL DE CONFIGURACIÓN Y PERFIL
function loadSettingsPanel() {
  // Cargar perfil
  if (appState.profile) {
    document.getElementById('edit-first-name').value = appState.profile.firstName || '';
    document.getElementById('edit-last-name').value = appState.profile.lastName || '';
    document.getElementById('edit-email').value = appState.profile.email || '';
    document.getElementById('edit-l1').value = appState.profile.l1 || 'Español';
  }
  
  // Cargar llaves y API
  document.getElementById('api-provider').value = appState.settings.apiProvider || 'openai';
  document.getElementById('api-key').value = appState.settings.apiKey || '';
  document.getElementById('api-url').value = appState.settings.apiUrl || '';
}

function saveSettingsForm(e) {
  e.preventDefault();
  
  appState.settings.apiProvider = document.getElementById('api-provider').value;
  appState.settings.apiKey = document.getElementById('api-key').value.trim();
  appState.settings.apiUrl = document.getElementById('api-url').value.trim();
  
  saveAppState();
  alert("Configuración de API guardada exitosamente de forma local.");
}

function saveProfileEditForm(e) {
  e.preventDefault();
  
  appState.profile = {
    firstName: document.getElementById('edit-first-name').value.trim(),
    lastName: document.getElementById('edit-last-name').value.trim(),
    email: document.getElementById('edit-email').value.trim(),
    l1: document.getElementById('edit-l1').value
  };
  
  saveAppState();
  updateUserDisplayBadge();
  alert("Perfil actualizado correctamente.");
}

// 8. ONBOARDING & SETUP INICIAL
function checkOnboarding() {
  const onboardingScreen = document.getElementById('onboarding-screen');
  if (!appState.profile) {
    onboardingScreen.classList.remove('hidden');
  } else {
    onboardingScreen.classList.add('hidden');
    updateUserDisplayBadge();
  }
}

function handleOnboardingForm(e) {
  e.preventDefault();
  
  const firstName = document.getElementById('profile-first-name').value.trim();
  const lastName = document.getElementById('profile-last-name').value.trim();
  const email = document.getElementById('profile-email').value.trim();
  const l1 = document.getElementById('profile-l1').value;
  
  appState.profile = { firstName, lastName, email, l1 };
  saveAppState();
  
  document.getElementById('onboarding-screen').classList.add('hidden');
  updateUserDisplayBadge();
  switchTab('learn');
}

function updateUserDisplayBadge() {
  if (appState.profile) {
    const fullName = `${appState.profile.firstName} ${appState.profile.lastName}`;
    document.getElementById('user-display-name').textContent = fullName;
    document.getElementById('user-avatar-char').textContent = appState.profile.firstName.charAt(0).toUpperCase();
  }
}

// 9. AUXILIAR UTILS & EVENT BINDINGS
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

document.addEventListener('DOMContentLoaded', () => {
  // Cargar estado local
  loadAppState();
  
  // Inicializar UI
  initTheme();
  checkOnboarding();
  initNavigation();
  
  // Asignar controladores
  document.getElementById('theme-btn').addEventListener('click', rotateTheme);
  document.getElementById('onboarding-form').addEventListener('submit', handleOnboardingForm);
  document.getElementById('settings-form').addEventListener('submit', saveSettingsForm);
  document.getElementById('profile-edit-form').addEventListener('submit', saveProfileEditForm);
  document.getElementById('gen-island-form').addEventListener('submit', handleGenerateIsland);
  document.getElementById('btn-save-generated').addEventListener('click', saveGeneratedIsland);
  
  // Sub-pestañas de modo (IA vs Manual)
  document.getElementById('btn-mode-ai').addEventListener('click', () => toggleGenerateMode('ai'));
  document.getElementById('btn-mode-manual').addEventListener('click', () => toggleGenerateMode('manual'));
  
  // Controladores Manuales
  document.getElementById('btn-add-manual-sentence').addEventListener('click', addManualSentence);
  document.getElementById('btn-save-manual-island').addEventListener('click', saveManualIsland);
  
  // Controladores Karaoke
  document.getElementById('btn-play-pause').addEventListener('click', playTTS);
  document.getElementById('btn-prev-sentence').addEventListener('click', () => advanceSentence(-1));
  document.getElementById('btn-next-sentence').addEventListener('click', () => advanceSentence(1));
  document.getElementById('tts-speed').addEventListener('input', (e) => {
    document.getElementById('speed-val').textContent = `${e.target.value}x`;
    if (isPlaying) {
      // Reiniciar TTS para aplicar la nueva velocidad
      stopTTS();
      playTTS();
    }
  });
  
  // Controladores Recall Loop
  document.getElementById('btn-recall-submit').addEventListener('click', evaluateRecallAttempt);
  document.getElementById('btn-recall-hint').addEventListener('click', showHint);
  document.getElementById('btn-recall-next').addEventListener('click', () => {
    currentPracticeIndex = (currentPracticeIndex + 1) % practiceSentences.length;
    loadPracticeExercise();
  });
  
  // Ver visibilidad API key
  document.getElementById('btn-toggle-key-visibility').addEventListener('click', () => {
    const keyInput = document.getElementById('api-key');
    const keyIcon = document.querySelector('#btn-toggle-key-visibility span');
    if (keyInput.type === 'password') {
      keyInput.type = 'text';
      keyIcon.textContent = 'visibility_off';
    } else {
      keyInput.type = 'password';
      keyIcon.textContent = 'visibility';
    }
  });
  
  // Panel inicial por defecto
  initLearnPanel();
});
