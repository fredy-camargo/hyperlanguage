// app.js - Client-Side State, TTS Karaoke Loop & LLM BYOK Integrator

// CONFIGURACIÓN DE FIREBASE (PRODUCCIÓN)
// Reemplaza los valores de abajo con las credenciales de tu proyecto de Firebase.
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDPJQmTVtWDLzeAOoIyCaV0JNy8doKg9Ck",
  authDomain: "polyglotlab-31c84.firebaseapp.com",
  projectId: "polyglotlab-31c84",
  storageBucket: "polyglotlab-31c84.firebasestorage.app",
  messagingSenderId: "247174107684",
  appId: "1:247174107684:web:0d2f34fe9d859f61fb3eb1"
};

let firebaseApp = null;
let firebaseAuth = null;
let firebaseDb = null;
let isFirebaseEnabled = false;

// Inicializar Firebase de forma segura si las claves son válidas
if (typeof firebase !== 'undefined' && FIREBASE_CONFIG.apiKey && !FIREBASE_CONFIG.apiKey.startsWith('REPLACE_')) {
  try {
    firebaseApp = firebase.initializeApp(FIREBASE_CONFIG);
    firebaseAuth = firebase.auth();
    firebaseDb = firebase.firestore();
    isFirebaseEnabled = true;
    console.log("PolyglotLab: Conexión con Firebase establecida de manera exitosa.");
  } catch (err) {
    console.error("Error al inicializar Firebase:", err);
  }
}

// 1. STATE & ALMACENAMIENTO LOCAL
const DEFAULT_STATE = {
  profile: null, // { firstName, lastName, email, l1 }
  settings: {
    theme: 'light',
    apiProvider: 'openai',
    apiKey: '',
    apiUrl: '',
    apiTtsKey: '',
    ttsEngine: 'azure',
    ttsVoiceBrowser: '',
    ttsVoiceOpenAI: 'alloy',
    ttsVoiceAzure: 'en-US-GuyNeural'
  },
  islands: [
    {
      id: 'island_pres_en',
      name: 'Presentación Personal (Inglés)',
      language: 'Inglés',
      sentences: [
        { id: 's_pres_en_01', l1: 'Hola, buenas tardes, mi nombre es Andrés.', l2: 'Hello, good afternoon, my name is Andres.', word_targeted: 'Name', mastery: 0 },
        { id: 's_pres_en_02', l1: 'Soy de Bogotá, Colombia.', l2: 'I am from Bogota, Colombia.', word_targeted: 'Origin', mastery: 0 },
        { id: 's_pres_en_03', l1: 'Tengo treinta y seis años.', l2: 'I am thirty-six years old.', word_targeted: 'Age', mastery: 0 },
        { id: 's_pres_en_04', l1: 'Trabajo en el área de planeación financiera y analítica de datos.', l2: 'I work in financial planning and data analytics.', word_targeted: 'Profession', mastery: 0 },
        { id: 's_pres_en_05', l1: 'Actualmente estoy terminando mi maestría.', l2: 'I am currently finishing my master\'s degree.', word_targeted: 'Studies', mastery: 0 },
        { id: 's_pres_en_06', l1: 'En mi tiempo libre me gusta entrenar calistenia y andar en bicicleta.', l2: 'In my free speed, I like to train calisthenics and ride my bike.', word_targeted: 'Hobbies', mastery: 0 },
        { id: 's_pres_en_07', l1: 'Tengo una hija de nueve años y disfrutamos mucho jugar videojuegos juntos.', l2: 'I have a nine-year-old daughter and we really enjoy playing video games together.', word_targeted: 'Family', mastery: 0 }
      ]
    },
    {
      id: 'island_pres_pt',
      name: 'Apresentação Pessoal (Português)',
      language: 'Portugués',
      sentences: [
        { id: 's_pres_pt_01', l1: 'Hola, buenas tardes, mi nombre es Andrés.', l2: 'Olá, boa tarde, o meu nome é Andrés.', word_targeted: 'Nome', mastery: 0 },
        { id: 's_pres_pt_02', l1: 'Soy de Bogotá, Colombia.', l2: 'Sou de Bogotá, Colômbia.', word_targeted: 'Origem', mastery: 0 },
        { id: 's_pres_pt_03', l1: 'Tengo treinta y seis años.', l2: 'Tenho trinta e seis anos.', word_targeted: 'Idade', mastery: 0 },
        { id: 's_pres_pt_04', l1: 'Trabajo en el área de planeación financiera y analítica de datos.', l2: 'Trabalho na área de planejamento financeiro e análise de dados.', word_targeted: 'Profissão', mastery: 0 },
        { id: 's_pres_pt_05', l1: 'Actualmente estoy terminando mi maestría.', l2: 'Atualmente estou terminando meu mestrado.', word_targeted: 'Estudos', mastery: 0 },
        { id: 's_pres_pt_06', l1: 'En mi tiempo libre me gusta entrenar calistenia y andar en bicicleta.', l2: 'No meu tempo livre gosto de treinar calistenia e andar de bicicleta.', word_targeted: 'Hobbies', mastery: 0 },
        { id: 's_pres_pt_07', l1: 'Tengo una hija de nueve años y disfrutamos mucho jugar videojuegos juntos.', l2: 'Tenho uma filha de nove anos e gostamos muito de jogar videogame juntos.', word_targeted: 'Família', mastery: 0 }
      ]
    },
    {
      id: 'island_pres_fr',
      name: 'Présentation Personnelle (Francés)',
      language: 'Francés',
      sentences: [
        { id: 's_pres_fr_01', l1: 'Hola, buenas tardes, mi nombre es Andrés.', l2: 'Bonjour, bon après-midi, je m\'appelle Andrés.', word_targeted: 'Nom', mastery: 0 },
        { id: 's_pres_fr_02', l1: 'Soy de Bogotá, Colombia.', l2: 'Je viens de Bogota, en Colombie.', word_targeted: 'Origine', mastery: 0 },
        { id: 's_pres_fr_03', l1: 'Tengo treinta y seis años.', l2: 'J\'ai trente-six ans.', word_targeted: 'Âge', mastery: 0 },
        { id: 's_pres_fr_04', l1: 'Trabajo en el área de planeación financiera y analítica de datos.', l2: 'Je travaille dans le domaine de la planification financière et de l\'analyse de données.', word_targeted: 'Profession', mastery: 0 },
        { id: 's_pres_fr_05', l1: 'Actualmente estoy terminando mi maestría.', l2: 'Je termine actuellement mon master.', word_targeted: 'Études', mastery: 0 },
        { id: 's_pres_fr_06', l1: 'En mi tiempo libre me gusta entrenar calistenia y andar en bicicleta.', l2: 'Pendant mon temps libre, j\'aime m\'entraîner à la callisthénie et faire du vélo.', word_targeted: 'Loisirs', mastery: 0 },
        { id: 's_pres_fr_07', l1: 'Tengo una hija de nueve años y disfrutamos mucho jugar videojuegos juntos.', l2: 'J\'ai une fille de neuf ans et nous aimons beaucoup jouer aux jeux vidéo ensemble.', word_targeted: 'Famille', mastery: 0 }
      ]
    },
    {
      id: 'island_pres_de',
      name: 'Persönliche Vorstellung (Alemán)',
      language: 'Alemán',
      sentences: [
        { id: 's_pres_de_01', l1: 'Hola, buenas tardes, mi nombre es Andrés.', l2: 'Hallo, guten Tag, mein Name ist Andrés.', word_targeted: 'Name', mastery: 0 },
        { id: 's_pres_de_02', l1: 'Soy de Bogotá, Colombia.', l2: 'Ich komme aus Bogota, Kolumbien.', word_targeted: 'Herkunft', mastery: 0 },
        { id: 's_pres_de_03', l1: 'Tengo treinta y seis años.', l2: 'Ich bin sechsunddreißig Jahre alt.', word_targeted: 'Alter', mastery: 0 },
        { id: 's_pres_de_04', l1: 'Trabajo en el área de planeación financiera y analítica de datos.', l2: 'Ich arbeite im Bereich Finanzplanung und Datenanalyse.', word_targeted: 'Beruf', mastery: 0 },
        { id: 's_pres_de_05', l1: 'Actualmente estoy terminando mi maestría.', l2: 'Derzeit beende ich mein Masterstudium.', word_targeted: 'Studium', mastery: 0 },
        { id: 's_pres_de_06', l1: 'En mi tiempo libre me gusta entrenar calistenia y andar en bicicleta.', l2: 'In meiner Freizeit trainiere ich gerne Calisthenics und fahre Rad.', word_targeted: 'Hobbys', mastery: 0 },
        { id: 's_pres_de_07', l1: 'Tengo una hija de nueve años y disfrutamos mucho jugar videojuegos juntos.', l2: 'Ich habe eine neunjährige Tochter und wir spielen sehr gerne zusammen Videospiele.', word_targeted: 'Familie', mastery: 0 }
      ]
    },
    {
      id: 'island_pres_it',
      name: 'Presentazione Personale (Italiano)',
      language: 'Italiano',
      sentences: [
        { id: 's_pres_it_01', l1: 'Hola, buenas tardes, mi nombre es Andrés.', l2: 'Ciao, buon pomeriggio, il mio nome è Andrés.', word_targeted: 'Nome', mastery: 0 },
        { id: 's_pres_it_02', l1: 'Soy de Bogotá, Colombia.', l2: 'Vengo da Bogotà, Colombia.', word_targeted: 'Origine', mastery: 0 },
        { id: 's_pres_it_03', l1: 'Tengo treinta y seis años.', l2: 'Ho trentasei anni.', word_targeted: 'Età', mastery: 0 },
        { id: 's_pres_it_04', l1: 'Trabajo en el área de planeación financiera y analítica de datos.', l2: 'Lavoro nell\'area della pianificazione finanziaria e dell\'analisi dei dati.', word_targeted: 'Professione', mastery: 0 },
        { id: 's_pres_it_05', l1: 'Actualmente estoy terminando mi maestría.', l2: 'Attualmente sto finendo il mio master.', word_targeted: 'Studi', mastery: 0 },
        { id: 's_pres_it_06', l1: 'En mi tiempo libre me gusta entrenar calistenia y andar en bicicleta.', l2: 'Nel mio tempo libero mi piace allenarmi alla calistenia e andare in bicicletta.', word_targeted: 'Hobby', mastery: 0 },
        { id: 's_pres_it_07', l1: 'Tengo una hija de nueve años y disfrutamos mucho jugar videojuegos juntos.', l2: 'Ho una figlia di nove anni e ci piace molto giocare ai videogiochi insieme.', word_targeted: 'Famiglia', mastery: 0 }
      ]
    },
    {
      id: 'island_default_01',
      name: 'Finanzas Corporativas y Datos',
      language: 'Inglés',
      sentences: [
        { id: 's_01', l1: 'Los ajustes de transición bajo IFRS 17 afectarán las ganancias acumuladas iniciales.', l2: 'Transition adjustments under IFRS 17 will impact the opening retained earnings.', word_targeted: 'transition', mastery: 0 },
        { id: 's_02', l1: 'Necesitamos conciliar el libro mayor con el sistema de flujo de caja antes de la auditoría.', l2: 'We need to reconcile the general ledger with the cash flow system prior to the audit.', word_targeted: 'reconcile', mastery: 0 },
        { id: 's_03', l1: 'El script de Python procesa los datos financieros utilizando concurrencia para optimizar el rendimiento.', l2: 'The Python script parses the financial data using concurrency to optimize performance.', word_targeted: 'parses', mastery: 0 },
        { id: 's_04', l1: 'Debemos imputar los gastos indirectos a los grupos de contratos de seguros correspondientes.', l2: 'We must impute indirect expenses to the corresponding groups of insurance contracts.', word_targeted: 'impute', mastery: 0 },
        { id: 's_05', l1: 'Pronosticar los flujos de efectivo netos requiere un modelo robusto de análisis de varianza.', l2: 'Forecasting net cash flows requires a robust variance analysis model.', word_targeted: 'forecasting', mastery: 0 }
      ]
    }
  ],
  metrics: {
    sessionsCompleted: 0,
    accuracySum: 0,
    totalAttempts: 0,
    streak: 0,
    pronAccuracySum: 0,
    totalPronAttempts: 0,
    wordsCount: 0,
    correctCount: 0,
    incorrectCount: 0
  },
  targetLanguages: ['Inglés', 'Portugués', 'Francés', 'Alemán', 'Italiano'],
  activeTargetLanguage: 'Inglés',
  topics: [
    { id: 'topic_general', name: 'General / Sin Categoría', language: 'all' },
    { id: 'topic_pres', name: 'Presentación Personal', language: 'all' },
    { id: 'topic_travel', name: 'Viajes y Turismo', language: 'all' },
    { id: 'topic_business', name: 'Negocios y Trabajo', language: 'all' },
    { id: 'topic_social', name: 'Conversaciones Diarias', language: 'all' },
    { id: 'topic_tech', name: 'Tecnología y Datos', language: 'all' }
  ]
};

let appState = { ...DEFAULT_STATE };

// Cargar estado de localStorage con migración desde la clave anterior
function sanitizeAppState() {
  if (!appState) appState = { ...DEFAULT_STATE };
  if (!appState.islands) appState.islands = [...DEFAULT_STATE.islands];
  if (!appState.metrics) appState.metrics = { ...DEFAULT_STATE.metrics };
  if (!appState.settings) appState.settings = { ...DEFAULT_STATE.settings };
  if (!appState.targetLanguages || appState.targetLanguages.length === 0) {
    appState.targetLanguages = ['Inglés', 'Portugués', 'Francés', 'Alemán', 'Italiano'];
  }
  if (!appState.activeTargetLanguage) {
    appState.activeTargetLanguage = 'Inglés';
  }
  if (!appState.topics || appState.topics.length === 0) {
    appState.topics = [
      { id: 'topic_general', name: 'General / Sin Categoría', language: 'all' },
      { id: 'topic_pres', name: 'Presentación Personal', language: 'all' },
      { id: 'topic_travel', name: 'Viajes y Turismo', language: 'all' },
      { id: 'topic_business', name: 'Negocios y Trabajo', language: 'all' },
      { id: 'topic_social', name: 'Conversaciones Diarias', language: 'all' },
      { id: 'topic_tech', name: 'Tecnología y Datos', language: 'all' }
    ];
  }

  // 1. Inyectar islas de presentación si no existen
  const hasPresIsland = appState.islands.some(isl => isl.id === 'island_pres_en');
  if (!hasPresIsland) {
    const predefined = DEFAULT_STATE.islands.filter(isl => isl.id.startsWith('island_pres_'));
    appState.islands.unshift(...predefined);
  }

  // 2. Asegurar configuraciones predeterminadas de voz
  if (appState.settings.apiTtsKey === undefined) appState.settings.apiTtsKey = '';
  if (appState.settings.ttsEngine === undefined) appState.settings.ttsEngine = 'azure';
  if (appState.settings.ttsVoiceBrowser === undefined) appState.settings.ttsVoiceBrowser = '';
  if (appState.settings.ttsVoiceOpenAI === undefined) appState.settings.ttsVoiceOpenAI = 'alloy';
  if (appState.settings.ttsVoiceAzure === undefined) appState.settings.ttsVoiceAzure = 'en-US-GuyNeural';
  if (appState.settings.uiLanguage === undefined) appState.settings.uiLanguage = 'es';

  // 3. Validar currentIslandIndex de forma segura
  if (currentIslandIndex === undefined || currentIslandIndex === null || currentIslandIndex < 0 || currentIslandIndex >= appState.islands.length) {
    currentIslandIndex = 0;
  }

  // 4. Asegurar métricas
  if (appState.metrics.streak === undefined) appState.metrics.streak = 0;
  if (appState.metrics.pronAccuracySum === undefined) appState.metrics.pronAccuracySum = 0;
  if (appState.metrics.totalPronAttempts === undefined) appState.metrics.totalPronAttempts = 0;
  if (appState.metrics.wordsCount === undefined) appState.metrics.wordsCount = 0;
  if (appState.metrics.correctCount === undefined) appState.metrics.correctCount = 0;
  if (appState.metrics.incorrectCount === undefined) appState.metrics.incorrectCount = 0;

  // 5. Sanear idiomas y temas de islas
  appState.islands.forEach(island => {
    if (!island.language) {
      if (island.id === 'island_pres_pt') island.language = 'Portugués';
      else if (island.id === 'island_pres_fr') island.language = 'Francés';
      else if (island.id === 'island_pres_de') island.language = 'Alemán';
      else if (island.id === 'island_pres_it') island.language = 'Italiano';
      else island.language = 'Inglés';
    }
    if (!island.topicId) {
      if (island.id.startsWith('island_pres_')) island.topicId = 'topic_pres';
      else island.topicId = 'topic_business';
    }
    if (island.sentences) {
      island.sentences.forEach(s => {
        sanitizeSentenceSRMetadata(s);
      });
    }
  });
}

function loadAppState() {
  let localData = localStorage.getItem('polyglotlab_state');
  if (!localData) {
    // Intentar migrar desde la versión antigua 'hyperpolyglot_harness_state'
    localData = localStorage.getItem('hyperpolyglot_harness_state');
    if (localData) {
      localStorage.setItem('polyglotlab_state', localData);
    }
  }
  if (localData) {
    try {
      appState = JSON.parse(localData);
      sanitizeAppState();
    } catch (e) {
      console.error("Error cargando estado local:", e);
      appState = { ...DEFAULT_STATE };
      sanitizeAppState();
    }
  } else {
    appState = { ...DEFAULT_STATE };
    sanitizeAppState();
  }
}

// Guardar estado en localStorage y sincronizar con Firestore si Firebase está activo
function saveAppState() {
  localStorage.setItem('polyglotlab_state', JSON.stringify(appState));
  
  if (isFirebaseEnabled && firebaseAuth && firebaseAuth.currentUser) {
    const user = firebaseAuth.currentUser;
    firebaseDb.collection("users").doc(user.uid).set({
      profile: appState.profile,
      settings: appState.settings,
      islands: appState.islands,
      metrics: appState.metrics,
      targetLanguages: appState.targetLanguages,
      activeTargetLanguage: appState.activeTargetLanguage,
      topics: appState.topics,
      lastUpdated: new Date().toISOString()
    }, { merge: true }).catch(err => {
      console.warn("No se pudo sincronizar con Firestore (sigue funcionando local-first):", err);
    });
  }
}

// -------------------------------------------------------------
// SECCIÓN: GESTIÓN MULTIDIOMA OBJETIVO Y TEMAS / CATEGORÍAS
// -------------------------------------------------------------
const LANG_FLAGS = {
  'Inglés': '🇺🇸',
  'English': '🇺🇸',
  'Portugués': '🇧🇷',
  'Portuguese': '🇧🇷',
  'Francés': '🇫🇷',
  'French': '🇫🇷',
  'Alemán': '🇩🇪',
  'German': '🇩🇪',
  'Italiano': '🇮🇹',
  'Italian': '🇮🇹',
  'Español': '🇪🇸',
  'Spanish': '🇪🇸',
  'Chino': '🇨🇳',
  'Japonés': '🇯🇵'
};

function getLangFlag(lang) {
  return LANG_FLAGS[lang] || '🌐';
}

function getFilteredIslands() {
  if (!appState || !appState.islands) return [];
  const activeLang = appState.activeTargetLanguage || 'Inglés';
  const filtered = appState.islands.filter(isl => isl.language === activeLang);
  return filtered.length > 0 ? filtered : appState.islands;
}

function setActiveTargetLanguage(lang) {
  if (!appState.targetLanguages.includes(lang)) {
    appState.targetLanguages.push(lang);
  }
  appState.activeTargetLanguage = lang;
  currentIslandIndex = 0;
  saveAppState();
  updateTargetLanguageUI();
  
  if (typeof renderKaraokeLoop === 'function') renderKaraokeLoop();
  if (typeof updateIslandsList === 'function') updateIslandsList();
  if (typeof renderPracticeSentence === 'function') renderPracticeSentence();
  
  showNotification(`PolyglotLab: Idioma activo cambiado a ${getLangFlag(lang)} ${lang}`, "success");
}

function updateTargetLanguageUI() {
  const activeLang = appState.activeTargetLanguage || 'Inglés';
  const flag = getLangFlag(activeLang);

  const flagEl = document.getElementById('topbar-target-lang-flag');
  const nameEl = document.getElementById('topbar-target-lang-name');
  if (flagEl) flagEl.textContent = flag;
  if (nameEl) nameEl.textContent = activeLang;

  const gridEl = document.getElementById('target-languages-grid');
  if (gridEl) {
    gridEl.innerHTML = appState.targetLanguages.map(lang => {
      const isActive = lang === activeLang;
      const count = appState.islands.filter(isl => isl.language === lang).length;
      return `
        <div class="target-lang-card ${isActive ? 'active' : ''}" data-lang="${lang}" style="padding: 14px; border-radius: 16px; border: 2px solid ${isActive ? 'hsl(var(--md-sys-color-primary))' : 'hsl(var(--md-sys-color-outline))'}; background: ${isActive ? 'hsla(var(--md-sys-color-primary), 0.12)' : 'hsl(var(--md-sys-color-surface-container-low))'}; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 4px; transition: all 0.2s;">
          <span style="font-size: 28px;">${getLangFlag(lang)}</span>
          <span style="font-size: 14px; font-weight: 700; color: ${isActive ? 'hsl(var(--md-sys-color-primary))' : 'inherit'};">${lang}</span>
          <span style="font-size: 11px; opacity: 0.8; font-weight: 500;">${count} ${count === 1 ? 'isla' : 'islas'}</span>
        </div>
      `;
    }).join('');

    gridEl.querySelectorAll('.target-lang-card').forEach(card => {
      card.addEventListener('click', () => {
        const lang = card.getAttribute('data-lang');
        setActiveTargetLanguage(lang);
        const modal = document.getElementById('target-lang-modal');
        if (modal) modal.classList.add('hidden');
      });
    });
  }

  const settingsListEl = document.getElementById('settings-target-langs-list');
  if (settingsListEl) {
    settingsListEl.innerHTML = appState.targetLanguages.map(lang => {
      const isActive = lang === activeLang;
      return `
        <span style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 600; background: ${isActive ? 'hsl(var(--md-sys-color-primary))' : 'hsl(var(--md-sys-color-surface-container-high))'}; color: ${isActive ? 'hsl(var(--md-sys-color-on-primary))' : 'inherit'}; border: 1px solid hsl(var(--md-sys-color-outline));">
          <span>${getLangFlag(lang)}</span>
          <span>${lang}</span>
          ${isActive ? '<span class="material-symbols-rounded" style="font-size: 16px;">check_circle</span>' : ''}
        </span>
      `;
    }).join('');
  }
}

// -------------------------------------------------------------
// SECCIÓN: CERRAR SESIÓN (LOGOUT)
// -------------------------------------------------------------
async function handleLogout() {
  const confirmed = await showCustomConfirm(
    "PolyglotLab: ¿Cerrar Sesión?",
    "¿Estás seguro de que deseas cerrar sesión? Retornarás a la pantalla de acceso y tus datos locales se conservarán."
  );
  if (confirmed) {
    executeLogout();
  }
}

function executeLogout() {
  try {
    if (isFirebaseEnabled && firebaseAuth && firebaseAuth.currentUser) {
      firebaseAuth.signOut().catch(err => console.warn("Firebase signout error:", err));
    }
  } catch (err) {
    console.warn("Logout error:", err);
  }

  // Resetear perfil y guardar estado limpio
  appState.profile = null;
  saveAppState();

  // Ocultar todos los modales activos
  document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));

  // Desplegar modal de login/onboarding
  const onboardingScreen = document.getElementById('onboarding-screen');
  if (onboardingScreen) {
    onboardingScreen.classList.remove('hidden');
  }

  // Actualizar indicador de usuario
  const nameEl = document.getElementById('user-display-name');
  if (nameEl) nameEl.textContent = 'Usuario';

  showNotification("Sesión cerrada correctamente en PolyglotLab.", "info");
}

// -------------------------------------------------------------
// SECCIÓN: EXPORTACIÓN E IMPRESIÓN TXT / DOC
// -------------------------------------------------------------
let exportTargetIsland = null;

function openExportTxtDocModal(island) {
  exportTargetIsland = island || appState.islands[currentIslandIndex];
  const modal = document.getElementById('export-txt-doc-modal');
  if (modal) modal.classList.remove('hidden');
}

function exportIslandTxtDoc(island, format) {
  const target = island || exportTargetIsland || appState.islands[currentIslandIndex];
  if (!target || !target.sentences || target.sentences.length === 0) {
    showNotification("La isla seleccionada no contiene oraciones para exportar.", "warning");
    return;
  }

  const activeLang = target.language || appState.activeTargetLanguage || 'Inglés';
  const lines = [];

  target.sentences.forEach(s => {
    const l1 = (s.l1 || '').trim();
    const l2 = (s.l2 || '').trim();
    const keyword = (s.word_targeted || s.target || '').trim();
    lines.push(`${l1} | ${l2} | ${keyword}`);
  });

  const rawTextContent = lines.join('\n');
  const sanitizedName = (target.name || 'isla').replace(/[^a-z0-9]/gi, '_').toLowerCase();

  if (format === 'txt') {
    const textWithHeader = `# PolyglotLab - Isla Lingüística: ${target.name}\n# Idioma Objetivo: ${activeLang}\n# Estructura: frase idioma origen | frase idioma objetivo | palabra clave idioma objetivo\n\n` + rawTextContent;
    const blob = new Blob([textWithHeader], { type: 'text/plain;charset=utf-8' });
    triggerBlobDownload(blob, `${sanitizedName}_isla.txt`);
  } else if (format === 'doc') {
    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${escapeHtml(target.name)}</title>
        <style>
          body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; color: #1e293b; margin: 20pt; }
          h1 { color: #2563eb; font-size: 18pt; border-bottom: 2px solid #0ea5e9; padding-bottom: 4pt; margin-bottom: 8pt; }
          .meta { color: #64748b; font-size: 10pt; margin-bottom: 16pt; background: #f8fafc; padding: 10pt; border-radius: 6pt; border: 1px solid #e2e8f0; }
          table { width: 100%; border-collapse: collapse; margin-top: 12pt; }
          th { background-color: #2563eb; color: #ffffff; text-align: left; padding: 8pt; border: 1px solid #1d4ed8; font-size: 10pt; }
          td { padding: 8pt; border: 1px solid #cbd5e1; vertical-align: top; font-size: 10pt; }
          tr:nth-child(even) { background-color: #f1f5f9; }
          .raw-lines { font-family: Consolas, 'Courier New', monospace; font-size: 9.5pt; background: #0f172a; color: #38bdf8; padding: 12pt; border-radius: 6pt; white-space: pre-wrap; margin-top: 16pt; }
        </style>
      </head>
      <body>
        <h1>PolyglotLab - ${escapeHtml(target.name)}</h1>
        <div class="meta">
          <p><strong>Idioma Objetivo:</strong> ${escapeHtml(activeLang)}</p>
          <p><strong>Estructura Solicitada:</strong> frase idioma origen | frase idioma objetivo | palabra clave idioma objetivo</p>
        </div>
        
        <h3>Vista Tabular</h3>
        <table>
          <thead>
            <tr>
              <th>Frase Idioma Origen (L1)</th>
              <th>Frase Idioma Objetivo (L2)</th>
              <th>Palabra Clave Idioma Objetivo</th>
            </tr>
          </thead>
          <tbody>
            ${target.sentences.map(s => `
              <tr>
                <td>${escapeHtml(s.l1 || '')}</td>
                <td><strong>${escapeHtml(s.l2 || '')}</strong></td>
                <td><code>${escapeHtml(s.word_targeted || s.target || '')}</code></td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <h3>Vista Formato Plano Estricto (Pipa |)</h3>
        <div class="raw-lines">${escapeHtml(rawTextContent)}</div>
      </body>
      </html>
    `;
    const blob = new Blob(['\ufeff' + htmlContent], { type: 'application/msword;charset=utf-8' });
    triggerBlobDownload(blob, `${sanitizedName}_isla.doc`);
  }

  showNotification(`Isla "${target.name}" descargada correctamente en .${format.toUpperCase()}`, "success");
  const modal = document.getElementById('export-txt-doc-modal');
  if (modal) modal.classList.add('hidden');
}

function triggerBlobDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

// Mostrar diálogo de confirmación personalizado
function showCustomConfirm(title, message) {
  return new Promise((resolve) => {
    const screen = document.getElementById('confirm-dialog-screen');
    const titleEl = document.getElementById('confirm-dialog-title');
    const msgEl = document.getElementById('confirm-dialog-message');
    const cancelBtn = document.getElementById('btn-confirm-cancel');
    const acceptBtn = document.getElementById('btn-confirm-accept');

    titleEl.textContent = title;
    msgEl.textContent = message;
    screen.classList.remove('hidden');

    function cleanup() {
      screen.classList.add('hidden');
      cancelBtn.removeEventListener('click', onCancel);
      acceptBtn.removeEventListener('click', onAccept);
    }

    function onCancel() {
      cleanup();
      resolve(false);
    }

    function onAccept() {
      cleanup();
      resolve(true);
    }

    cancelBtn.addEventListener('click', onCancel, { once: true });
    acceptBtn.addEventListener('click', onAccept, { once: true });
  });
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
  if (['learn', 'practice', 'generate', 'settings', 'methodology', 'about'].includes(hash)) {
    switchTab(hash);
  }
}

function switchTab(tabId) {
  // Detener TTS activo si cambiamos de pestaña
  stopTTS();
  if (window.speechSynthesis) window.speechSynthesis.cancel();
  
  // Ocultar el widget de cerebro en metodología, configuración y acerca de
  const brainWidget = document.querySelector('.top-bar-brain-widget');
  if (brainWidget) {
    if (['methodology', 'settings', 'about'].includes(tabId)) {
      brainWidget.classList.add('hidden');
    } else {
      brainWidget.classList.remove('hidden');
    }
  }
  
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
  const titleMap = window.uiTitleMap || {
    learn: 'Aprender (Karaoke)',
    practice: 'Practicar (Recall Loop)',
    generate: 'Generar Contexto Inteligente',
    methodology: 'Metodología y Guía de Uso',
    settings: 'Configuración del Laboratorio',
    about: 'Acerca de PolyglotLab'
  };
  document.getElementById('view-title').textContent = titleMap[tabId] || 'PolyglotLab';
  
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
window.karaokeQueue = [];

function buildKaraokeQueue() {
  const island = appState.islands[currentIslandIndex];
  window.karaokeQueue = [];
  if (!island || !island.sentences || island.sentences.length === 0) return;
  
  // Obtener los niveles de dificultad que están seleccionados (activos) en la UI
  const activeLevels = [];
  document.querySelectorAll('.diff-chip.active').forEach(btn => {
    activeLevels.push(parseInt(btn.getAttribute('data-level')));
  });
  
  // Obtener el tipo de orden
  const orderSelect = document.getElementById('karaoke-order-select');
  const orderType = orderSelect ? orderSelect.value : 'normal';
  
  // Filtrar
  const filtered = [];
  island.sentences.forEach((sentence, idx) => {
    if (!sentence.speech_sr) {
      sanitizeSentenceSRMetadata(sentence);
    }
    const box = sentence.speech_sr.box || 1;
    if (activeLevels.includes(box)) {
      filtered.push({
        originalIndex: idx,
        sentence: sentence
      });
    }
  });
  
  // Ordenar
  if (orderType === 'fsrs' && filtered.length > 0) {
    const now = new Date();
    filtered.sort((a, b) => {
      const srA = a.sentence.speech_sr;
      const srB = b.sentence.speech_sr;
      
      const elapsedA = srA.last_review ? (now.getTime() - new Date(srA.last_review).getTime()) / (24 * 60 * 60 * 1000) : 100;
      const elapsedB = srB.last_review ? (now.getTime() - new Date(srB.last_review).getTime()) / (24 * 60 * 60 * 1000) : 100;
      
      const rA = Math.pow(1 + elapsedA / (9 * (srA.stability || 1.0)), -0.5);
      const rB = Math.pow(1 + elapsedB / (9 * (srB.stability || 1.0)), -0.5);
      
      if (rA !== rB) {
        return rA - rB;
      }
      return (srA.stability || 1.0) - (srB.stability || 1.0);
    });
  }
  
  window.karaokeQueue = filtered;
}

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
  buildKaraokeQueue();
  if (currentSentenceIndex >= window.karaokeQueue.length) {
    currentSentenceIndex = 0;
  }
  loadCurrentSentence();
}

function renderIslandSelectors() {
  const container = document.getElementById('island-selector-list');
  container.innerHTML = '';
  
  const activeLang = appState.activeTargetLanguage || 'Inglés';
  const availableIslands = appState.islands.filter(isl => isl.language === activeLang);
  
  if (availableIslands.length === 0) {
    container.innerHTML = `<p class="text-secondary small" style="padding: 12px; text-align: center;">No tienes islas para <strong>${getLangFlag(activeLang)} ${activeLang}</strong>. Genera una en la pestaña de Generar Islas o selecciona otro idioma objetivo.</p>`;
    return;
  }
  
  // Agrupar islas por topicId
  const topicsMap = {};
  if (appState.topics) {
    appState.topics.forEach(t => {
      topicsMap[t.id] = { topic: t, islands: [] };
    });
  }

  // Fallback para topic_general
  if (!topicsMap['topic_general']) {
    topicsMap['topic_general'] = { topic: { id: 'topic_general', name: 'General / Sin Categoría' }, islands: [] };
  }

  availableIslands.forEach(island => {
    const topicId = island.topicId && topicsMap[island.topicId] ? island.topicId : 'topic_general';
    topicsMap[topicId].islands.push(island);
  });

  // Renderizar carpetas de temas
  Object.keys(topicsMap).forEach(topicId => {
    const group = topicsMap[topicId];
    if (group.islands.length === 0) return; // Ocultar grupos vacíos

    const topicFolder = document.createElement('div');
    topicFolder.className = 'topic-folder-card';
    topicFolder.style.cssText = `
      margin-bottom: 16px;
      border: 1px solid hsl(var(--md-sys-color-outline-variant));
      border-radius: 16px;
      overflow: hidden;
      background: hsl(var(--md-sys-color-surface-container-low));
    `;

    const folderHeader = document.createElement('div');
    folderHeader.className = 'topic-folder-header';
    folderHeader.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 14px;
      background: hsl(var(--md-sys-color-surface-container-high));
      border-bottom: 1px solid hsl(var(--md-sys-color-outline-variant));
      font-weight: 700;
      font-size: 13px;
      color: hsl(var(--md-sys-color-on-surface));
    `;

    folderHeader.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <span class="material-symbols-rounded text-primary" style="font-size: 20px;">folder</span>
        <span>${escapeHtml(group.topic.name)}</span>
      </div>
      <span style="font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 12px; background: hsl(var(--md-sys-color-primary-container)); color: hsl(var(--md-sys-color-primary));">
        ${group.islands.length} ${group.islands.length === 1 ? 'isla' : 'islas'}
      </span>
    `;

    const folderBody = document.createElement('div');
    folderBody.className = 'topic-folder-body';
    folderBody.style.cssText = `
      padding: 8px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    `;

    group.islands.forEach(island => {
      const index = appState.islands.indexOf(island);
      const item = document.createElement('div');
      item.className = `island-item ${index === currentIslandIndex ? 'active' : ''}`;
      item.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 12px;
        border-radius: 12px;
        background: ${index === currentIslandIndex ? 'hsl(var(--md-sys-color-primary-container))' : 'hsl(var(--md-sys-color-surface))'};
        border: 1px solid ${index === currentIslandIndex ? 'hsl(var(--md-sys-color-primary))' : 'hsl(var(--md-sys-color-outline))'};
        cursor: pointer;
      `;

      let totalMastery = 0;
      const sentencesList = island.sentences || [];
      sentencesList.forEach(s => {
        totalMastery += (s.mastery !== undefined ? s.mastery : 0);
      });
      const maxPossibleMastery = sentencesList.length * 5;
      const progressPercent = maxPossibleMastery > 0 ? Math.round((totalMastery / maxPossibleMastery) * 100) : 0;

      const topicOptionsHtml = (appState.topics || []).map(t => 
        `<option value="${t.id}" ${t.id === (island.topicId || 'topic_general') ? 'selected' : ''}>${escapeHtml(t.name)}</option>`
      ).join('');

      item.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
          <div class="island-info" style="flex-grow: 1;">
            <div class="island-title font-semibold" style="font-size: 14px;">${escapeHtml(island.name)}</div>
            <div class="island-meta text-secondary small">${sentencesList.length} oraciones • ${escapeHtml(island.language || activeLang)}</div>
          </div>
          <div class="island-actions" style="display: flex; gap: 4px; align-items: center;">
            <button class="icon-btn small-btn btn-export-island" title="Descargar (.txt / .doc)" style="background: none; border: none; color: hsl(var(--md-sys-color-primary)); cursor: pointer; padding: 6px; border-radius: 6px; display: inline-flex; align-items: center;">
              <span class="material-symbols-rounded" style="font-size: 18px;">download</span>
            </button>
            <button class="icon-btn small-btn btn-delete-island" title="Eliminar Isla" style="background: none; border: none; color: hsl(var(--md-sys-color-error)); cursor: pointer; padding: 6px; border-radius: 6px; display: inline-flex; align-items: center;">
              <span class="material-symbols-rounded" style="font-size: 18px;">delete</span>
            </button>
            <span class="material-symbols-rounded text-primary btn-play-island" style="cursor: pointer; padding: 4px;" title="Reproducir Isla">play_arrow</span>
          </div>
        </div>

        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 4px; padding-top: 6px; border-top: 1px dashed hsl(var(--md-sys-color-outline-variant));">
          <div style="display: flex; align-items: center; gap: 6px;">
            <div class="island-progress-bar-container" style="width: 80px; height: 5px; background-color: hsl(var(--md-sys-color-surface-variant)); border-radius: 3px; overflow: hidden;">
              <div style="width: ${progressPercent}%; height: 100%; background-color: hsl(var(--md-sys-color-primary));"></div>
            </div>
            <span style="font-size: 10px; font-weight: 700; color: hsl(var(--md-sys-color-primary));">${progressPercent}%</span>
          </div>

          <div style="display: flex; align-items: center; gap: 4px;" onclick="event.stopPropagation();">
            <span class="material-symbols-rounded" style="font-size: 14px; color: hsl(var(--md-sys-color-secondary));">folder_move</span>
            <select class="change-island-topic-select" data-island-id="${island.id}" style="font-size: 11px; padding: 2px 6px; border-radius: 6px; border: 1px solid hsl(var(--md-sys-color-outline)); background: hsl(var(--md-sys-color-surface)); color: inherit; cursor: pointer;">
              ${topicOptionsHtml}
            </select>
          </div>
        </div>
      `;

      const exportEl = item.querySelector('.btn-export-island');
      const deleteEl = item.querySelector('.btn-delete-island');
      const playEl = item.querySelector('.btn-play-island');
      const topicSelectEl = item.querySelector('.change-island-topic-select');

      if (exportEl) {
        exportEl.addEventListener('click', (e) => {
          e.stopPropagation();
          openExportTxtDocModal(island);
        });
      }

      if (deleteEl) {
        deleteEl.addEventListener('click', async (e) => {
          e.stopPropagation();
          const confirmed = await showCustomConfirm(
            `¿Eliminar "${island.name}"?`,
            `¿Estás seguro de que deseas eliminar la isla "${island.name}"?`
          );
          if (confirmed) {
            stopTTS();
            appState.islands.splice(index, 1);
            if (currentIslandIndex >= appState.islands.length) {
              currentIslandIndex = Math.max(0, appState.islands.length - 1);
            }
            saveAppState();
            renderIslandSelectors();
          }
        });
      }

      if (playEl) {
        playEl.addEventListener('click', (e) => {
          e.stopPropagation();
          stopTTS();
          currentIslandIndex = index;
          currentSentenceIndex = 0;
          buildKaraokeQueue();
          renderIslandSelectors();
          loadCurrentSentence();
          playTTS();
        });
      }

      if (topicSelectEl) {
        topicSelectEl.addEventListener('change', (e) => {
          e.stopPropagation();
          const newTopicId = e.target.value;
          island.topicId = newTopicId;
          saveAppState();
          renderIslandSelectors();
          showNotification(`Isla movida de tema`, "success");
        });
      }

      item.addEventListener('click', (e) => {
        if (e.target.closest('.btn-delete-island') || e.target.closest('.btn-play-island') || e.target.closest('.btn-export-island') || e.target.closest('.change-island-topic-select')) {
          return;
        }
        stopTTS();
        currentIslandIndex = index;
        currentSentenceIndex = 0;
        buildKaraokeQueue();
        renderIslandSelectors();
        loadCurrentSentence();
      });

      folderBody.appendChild(item);
    });

    topicFolder.appendChild(folderHeader);
    topicFolder.appendChild(folderBody);
    container.appendChild(topicFolder);
  });
}

function loadCurrentSentence() {
  const island = appState.islands[currentIslandIndex];
  populateVoicesDropdown();
  
  const progressText = document.getElementById('player-progress-text');
  const progressPercent = document.getElementById('player-progress-percentage');
  const progressFill = document.getElementById('player-progress-fill');
  
  if (!island || window.karaokeQueue.length === 0) {
    document.getElementById('player-island-name').textContent = island ? island.name : "Ninguna Isla";
    document.getElementById('player-lang-badge').textContent = island ? island.language : "N/A";
    document.getElementById('karaoke-l1').textContent = island ? "Ninguna frase coincide con los filtros de dificultad." : "Crea una isla lingüística para comenzar.";
    document.getElementById('karaoke-l2').innerHTML = '<span class="placeholder-text">Ninguna oración cargada que cumpla con los filtros de dificultad.</span>';
    
    if (progressText) progressText.textContent = "Frase 0 de 0";
    if (progressPercent) progressPercent.textContent = "0%";
    if (progressFill) progressFill.style.width = "0%";
    return;
  }
  
  const currentNum = currentSentenceIndex + 1;
  const totalNum = window.karaokeQueue.length;
  const percent = Math.round((currentNum / totalNum) * 100);
  
  if (progressText) progressText.textContent = `Frase ${currentNum} de ${totalNum}`;
  if (progressPercent) progressPercent.textContent = `${percent}%`;
  if (progressFill) progressFill.style.width = `${percent}%`;
  
  const queueItem = window.karaokeQueue[currentSentenceIndex];
  const sentence = queueItem.sentence;
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

  const masteryContainer = document.getElementById('karaoke-sentence-mastery-container');
  if (masteryContainer) {
    if (!sentence.speech_sr) {
      sanitizeSentenceSRMetadata(sentence);
    }
    const box = sentence.speech_sr.box || 1;
    const percent = box * 25;
    
    let levelName = "Semilla (Por repasar)";
    let progressColor = "hsl(var(--md-sys-color-outline))";
    
    if (box === 4) {
      levelName = "Árbol Maduro (Largo Plazo)";
      progressColor = "hsl(142, 60%, 40%)";
    } else if (box === 3) {
      levelName = "Planta Joven (Mediano Plazo)";
      progressColor = "hsl(215, 60%, 50%)";
    } else if (box === 2) {
      levelName = "Brote Joven (Corto Plazo)";
      progressColor = "hsl(142, 40%, 55%)";
    } else if (box === 1) {
      levelName = "Semilla (Corto Plazo)";
      progressColor = "hsl(36, 100%, 45%)";
    }
    
    let targetWordHtml = '';
    if (sentence.word_targeted && sentence.word_targeted.trim()) {
      const cleanL2 = sentence.l2.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, "");
      const cleanWord = sentence.word_targeted.toLowerCase().trim().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, "");
      
      const wordsList = cleanL2.split(/\s+/);
      const wordExists = cleanWord && (wordsList.includes(cleanWord) || cleanL2.includes(cleanWord));
      
      if (wordExists) {
        targetWordHtml = `
          <span class="target-word-badge" style="display: inline-flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 600; padding: 6px 12px; border-radius: 8px; background-color: hsla(var(--md-sys-color-primary), 0.08); color: hsl(var(--md-sys-color-primary)); border: 1px solid hsla(var(--md-sys-color-primary), 0.2); box-shadow: var(--md-sys-elevation-1);">
            <span class="material-symbols-rounded" style="font-size: 18px;">key</span>
            <span>Palabra Objetivo: <strong>${escapeHtml(sentence.word_targeted)}</strong></span>
          </span>
        `;
      }
    }

    masteryContainer.innerHTML = `
      <span style="display: inline-flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 600; padding: 6px 12px; border-radius: 8px; background-color: hsl(var(--md-sys-color-surface-variant)); color: hsl(var(--md-sys-color-on-surface-variant)); border: 1px solid hsl(var(--md-sys-color-outline-variant)); box-shadow: var(--md-sys-elevation-1);">
        <span class="material-symbols-rounded" style="font-size: 18px; color: hsl(var(--md-sys-color-primary));">psychology</span>
        <span>Dominio de la Frase: <strong style="color: ${progressColor};">${percent}%</strong> (${levelName})</span>
      </span>
      ${targetWordHtml}
      <div style="flex-grow: 1; max-width: 180px; height: 8px; background-color: hsl(var(--md-sys-color-surface-variant)); border-radius: 4px; overflow: hidden; position: relative; border: 1px solid hsl(var(--md-sys-color-outline-variant));">
        <div style="width: ${percent}%; height: 100%; background-color: ${progressColor}; border-radius: 4px; transition: width 0.3s ease;"></div>
      </div>
    `;
    
    // Actualizar UI del Spaced Repetition (Métricas, Jardín de Memoria y Ebbinghaus Curve)
    updateSRUI();
  }
}

const audioCache = {};
let openAiAudioElement = null;
let wordHighlightTimings = [];
window.browserHighlightAnimationFrameId = null;

const OPENAI_VOICES = [
  { id: 'alloy', name: 'Alloy (Neutral)' },
  { id: 'echo', name: 'Echo (Hombre - Enérgico)' },
  { id: 'fable', name: 'Fable (Hombre - Juvenil)' },
  { id: 'onyx', name: 'Onyx (Hombre - Profundo)' },
  { id: 'nova', name: 'Nova (Mujer - Profesional)' },
  { id: 'shimmer', name: 'Shimmer (Mujer - Clara)' }
];

const AZURE_VOICES = {
  'Inglés': [
    { id: 'en-US-JennyNeural', name: 'Jenny (Mujer - EE. UU.)' },
    { id: 'en-US-GuyNeural', name: 'Guy (Hombre - EE. UU.)' },
    { id: 'en-GB-SoniaNeural', name: 'Sonia (Mujer - Reino Unido)' },
    { id: 'en-US-BrianMultilingualNeural', name: 'Brian (Hombre - Multilingüe)' }
  ],
  'Español': [
    { id: 'es-CO-GonzaloNeural', name: 'Gonzalo (Hombre - Colombia)' },
    { id: 'es-MX-DaliaNeural', name: 'Dalia (Mujer - México)' },
    { id: 'es-ES-AlvaroNeural', name: 'Álvaro (Hombre - España)' },
    { id: 'es-ES-ElviraNeural', name: 'Elvira (Mujer - España)' },
    { id: 'es-ES-AlvaroMultilingualNeural', name: 'Álvaro (Hombre - Multilingüe)' }
  ],
  'Portugués': [
    { id: 'pt-BR-FranciscaNeural', name: 'Francisca (Mujer - Brasil)' },
    { id: 'pt-BR-AntonioNeural', name: 'Antônio (Hombre - Brasil)' },
    { id: 'pt-PT-RaquelNeural', name: 'Raquel (Mujer - Portugal)' }
  ],
  'Francés': [
    { id: 'fr-FR-DeniseNeural', name: 'Denise (Mujer - Francia)' },
    { id: 'fr-FR-HenriNeural', name: 'Henri (Hombre - Francia)' },
    { id: 'fr-CA-SylvieNeural', name: 'Sylvie (Mujer - Canadá)' }
  ],
  'Alemán': [
    { id: 'de-DE-KatjaNeural', name: 'Katja (Mujer - Alemania)' },
    { id: 'de-DE-ConradNeural', name: 'Conrad (Hombre - Alemania)' }
  ],
  'Italiano': [
    { id: 'it-IT-ElsaNeural', name: 'Elsa (Mujer - Italia)' },
    { id: 'it-IT-GianniNeural', name: 'Gianni (Hombre - Italia)' }
  ]
};

function playTTS() {
  if (isPlaying) {
    stopTTS();
    return;
  }
  
  const island = appState.islands[currentIslandIndex];
  if (!island) return;
  const sentence = island.sentences[currentSentenceIndex];
  if (!sentence) return;
  
  const speed = parseFloat(document.getElementById('tts-speed').value) || 1.0;
  const engine = document.getElementById('tts-engine').value;
  
  if (engine === 'openai') {
    playOpenAITTS(sentence, speed);
    return;
  }
  if (engine === 'azure') {
    playAzureTTS(sentence, speed);
    return;
  }
  
  isPlaying = true;
  document.getElementById('play-pause-icon').textContent = 'pause';
  
  const langCode = LANG_CODES[island.language] || 'en-US';
  
  currentUtterance = new SpeechSynthesisUtterance(sentence.l2);
  currentUtterance.lang = langCode;
  currentUtterance.rate = speed;
  
  // Seleccionar voz del navegador
  const voices = window.speechSynthesis.getVoices();
  const selectedVoiceName = document.getElementById('tts-voice').value;
  const matchedVoice = voices.find(voice => voice.name === selectedVoiceName) || voices.find(voice => voice.lang.startsWith(langCode));
  if (matchedVoice) {
    currentUtterance.voice = matchedVoice;
  }
  
  let boundaryFired = false;
  let speechStartTime = null;
  
  currentUtterance.onstart = () => {
    speechStartTime = performance.now();
    
    // Iniciar fallback si onboundary no se dispara en 350ms
    setTimeout(() => {
      if (isPlaying && !boundaryFired && speechStartTime) {
        console.warn("La síntesis de voz no disparó eventos 'onboundary'. Activando resaltado temporal estimado.");
        startBrowserSpeechTimerHighlighting(speechStartTime, sentence.l2, speed);
      }
    }, 350);
  };
  
  // Karaoke: Resaltado en tiempo real con onboundary
  currentUtterance.onboundary = (event) => {
    boundaryFired = true;
    if (event.name === 'word') {
      const charIndex = event.charIndex;
      highlightWord(charIndex);
    }
  };
  
  currentUtterance.onend = () => {
    cleanupBrowserSpeechHighlight();
    clearHighlights();
    isPlaying = false;
    document.getElementById('play-pause-icon').textContent = 'play_arrow';
    
    // Bucle continuo de la isla si está activo (checked)
    const repeatPhrase = document.getElementById('toggle-infinite-phrase').checked;
    if (repeatPhrase) {
      setTimeout(() => {
        advanceSentence(1);
        playTTS();
      }, 2500);
    }
  };
  
  currentUtterance.onerror = (e) => {
    console.error("Error en la reproducción de síntesis de voz:", e);
    cleanupBrowserSpeechHighlight();
    clearHighlights();
    isPlaying = false;
    document.getElementById('play-pause-icon').textContent = 'play_arrow';
  };
  
  window.speechSynthesis.speak(currentUtterance);
}

function startBrowserSpeechTimerHighlighting(startTime, textL2, rate) {
  const wordSpans = document.querySelectorAll('#karaoke-l2 .karaoke-word');
  if (wordSpans.length === 0) return;
  
  const wordCount = wordSpans.length;
  // Estimación de la duración a una velocidad promedio de 135 palabras por minuto a ritmo 1.0x
  const estimatedDurationMs = ((wordCount * 60) / (135 * rate)) * 1000;
  
  const wordLengths = Array.from(wordSpans).map(span => span.textContent.length);
  const totalChars = wordLengths.reduce((sum, len) => sum + len, 0);
  
  let cumulativeTime = 0;
  const timings = Array.from(wordSpans).map((span, index) => {
    const len = wordLengths[index];
    const wordDuration = (len / totalChars) * estimatedDurationMs;
    const start = cumulativeTime;
    const end = cumulativeTime + wordDuration;
    cumulativeTime = end;
    return { start, end, index };
  });
  
  const updateHighlight = () => {
    if (!isPlaying) {
      cleanupBrowserSpeechHighlight();
      return;
    }
    
    const elapsed = performance.now() - startTime;
    const currentTiming = timings.find(t => elapsed >= t.start && elapsed <= t.end);
    
    if (currentTiming) {
      const span = wordSpans[currentTiming.index];
      if (span && !span.classList.contains('active')) {
        clearHighlights();
        span.classList.add('active');
      }
    } else if (elapsed > estimatedDurationMs) {
      clearHighlights();
    }
    
    window.browserHighlightAnimationFrameId = requestAnimationFrame(updateHighlight);
  };
  
  if (window.browserHighlightAnimationFrameId) {
    cancelAnimationFrame(window.browserHighlightAnimationFrameId);
  }
  window.browserHighlightAnimationFrameId = requestAnimationFrame(updateHighlight);
}

function cleanupBrowserSpeechHighlight() {
  if (window.browserHighlightAnimationFrameId) {
    cancelAnimationFrame(window.browserHighlightAnimationFrameId);
    window.browserHighlightAnimationFrameId = null;
  }
}

window.highlightAnimationFrameId = null;
window.azureHighlightAnimationFrameId = null;
window.sharedAudioPlayer = new Audio();

async function playOpenAITTS(sentence, speed) {
  const text = sentence.l2;
  const sentenceId = sentence.id;
  const voice = document.getElementById('tts-voice').value || 'alloy';
  
  stopOpenAiAudio();
  
  const cacheKey = `${sentenceId}_${voice}_${speed}`;
  let audioUrl = audioCache[cacheKey];
  
  if (!audioUrl) {
    let key = appState.settings.apiTtsKey;
    if (!key && appState.settings.apiProvider === 'openai') {
      key = appState.settings.apiKey;
    }
    
    if (!key) {
      alert("Para usar las voces premium, ingresa una clave de API de OpenAI en la pestaña de Ajustes (o selecciona el motor del navegador).");
      isPlaying = false;
      document.getElementById('play-pause-icon').textContent = 'play_arrow';
      switchTab('settings');
      return;
    }
    
    // Visual loading state
    const playPauseBtnIcon = document.getElementById('play-pause-icon');
    playPauseBtnIcon.textContent = 'sync';
    playPauseBtnIcon.classList.add('spin');
    
    try {
      const baseUrl = appState.settings.apiUrl || 'https://api.openai.com/v1';
      const url = `${baseUrl}/audio/speech`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'tts-1',
          input: text,
          voice: voice,
          speed: speed
        })
      });
      
      if (!response.ok) {
        let errMsg = response.statusText;
        try {
          const errData = await response.json();
          errMsg = errData.error?.message || errMsg;
        } catch(e) {}
        throw new Error(errMsg);
      }
      
      const blob = await response.blob();
      audioUrl = URL.createObjectURL(blob);
      audioCache[cacheKey] = audioUrl;
      
    } catch (err) {
      console.error("OpenAI TTS failed:", err);
      alert("Error al generar voz de OpenAI: " + err.message);
      isPlaying = false;
      playPauseBtnIcon.textContent = 'play_arrow';
      playPauseBtnIcon.classList.remove('spin');
      return;
    } finally {
      playPauseBtnIcon.classList.remove('spin');
    }
  }
  
  isPlaying = true;
  document.getElementById('play-pause-icon').textContent = 'pause';
  
  window.sharedAudioPlayer.src = audioUrl;
  setupAudioHighlighting(window.sharedAudioPlayer, text);
  window.sharedAudioPlayer.play().catch(e => {
    console.error("OpenAI Audio playback failed:", e);
    isPlaying = false;
    document.getElementById('play-pause-icon').textContent = 'play_arrow';
  });
}

function stopOpenAiAudio() {
  if (window.highlightAnimationFrameId) {
    cancelAnimationFrame(window.highlightAnimationFrameId);
    window.highlightAnimationFrameId = null;
  }
  if (window.sharedAudioPlayer) {
    window.sharedAudioPlayer.pause();
  }
  wordHighlightTimings = [];
}

function playAzureTTS(sentence, speed) {
  const text = sentence.l2;
  const voice = document.getElementById('tts-voice').value || 'en-US-JennyNeural';
  
  stopAzureAudio();
  
  const audioUrl = `/api/tts?text=${encodeURIComponent(text)}&voice=${encodeURIComponent(voice)}&speed=${speed}`;
  
  isPlaying = true;
  document.getElementById('play-pause-icon').textContent = 'pause';
  
  window.sharedAudioPlayer.src = audioUrl;
  setupAudioHighlighting(window.sharedAudioPlayer, text);
  window.sharedAudioPlayer.play().catch(e => {
    console.error("Azure Audio playback failed:", e);
    isPlaying = false;
    document.getElementById('play-pause-icon').textContent = 'play_arrow';
  });
}

function stopAzureAudio() {
  if (window.azureHighlightAnimationFrameId) {
    cancelAnimationFrame(window.azureHighlightAnimationFrameId);
    window.azureHighlightAnimationFrameId = null;
  }
  if (window.sharedAudioPlayer) {
    window.sharedAudioPlayer.pause();
  }
  wordHighlightTimings = [];
}

function setupAudioHighlighting(audio, textL2) {
  const wordSpans = document.querySelectorAll('#karaoke-l2 .karaoke-word');
  
  const calculateTimings = () => {
    const duration = audio.duration;
    if (isNaN(duration) || duration === Infinity) return;
    
    const wordLengths = Array.from(wordSpans).map(span => span.textContent.length);
    const totalChars = wordLengths.reduce((sum, len) => sum + len, 0);
    
    let cumulativeTime = 0;
    wordHighlightTimings = Array.from(wordSpans).map((span, index) => {
      const len = wordLengths[index];
      const wordDuration = (len / totalChars) * duration;
      const start = cumulativeTime;
      const end = cumulativeTime + wordDuration;
      cumulativeTime = end;
      return { start, end, index };
    });
  };

  if (audio.readyState >= 1) {
    calculateTimings();
  } else {
    audio.onloadedmetadata = calculateTimings;
  }

  const updateHighlight = () => {
    if (!isPlaying || audio.paused || audio.ended) {
      return;
    }
    
    const currentTime = audio.currentTime;
    const currentTiming = wordHighlightTimings.find(t => currentTime >= t.start && currentTime <= t.end);
    
    if (currentTiming) {
      const span = wordSpans[currentTiming.index];
      if (span && !span.classList.contains('active')) {
        clearHighlights();
        span.classList.add('active');
      }
    }
    
    window.azureHighlightAnimationFrameId = requestAnimationFrame(updateHighlight);
    window.highlightAnimationFrameId = window.azureHighlightAnimationFrameId;
  };

  audio.onplay = () => {
    if (window.azureHighlightAnimationFrameId) {
      cancelAnimationFrame(window.azureHighlightAnimationFrameId);
    }
    window.azureHighlightAnimationFrameId = requestAnimationFrame(updateHighlight);
    window.highlightAnimationFrameId = window.azureHighlightAnimationFrameId;
  };

  audio.onended = () => {
    if (window.azureHighlightAnimationFrameId) {
      cancelAnimationFrame(window.azureHighlightAnimationFrameId);
    }
    clearHighlights();
    isPlaying = false;
    document.getElementById('play-pause-icon').textContent = 'play_arrow';
    
    const repeatPhrase = document.getElementById('toggle-infinite-phrase').checked;
    if (repeatPhrase) {
      setTimeout(() => {
        advanceSentence(1);
        playTTS();
      }, 2500);
    }
  };

  audio.onerror = (e) => {
    if (window.azureHighlightAnimationFrameId) {
      cancelAnimationFrame(window.azureHighlightAnimationFrameId);
    }
    console.error("Audio playback error:", e);
    clearHighlights();
    isPlaying = false;
    document.getElementById('play-pause-icon').textContent = 'play_arrow';
  };
}

function stopTTS() {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  stopOpenAiAudio();
  stopAzureAudio();
  cleanupBrowserSpeechHighlight();
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
  if (!island || window.karaokeQueue.length === 0) return;
  
  const wasPlaying = isPlaying;
  stopTTS();
  
  currentSentenceIndex = (currentSentenceIndex + offset + window.karaokeQueue.length) % window.karaokeQueue.length;
  loadCurrentSentence();
  
  if (wasPlaying) {
    setTimeout(playTTS, 200);
  }
}

// --- SISTEMA DE REPETICIÓN ESPACIADA INTEGRADA (FSRS + LEITNER) ---

// --- SISTEMA DE REPETICIÓN ESPACIADA INTEGRADA (FSRS + LEITNER) ---

function sanitizeSentenceSRMetadata(s) {
  if (!s.writing_sr) {
    s.writing_sr = {
      box: 1,
      difficulty: 5.0,
      stability: 1.0,
      last_review: null,
      next_review: null,
      reps: 0,
      lapses: 0
    };
  }
  if (!s.speech_sr) {
    s.speech_sr = {
      box: 1,
      difficulty: 5.0,
      stability: 1.0,
      last_review: null,
      next_review: null,
      reps: 0,
      lapses: 0
    };
  }
  if (s.box === undefined) s.box = s.writing_sr.box;
  if (s.difficulty === undefined) s.difficulty = s.writing_sr.difficulty;
  if (s.stability === undefined) s.stability = s.writing_sr.stability;
  if (s.mastery === undefined) s.mastery = s.writing_sr.box;
  return s;
}

function gradeActiveSentence(grade) {
  console.log("gradeActiveSentence invoked with grade:", grade);
  console.log("practiceSentences length:", practiceSentences.length);
  console.log("currentPracticeIndex:", currentPracticeIndex);
  if (practiceSentences.length === 0) {
    console.warn("practiceSentences is empty!");
    return;
  }
  const sentence = practiceSentences[currentPracticeIndex];
  console.log("Active sentence:", sentence);
  if (!sentence) {
    console.warn("No active sentence found at index:", currentPracticeIndex);
    return;
  }
  
  const island = appState.islands.find(isl => isl.id === sentence.islandId);
  console.log("Found island:", island);
  if (!island) {
    console.warn("No island found for ID:", sentence.islandId);
    return;
  }
  const dbSentence = island.sentences.find(s => s.id === sentence.id);
  console.log("Found dbSentence:", dbSentence);
  if (!dbSentence) {
    console.warn("No dbSentence found for ID:", sentence.id);
    return;
  }
  
  sanitizeSentenceSRMetadata(dbSentence);
  
  const now = new Date();
  const isSpeech = (activePracticeMode === 'speech');
  const sr = isSpeech ? dbSentence.speech_sr : dbSentence.writing_sr;
  
  sr.last_review = now.toISOString();
  let S = sr.stability || 1.0;
  let D = sr.difficulty || 5.0;
  
  if (grade === 1) { // Olvidé
    D = Math.min(D + 2.0, 10.0);
    S = 0.5;
    sr.lapses = (sr.lapses || 0) + 1;
    sr.box = 1;
  } else if (grade === 2) { // Difícil
    D = Math.min(D + 1.0, 10.0);
    S = S * 1.2;
    sr.reps = (sr.reps || 0) + 1;
    if (S >= 3.0) sr.box = Math.min((sr.box || 1) + 1, 4);
  } else if (grade === 3) { // Bien
    const factor = 1.8 + 2.0 * Math.pow(D, -0.3);
    S = S * factor;
    sr.reps = (sr.reps || 0) + 1;
    sr.box = Math.min((sr.box || 1) + 1, 4);
  } else if (grade === 4) { // Fácil
    D = Math.max(D - 1.5, 1.0);
    const factor = 3.5 * (1.2 + 2.0 * Math.pow(D, -0.3));
    S = S * factor;
    sr.reps = (sr.reps || 0) + 1;
    sr.box = Math.max((sr.box || 1), 3);
    sr.box = Math.min(sr.box + 1, 4);
  }
  
  sr.stability = S;
  sr.difficulty = D;
  
  // Compatibilidad general basada en el modo activo
  if (isSpeech) {
    dbSentence.box = dbSentence.speech_sr.box;
    dbSentence.stability = dbSentence.speech_sr.stability;
    dbSentence.difficulty = dbSentence.speech_sr.difficulty;
    dbSentence.mastery = dbSentence.speech_sr.box;
  } else {
    dbSentence.box = dbSentence.writing_sr.box;
    dbSentence.stability = dbSentence.writing_sr.stability;
    dbSentence.difficulty = dbSentence.writing_sr.difficulty;
    dbSentence.mastery = dbSentence.writing_sr.box;
  }
  
  const nextDate = new Date();
  nextDate.setTime(now.getTime() + S * 24 * 60 * 60 * 1000);
  sr.next_review = nextDate.toISOString();
  
  saveAppState();
  
  const btnId = ['btn-sr-again', 'btn-sr-hard', 'btn-sr-good', 'btn-sr-easy'][grade - 1];
  const btnEl = document.getElementById(btnId);
  if (btnEl) {
    btnEl.style.transform = "scale(0.92)";
    setTimeout(() => { btnEl.style.transform = ""; }, 150);
  }
  
  const feedbackCard = document.getElementById('recall-feedback-card');
  if (feedbackCard) feedbackCard.classList.add('hidden');
  
  const select = document.getElementById('recall-island-select');
  if (select && select.value === 'fsrs') {
    buildPracticeQueue();
    currentPracticeIndex = 0;
  } else {
    currentPracticeIndex = (currentPracticeIndex + 1) % practiceSentences.length;
  }
  
  loadPracticeExercise();
}

function updateSRUI() {
  if (practiceSentences.length === 0) {
    const analytics = document.getElementById('sr-analytics-section');
    if (analytics) analytics.style.display = 'none';
    const panel = document.getElementById('spaced-repetition-panel');
    if (panel) panel.style.display = 'none';
    return;
  }
  
  const analytics = document.getElementById('sr-analytics-section');
  if (analytics) analytics.style.display = 'flex';
  
  const feedbackCard = document.getElementById('recall-feedback-card');
  const panel = document.getElementById('spaced-repetition-panel');
  if (panel) {
    if (feedbackCard && !feedbackCard.classList.contains('hidden')) {
      panel.style.display = 'flex';
    } else {
      panel.style.display = 'none';
    }
  }
  
  const now = new Date();
  let totalRetention = 0;
  let consolidationCount = 0;
  
  const gardenContainer = document.getElementById('memory-garden');
  if (gardenContainer) {
    gardenContainer.innerHTML = '';
    
    practiceSentences.forEach((s, idx) => {
      const stateIsland = appState.islands.find(isl => isl.id === s.islandId);
      let refSentence = s;
      if (stateIsland) {
        const stateSent = stateIsland.sentences.find(sent => sent.id === s.id);
        if (stateSent) {
          sanitizeSentenceSRMetadata(stateSent);
          refSentence = stateSent;
        }
      }
      
      const isSpeech = (activePracticeMode === 'speech');
      const sr = isSpeech ? refSentence.speech_sr : refSentence.writing_sr;
      
      let R = 1.0;
      if (sr.last_review) {
        const lastReviewDate = new Date(sr.last_review);
        const elapsedDays = (now.getTime() - lastReviewDate.getTime()) / (24 * 60 * 60 * 1000);
        R = Math.pow(1 + elapsedDays / (9 * sr.stability), -0.5);
      }
      totalRetention += R;
      
      if (sr.box === 4) {
        consolidationCount++;
      }
      
      let icon = "🌱";
      let iconName = "Semilla";
      let badgeColor = "hsl(var(--md-sys-color-outline-variant))";
      
      if (sr.box === 4) {
        icon = "🌳";
        iconName = "Árbol Consolidado";
        badgeColor = "hsl(142, 60%, 40%)";
      } else if (sr.box >= 2) {
        icon = "🌿";
        iconName = "Brote Joven";
        badgeColor = "hsl(142, 40%, 55%)";
      }
      
      const isCurrent = (idx === currentPracticeIndex);
      const sproutDiv = document.createElement('div');
      sproutDiv.className = 'garden-sprout';
      sproutDiv.style.borderColor = badgeColor;
      if (isCurrent) {
        sproutDiv.style.backgroundColor = "hsla(var(--md-sys-color-primary), 0.12)";
        sproutDiv.style.boxShadow = "0 0 8px hsl(var(--md-sys-color-primary))";
      }
      
      sproutDiv.innerHTML = `
        <span style="font-size: 16px;">${icon}</span>
      `;
      
      sproutDiv.addEventListener('mouseenter', () => {
        showGardenItemDetails(refSentence, idx, R, sr, icon, iconName);
      });
      
      sproutDiv.addEventListener('click', () => {
        showGardenItemDetails(refSentence, idx, R, sr, icon, iconName);
        currentPracticeIndex = idx;
        loadPracticeExercise();
      });
      
      gardenContainer.appendChild(sproutDiv);
    });
  }
  
  const avgRetention = (totalRetention / practiceSentences.length) * 100;
  const consolidationPercent = (consolidationCount / practiceSentences.length) * 100;
  
  const retEl = document.getElementById('sr-metric-retention');
  const conEl = document.getElementById('sr-metric-consolidation');
  if (retEl) retEl.textContent = `${avgRetention.toFixed(1)}%`;
  if (conEl) conEl.textContent = `${consolidationPercent.toFixed(0)}%`;
  
  const svg = document.getElementById('ebbinghaus-curve-svg');
  if (svg) {
    svg.innerHTML = '';
    
    let sumStability = 0;
    practiceSentences.forEach(s => {
      const stateIsland = appState.islands.find(isl => isl.id === s.islandId);
      let refSentence = s;
      if (stateIsland) {
        const stateSent = stateIsland.sentences.find(sent => sent.id === s.id);
        if (stateSent) {
          refSentence = stateSent;
        }
      }
      const isSpeech = (activePracticeMode === 'speech');
      const sr = isSpeech ? refSentence.speech_sr : refSentence.writing_sr;
      sumStability += sr.stability || 1.0;
    });
    const avgStability = sumStability / practiceSentences.length;
    
    const lineY90 = 10 + (1.0 - 0.90) * 80;
    const refLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
    refLine.setAttribute("x1", "0");
    refLine.setAttribute("y1", lineY90.toString());
    refLine.setAttribute("x2", "400");
    refLine.setAttribute("y2", lineY90.toString());
    refLine.setAttribute("stroke", "rgba(255, 0, 0, 0.25)");
    refLine.setAttribute("stroke-dasharray", "4,4");
    svg.appendChild(refLine);
    
    const refText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    refText.setAttribute("x", "5");
    refText.setAttribute("y", (lineY90 - 4).toString());
    refText.setAttribute("fill", "hsl(var(--md-sys-color-error))");
    refText.setAttribute("font-size", "9px");
    refText.setAttribute("font-weight", "600");
    refText.textContent = "Umbral de repaso (90%)";
    svg.appendChild(refText);
    
    let pathD = "";
    const steps = 30;
    for (let d = 0; d <= steps; d++) {
      const x = (d / steps) * 400;
      const R = Math.pow(1 + d / (9 * avgStability), -0.5);
      const y = 10 + (1.0 - R) * 80;
      
      if (d === 0) {
        pathD += `M ${x} ${y}`;
      } else {
        pathD += ` L ${x} ${y}`;
      }
    }
    
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", pathD);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "hsl(var(--md-sys-color-primary))");
    path.setAttribute("stroke-width", "2.5");
    svg.appendChild(path);
    
    const daysLabels = [
      { day: 0, text: "Hoy" },
      { day: 10, text: "10d" },
      { day: 20, text: "20d" },
      { day: 30, text: "30d" }
    ];
    
    daysLabels.forEach(l => {
      const x = (l.day / steps) * 400;
      
      const gridLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
      gridLine.setAttribute("x1", x.toString());
      gridLine.setAttribute("y1", "10");
      gridLine.setAttribute("x2", x.toString());
      gridLine.setAttribute("y2", "90");
      gridLine.setAttribute("stroke", "rgba(0, 0, 0, 0.05)");
      svg.appendChild(gridLine);
      
      const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      label.setAttribute("x", x.toString());
      label.setAttribute("y", "98");
      label.setAttribute("text-anchor", "middle");
      label.setAttribute("fill", "hsl(var(--md-sys-color-on-surface-variant))");
      label.setAttribute("font-size", "9px");
      label.textContent = l.text;
      svg.appendChild(label);
    });
  }
}

function showGardenItemDetails(s, idx, R, sr, icon, iconName) {
  const placeholder = document.getElementById('garden-details-placeholder');
  const body = document.getElementById('garden-details-body');
  
  if (placeholder) placeholder.classList.add('hidden');
  if (body) body.classList.remove('hidden');
  
  const numEl = document.getElementById('detail-num');
  const retEl = document.getElementById('detail-retention');
  const stabEl = document.getElementById('detail-stability');
  const boxEl = document.getElementById('detail-box');
  const l2El = document.getElementById('detail-l2-text') || document.getElementById('detail-l2');
  
  if (numEl) numEl.textContent = `#${idx + 1}`;
  if (retEl) retEl.textContent = `${(R * 100).toFixed(1)}%`;
  
  if (stabEl) {
    const daysText = appState.settings.uiLanguage === 'en' ? 'days' : 
                     appState.settings.uiLanguage === 'pt' ? 'dias' :
                     appState.settings.uiLanguage === 'fr' ? 'jours' :
                     appState.settings.uiLanguage === 'de' ? 'Tage' :
                     appState.settings.uiLanguage === 'it' ? 'giorni' : 'días';
    stabEl.textContent = `${sr.stability.toFixed(1)} ${daysText}`;
  }
  
  if (boxEl) {
    boxEl.textContent = `${icon} ${iconName}`;
    if (sr.box === 4) {
      boxEl.style.background = "rgba(76, 175, 80, 0.15)";
      boxEl.style.color = "hsl(142, 60%, 30%)";
    } else if (sr.box >= 2) {
      boxEl.style.background = "rgba(33, 150, 243, 0.1)";
      boxEl.style.color = "hsl(215, 60%, 40%)";
    } else {
      boxEl.style.background = "rgba(255, 193, 7, 0.15)";
      boxEl.style.color = "hsl(36, 100%, 30%)";
    }
  }
  
  if (l2El) {
    l2El.textContent = s.textL2 || s.text_l2 || s.l2 || '';
  }
}

// 5. EVALUACIÓN Y RETROALIMENTACIÓN (RECALL LOOP)
let practiceSentences = [];
let currentPracticeIndex = 0;
let activePracticeMode = 'writing'; // 'writing' o 'speech'
let recordedAudios = {}; // Mapeo de currentPracticeIndex -> blob de voz grabado por el usuario
let userRecordedVoiceUrl = null;
let mediaRecorder = null;
let audioChunks = [];
let isRecordingSpeech = false;
let speechRecognitionInstance = null;

function populateRecallIslandSelect() {
  const select = document.getElementById('recall-island-select');
  if (!select) return;
  const currentSelection = select.value || 'fsrs';
  select.innerHTML = `
    <option value="fsrs">🧠 Repaso Inteligente (FSRS)</option>
    <option value="all">Todas las Islas</option>
  `;
  appState.islands.forEach(island => {
    const opt = document.createElement('option');
    opt.value = island.id || `island_${Math.random()}`;
    opt.textContent = island.name;
    select.appendChild(opt);
  });
  const optionExists = Array.from(select.options).some(opt => opt.value === currentSelection);
  select.value = optionExists ? currentSelection : 'fsrs';
}

function buildPracticeQueue() {
  const select = document.getElementById('recall-island-select');
  const filterVal = select ? select.value : 'fsrs';
  practiceSentences = [];
  
  appState.islands.forEach(island => {
    if (filterVal === 'fsrs' || filterVal === 'all' || island.id === filterVal) {
      island.sentences.forEach(s => {
        sanitizeSentenceSRMetadata(s);
        practiceSentences.push({
          ...s,
          language: island.language,
          islandId: island.id,
          islandName: island.name
        });
      });
    }
  });
  
  if (filterVal === 'fsrs' && practiceSentences.length > 0) {
    const now = new Date();
    practiceSentences.sort((a, b) => {
      const srA = (activePracticeMode === 'speech') ? a.speech_sr : a.writing_sr;
      const srB = (activePracticeMode === 'speech') ? b.speech_sr : b.writing_sr;
      
      const overdueA = srA.next_review ? (new Date(srA.next_review) <= now) : true;
      const overdueB = srB.next_review ? (new Date(srB.next_review) <= now) : true;
      
      if (overdueA && !overdueB) return -1;
      if (!overdueA && overdueB) return 1;
      
      if (overdueA && overdueB) {
        const lastA = srA.last_review ? new Date(srA.last_review).getTime() : 0;
        const lastB = srB.last_review ? new Date(srB.last_review).getTime() : 0;
        const elapsedA = (now.getTime() - lastA) / (24 * 60 * 60 * 1000);
        const elapsedB = (now.getTime() - lastB) / (24 * 60 * 60 * 1000);
        const rA = Math.pow(1 + elapsedA / (9 * srA.stability), -0.5);
        const rB = Math.pow(1 + elapsedB / (9 * srB.stability), -0.5);
        return rA - rB;
      }
      
      const nextA = srA.next_review ? new Date(srA.next_review).getTime() : 0;
      const nextB = srB.next_review ? new Date(srB.next_review).getTime() : 0;
      if (nextA !== nextB) {
        return nextA - nextB;
      }
      return srA.stability - srB.stability;
    });
  }
}

function initPracticePanel() {
  populateRecallIslandSelect();
  buildPracticeQueue();
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
  
  // Ocultar replay de voz del usuario por defecto
  const replayGroup = document.getElementById('user-voice-replay-group');
  if (replayGroup) replayGroup.classList.add('hidden');
  
  // Limpiar estados de voz
  const transcriptEl = document.getElementById('recall-speech-transcript');
  if (transcriptEl) transcriptEl.textContent = '(Tu pronunciación aparecerá aquí...)';
  
  const recordIcon = document.getElementById('record-mic-icon');
  if (recordIcon) recordIcon.textContent = 'mic';
  
  const recordBtn = document.getElementById('btn-record-speech');
  if (recordBtn) {
    recordBtn.className = '';
    recordBtn.style.backgroundColor = 'hsl(var(--md-sys-color-primary))';
  }
  
  const statusEl = document.getElementById('speech-status');
  if (statusEl) statusEl.textContent = 'Presiona para hablar';
  
  const submitSpeechBtn = document.getElementById('btn-speech-submit');
  if (submitSpeechBtn) submitSpeechBtn.disabled = true;
  
  if (practiceSentences.length === 0) {
    container.textContent = "No tienes oraciones cargadas para practicar. Genera oraciones mediante la Inteligencia Artificial.";
    indexEl.textContent = "0 / 0";
    domainEl.textContent = "Ningún dominio";
    document.getElementById('btn-recall-submit').disabled = true;
    return;
  }
  
  document.getElementById('btn-recall-submit').disabled = false;
  const sentence = practiceSentences[currentPracticeIndex];
  
  const isSpeechMode = (activePracticeMode === 'speech');
  const flipCard = document.getElementById('recall-speech-flip-card');
  const labelEl = document.querySelector('.recall-prompt p.small');
  
  if (isSpeechMode) {
    if (container) container.classList.add('hidden');
    if (labelEl) labelEl.classList.add('hidden');
    if (flipCard) {
      flipCard.classList.remove('hidden');
      flipCard.classList.remove('flipped');
      document.getElementById('flip-front-text').textContent = sentence.l1;
      document.getElementById('flip-back-text').textContent = sentence.l2;
    }
  } else {
    if (container) {
      container.classList.remove('hidden');
      container.textContent = sentence.l1;
    }
    if (labelEl) labelEl.classList.remove('hidden');
    if (flipCard) flipCard.classList.add('hidden');
  }
  
  indexEl.textContent = `${currentPracticeIndex + 1} / ${practiceSentences.length}`;
  domainEl.textContent = `Idioma de Estudio: ${sentence.language} | Palabra objetivo: ${sentence.word_targeted || 'General'}`;
  
  let stateMastery = 1;
  const stateIsland = appState.islands.find(isl => isl.id === sentence.islandId);
  if (stateIsland) {
    const stateSentence = stateIsland.sentences.find(s => s.id === sentence.id);
    if (stateSentence) {
      sanitizeSentenceSRMetadata(stateSentence);
      const sr = isSpeechMode ? stateSentence.speech_sr : stateSentence.writing_sr;
      stateMastery = sr.box;
    }
  }
  
  const masteryTextEl = document.getElementById('recall-sentence-mastery-text');
  const masteryBadgeEl = document.getElementById('recall-sentence-mastery-badge');
  if (masteryTextEl) {
    const percent = stateMastery * 25;
    let levelName = "Semilla (Por repasar)";
    let badgeBg = "rgba(255, 193, 7, 0.15)";
    let badgeFg = "hsl(36, 100% ,30%)";
    
    if (stateMastery === 4) {
      levelName = "Árbol Maduro (Largo Plazo)";
      badgeBg = "rgba(76, 175, 80, 0.15)";
      badgeFg = "hsl(142, 60% ,30%)";
    } else if (stateMastery === 3) {
      levelName = "Planta Joven (Mediano Plazo)";
      badgeBg = "rgba(33, 150, 243, 0.1)";
      badgeFg = "hsl(215, 60% ,40%)";
    } else if (stateMastery === 2) {
      levelName = "Brote Joven (Corto Plazo)";
      badgeBg = "rgba(76, 175, 80, 0.1)";
      badgeFg = "hsl(142, 50% ,35%)";
    }
    
    masteryTextEl.textContent = `Dominio: ${percent}% (${levelName})`;
    if (masteryBadgeEl) {
      masteryBadgeEl.style.backgroundColor = badgeBg;
      masteryBadgeEl.style.color = badgeFg;
    }
  }
  
  updateSRUI();
}

function diffWords(userText, correctText) {
  const cleanWord = (w) => w.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?¿¡]/g, "").trim();
  const userWords = userText.split(/\s+/).filter(w => w.trim() !== "");
  const correctWords = correctText.split(/\s+/).filter(w => w.trim() !== "");
  
  const dp = Array(userWords.length + 1).fill(null).map(() => Array(correctWords.length + 1).fill(0));
  
  for (let i = 1; i <= userWords.length; i++) {
    for (let j = 1; j <= correctWords.length; j++) {
      if (cleanWord(userWords[i-1]) === cleanWord(correctWords[j-1])) {
        dp[i][j] = dp[i-1][j-1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i-1][j], dp[i][j-1]);
      }
    }
  }
  
  let i = userWords.length;
  let j = correctWords.length;
  
  const userAligned = [];
  const correctAligned = [];
  
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && cleanWord(userWords[i-1]) === cleanWord(correctWords[j-1])) {
      userAligned.unshift({ word: userWords[i-1], match: true });
      correctAligned.unshift({ word: correctWords[j-1], match: true });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j-1] >= dp[i-1][j])) {
      correctAligned.unshift({ word: correctWords[j-1], match: false });
      j--;
    } else {
      userAligned.unshift({ word: userWords[i-1], match: false });
      i--;
    }
  }
  
  const userHTML = userAligned.map(item => {
    if (item.match) {
      return `<span style="color: hsl(var(--md-sys-color-accent)); font-weight: 600;">${escapeHtml(item.word)}</span>`;
    } else {
      return `<span style="color: hsl(var(--md-sys-color-error)); font-weight: 700; text-decoration: underline wavy hsl(var(--md-sys-color-error));" title="Diferente del modelo">${escapeHtml(item.word)}</span>`;
    }
  }).join(' ');
  
  const correctHTML = correctAligned.map(item => {
    if (item.match) {
      return `<span class="matched" style="color: hsl(var(--md-sys-color-on-surface));">${escapeHtml(item.word)}</span>`;
    } else {
      return `<span class="missed" style="color: hsl(var(--md-sys-color-accent)); font-weight: 600; background-color: rgba(76, 175, 80, 0.15); padding: 2px 4px; border-radius: 4px;">${escapeHtml(item.word)}</span>`;
    }
  }).join(' ');
  
  return { userHTML, correctHTML };
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
  
  // Renderizar la comparación coloreada (diff)
  const diffResult = diffWords(userAttempt, correctAnswer);
  feedbackUser.innerHTML = diffResult.userHTML;
  feedbackCorrect.innerHTML = diffResult.correctHTML;
  
  if (accuracy >= 85) {
    feedbackTitle.textContent = "¡Excelente traducción!";
    feedbackTitle.className = "text-success";
    feedbackCard.style.borderColor = "hsl(142, 60%, 60%)";
    
    // Incrementar racha, contar palabras y aciertos
    appState.metrics.streak += 1;
    appState.metrics.wordsCount += correctAnswer.split(/\s+/).length;
    appState.metrics.correctCount += 1;
  } else {
    if (accuracy >= 50) {
      feedbackTitle.textContent = "Casi correcto. Revisa los detalles.";
      feedbackTitle.className = "text-secondary";
      feedbackCard.style.borderColor = "hsl(215, 15%, 70%)";
    } else {
      feedbackTitle.textContent = "Inténtalo de nuevo.";
      feedbackTitle.className = "text-error";
      feedbackCard.style.borderColor = "red";
    }
    
    // Resetear racha e incrementar fallos
    appState.metrics.streak = 0;
    appState.metrics.incorrectCount += 1;
  }
  
  updateSRUI();

  // Actualizar métricas del estado local
  appState.metrics.totalAttempts += 1;
  appState.metrics.accuracySum += accuracy;
  if (currentPracticeIndex === practiceSentences.length - 1) {
    appState.metrics.sessionsCompleted += 1;
  }
  saveAppState();
  logLearningTelemetry({
    activityType: 'recall_written',
    accuracy: accuracy,
    sentenceL2: correctAnswer,
    sentenceL1: sentence.l1,
    wordTargeted: sentence.word_targeted || ''
  });
  renderMetrics();
}

let activeVoiceStream = null;

function toggleSpeechRecording() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert("Tu navegador no soporta el reconocimiento de voz. Te recomendamos usar Google Chrome o Microsoft Edge.");
    return;
  }

  const recordBtn = document.getElementById('btn-record-speech');
  const recordIcon = document.getElementById('record-mic-icon');
  const statusEl = document.getElementById('speech-status');
  const transcriptEl = document.getElementById('recall-speech-transcript');
  const submitBtn = document.getElementById('btn-speech-submit');
  
  const sentence = practiceSentences[currentPracticeIndex];
  if (!sentence) return;

  if (!isRecordingSpeech) {
    // Iniciar grabación de audio y transcripción
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        activeVoiceStream = stream;
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunks.push(event.data);
          }
        };
        
        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
          recordedAudios[currentPracticeIndex] = audioBlob;
          
          if (userRecordedVoiceUrl) {
            URL.revokeObjectURL(userRecordedVoiceUrl);
          }
          userRecordedVoiceUrl = URL.createObjectURL(audioBlob);
        };
        
        mediaRecorder.start();
        
        // Iniciar reconocimiento de voz
        speechRecognitionInstance = new SpeechRecognition();
        const studyLang = sentence.language || 'Inglés';
        speechRecognitionInstance.lang = LANG_CODES[studyLang] || 'en-US';
        speechRecognitionInstance.continuous = false;
        speechRecognitionInstance.interimResults = false;
        
        speechRecognitionInstance.onstart = () => {
          statusEl.textContent = 'Escuchando... ¡Habla ahora!';
          recordIcon.textContent = 'stop';
          recordBtn.classList.add('recording-active');
        };
        
        speechRecognitionInstance.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          transcriptEl.textContent = transcript;
          submitBtn.disabled = false;
          statusEl.textContent = 'Grabación finalizada. Listo para validar.';
        };
        
        speechRecognitionInstance.onerror = (event) => {
          console.error("Speech recognition error:", event.error);
          statusEl.textContent = `Error: ${event.error}. Intenta de nuevo.`;
          stopRecordingControls();
        };
        
        speechRecognitionInstance.onend = () => {
          if (isRecordingSpeech) {
            stopRecordingControls();
          }
        };
        
        speechRecognitionInstance.start();
        isRecordingSpeech = true;
      })
      .catch(err => {
        console.error("Mic access denied:", err);
        alert("No se pudo acceder al micrófono. Asegúrate de dar permisos de audio a la aplicación.");
      });
  } else {
    stopRecordingControls();
  }
}

function stopRecordingControls() {
  const recordBtn = document.getElementById('btn-record-speech');
  const recordIcon = document.getElementById('record-mic-icon');
  const statusEl = document.getElementById('speech-status');
  
  isRecordingSpeech = false;
  
  if (recordIcon) recordIcon.textContent = 'mic';
  if (recordBtn) recordBtn.classList.remove('recording-active');
  if (statusEl && statusEl.textContent.startsWith('Escuchando')) {
    statusEl.textContent = 'Grabación procesada.';
  }
  
  if (speechRecognitionInstance) {
    try {
      speechRecognitionInstance.stop();
    } catch(e) {}
    speechRecognitionInstance = null;
  }
  
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    try {
      mediaRecorder.stop();
    } catch(e) {}
  }
  
  if (activeVoiceStream) {
    activeVoiceStream.getTracks().forEach(track => track.stop());
    activeVoiceStream = null;
  }
}

function evaluatePronunciationAttempt() {
  const transcriptEl = document.getElementById('recall-speech-transcript');
  const userAttempt = transcriptEl.textContent.trim();
  if (!userAttempt || userAttempt.startsWith('(')) return;
  
  const sentence = practiceSentences[currentPracticeIndex];
  const correctAnswer = sentence.l2;
  
  // Calcular porcentaje de precisión basado en similitud
  const accuracy = Math.round(calculateSimilarity(userAttempt.toLowerCase(), correctAnswer.toLowerCase()) * 100);
  
  const feedbackCard = document.getElementById('recall-feedback-card');
  const feedbackScore = document.getElementById('feedback-score');
  const feedbackTitle = document.getElementById('feedback-title');
  const feedbackUser = document.getElementById('feedback-user-attempt');
  const feedbackCorrect = document.getElementById('feedback-correct-answer');
  const replayGroup = document.getElementById('user-voice-replay-group');
  
  feedbackCard.classList.remove('hidden');
  
  feedbackScore.textContent = `${accuracy}%`;
  
  // Renderizar la comparación coloreada (diff)
  const diffResult = diffWords(userAttempt, correctAnswer);
  feedbackUser.innerHTML = diffResult.userHTML;
  feedbackCorrect.innerHTML = diffResult.correctHTML;
  
  // Mostrar botón de reproducción de la propia grabación de voz
  if (replayGroup && userRecordedVoiceUrl) {
    replayGroup.classList.remove('hidden');
  }
  
  if (accuracy >= 85) {
    feedbackTitle.textContent = "¡Excelente pronunciación!";
    feedbackTitle.className = "text-success";
    feedbackCard.style.borderColor = "hsl(142, 60%, 60%)";
    
    appState.metrics.streak += 1;
    appState.metrics.wordsCount += correctAnswer.split(/\s+/).length;
    appState.metrics.correctCount += 1;
  } else {
    if (accuracy >= 50) {
      feedbackTitle.textContent = "Casi correcto. Revisa los detalles.";
      feedbackTitle.className = "text-secondary";
      feedbackCard.style.borderColor = "hsl(215, 15%, 70%)";
    } else {
      feedbackTitle.textContent = "Inténtalo de nuevo. Presta atención al modelo de voz.";
      feedbackTitle.className = "text-error";
      feedbackCard.style.borderColor = "red";
    }
    
    appState.metrics.streak = 0;
    appState.metrics.incorrectCount += 1;
  }
  
  updateSRUI();

  appState.metrics.totalPronAttempts += 1;
  appState.metrics.pronAccuracySum += accuracy;
  
  saveAppState();
  logLearningTelemetry({
    activityType: 'recall_speech',
    accuracy: accuracy,
    sentenceL2: correctAnswer,
    sentenceL1: sentence.l1,
    wordTargeted: sentence.word_targeted || ''
  });
  renderMetrics();
}

let practiceAudioElement = null;
function playPracticeSentenceTTS() {
  const sentence = practiceSentences[currentPracticeIndex];
  if (!sentence) return;
  
  if (practiceAudioElement) {
    practiceAudioElement.pause();
    practiceAudioElement = null;
  }
  
  const engine = document.getElementById('tts-engine').value;
  const voice = document.getElementById('tts-voice').value || (engine === 'openai' ? 'alloy' : 'en-US-JennyNeural');
  const speed = parseFloat(document.getElementById('tts-speed').value) || 1.0;
  
  if (engine === 'browser') {
    const langCode = LANG_CODES[sentence.language] || 'en-US';
    const utter = new SpeechSynthesisUtterance(sentence.l2);
    utter.lang = langCode;
    utter.rate = speed;
    const voices = window.speechSynthesis.getVoices();
    const matchedVoice = voices.find(v => v.name === voice) || voices.find(v => v.lang.startsWith(langCode));
    if (matchedVoice) utter.voice = matchedVoice;
    window.speechSynthesis.speak(utter);
  } else if (engine === 'azure') {
    const audioUrl = `/api/tts?text=${encodeURIComponent(sentence.l2)}&voice=${encodeURIComponent(voice)}&speed=${speed}`;
    practiceAudioElement = new Audio(audioUrl);
    practiceAudioElement.play().catch(e => console.error("Playback error:", e));
  } else if (engine === 'openai') {
    let key = appState.settings.apiTtsKey || (appState.settings.apiProvider === 'openai' ? appState.settings.apiKey : '');
    if (!key) {
      alert("Por favor, ingresa tu clave API de OpenAI en la pestaña de Ajustes para reproducir la voz.");
      return;
    }
    const baseUrl = appState.settings.apiUrl || 'https://api.openai.com/v1';
    const url = `${baseUrl}/audio/speech`;
    fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: sentence.l2,
        voice: voice,
        speed: speed
      })
    })
    .then(r => r.blob())
    .then(blob => {
      const audioUrl = URL.createObjectURL(blob);
      practiceAudioElement = new Audio(audioUrl);
      practiceAudioElement.play();
    })
    .catch(e => console.error("OpenAI playback failed:", e));
  }
}

async function exportPracticeToMp3() {
  const keys = Object.keys(recordedAudios);
  if (keys.length === 0) {
    alert("No tienes grabaciones de voz en esta sesión de práctica. ¡Usa el micrófono en el Modo Voz antes de exportar!");
    return;
  }
  
  const progressIndicator = document.getElementById('export-loading-indicator');
  const progressText = document.getElementById('export-progress-text');
  if (progressIndicator) progressIndicator.classList.remove('hidden');
  if (progressText) progressText.textContent = "Empaquetando grabaciones de voz...";
  
  try {
    const zip = new JSZip();
    let readmeText = `POLYGLOTLAB - EXPORTACIÓN DE PRÁCTICA DE ORATORIA\n`;
    readmeText += `Fecha: ${new Date().toLocaleString()}\n`;
    readmeText += `==========================================================\n\n`;
    
    keys.forEach(keyIdx => {
      const idx = parseInt(keyIdx);
      const sentence = practiceSentences[idx];
      if (!sentence) return;
      
      const blob = recordedAudios[keyIdx];
      const indexStr = String(idx + 1).padStart(2, '0');
      
      // Añadir la grabación de audio del usuario al ZIP
      zip.file(`${indexStr}_mi_pronunciacion.webm`, blob);
      
      readmeText += `${indexStr}. Frase en Español: ${sentence.l1}\n`;
      readmeText += `    Traducción Correcta: ${sentence.l2}\n\n`;
    });
    
    zip.file("LEEME.txt", readmeText);
    
    const content = await zip.generateAsync({ type: "blob" });
    const filename = `mi_practica_oratoria_${Date.now()}.zip`;
    
    const response = await fetch(`/api/save-export?filename=${encodeURIComponent(filename)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream'
      },
      body: content
    });
    const resData = await response.json();
    if (!resData.success) {
      throw new Error("No se pudo guardar la exportación en el servidor.");
    }
    
    const a = document.createElement('a');
    a.href = resData.url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    alert("¡Tus grabaciones de voz han sido exportadas con éxito en un archivo ZIP!");
  } catch (err) {
    console.error("Export error:", err);
    alert(`Ocurrió un error al exportar la práctica: ${err.message}`);
  } finally {
    if (progressIndicator) progressIndicator.classList.add('hidden');
  }
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

function updateUserAvatarAndLevel() {
  const container = document.getElementById('user-avatar-container');
  const img = document.getElementById('user-avatar-img');
  const levelText = document.querySelector('.user-level');
  
  const topContainer = document.getElementById('top-avatar-container');
  const topImg = document.getElementById('top-avatar-img');
  const topLevelText = document.getElementById('top-avatar-level-text');
  
  const sessions = appState.metrics.sessionsCompleted || 0;
  const attempts = (appState.metrics.totalAttempts || 0) + (appState.metrics.totalPronAttempts || 0);
  const words = appState.metrics.wordsCount || 0;
  
  const xp = (sessions * 100) + (attempts * 10) + (words * 20);
  
  let level = 1;
  let levelName = "Cerebro Novato";
  let avatarSrc = "assets/avatars/brain_level1.png";
  
  if (xp >= 2000) {
    level = 4;
    levelName = "Cerebro Hiperpolíglota 🔥";
    avatarSrc = "assets/avatars/brain_level4.png";
  } else if (xp >= 800) {
    level = 3;
    levelName = "Cerebro Analítico 🧠";
    avatarSrc = "assets/avatars/brain_level3.png";
  } else if (xp >= 200) {
    level = 2;
    levelName = "Cerebro Aprendiz 🌱";
    avatarSrc = "assets/avatars/brain_level2.png";
  }
  
  // Actualizar avatar inferior (barra lateral)
  if (container && img) {
    container.className = "user-avatar";
    container.classList.add(`level-${level}`);
    if (!img.src.includes(avatarSrc)) {
      img.src = avatarSrc;
    }
  }
  if (levelText) {
    levelText.textContent = levelName;
  }
  
  // Actualizar avatar superior grande (top-bar)
  if (topContainer && topImg) {
    topContainer.className = "user-avatar";
    topContainer.classList.add(`level-${level}`);
    if (!topImg.src.includes(avatarSrc)) {
      topImg.src = avatarSrc;
    }
  }
  if (topLevelText) {
    topLevelText.textContent = levelName;
  }
}

function renderMetrics() {
  document.getElementById('metric-sessions').textContent = appState.metrics.sessionsCompleted;
  
  const avgAccuracy = appState.metrics.totalAttempts > 0 
    ? Math.round(appState.metrics.accuracySum / appState.metrics.totalAttempts) 
    : 0;
  document.getElementById('metric-accuracy').textContent = `${avgAccuracy}%`;
  
  // Racha
  document.getElementById('metric-streak').textContent = `${appState.metrics.streak || 0} 🔥`;
  
  // Precisión Voz
  const avgPronAccuracy = appState.metrics.totalPronAttempts > 0
    ? Math.round(appState.metrics.pronAccuracySum / appState.metrics.totalPronAttempts)
    : 0;
  document.getElementById('metric-pron-accuracy').textContent = `${avgPronAccuracy}%`;
  
  // Intentos
  document.getElementById('metric-attempts').textContent = appState.metrics.totalAttempts + appState.metrics.totalPronAttempts;
  
  // Palabras
  document.getElementById('metric-words').textContent = appState.metrics.wordsCount || 0;
  
  // Rellenar barra de progreso
  const progressFill = document.getElementById('metric-progress-fill');
  const generalProgress = avgAccuracy;
  progressFill.style.width = `${Math.min(generalProgress, 100)}%`;
  
  // Actualizar avatar y nivel evolutivo del cerebro
  updateUserAvatarAndLevel();
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
Crucially, ensure a balanced distribution of verb tenses across the sentences (e.g., Present, Past Simple, Present Perfect, Future, Conditional, Imperative) to provide a rich learning experience.
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
  const btnImport = document.getElementById('btn-mode-import');
  const panelAi = document.getElementById('panel-gen-ai');
  const panelManual = document.getElementById('panel-gen-manual');
  const panelImport = document.getElementById('panel-gen-import');
  
  btnAi.classList.remove('active');
  btnManual.classList.remove('active');
  btnImport.classList.remove('active');
  panelAi.classList.add('hidden');
  panelManual.classList.add('hidden');
  panelImport.classList.add('hidden');
  
  if (mode === 'ai') {
    btnAi.classList.add('active');
    panelAi.classList.remove('hidden');
  } else if (mode === 'manual') {
    btnManual.classList.add('active');
    panelManual.classList.remove('hidden');
  } else if (mode === 'import') {
    btnImport.classList.add('active');
    panelImport.classList.remove('hidden');
    initImportPanel();
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

// ==========================================
// 6.2 LÓGICA DE IMPORTACIÓN POR ARCHIVO PLANO
// ==========================================
let parsedSentencesTemp = [];

function initImportPanel() {
  parsedSentencesTemp = [];
  
  // Resetear formularios
  document.getElementById('import-island-name').value = '';
  document.getElementById('import-textarea').value = '';
  document.getElementById('import-file-input').value = '';
  document.getElementById('import-file-name').textContent = 'Ningún archivo seleccionado';
  document.getElementById('import-destination-type').value = 'new';
  
  // Ocultar/Mostrar campos condicionales
  document.getElementById('import-new-island-fields').classList.remove('hidden');
  document.getElementById('import-existing-island-fields').classList.add('hidden');
  document.getElementById('import-preview-area').classList.add('hidden');
  document.getElementById('btn-import-submit').disabled = true;
  
  // Cargar islas existentes en el selector
  populateImportIslandsDropdown();
}

function populateImportIslandsDropdown() {
  const select = document.getElementById('import-island-select');
  select.innerHTML = '';
  
  if (appState.islands.length === 0) {
    const opt = document.createElement('option');
    opt.value = '';
    opt.textContent = '-- No hay islas disponibles --';
    select.appendChild(opt);
    return;
  }
  
  appState.islands.forEach(island => {
    const opt = document.createElement('option');
    opt.value = island.id;
    opt.textContent = `${island.name} (${island.language})`;
    select.appendChild(opt);
  });
}

function handleImportDestinationChange(e) {
  const type = e.target.value;
  const newFields = document.getElementById('import-new-island-fields');
  const existingFields = document.getElementById('import-existing-island-fields');
  
  if (type === 'new') {
    newFields.classList.remove('hidden');
    existingFields.classList.add('hidden');
  } else {
    newFields.classList.add('hidden');
    existingFields.classList.remove('hidden');
  }
  validateImportSubmitButton();
}

function parsePlainLines(text) {
  const lines = text.split(/\r?\n/);
  const results = [];
  
  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) return;
    
    // Ignorar líneas de cabecera si el usuario copia las instrucciones
    if (trimmed.toLowerCase().startsWith("oración l1") || trimmed.toLowerCase().startsWith("ejemplo:")) return;
    
    let delimiter = null;
    if (trimmed.includes('|')) {
      delimiter = '|';
    } else if (trimmed.includes(';')) {
      delimiter = ';';
    } else if (trimmed.includes('\t')) {
      delimiter = '\t';
    } else if (trimmed.includes(',')) {
      // Usar coma solo si resulta en un split válido de mínimo 2 columnas
      const parts = trimmed.split(',');
      if (parts.length >= 2 && parts[0].trim().length > 0 && parts[1].trim().length > 0) {
        delimiter = ',';
      }
    }
    
    if (delimiter) {
      const columns = trimmed.split(delimiter).map(c => c.trim());
      if (columns.length >= 2 && columns[0] && columns[1]) {
        // Remover comillas si existen (estilo CSV estándar)
        const cleanL1 = columns[0].replace(/^["']|["']$/g, '').trim();
        const cleanL2 = columns[1].replace(/^["']|["']$/g, '').trim();
        const cleanWord = columns[2] ? columns[2].replace(/^["']|["']$/g, '').trim() : '';
        
        results.push({
          l1: cleanL1,
          l2: cleanL2,
          word: cleanWord
        });
      }
    }
  });
  
  return results;
}

function processImportInput() {
  const text = document.getElementById('import-textarea').value;
  parsedSentencesTemp = parsePlainLines(text);
  renderImportPreview();
}

function renderImportPreview() {
  const previewArea = document.getElementById('import-preview-area');
  const countSpan = document.getElementById('import-preview-count');
  const tbody = document.getElementById('import-preview-body');
  
  tbody.innerHTML = '';
  
  if (parsedSentencesTemp.length === 0) {
    previewArea.classList.add('hidden');
    validateImportSubmitButton();
    return;
  }
  
  countSpan.textContent = parsedSentencesTemp.length;
  parsedSentencesTemp.forEach(s => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escapeHtml(s.l1)}</td>
      <td>${escapeHtml(s.l2)}</td>
      <td class="font-semibold text-primary">${escapeHtml(s.word || 'N/A')}</td>
    `;
    tbody.appendChild(tr);
  });
  
  previewArea.classList.remove('hidden');
  validateImportSubmitButton();
}

function handleImportFileSelect(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  readImportFile(file);
}

function readImportFile(file) {
  document.getElementById('import-file-name').textContent = file.name;
  
  const reader = new FileReader();
  reader.onload = function(evt) {
    const content = evt.target.result;
    document.getElementById('import-textarea').value = content;
    processImportInput();
  };
  reader.onerror = function() {
    alert("Error al leer el archivo plano.");
  };
  reader.readAsText(file, "UTF-8");
}

function clearImportData() {
  document.getElementById('import-textarea').value = '';
  document.getElementById('import-file-input').value = '';
  document.getElementById('import-file-name').textContent = 'Ningún archivo seleccionado';
  parsedSentencesTemp = [];
  renderImportPreview();
}

function validateImportSubmitButton() {
  const submitBtn = document.getElementById('btn-import-submit');
  const destType = document.getElementById('import-destination-type').value;
  
  let valid = parsedSentencesTemp.length > 0;
  
  if (destType === 'new') {
    const islandName = document.getElementById('import-island-name').value.trim();
    if (!islandName) valid = false;
  } else {
    const islandSelect = document.getElementById('import-island-select').value;
    if (!islandSelect) valid = false;
  }
  
  submitBtn.disabled = !valid;
}

function submitImportedSentences() {
  if (parsedSentencesTemp.length === 0) return;
  
  const destType = document.getElementById('import-destination-type').value;
  let targetIslandIndex = -1;
  
  if (destType === 'new') {
    const islandName = document.getElementById('import-island-name').value.trim();
    const l2 = document.getElementById('import-target-lang').value;
    
    if (!islandName) {
      alert("Por favor, proporciona un nombre para la nueva isla.");
      document.getElementById('import-island-name').focus();
      return;
    }
    
    const newIsland = {
      id: 'island_import_' + Date.now(),
      name: islandName,
      language: l2,
      sentences: parsedSentencesTemp.map((s, idx) => ({
        id: `s_imp_${Date.now()}_${idx}`,
        l1: s.l1,
        l2: s.l2,
        word_targeted: s.word || s.l2.split(' ')[0].toLowerCase().replace(/[^a-zA-Z]/g, ''),
        mastery: 0
      }))
    };
    
    appState.islands.push(newIsland);
    targetIslandIndex = appState.islands.length - 1;
    
  } else {
    const selectedId = document.getElementById('import-island-select').value;
    if (!selectedId) {
      alert("Por favor, selecciona una isla existente.");
      return;
    }
    
    const targetIsland = appState.islands.find(is => is.id === selectedId);
    if (!targetIsland) {
      alert("La isla seleccionada no existe.");
      return;
    }
    
    if (!targetIsland.sentences) targetIsland.sentences = [];
    
    parsedSentencesTemp.forEach((s, idx) => {
      targetIsland.sentences.push({
        id: `s_imp_${Date.now()}_${idx}`,
        l1: s.l1,
        l2: s.l2,
        word_targeted: s.word || s.l2.split(' ')[0].toLowerCase().replace(/[^a-zA-Z]/g, ''),
        mastery: 0
      });
    });
    
    targetIslandIndex = appState.islands.indexOf(targetIsland);
  }
  
  currentIslandIndex = targetIslandIndex;
  currentSentenceIndex = 0;
  
  saveAppState();
  initImportPanel();
  
  alert("¡Oraciones importadas y guardadas correctamente!");
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
  document.getElementById('api-tts-key').value = appState.settings.apiTtsKey || '';

  // Cargar idioma de la interfaz
  const uiLangSelect = document.getElementById('settings-ui-lang');
  if (uiLangSelect) {
    uiLangSelect.value = appState.settings.uiLanguage || 'es';
  }

  // Visibilidad de tarjeta de seguridad de Firebase
  const securityCard = document.getElementById('settings-security-card');
  if (securityCard) {
    if (isFirebaseEnabled && firebaseAuth && firebaseAuth.currentUser) {
      securityCard.classList.remove('hidden');
    } else {
      securityCard.classList.add('hidden');
    }
  }
}

function saveSettingsForm(e) {
  e.preventDefault();
  
  appState.settings.apiProvider = document.getElementById('api-provider').value;
  appState.settings.apiKey = document.getElementById('api-key').value.trim();
  appState.settings.apiUrl = document.getElementById('api-url').value.trim();
  appState.settings.apiTtsKey = document.getElementById('api-tts-key').value.trim();
  
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

async function handleDeleteAccount() {
  if (!isFirebaseEnabled || !firebaseAuth || !firebaseAuth.currentUser) {
    alert("No tienes una sesión activa en la nube para eliminar.");
    return;
  }
  
  const confirmed = await showCustomConfirm(
    "¿Eliminar tu cuenta permanentemente?",
    "Esta acción es irreversible. Se borrarán permanentemente tu cuenta de acceso, tu perfil y todas tus islas sincronizadas en la nube de Firebase."
  );
  
  if (!confirmed) return;
  
  const btnDelete = document.getElementById('btn-delete-account');
  const originalText = btnDelete.innerHTML;
  btnDelete.disabled = true;
  btnDelete.textContent = "Eliminando cuenta de la nube...";
  
  try {
    const user = firebaseAuth.currentUser;
    const userId = user.uid;
    
    // 1. Borrar documento del usuario en la base de datos Firestore
    console.log("Eliminando documento de usuario en Firestore:", userId);
    await firebaseDb.collection("users").doc(userId).delete().catch(err => {
      console.warn("Advertencia: No se pudo eliminar el documento de Firestore (tal vez no existía):", err);
    });
    
    // 2. Eliminar al usuario de Firebase Auth
    console.log("Eliminando usuario de Firebase Auth...");
    await user.delete();
    
    // 3. Limpiar estado local
    localStorage.removeItem('polyglotlab_state');
    appState = { ...DEFAULT_STATE };
    
    alert("¡Tu cuenta y todos tus datos sincronizados han sido eliminados correctamente de la nube!\n\nLa aplicación se reiniciará para que puedas registrarte de nuevo.");
    window.location.reload();
  } catch (error) {
    console.error("Error al eliminar la cuenta:", error);
    btnDelete.disabled = false;
    btnDelete.innerHTML = originalText;
    
    if (error.code === 'auth/requires-recent-login') {
      const logOutConfirm = await showCustomConfirm(
        "Acción requerida por Firebase",
        "Por seguridad, Firebase requiere que hayas iniciado sesión recientemente antes de eliminar tu cuenta. ¿Deseas simplemente cerrar sesión en este dispositivo para poder registrar una cuenta nueva?"
      );
      if (logOutConfirm) {
        // Cerrar sesión localmente y en Auth
        await firebaseAuth.signOut().catch(()=>{});
        localStorage.removeItem('polyglotlab_state');
        appState = { ...DEFAULT_STATE };
        window.location.reload();
      }
    } else {
      alert("No se pudo eliminar la cuenta: " + error.message);
    }
  }
}

// 8. ONBOARDING & SETUP INICIAL
let authMode = 'login'; // 'login' o 'register' por defecto

function setupFirebaseAuthToggle() {
  if (!isFirebaseEnabled) return;
  
  // Mostrar selector de modo y contraseña
  document.getElementById('auth-mode-selector').classList.remove('hidden');
  document.getElementById('onboarding-password-group').classList.remove('hidden');
  document.getElementById('profile-password').setAttribute('required', 'true');
  
  const btnRegister = document.getElementById('btn-mode-register');
  const btnLogin = document.getElementById('btn-mode-login');
  const nameRow = document.getElementById('onboarding-name-row');
  const l1Group = document.getElementById('onboarding-l1-group');
  const termsGroup = document.getElementById('onboarding-terms-group');
  const checkboxTerms = document.getElementById('profile-terms');
  const submitText = document.getElementById('onboarding-submit-text');
  
  // 1. Configurar estado inicial de LOGIN por defecto al arrancar
  authMode = 'login';
  btnLogin.classList.add('active');
  btnLogin.style.color = 'hsl(var(--md-sys-color-primary))';
  btnLogin.style.borderBottom = '2px solid hsl(var(--md-sys-color-primary))';
  btnRegister.classList.remove('active');
  btnRegister.style.color = 'var(--md-sys-color-secondary)';
  btnRegister.style.borderBottom = 'none';
  
  nameRow.classList.add('hidden');
  l1Group.classList.add('hidden');
  termsGroup.classList.add('hidden');
  if (checkboxTerms) checkboxTerms.removeAttribute('required');
  document.getElementById('profile-first-name').removeAttribute('required');
  document.getElementById('profile-last-name').removeAttribute('required');
  submitText.textContent = "Iniciar Sesión";
  
  const forgotPwdContainer = document.getElementById('forgot-password-container');
  if (forgotPwdContainer) forgotPwdContainer.classList.remove('hidden');
  
  // 2. Conmutar a modo REGISTRO
  btnRegister.addEventListener('click', () => {
    authMode = 'register';
    btnRegister.classList.add('active');
    btnRegister.style.color = 'hsl(var(--md-sys-color-primary))';
    btnRegister.style.borderBottom = '2px solid hsl(var(--md-sys-color-primary))';
    btnLogin.classList.remove('active');
    btnLogin.style.color = 'var(--md-sys-color-secondary)';
    btnLogin.style.borderBottom = 'none';
    
    nameRow.classList.remove('hidden');
    l1Group.classList.remove('hidden');
    termsGroup.classList.remove('hidden');
    if (checkboxTerms) checkboxTerms.setAttribute('required', 'true');
    document.getElementById('profile-first-name').setAttribute('required', 'true');
    document.getElementById('profile-last-name').setAttribute('required', 'true');
    submitText.textContent = "Comenzar Aventura";
    
    if (forgotPwdContainer) forgotPwdContainer.classList.add('hidden');
  });
  
  // 3. Conmutar a modo INICIAR SESIÓN
  btnLogin.addEventListener('click', () => {
    authMode = 'login';
    btnLogin.classList.add('active');
    btnLogin.style.color = 'hsl(var(--md-sys-color-primary))';
    btnLogin.style.borderBottom = '2px solid hsl(var(--md-sys-color-primary))';
    btnRegister.classList.remove('active');
    btnRegister.style.color = 'var(--md-sys-color-secondary)';
    btnRegister.style.borderBottom = 'none';
    
    nameRow.classList.add('hidden');
    l1Group.classList.add('hidden');
    termsGroup.classList.add('hidden');
    if (checkboxTerms) checkboxTerms.removeAttribute('required');
    document.getElementById('profile-first-name').removeAttribute('required');
    document.getElementById('profile-last-name').removeAttribute('required');
    submitText.textContent = "Iniciar Sesión";
    
    if (forgotPwdContainer) forgotPwdContainer.classList.remove('hidden');
  });

  // 4. Modal explicativo para los links de términos y privacidad
  const linkTerms = document.getElementById('link-terms');
  const linkPrivacy = document.getElementById('link-privacy');
  
  if (linkTerms) {
    linkTerms.addEventListener('click', (e) => {
      e.preventDefault();
      alert("Términos y Condiciones de Uso de PolyglotLab:\n\n" +
            "1. Propósito: PolyglotLab es una herramienta personal local-first para el aprendizaje práctico de idiomas basada en la adquisición por contexto.\n" +
            "2. Llaves de API (BYOK): Eres propietario y único responsable del uso y confidencialidad de tus llaves de API (OpenAI u otros proveedores).\n" +
            "3. Datos locales: Toda la información de tu perfil, historial de estudio e islas creadas se guarda de forma segura en la memoria de tu navegador (LocalStorage).\n" +
            "4. Sincronización: Si habilitas Firebase, tu progreso se respaldará en servidores seguros únicamente para sincronización de tus dispositivos.");
    });
  }
  
  if (linkPrivacy) {
    linkPrivacy.addEventListener('click', (e) => {
      e.preventDefault();
      alert("Autorización para el Tratamiento de Datos Personales:\n\n" +
            "De conformidad con las leyes de protección de datos, al registrarte autorizas a PolyglotLab a almacenar tu Nombre y Correo Electrónico con los siguientes fines únicos:\n\n" +
            "- Creación y gestión de tu cuenta de usuario.\n" +
            "- Sincronización en la nube de tu progreso de estudio.\n" +
            "- Envío seguro de comentarios y sugerencias para la mejora de la app.\n\n" +
            "Tus datos de contacto están protegidos y nunca serán transferidos, vendidos o utilizados con fines comerciales o publicitarios.");
    });
  }
}

async function handleForgotPassword(e) {
  e.preventDefault();
  
  if (!isFirebaseEnabled || !firebaseAuth) {
    alert("La sincronización en la nube (Firebase) no está activa. No es necesario recuperar contraseñas locales.");
    return;
  }
  
  const emailInput = document.getElementById('profile-email');
  const email = emailInput ? emailInput.value.trim() : '';
  
  if (!email) {
    alert("Por favor, ingresa tu correo electrónico en el campo superior antes de restablecer tu contraseña.");
    if (emailInput) emailInput.focus();
    return;
  }
  
  // Validar formato básico de correo electrónico
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    alert("Por favor, ingresa un correo electrónico con formato válido.");
    if (emailInput) emailInput.focus();
    return;
  }
  
  try {
    const linkForgot = document.getElementById('link-forgot-password');
    const originalText = linkForgot ? linkForgot.textContent : '¿Olvidaste tu contraseña?';
    if (linkForgot) {
      linkForgot.textContent = "Enviando enlace...";
      linkForgot.style.pointerEvents = 'none';
      linkForgot.style.opacity = '0.6';
    }
    
    await firebaseAuth.sendPasswordResetEmail(email);
    
    alert(`¡Correo de restablecimiento enviado con éxito a ${email}!\n\nRevisa tu bandeja de entrada (y la carpeta de spam si es necesario) para seguir el enlace de recuperación.`);
    
    if (linkForgot) {
      linkForgot.textContent = originalText;
      linkForgot.style.pointerEvents = 'auto';
      linkForgot.style.opacity = '1';
    }
  } catch (error) {
    console.error("Error al enviar correo de recuperación:", error);
    
    // Traducción amigable de errores comunes de Firebase Auth
    let message = error.message;
    if (error.code === 'auth/user-not-found') {
      message = "No existe ninguna cuenta de usuario registrada con este correo electrónico.";
    } else if (error.code === 'auth/invalid-email') {
      message = "El formato del correo electrónico ingresado no es válido.";
    } else if (error.code === 'auth/too-many-requests') {
      message = "Hemos detectado demasiadas solicitudes de recuperación para este correo electrónico. Por favor, inténtalo más tarde.";
    }
    
    alert("No pudimos enviar el correo de recuperación:\n\n" + message);
    
    const linkForgot = document.getElementById('link-forgot-password');
    if (linkForgot) {
      linkForgot.textContent = '¿Olvidaste tu contraseña?';
      linkForgot.style.pointerEvents = 'auto';
      linkForgot.style.opacity = '1';
    }
  }
}

function checkOnboarding() {
  const onboardingScreen = document.getElementById('onboarding-screen');
  if (!appState.profile) {
    onboardingScreen.classList.remove('hidden');
  } else {
    onboardingScreen.classList.add('hidden');
    updateUserDisplayBadge();
  }
}

async function handleOnboardingForm(e) {
  e.preventDefault();
  
  const submitBtn = document.getElementById('btn-onboarding-submit');
  submitBtn.disabled = true;
  const originalText = document.getElementById('onboarding-submit-text').textContent;
  document.getElementById('onboarding-submit-text').textContent = "Procesando...";

  const email = document.getElementById('profile-email').value.trim();
  const password = document.getElementById('profile-password') ? document.getElementById('profile-password').value : '';
  const firstName = document.getElementById('profile-first-name').value.trim();
  const lastName = document.getElementById('profile-last-name').value.trim();
  const l1 = document.getElementById('profile-l1').value;

  if (isFirebaseEnabled) {
    try {
      if (authMode === 'register') {
        const userCredential = await firebaseAuth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        appState.profile = { firstName, lastName, email, l1 };
        
        await firebaseDb.collection("users").doc(user.uid).set({
          profile: appState.profile,
          settings: appState.settings,
          islands: appState.islands,
          metrics: appState.metrics,
          lastUpdated: new Date().toISOString()
        });
        
        saveAppState();
      } else {
        const userCredential = await firebaseAuth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        const userDoc = await firebaseDb.collection("users").doc(user.uid).get();
        if (userDoc.exists) {
          const cloudData = userDoc.data();
          appState.profile = cloudData.profile || null;
          appState.settings = cloudData.settings || appState.settings;
          appState.islands = cloudData.islands || appState.islands;
          appState.metrics = cloudData.metrics || appState.metrics;
        } else {
          appState.profile = { firstName: 'Usuario', lastName: 'Polyglot', email, l1: 'Español' };
          await firebaseDb.collection("users").doc(user.uid).set({
            profile: appState.profile,
            settings: appState.settings,
            islands: appState.islands,
            metrics: appState.metrics,
            lastUpdated: new Date().toISOString()
          });
        }
        
        saveAppState();
      }
      
      document.getElementById('onboarding-screen').classList.add('hidden');
      updateUserDisplayBadge();
      switchTab('learn');
      
    } catch (err) {
      console.error("Error de autenticación en Firebase:", err);
      alert(`Error: ${err.message}`);
    } finally {
      submitBtn.disabled = false;
      document.getElementById('onboarding-submit-text').textContent = originalText;
    }
  } else {
    appState.profile = { firstName, lastName, email, l1 };
    saveAppState();
    document.getElementById('onboarding-screen').classList.add('hidden');
    updateUserDisplayBadge();
    switchTab('learn');
  }
}

function updateUserDisplayBadge() {
  if (appState.profile) {
    const fullName = `${appState.profile.firstName} ${appState.profile.lastName}`;
    document.getElementById('user-display-name').textContent = fullName;
    const avatarCharEl = document.getElementById('user-avatar-char');
    if (avatarCharEl) {
      avatarCharEl.textContent = appState.profile.firstName.charAt(0).toUpperCase();
    }
    // Autogestionar campos de feedback con el perfil del usuario logueado
    autofillFeedbackForm();
  }
}

// Lógica de escucha de Firebase Auth al iniciar la app
function initFirebaseAuthStateListener() {
  if (!isFirebaseEnabled) return;
  
  firebaseAuth.onAuthStateChanged(async (user) => {
    if (user) {
      console.log("Sesión activa de Firebase detectada:", user.email);
      try {
        const userDoc = await firebaseDb.collection("users").doc(user.uid).get();
        if (userDoc.exists) {
          const cloudData = userDoc.data();
          appState.profile = cloudData.profile || null;
          appState.settings = cloudData.settings || appState.settings;
          appState.islands = cloudData.islands || appState.islands;
          appState.metrics = cloudData.metrics || appState.metrics;
          
          sanitizeAppState();
          localStorage.setItem('polyglotlab_state', JSON.stringify(appState));
          
          updateUserDisplayBadge();
          checkOnboarding();
          
          // Refrescar la vista en caliente si estamos en aprender (Karaoke)
          const activeLink = document.querySelector('.sidebar-nav a.active, .mobile-nav-link.active');
          if (activeLink && activeLink.getAttribute('data-tab') === 'learn') {
            initLearnPanel();
          }
        }
      } catch (err) {
        console.error("Error sincronizando sesión activa:", err);
      }
    }
  });
}

// Función para reportar telemetría de aprendizaje
async function logLearningTelemetry(data) {
  if (!isFirebaseEnabled || !firebaseAuth || !firebaseAuth.currentUser) return;
  
  const user = firebaseAuth.currentUser;
  try {
    await firebaseDb.collection("learning_telemetry").add({
      userId: user.uid,
      timestamp: new Date().toISOString(),
      ...data
    });
    console.log("Telemetría de aprendizaje enviada.");
  } catch (err) {
    console.warn("No se pudo registrar la telemetría en Firestore:", err);
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
  
  // Aplicar idioma cargado
  applyUiLanguage(appState.settings.uiLanguage || 'es');
  
  // Inicializar UI
  initTheme();
  setupFirebaseAuthToggle();
  initFirebaseAuthStateListener();
  checkOnboarding();
  initNavigation();
  
  // Asignar controladores
  document.getElementById('theme-btn').addEventListener('click', rotateTheme);
  document.getElementById('onboarding-form').addEventListener('submit', handleOnboardingForm);
  const linkForgot = document.getElementById('link-forgot-password');
  if (linkForgot) {
    linkForgot.addEventListener('click', handleForgotPassword);
  }
  document.getElementById('settings-form').addEventListener('submit', saveSettingsForm);
  document.getElementById('profile-edit-form').addEventListener('submit', saveProfileEditForm);
  document.getElementById('gen-island-form').addEventListener('submit', handleGenerateIsland);
  document.getElementById('btn-save-generated').addEventListener('click', saveGeneratedIsland);
  
  const btnDeleteAcc = document.getElementById('btn-delete-account');
  if (btnDeleteAcc) {
    btnDeleteAcc.addEventListener('click', handleDeleteAccount);
  }
  
  // Controladores de la pestaña Acerca de
  const aboutTopBtn = document.getElementById('about-top-btn');
  if (aboutTopBtn) {
    aboutTopBtn.addEventListener('click', () => switchTab('about'));
  }
  const btnGoToAbout = document.getElementById('btn-go-to-about');
  if (btnGoToAbout) {
    btnGoToAbout.addEventListener('click', () => switchTab('about'));
  }
  const btnCopyEmail = document.getElementById('btn-copy-about-email');
  if (btnCopyEmail) {
    btnCopyEmail.addEventListener('click', () => {
      navigator.clipboard.writeText('fandres.camargo@gmail.com').then(() => {
        const icon = btnCopyEmail.querySelector('.material-symbols-rounded');
        if (icon) {
          icon.textContent = 'check';
          setTimeout(() => {
            icon.textContent = 'content_copy';
          }, 2000);
        }
      }).catch(err => {
        console.error('Error al copiar correo:', err);
      });
    });
  }
  
  // Sub-pestañas de modo (IA vs Manual vs Importar)
  document.getElementById('btn-mode-ai').addEventListener('click', () => toggleGenerateMode('ai'));
  document.getElementById('btn-mode-manual').addEventListener('click', () => toggleGenerateMode('manual'));
  document.getElementById('btn-mode-import').addEventListener('click', () => toggleGenerateMode('import'));
  
  // Controladores Manuales
  document.getElementById('btn-add-manual-sentence').addEventListener('click', addManualSentence);
  document.getElementById('btn-save-manual-island').addEventListener('click', saveManualIsland);
  
  // Controladores de Importación
  document.getElementById('import-destination-type').addEventListener('change', handleImportDestinationChange);
  document.getElementById('import-island-name').addEventListener('input', validateImportSubmitButton);
  document.getElementById('import-textarea').addEventListener('input', processImportInput);
  document.getElementById('btn-import-clear').addEventListener('click', clearImportData);
  document.getElementById('btn-import-submit').addEventListener('click', submitImportedSentences);
  
  // File upload and Drag & Drop events
  const dragZone = document.getElementById('import-drag-zone');
  const fileInput = document.getElementById('import-file-input');
  
  dragZone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', handleImportFileSelect);
  
  dragZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dragZone.classList.add('dragover');
  });
  dragZone.addEventListener('dragenter', (e) => {
    e.preventDefault();
    dragZone.classList.add('dragover');
  });
  dragZone.addEventListener('dragleave', () => {
    dragZone.classList.remove('dragover');
  });
  dragZone.addEventListener('dragend', () => {
    dragZone.classList.remove('dragover');
  });
  dragZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dragZone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.txt') || file.name.endsWith('.csv') || file.name.endsWith('.tsv'))) {
      readImportFile(file);
    } else {
      alert("Por favor, suelta un archivo plano válido (.txt, .csv o .tsv).");
    }
  });
  
  // Controladores Karaoke
  document.getElementById('btn-play-pause').addEventListener('click', playTTS);
  document.getElementById('btn-prev-sentence').addEventListener('click', () => advanceSentence(-1));
  document.getElementById('btn-next-sentence').addEventListener('click', () => advanceSentence(1));
  
  // Orden y Filtros de Karaoke
  const orderSelect = document.getElementById('karaoke-order-select');
  if (orderSelect) {
    orderSelect.addEventListener('change', () => {
      stopTTS();
      buildKaraokeQueue();
      currentSentenceIndex = 0;
      loadCurrentSentence();
    });
  }
  
  document.querySelectorAll('.diff-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      stopTTS();
      chip.classList.toggle('active');
      buildKaraokeQueue();
      currentSentenceIndex = 0;
      loadCurrentSentence();
    });
  });
  
  // Controladores de Calificación de Repetición Espaciada (FSRS/Leitner)
  document.getElementById('btn-sr-again').addEventListener('click', () => gradeActiveSentence(1));
  document.getElementById('btn-sr-hard').addEventListener('click', () => gradeActiveSentence(2));
  document.getElementById('btn-sr-good').addEventListener('click', () => gradeActiveSentence(3));
  document.getElementById('btn-sr-easy').addEventListener('click', () => gradeActiveSentence(4));
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
  
  // Selector de isla para practicar
  document.getElementById('recall-island-select').addEventListener('change', () => {
    buildPracticeQueue();
    currentPracticeIndex = 0;
    loadPracticeExercise();
  });
  
  // Exportar audio de la práctica (tus propias grabaciones)
  document.getElementById('btn-recall-export-audio').addEventListener('click', exportPracticeToMp3);
  
  // Conmutadores de modo de práctica
  const btnWriting = document.getElementById('btn-mode-writing');
  const btnSpeech = document.getElementById('btn-mode-speech');
  const writingGroup = document.getElementById('recall-writing-group');
  const speechGroup = document.getElementById('recall-speech-group');
  
  btnWriting.addEventListener('click', () => {
    activePracticeMode = 'writing';
    btnWriting.classList.add('active');
    btnSpeech.classList.remove('active');
    writingGroup.classList.remove('hidden');
    speechGroup.classList.add('hidden');
    stopRecordingControls();
    loadPracticeExercise();
  });
  
  btnSpeech.addEventListener('click', () => {
    activePracticeMode = 'speech';
    btnSpeech.classList.add('active');
    btnWriting.classList.remove('active');
    speechGroup.classList.remove('hidden');
    writingGroup.classList.add('hidden');
    loadPracticeExercise();
  });
  
  // Acción del micrófono
  document.getElementById('btn-record-speech').addEventListener('click', toggleSpeechRecording);
  
  // Escuchar pronunciación correcta de referencia
  document.getElementById('btn-speech-play-target').addEventListener('click', playPracticeSentenceTTS);
  
  // Validar pronunciación por voz
  document.getElementById('btn-speech-submit').addEventListener('click', evaluatePronunciationAttempt);
  
  // Reproducir mi propia grabación
  document.getElementById('btn-replay-user-voice').addEventListener('click', () => {
    if (userRecordedVoiceUrl) {
      const audio = new Audio(userRecordedVoiceUrl);
      audio.play().catch(e => console.error("Replay playback error:", e));
    }
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

  // Ver visibilidad API key de TTS
  document.getElementById('btn-toggle-tts-key-visibility').addEventListener('click', () => {
    const keyInput = document.getElementById('api-tts-key');
    const keyIcon = document.querySelector('#btn-toggle-tts-key-visibility span');
    if (keyInput.type === 'password') {
      keyInput.type = 'text';
      keyIcon.textContent = 'visibility_off';
    } else {
      keyInput.type = 'password';
      keyIcon.textContent = 'visibility';
    }
  });

  // Sincronizar selectores de motor y voces
  document.getElementById('tts-engine').value = appState.settings.ttsEngine || 'browser';
  populateVoicesDropdown();

  document.getElementById('tts-engine').addEventListener('change', (e) => {
    stopTTS();
    appState.settings.ttsEngine = e.target.value;
    saveAppState();
    populateVoicesDropdown();
  });

  document.getElementById('tts-voice').addEventListener('change', (e) => {
    stopTTS();
    const engine = document.getElementById('tts-engine').value;
    if (engine === 'openai') {
      appState.settings.ttsVoiceOpenAI = e.target.value;
    } else if (engine === 'azure') {
      appState.settings.ttsVoiceAzure = e.target.value;
    } else {
      appState.settings.ttsVoiceBrowser = e.target.value;
    }
    saveAppState();
  });

  // Controladores de velocidad
  document.getElementById('btn-speed-reset').addEventListener('click', () => {
    const slider = document.getElementById('tts-speed');
    slider.value = 1.0;
    document.getElementById('speed-val').textContent = '1.0x';
    // Desencadenar el evento input
    const event = new Event('input', { bubbles: true });
    slider.dispatchEvent(event);
  });

  // Exportador de isla a MP3
  document.getElementById('btn-export-active-island').addEventListener('click', openExportOptionsModal);

  // Editores de Isla activa
  document.getElementById('btn-edit-active-island').addEventListener('click', openEditActiveIslandModal);
  document.getElementById('btn-close-edit-island').addEventListener('click', () => {
    document.getElementById('edit-island-screen').classList.add('hidden');
  });
  document.getElementById('btn-cancel-edit-island').addEventListener('click', () => {
    document.getElementById('edit-island-screen').classList.add('hidden');
  });
  document.getElementById('btn-add-edit-sentence').addEventListener('click', addNewSentenceToEditing);
  document.getElementById('btn-save-edit-island-changes').addEventListener('click', saveEditIslandChanges);
  
  // Eliminar isla desde el modal
  document.getElementById('btn-delete-island-modal').addEventListener('click', async () => {
    const island = appState.islands[currentIslandIndex];
    if (!island) return;
    const confirmed = await showCustomConfirm(
      `¿Eliminar "${island.name}"?`,
      `¿Estás seguro de que deseas eliminar la isla "${island.name}"? Esta acción no se puede deshacer.`
    );
    if (confirmed) {
      const deletedIndex = currentIslandIndex;
      stopTTS();
      appState.islands.splice(deletedIndex, 1);
      
      // Ajustar el índice activo de forma coherente
      if (currentIslandIndex >= appState.islands.length) {
        currentIslandIndex = Math.max(0, appState.islands.length - 1);
      }
      
      currentSentenceIndex = 0;
      saveAppState();
      document.getElementById('edit-island-screen').classList.add('hidden');
      renderIslandSelectors();
      loadCurrentSentence();
    }
  });

  // Inicializar panel de metodología y guías
  initMethodologyPanel();

  // Registrar listeners adicionales para Idioma e Flip Card 3D
  const uiLangSelect = document.getElementById('settings-ui-lang');
  if (uiLangSelect) {
    uiLangSelect.addEventListener('change', (e) => {
      const lang = e.target.value;
      appState.settings.uiLanguage = lang;
      saveAppState();
      applyUiLanguage(lang);
    });
  }

  const flipCard = document.getElementById('recall-speech-flip-card');
  if (flipCard) {
    flipCard.addEventListener('click', () => {
      flipCard.classList.toggle('flipped');
      if (flipCard.classList.contains('flipped')) {
        playPracticeSentenceTTS();
      }
    });
  }

  // Panel inicial por defecto
  initLearnPanel();
  
  // Inicializar controladores de donación multi-opción
  initDonationControls();
});

// ==================================================================
// 10. FUNCIONES DE APOYO PARA MEJORAS (TTS SELECTION, MP3 & EDIT CRUD)
// ==================================================================

function populateVoicesDropdown() {
  const select = document.getElementById('tts-voice');
  if (!select) return;
  select.innerHTML = '';
  
  const engine = document.getElementById('tts-engine').value;
  const island = appState.islands[currentIslandIndex];
  const lang = island ? island.language : 'Inglés';
  const langCode = LANG_CODES[lang] || 'en-US';
  
  if (engine === 'openai') {
    OPENAI_VOICES.forEach(voice => {
      const opt = document.createElement('option');
      opt.value = voice.id;
      opt.textContent = voice.name;
      if (appState.settings.ttsVoiceOpenAI === voice.id) {
        opt.selected = true;
      }
      select.appendChild(opt);
    });
  } else if (engine === 'azure') {
    const list = AZURE_VOICES[lang] || AZURE_VOICES['Inglés'];
    list.forEach(voice => {
      const opt = document.createElement('option');
      opt.value = voice.id;
      opt.textContent = voice.name;
      if (appState.settings.ttsVoiceAzure === voice.id) {
        opt.selected = true;
      }
      select.appendChild(opt);
    });
  } else {
    if (!window.speechSynthesis) return;
    const voices = window.speechSynthesis.getVoices();
    const prefix = langCode.split('-')[0];
    const filtered = voices.filter(voice => voice.lang.toLowerCase().startsWith(prefix));
    
    const listToUse = filtered.length > 0 ? filtered : voices;
    
    // Priorizar voces que soporten onboundary (Google, Siri, Natural) y ordenarlas al principio
    listToUse.sort((a, b) => {
      const aLower = a.name.toLowerCase();
      const bLower = b.name.toLowerCase();
      
      const aPremium = aLower.includes('google') || aLower.includes('siri') || aLower.includes('natural');
      const bPremium = bLower.includes('google') || bLower.includes('siri') || bLower.includes('natural');
      
      if (aPremium && !bPremium) return -1;
      if (!aPremium && bPremium) return 1;
      return a.name.localeCompare(b.name);
    });
    
    listToUse.forEach(voice => {
      const opt = document.createElement('option');
      opt.value = voice.name;
      opt.textContent = `${voice.name} (${voice.lang})`;
      if (appState.settings.ttsVoiceBrowser === voice.name) {
        opt.selected = true;
      }
      select.appendChild(opt);
    });
  }
}

if (window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = () => {
    if (document.getElementById('tts-engine') && document.getElementById('tts-engine').value === 'browser') {
      populateVoicesDropdown();
    }
  };
}

async function openExportOptionsModal() {
  const island = appState.islands[currentIslandIndex];
  if (!island || island.sentences.length === 0) {
    alert("No hay oraciones en esta isla para exportar.");
    return;
  }

  const engine = document.getElementById('tts-engine').value;
  if (engine !== 'openai' && engine !== 'azure') {
    alert("La exportación a archivos de sonido MP3 requiere activar el motor 'OpenAI (Premium)' o 'Microsoft Azure (Neuronal Gratis)' en el reproductor.");
    return;
  }

  const total = island.sentences.length;
  
  // Asignar etiquetas dinámicas en el modal
  document.getElementById('export-all-count-label').textContent = `Exportará las ${total} oraciones de la isla.`;
  
  const radio30 = document.getElementById('export-range-30');
  const label30 = document.getElementById('export-last-30-label');
  
  if (total <= 30) {
    radio30.disabled = true;
    label30.textContent = "La isla tiene 30 frases o menos (esta opción está deshabilitada).";
    document.getElementById('export-range-all').checked = true;
  } else {
    radio30.disabled = false;
    label30.textContent = "Ideal para repasar las adiciones o cambios más recientes.";
  }

  // Función para actualizar el texto de comportamiento esperado
  const updateBehaviorText = () => {
    const selectedRange = document.querySelector('input[name="export-range"]:checked').value;
    const infoText = document.getElementById('export-behavior-info-text');
    
    if (selectedRange === 'last30') {
      infoText.innerHTML = `Se exportarán solo las <strong>últimas 30 frases</strong>. Como el lote es menor o igual a 30, se consolidarán en <strong>un único archivo MP3 continuo</strong> en tu descarga.`;
    } else {
      if (total <= 30) {
        infoText.innerHTML = `Se exportará la isla completa (<strong>${total} frases</strong>). Como el total es menor o igual a 30, se consolidarán en <strong>un único archivo MP3 continuo</strong> en tu descarga.`;
      } else {
        const totalChunks = Math.ceil(total / 30);
        infoText.innerHTML = `Se exportará la isla completa (<strong>${total} frases</strong>). Al superar las 30 frases, se dividirá en <strong>${totalChunks} archivos de audio consolidados</strong> de máximo 30 oraciones consecutivas cada uno.`;
      }
    }
  };

  // Escuchar cambios de radio
  const radioAll = document.getElementById('export-range-all');
  radioAll.addEventListener('change', updateBehaviorText);
  radio30.addEventListener('change', updateBehaviorText);
  
  updateBehaviorText();

  // Mostrar modal
  const screen = document.getElementById('export-options-screen');
  screen.classList.remove('hidden');

  // Limpiar event listeners previos de los botones
  const cancelBtn = document.getElementById('btn-export-options-cancel');
  const confirmBtn = document.getElementById('btn-export-options-confirm');

  const onCancel = () => {
    screen.classList.add('hidden');
    cleanup();
  };

  const onConfirm = () => {
    screen.classList.add('hidden');
    cleanup();
    const selectedRange = document.querySelector('input[name="export-range"]:checked').value;
    exportIslandToMp3(selectedRange);
  };

  function cleanup() {
    cancelBtn.removeEventListener('click', onCancel);
    confirmBtn.removeEventListener('click', onConfirm);
    radioAll.removeEventListener('change', updateBehaviorText);
    radio30.removeEventListener('change', updateBehaviorText);
  }

  cancelBtn.addEventListener('click', onCancel);
  confirmBtn.addEventListener('click', onConfirm);
}

function stripMp3Metadata(arrayBuffer) {
  const view = new DataView(arrayBuffer);
  let offset = 0;
  let len = arrayBuffer.byteLength;

  // 1. Quitar cabecera ID3v2 si existe (empieza con 'ID3' = [0x49, 0x44, 0x33])
  if (len > 10 && view.getUint8(0) === 0x49 && view.getUint8(1) === 0x44 && view.getUint8(2) === 0x33) {
    const b3 = view.getUint8(6);
    const b2 = view.getUint8(7);
    const b1 = view.getUint8(8);
    const b0 = view.getUint8(9);
    // Tamaño es synchsafe de 4 bytes (7 bits significativos por byte)
    const size = (b3 << 21) | (b2 << 14) | (b1 << 7) | b0;
    const headerSize = 10 + size;
    if (headerSize < len) {
      offset = headerSize;
    }
  }

  // 2. Quitar cabecera ID3v1 al final si existe (los últimos 128 bytes si empiezan con 'TAG' = [0x54, 0x41, 0x47])
  let endOffset = len;
  if (len - offset > 128) {
    const tagOffset = len - 128;
    if (view.getUint8(tagOffset) === 0x54 && view.getUint8(tagOffset + 1) === 0x41 && view.getUint8(tagOffset + 2) === 0x47) {
      endOffset = tagOffset;
    }
  }

  if (offset > 0 || endOffset < len) {
    return arrayBuffer.slice(offset, endOffset);
  }
  return arrayBuffer;
}

async function exportIslandToMp3(rangeSelection) {
  const island = appState.islands[currentIslandIndex];
  if (!island || island.sentences.length === 0) {
    alert("No hay oraciones en esta isla para exportar.");
    return;
  }
  
  const engine = document.getElementById('tts-engine').value;
  if (engine !== 'openai' && engine !== 'azure') {
    alert("La exportación a archivos de sonido MP3 requiere activar el motor 'OpenAI (Premium)' o 'Microsoft Azure (Neuronal Gratis)' en el reproductor.");
    return;
  }
  
  let key = '';
  if (engine === 'openai') {
    key = appState.settings.apiTtsKey;
    if (!key && appState.settings.apiProvider === 'openai') {
      key = appState.settings.apiKey;
    }
    
    if (!key) {
      alert("Por favor, ingresa tu clave API de OpenAI en la pestaña de Ajustes para poder exportar.");
      switchTab('settings');
      return;
    }
  }

  // Filtrar oraciones
  let sentencesToExport = island.sentences;
  if (rangeSelection === 'last30') {
    sentencesToExport = island.sentences.slice(-30);
  }

  if (sentencesToExport.length === 0) {
    alert("No hay oraciones seleccionadas para exportar.");
    return;
  }
  
  const progressIndicator = document.getElementById('export-loading-indicator');
  const progressText = document.getElementById('export-progress-text');
  progressIndicator.classList.remove('hidden');
  
  try {
    const zip = new JSZip();
    const voice = document.getElementById('tts-voice').value || (engine === 'openai' ? 'alloy' : 'en-US-JennyNeural');
    const speed = parseFloat(document.getElementById('tts-speed').value) || 1.0;
    const baseUrl = appState.settings.apiUrl || 'https://api.openai.com/v1';
    const url = `${baseUrl}/audio/speech`;
    
    let readmeText = `POLYGLOTLAB - EXPORTACIÓN DE ISLA LINGÜÍSTICA\n`;
    readmeText += `Isla: ${island.name}\n`;
    readmeText += `Idioma: ${island.language}\n`;
    readmeText += `Voz: ${voice} | Velocidad: ${speed}x\n`;
    readmeText += `Motor: ${engine === 'openai' ? 'OpenAI Premium' : 'Microsoft Azure Neural'}\n`;
    readmeText += `Rango Seleccionado: ${rangeSelection === 'last30' ? 'Últimas 30 oraciones' : 'Todas las oraciones'}\n`;
    readmeText += `Fecha: ${new Date().toLocaleString()}\n`;
    readmeText += `==========================================================\n\n`;

    // 1. Precargar archivos de silencio MP3 digitalmente puros (2.5s y 1s = 3.5s total)
    progressText.textContent = "Precargando pistas de silencio...";
    let silence25Buffer = null;
    let silence10Buffer = null;
    try {
      const r25 = await fetch('/assets/silence_2_5s.mp3');
      if (r25.ok) silence25Buffer = await r25.arrayBuffer();
      const r10 = await fetch('/assets/silence_1s.mp3');
      if (r10.ok) silence10Buffer = await r10.arrayBuffer();
    } catch (err) {
      console.warn("No se pudieron precargar los silencios locales, usando fallback de red en silencio:", err);
    }

    // 2. Dividir las oraciones a exportar en grupos (chunks) de máximo 30
    const chunkSize = 30;
    const chunks = [];
    for (let i = 0; i < sentencesToExport.length; i += chunkSize) {
      chunks.push(sentencesToExport.slice(i, i + chunkSize));
    }

    // 3. Procesar cada chunk de forma secuencial
    for (let c = 0; c < chunks.length; c++) {
      const currentChunk = chunks[c];
      const startNum = c * chunkSize + 1;
      const endNum = Math.min((c + 1) * chunkSize, sentencesToExport.length);
      
      const audioBuffers = [];
      
      readmeText += `--- AUDIO PARTE ${String(c + 1).padStart(2, '0')} (Oraciones de la ${startNum} a la ${endNum}) ---\n`;
      
      for (let i = 0; i < currentChunk.length; i++) {
        const sentence = currentChunk[i];
        const overallIndex = c * chunkSize + i + 1;
        progressText.textContent = `Generando audio ${overallIndex}/${sentencesToExport.length}...`;
        
        let response;
        if (engine === 'openai') {
          response = await fetch(url, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${key}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: 'tts-1',
              input: sentence.l2,
              voice: voice,
              speed: speed
            })
          });
        } else {
          const fetchUrl = `/api/tts?text=${encodeURIComponent(sentence.l2)}&voice=${encodeURIComponent(voice)}&speed=${speed}`;
          response = await fetch(fetchUrl);
        }
        
        if (!response.ok) {
          throw new Error(`Error en la frase ${overallIndex}: ${response.statusText}`);
        }
        
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        audioBuffers.push(arrayBuffer);
        
        // Agregar silencio de 3.5 segundos entre frase y frase (excepto la última del chunk)
        if (i < currentChunk.length - 1) {
          if (silence25Buffer && silence10Buffer) {
            // Añadir los dos buffers que componen 3.5s de silencio absoluto
            audioBuffers.push(silence25Buffer.slice(0));
            audioBuffers.push(silence10Buffer.slice(0));
          } else {
            // Fallback de red inestable en desarrollo si no se encuentran los assets locales
            try {
              const silenceResponse = await fetch(`/api/silence?duration=3.5&voice=${encodeURIComponent(voice)}`);
              if (silenceResponse.ok) {
                const silenceBlob = await silenceResponse.blob();
                if (silenceBlob) {
                  const silenceBuffer = await silenceBlob.arrayBuffer();
                  audioBuffers.push(silenceBuffer);
                }
              }
            } catch (silenceErr) {
              console.error("Error al obtener silencio de fallback de red:", silenceErr);
            }
          }
        }
        
        readmeText += `${String(overallIndex).padStart(2, '0')}. L1: ${sentence.l1}\n`;
        readmeText += `    L2: ${sentence.l2}\n`;
        readmeText += `    Palabra Clave: ${sentence.word_targeted || 'General'}\n\n`;
      }
      
      // 4. Concatenar los audios de este chunk eliminando cabeceras ID3 para evitar clics
      progressText.textContent = `Consolidando audio parte ${c + 1}/${chunks.length}...`;
      
      const cleanBuffers = audioBuffers.map(buf => stripMp3Metadata(buf));
      const combinedLength = cleanBuffers.reduce((acc, b) => acc + b.byteLength, 0);
      const combinedBuffer = new Uint8Array(combinedLength);
      
      let offset = 0;
      for (const buffer of cleanBuffers) {
        combinedBuffer.set(new Uint8Array(buffer), offset);
        offset += buffer.byteLength;
      }
      
      // Determinar nombre del archivo de audio del chunk
      const islandPrefix = island.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      let audioFilename = "";
      if (chunks.length === 1) {
        audioFilename = `${islandPrefix}_completo.mp3`;
      } else {
        audioFilename = `${islandPrefix}_parte_${String(c + 1).padStart(2, '0')}_frases_${startNum}_a_${endNum}.mp3`;
      }
      
      zip.file(audioFilename, combinedBuffer.buffer);
    }
    
    zip.file("LEEME.txt", readmeText);
    progressText.textContent = "Empaquetando en ZIP...";
    
    const content = await zip.generateAsync({ type: "blob" });
    const filename = `${island.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_isla_audio.zip`;
    
    // Descargar el archivo. Intentar guardar en servidor (harness local) y hacer fallback en navegador
    let downloadUrl = null;
    try {
      const response = await fetch(`/api/save-export?filename=${encodeURIComponent(filename)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream'
        },
        body: content
      });
      if (response.ok) {
        const resData = await response.json();
        if (resData.success) {
          downloadUrl = resData.url;
        }
      }
    } catch (saveErr) {
      console.warn("No se pudo guardar la copia en el backend (esperado en produccion estática):", saveErr);
    }
    
    if (!downloadUrl) {
      downloadUrl = URL.createObjectURL(content);
    }
    
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    if (!downloadUrl.startsWith('/')) {
      // Si se uso URL.createObjectURL, liberar memoria tras descargar
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 100);
    }
    
    alert("¡Isla de audio exportada con éxito en un archivo ZIP!");
  } catch (err) {
    console.error("Export error:", err);
    alert(`Ocurrió un error al exportar la isla: ${err.message}`);
  } finally {
    progressIndicator.classList.add('hidden');
  }
}

let editingIslandTemp = null;

function openEditActiveIslandModal() {
  const island = appState.islands[currentIslandIndex];
  if (!island) {
    alert("No hay ninguna isla seleccionada para editar.");
    return;
  }
  
  editingIslandTemp = JSON.parse(JSON.stringify(island));
  document.getElementById('edit-island-name-input').value = editingIslandTemp.name;
  
  document.getElementById('add-sentence-l1').value = '';
  document.getElementById('add-sentence-l2').value = '';
  document.getElementById('add-sentence-word').value = '';
  
  renderEditIslandSentencesList();
  document.getElementById('edit-island-screen').classList.remove('hidden');
}

function renderEditIslandSentencesList() {
  const container = document.getElementById('edit-island-sentences-list');
  const countEl = document.getElementById('edit-island-sentences-count');
  
  container.innerHTML = '';
  countEl.textContent = editingIslandTemp.sentences.length;
  
  editingIslandTemp.sentences.forEach((item, index) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="padding: 6px;"><input type="text" class="edit-l1-field" value="${escapeHtml(item.l1)}" required style="width:100%;"></td>
      <td style="padding: 6px;"><input type="text" class="edit-l2-field" value="${escapeHtml(item.l2)}" required style="width:100%;"></td>
      <td style="padding: 6px;"><input type="text" class="edit-word-field" value="${escapeHtml(item.word_targeted || '')}" style="width:100%;"></td>
      <td style="padding: 6px; text-align: center;">
        <button type="button" class="btn-danger-text btn-delete-edit" style="padding: 4px 8px; font-size:12px;">
          <span class="material-symbols-rounded" style="font-size:16px;">delete</span>
        </button>
      </td>
    `;
    
    tr.querySelector('.edit-l1-field').addEventListener('input', (e) => {
      editingIslandTemp.sentences[index].l1 = e.target.value.trim();
    });
    tr.querySelector('.edit-l2-field').addEventListener('input', (e) => {
      editingIslandTemp.sentences[index].l2 = e.target.value.trim();
    });
    tr.querySelector('.edit-word-field').addEventListener('input', (e) => {
      editingIslandTemp.sentences[index].word_targeted = e.target.value.trim();
    });
    
    tr.querySelector('.btn-delete-edit').addEventListener('click', () => {
      editingIslandTemp.sentences.splice(index, 1);
      renderEditIslandSentencesList();
    });
    
    container.appendChild(tr);
  });
}

function addNewSentenceToEditing() {
  const l1Input = document.getElementById('add-sentence-l1');
  const l2Input = document.getElementById('add-sentence-l2');
  const wordInput = document.getElementById('add-sentence-word');
  
  const l1 = l1Input.value.trim();
  const l2 = l2Input.value.trim();
  const word = wordInput.value.trim();
  
  if (!l1 || !l2) {
    alert("Por favor completa los campos L1 y L2 para agregar una nueva frase.");
    return;
  }
  
  editingIslandTemp.sentences.push({
    id: `s_ed_man_${Date.now()}_${editingIslandTemp.sentences.length}`,
    l1: l1,
    l2: l2,
    word_targeted: word
  });
  
  renderEditIslandSentencesList();
  
  l1Input.value = '';
  l2Input.value = '';
  wordInput.value = '';
  l1Input.focus();
}

function saveEditIslandChanges() {
  const nameInput = document.getElementById('edit-island-name-input');
  const name = nameInput.value.trim();
  
  if (!name) {
    alert("El nombre de la isla no puede estar vacío.");
    nameInput.focus();
    return;
  }
  
  if (editingIslandTemp.sentences.length === 0) {
    alert("La isla debe tener al menos una oración.");
    return;
  }
  
  // Validar campos vacíos en las frases
  const hasEmpty = editingIslandTemp.sentences.some(s => !s.l1 || !s.l2);
  if (hasEmpty) {
    alert("Todas las frases añadidas deben tener un texto válido en L1 y L2.");
    return;
  }
  
  editingIslandTemp.name = name;
  appState.islands[currentIslandIndex] = JSON.parse(JSON.stringify(editingIslandTemp));
  saveAppState();
  
  document.getElementById('edit-island-screen').classList.add('hidden');
  renderIslandSelectors();
  loadCurrentSentence();
  alert("Isla guardada exitosamente con sus cambios.");
}

// ==================================================================
// 11. METODOLOGÍA Y VIDEO TUTORIALES MULTILINGÜES (DOBLAJE)
// ==================================================================
const TUTORIAL_NARRATIONS = {
  karaoke: {
    'Español': 'Este tutorial demuestra cómo funciona el Bucle de Karaoke. El reproductor sintetiza la oración en el idioma objetivo mientras resalta cada palabra en tiempo real, permitiendo asimilar la entonación y velocidad de forma natural.',
    'Inglés': 'This tutorial demonstrates how the Karaoke Loop works. The player synthesizes the sentence in the target language while highlighting each word in real time, allowing you to absorb intonation and speed naturally.',
    'Portugués': 'Este tutorial demonstra como funciona o Loop de Karaoke. O reprodutor sintetiza a frase no idioma de destino enquanto destaca cada palavra em tempo real, permitindo absorver a entonação e a velocidade naturalmente.',
    'Francés': 'Ce didacticiel montre comment fonctionne la boucle de karaoké. Le lecteur synthétise la phrase dans la langue cible tout en surbrillant chaque mot en temps réel, vous permettant d\'absorber l\'intonation et la vitesse naturellement.',
    'Alemán': 'Dieses Tutorial zeigt, wie die Karaoke-Schleife funktioniert. Der Player synthetisiert den Satz in der Zielsprache und hebt jedes Wort in Echtzeit hervor, sodass Sie Intonation und Geschwindigkeit natürlich aufnehmen können.',
    'Italiano': 'Questo tutorial mostra come funziona il Karaoke Loop. Il lettore sintetizza la frase nella lingua di destinazione evidenziando ogni parola in tempo reale, consentendoti di assorbire l\'intonazione e la velocità in modo naturale.'
  },
  practice: {
    'Español': 'Este tutorial muestra la pestaña de Práctica. Aquí puedes escribir tu traducción o presionar el micrófono para practicar tu pronunciación. El sistema evaluará tus errores en color rojo con subrayado ondulado y guardará tus estadísticas.',
    'Inglés': 'This tutorial shows the Practice tab. Here you can write your translation or press the microphone to practice your pronunciation. The system will evaluate your mistakes in red with a wavy underline and save your statistics.',
    'Portugués': 'Este tutorial mostra a aba de Prática. Aqui você pode escrever sua tradução ou pressionar o microfone para praticar sua pronúncia. O sistema avaliará seus erros em vermelho com um sublinhado ondulado e salvará suas estatísticas.',
    'Francés': 'Ce didacticiel montre l\'onglet Pratique. Ici, vous pouvez écrire votre traduction ou appuyer sur le microphone pour pratiquer votre prononciation. Le système évaluera vos erreurs en rouge avec un soulignement ondulé et enregistrera vos statistiques.',
    'Alemán': 'Dieses Tutorial zeigt die Registerkarte "Praxis". Hier können Sie Ihre Übersetzung schreiben oder das Mikrofon drücken, um Ihre Aussprache zu üben. Das System bewertet Ihre Fehler in Rot mit einer gewellten Unterstreichung und speichert Ihre Statistiken.',
    'Italiano': 'Questo tutorial mostra la scheda Pratica. Qui puoi scrivere la tua traduzione o premere el microfono para ejercitarti con la pronuncia. Il sistema valuterà i tuoi errori in rosso con una sottolineatura ondulata e salverà le tue statistiche.'
  },
  create_islands: {
    'Español': 'Este tutorial enseña cómo crear tus islas de aprendizaje usando tres opciones: generar oraciones con Inteligencia Artificial mediante tu clave API, estructurarlas manualmente una a una, o cargar un archivo plano delimitado.',
    'Inglés': 'This tutorial teaches you how to create your learning islands using three options: generating sentences with Artificial Intelligence using your API key, structuring them manually one by one, or loading a delimited flat file.',
    'Portugués': 'Este tutorial ensina como criar suas ilhas de aprendizagem usando três opções: gerar frases com Inteligência Artificial usando sua chave de API, estruturá-las manualmente uma a uma, ou carregar um arquivo plano delimitado.',
    'Francés': 'Ce didacticiel vous apprend à créer vos îles d\'apprentissage à l\'aide de trois options : générer des phrases avec l\'Intelligence Artificielle à l\'aide de votre clé API, les structurer manuellement une par une, ou charger un fichier plat délimité.',
    'Alemán': 'Dieses Tutorial zeigt Ihnen, wie Sie Ihre Lerninseln mit drei Optionen erstellen: Sätze mit künstlicher Intelligenz über Ihren API-Schlüssel generieren, sie nacheinander manuell strukturieren oder eine begrenzte flache Datei laden.',
    'Italiano': 'Questo tutorial ti insegna come creare le tue isole di apprendimento utilizzando tre opzioni: generare frasi con l\'Intelligenza Artificiale utilizzando la tua chiave API, strutturarle manualmente una per una o caricare un file piatto delimitato.'
  }
};

function initMethodologyPanel() {
  // Configurar escuchadores de cambio de idioma de doblaje para actualizar texto en pantalla
  document.querySelectorAll('.narration-lang').forEach(select => {
    select.addEventListener('change', (e) => {
      const type = e.target.getAttribute('data-tutorial');
      const lang = e.target.value;
      const textEl = document.getElementById(`narration-${type}-text`);
      if (textEl && TUTORIAL_NARRATIONS[type] && TUTORIAL_NARRATIONS[type][lang]) {
        textEl.textContent = TUTORIAL_NARRATIONS[type][lang];
      }
    });
  });

  // Configurar botones de reproducción de doblaje por voz
  document.querySelectorAll('.btn-play-narration').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const targetBtn = e.currentTarget;
      const type = targetBtn.getAttribute('data-tutorial');
      const select = document.querySelector(`.narration-lang[data-tutorial="${type}"]`);
      if (!select) return;
      
      const lang = select.value;
      const text = TUTORIAL_NARRATIONS[type][lang];
      if (!text) return;
      
      // Detener cualquier síntesis de voz en curso
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      
      // Cambiar icono a bocina activa temporalmente
      const icon = targetBtn.querySelector('.material-symbols-rounded');
      const textSpan = targetBtn.querySelector('span:not(.material-symbols-rounded)');
      
      const originalIcon = icon ? icon.textContent : 'volume_up';
      const originalText = textSpan ? textSpan.textContent : 'Reproducir Doblaje';
      
      if (icon) icon.textContent = 'record_voice_over';
      if (textSpan) textSpan.textContent = 'Hablando...';
      
      const langCodeMap = {
        'Inglés': 'en-US',
        'Portugués': 'pt-BR',
        'Francés': 'fr-FR',
        'Español': 'es-ES',
        'Alemán': 'de-DE',
        'Italiano': 'it-IT'
      };
      const langCode = langCodeMap[lang] || 'es-ES';
      
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = langCode;
      
      // Buscar una voz adecuada del navegador para ese idioma
      if (window.speechSynthesis) {
        const voices = window.speechSynthesis.getVoices();
        const matchedVoice = voices.find(v => v.lang.startsWith(langCode));
        if (matchedVoice) {
          utter.voice = matchedVoice;
        }
      }
      
      utter.onend = () => {
        if (icon) icon.textContent = originalIcon;
        if (textSpan) textSpan.textContent = originalText;
      };
      
      utter.onerror = () => {
        if (icon) icon.textContent = originalIcon;
        if (textSpan) textSpan.textContent = originalText;
      };
      
      window.speechSynthesis.speak(utter);
    });
  });

  // Configurar escuchadores de control de videos explicativos (Play, Stop, Reiniciar)
  initVideoControls();
}

function initVideoControls() {
  document.querySelectorAll('.btn-play').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const target = e.currentTarget.getAttribute('data-target');
      playTutorialVideo(target);
    });
  });
  
  document.querySelectorAll('.btn-stop').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const target = e.currentTarget.getAttribute('data-target');
      stopTutorialVideo(target);
    });
  });
  
  document.querySelectorAll('.btn-restart').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const target = e.currentTarget.getAttribute('data-target');
      restartTutorialVideo(target);
    });
  });
  
  document.querySelectorAll('.video-placeholder-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      const target = overlay.id.replace('video-placeholder-', '');
      playTutorialVideo(target);
    });
  });
}

function playTutorialVideo(target) {
  const img = document.getElementById(`video-img-${target}`);
  const placeholder = document.getElementById(`video-placeholder-${target}`);
  
  if (img && placeholder) {
    const baseSrc = img.getAttribute('data-base-src');
    if (!img.src || img.classList.contains('video-stopped')) {
      img.src = baseSrc + '?t=' + Date.now();
      img.classList.remove('video-stopped');
    }
    img.style.display = 'block';
    img.style.opacity = '1';
    placeholder.classList.add('hidden');
  }
}

function stopTutorialVideo(target) {
  const img = document.getElementById(`video-img-${target}`);
  const placeholder = document.getElementById(`video-placeholder-${target}`);
  
  if (img && placeholder) {
    img.classList.add('video-stopped');
    img.style.display = 'none';
    placeholder.classList.remove('hidden');
  }
}

function restartTutorialVideo(target) {
  const img = document.getElementById(`video-img-${target}`);
  const placeholder = document.getElementById(`video-placeholder-${target}`);
  
  if (img && placeholder) {
    const baseSrc = img.getAttribute('data-base-src');
    img.src = baseSrc + '?t=' + Date.now();
    img.classList.remove('video-stopped');
    img.style.display = 'block';
    img.style.opacity = '1';
    placeholder.classList.add('hidden');
  }
}

// ==================================================================
// 11. SISTEMA DE TRADUCCIÓN MULTI-IDIOMA (I18N)
// ==================================================================

const UI_TRANSLATIONS = {
  es: {
    sidebar_learn: "Aprender (Karaoke)",
    sidebar_practice: "Practicar (Recall)",
    sidebar_generate: "Generar Islas",
    sidebar_methodology: "Metodología y Guía",
    sidebar_settings: "Configuración",
    sidebar_about: "Acerca de",
    
    lbl_practice_collection: "Colección de Práctica:",
    lbl_all_islands: "Todas las Islas",
    lbl_smart_review: "🧠 Repaso Inteligente (FSRS)",
    lbl_export_recordings: "Exportar mis Grabaciones (ZIP)",
    lbl_active_practice: "Práctica Activa",
    lbl_writing_tab: "Escritura (Recall)",
    lbl_speech_tab: "Pronunciación (Voz)",
    lbl_translate_prompt: "Traduce al idioma objetivo:",
    lbl_placeholder_input: "Escribe tu traducción aquí...",
    lbl_btn_hint: "Pista",
    lbl_btn_submit: "Validar Intento",
    lbl_mic_prompt: "Haz clic en el micrófono y pronuncia la traducción en voz alta:",
    lbl_mic_status: "Presiona para hablar",
    lbl_listening: "Escuchando...",
    lbl_listen_model: "Escuchar Modelo",
    lbl_validate_speech: "Validar Pronunciación",
    lbl_feedback_title: "Resultado de Evaluación",
    lbl_your_attempt: "Tu intento:",
    lbl_correct_translation: "Traducción Correcta:",
    lbl_next_exercise: "Siguiente Ejercicio",
    
    lbl_grade_prompt: "¿Cómo calificarías tu recuerdo de esta frase?",
    lbl_grade_again: "Olvidé",
    lbl_grade_hard: "Difícil",
    lbl_grade_good: "Bien",
    lbl_grade_easy: "Fácil",
    
    lbl_metrics_title: "Métricas de Sesión",
    lbl_metric_sessions: "Sesiones",
    lbl_metric_accuracy: "Precisión",
    lbl_metric_streak: "Racha",
    lbl_metric_speech_accuracy: "Precisión Voz",
    lbl_metric_attempts: "Intentos",
    lbl_metric_words: "Palabras",
    lbl_metric_daily_goal: "Meta de Maestría Diario",
    
    lbl_garden_title: "Jardim da Memória (Isla Activa)",
    lbl_garden_seed: "🌱 Semilla",
    lbl_garden_sprout: "🌿 Brote",
    lbl_garden_tree: "🌳 Árbol",
    lbl_ebbinghaus_title: "Proyección de la Curva de Olvido (Ebbinghaus)",
    
    lbl_settings_byok: "Configuración de Proveedor de Inteligencia Artificial (BYOK)",
    lbl_settings_provider: "Proveedor de LLM",
    lbl_settings_key: "Clave de API (API Key)",
    lbl_btn_save_settings: "Guardar Configuración de API",
    lbl_settings_profile: "Perfil de Usuario Local",
    lbl_btn_save_profile: "Actualizar Datos de Perfil",
    lbl_settings_ui_title: "Idioma de la Interfaz",
    lbl_settings_ui_desc: "Selecciona el idioma en el que deseas visualizar la interfaz de la aplicación.",
    lbl_settings_ui_label: "Idioma de la App",

    lbl_garden_details_title: "Detalle de Frase (Jardín)",
    lbl_garden_details_placeholder: "Pasa el cursor sobre un brote en el jardín para ver su estado de repetición espaciada.",
    lbl_detail_num: "Frase:",
    lbl_detail_retention: "Retención Estimada:",
    lbl_detail_stability: "Estabilidad:",
    lbl_detail_box: "Nivel de Dominio:",
    lbl_detail_l2: "Frase Objetivo (L2):",
    lbl_loop_label: "Autoplay de la Isla",
    lbl_karaoke_order: "Orden de Reproducción",
    opt_order_normal: "Secuencial",
    opt_order_fsrs: "Repetición Espaciada (FSRS)",
    lbl_filter_difficulty: "Filtrar por Dominio de Memoria"
  },
  en: {
    sidebar_learn: "Learn (Karaoke)",
    sidebar_practice: "Practice (Recall)",
    sidebar_generate: "Generate Islands",
    sidebar_methodology: "Methodology & Guide",
    sidebar_settings: "Settings",
    sidebar_about: "About",
    
    lbl_practice_collection: "Practice Collection:",
    lbl_all_islands: "All Islands",
    lbl_smart_review: "🧠 Smart Review (FSRS)",
    lbl_export_recordings: "Export my Recordings (ZIP)",
    lbl_active_practice: "Active Practice",
    lbl_writing_tab: "Writing (Recall)",
    lbl_speech_tab: "Pronunciation (Voice)",
    lbl_translate_prompt: "Translate to the target language:",
    lbl_placeholder_input: "Write your translation here...",
    lbl_btn_hint: "Hint",
    lbl_btn_submit: "Validate Attempt",
    lbl_mic_prompt: "Click the microphone and pronounce the translation aloud:",
    lbl_mic_status: "Press to speak",
    lbl_listening: "Listening...",
    lbl_listen_model: "Listen to Model",
    lbl_validate_speech: "Validate Pronunciation",
    lbl_feedback_title: "Evaluation Result",
    lbl_your_attempt: "Your attempt:",
    lbl_correct_translation: "Correct Translation:",
    lbl_next_exercise: "Next Exercise",
    
    lbl_grade_prompt: "How would you rate your recall of this sentence?",
    lbl_grade_again: "Again",
    lbl_grade_hard: "Hard",
    lbl_grade_good: "Good",
    lbl_grade_easy: "Easy",
    
    lbl_metrics_title: "Session Metrics",
    lbl_metric_sessions: "Sessions",
    lbl_metric_accuracy: "Accuracy",
    lbl_metric_streak: "Streak",
    lbl_metric_speech_accuracy: "Voice Accuracy",
    lbl_metric_attempts: "Attempts",
    lbl_metric_words: "Words",
    lbl_metric_daily_goal: "Daily Mastery Goal",
    
    lbl_garden_title: "Memory Garden (Active Island)",
    lbl_garden_seed: "🌱 Seed",
    lbl_garden_sprout: "🌿 Sprout",
    lbl_garden_tree: "🌳 Tree",
    lbl_ebbinghaus_title: "Forgetting Curve Projection (Ebbinghaus)",
    
    lbl_settings_byok: "AI Provider Configuration (BYOK)",
    lbl_settings_provider: "LLM Provider",
    lbl_settings_key: "API Key",
    lbl_btn_save_settings: "Save API Configuration",
    lbl_settings_profile: "Local User Profile",
    lbl_btn_save_profile: "Update Profile Data",
    lbl_settings_ui_title: "Interface Language",
    lbl_settings_ui_desc: "Select the language in which you want to display the application interface.",
    lbl_settings_ui_label: "App Language",

    lbl_garden_details_title: "Sentence Detail (Garden)",
    lbl_garden_details_placeholder: "Hover over a sprout in the garden to view its spaced repetition status.",
    lbl_detail_num: "Sentence:",
    lbl_detail_retention: "Estimated Retention:",
    lbl_detail_stability: "Stability:",
    lbl_detail_box: "Mastery Level:",
    lbl_detail_l2: "Target Sentence (L2):",
    lbl_loop_label: "Island Autoplay",
    lbl_karaoke_order: "Play Order",
    opt_order_normal: "Sequential",
    opt_order_fsrs: "Spaced Repetition (FSRS)",
    lbl_filter_difficulty: "Filter by Memory Stage"
  },
  pt: {
    sidebar_learn: "Aprender (Karaoke)",
    sidebar_practice: "Praticar (Recall)",
    sidebar_generate: "Gerar Ilhas",
    sidebar_methodology: "Metodologia e Guia",
    sidebar_settings: "Configuração",
    sidebar_about: "Sobre",
    
    lbl_practice_collection: "Coleção de Prática:",
    lbl_all_islands: "Todas as Ilhas",
    lbl_smart_review: "🧠 Revisão Inteligente (FSRS)",
    lbl_export_recordings: "Exportar minhas Gravações (ZIP)",
    lbl_active_practice: "Prática Ativa",
    lbl_writing_tab: "Escrita (Recall)",
    lbl_speech_tab: "Pronúncia (Voz)",
    lbl_translate_prompt: "Traduzir para o idioma de destino:",
    lbl_placeholder_input: "Escreva sua tradução aqui...",
    lbl_btn_hint: "Dica",
    lbl_btn_submit: "Validar Tentativa",
    lbl_mic_prompt: "Clique no microfone e pronuncie a tradução em voz alta:",
    lbl_mic_status: "Pressione para falar",
    lbl_listening: "Ouvindo...",
    lbl_listen_model: "Ouvir Modelo",
    lbl_validate_speech: "Validar Pronúncia",
    lbl_feedback_title: "Resultado da Avaliação",
    lbl_your_attempt: "Sua tentativa:",
    lbl_correct_translation: "Tradução Correta:",
    lbl_next_exercise: "Próximo Exercício",
    
    lbl_grade_prompt: "Como você avalia a sua lembrança desta frase?",
    lbl_grade_again: "Esqueci",
    lbl_grade_hard: "Difícil",
    lbl_grade_good: "Bom",
    lbl_grade_easy: "Fácil",
    
    lbl_metrics_title: "Métricas da Sessão",
    lbl_metric_sessions: "Sessões",
    lbl_metric_accuracy: "Precisão",
    lbl_metric_streak: "Racha",
    lbl_metric_speech_accuracy: "Precisão Voz",
    lbl_metric_attempts: "Tentativas",
    lbl_metric_words: "Palavras",
    lbl_metric_daily_goal: "Meta de Maestria Diária",
    
    lbl_garden_title: "Jardim da Memória (Ilha Ativa)",
    lbl_garden_seed: "🌱 Semente",
    lbl_garden_sprout: "🌿 Broto",
    lbl_garden_tree: "🌳 Árvore",
    lbl_ebbinghaus_title: "Projeção da Curva do Esquecimento (Ebbinghaus)",
    
    lbl_settings_byok: "Configuração do Provedor de IA (BYOK)",
    lbl_settings_provider: "Provedor de LLM",
    lbl_settings_key: "Chave de API",
    lbl_btn_save_settings: "Salvar Configuração de API",
    lbl_settings_profile: "Perfil de Usuário Local",
    lbl_btn_save_profile: "Atualizar Datos do Perfil",
    lbl_settings_ui_title: "Idioma da Interface",
    lbl_settings_ui_desc: "Selecione o idioma em que deseja exibir a interface do aplicativo.",
    lbl_settings_ui_label: "Idioma do App",

    lbl_garden_details_title: "Detalhe da Frase (Jardim)",
    lbl_garden_details_placeholder: "Passe o cursor sobre um broto no jardim para ver seu status de repetição espaçada.",
    lbl_detail_num: "Frase:",
    lbl_detail_retention: "Retenção Estimada:",
    lbl_detail_stability: "Estabilidade:",
    lbl_detail_box: "Nível de Domínio:",
    lbl_detail_l2: "Frase de Destino (L2):"
  },
  fr: {
    sidebar_learn: "Apprendre (Karaoké)",
    sidebar_practice: "S'entraîner (Recall)",
    sidebar_generate: "Générer des Îles",
    sidebar_methodology: "Méthodologie & Guide",
    sidebar_settings: "Configuration",
    sidebar_about: "À propos",
    
    lbl_practice_collection: "Collection d'Entraînement:",
    lbl_all_islands: "Toutes les Îles",
    lbl_smart_review: "🧠 Révision Intelligente (FSRS)",
    lbl_export_recordings: "Exporter mes Enregistrements (ZIP)",
    lbl_active_practice: "Pratique Active",
    lbl_writing_tab: "Écriture (Recall)",
    lbl_speech_tab: "Prononciation (Voix)",
    lbl_translate_prompt: "Traduire dans la langue cible:",
    lbl_placeholder_input: "Écrivez votre traduction ici...",
    lbl_btn_hint: "Indice",
    lbl_btn_submit: "Valider la Tentative",
    lbl_mic_prompt: "Cliquez sur le micro et prononcez la traduction à haute voix:",
    lbl_mic_status: "Appuyez pour parler",
    lbl_listening: "Écoute...",
    lbl_listen_model: "Écouter le Modèle",
    lbl_validate_speech: "Valider la Prononciation",
    lbl_feedback_title: "Résultat de l'Évaluation",
    lbl_your_attempt: "Votre tentative:",
    lbl_correct_translation: "Traduction Correcte:",
    lbl_next_exercise: "Exercice Suivant",
    
    lbl_grade_prompt: "Comment évaluez-vous votre rappel de cette phrase?",
    lbl_grade_again: "Oublié",
    lbl_grade_hard: "Difficile",
    lbl_grade_good: "Bien",
    lbl_grade_easy: "Facile",
    
    lbl_metrics_title: "Statistiques de Session",
    lbl_metric_sessions: "Sessions",
    lbl_metric_accuracy: "Précision",
    lbl_metric_streak: "Série",
    lbl_metric_speech_accuracy: "Précision Voix",
    lbl_metric_attempts: "Tentatives",
    lbl_metric_words: "Mots",
    lbl_metric_daily_goal: "Objectif Quotidien de Maîtrise",
    
    lbl_garden_title: "Jardin de la Mémoire (Île Active)",
    lbl_garden_seed: "🌱 Graine",
    lbl_garden_sprout: "🌿 Pousse",
    lbl_garden_tree: "🌳 Arbre",
    lbl_ebbinghaus_title: "Projection de la Courbe de l'Oubli (Ebbinghaus)",
    
    lbl_settings_byok: "Configuration du Fournisseur d'IA (BYOK)",
    lbl_settings_provider: "Fournisseur de LLM",
    lbl_settings_key: "Clé API",
    lbl_btn_save_settings: "Enregistrer la Configuration API",
    lbl_settings_profile: "Profil Utilisateur Local",
    lbl_btn_save_profile: "Mettre à Jour le Profil",
    lbl_settings_ui_title: "Langue de l'Interface",
    lbl_settings_ui_desc: "Sélectionnez la langue dans laquelle vous souhaitez afficher l'interface de l'application.",
    lbl_settings_ui_label: "Langue de l'App",

    lbl_garden_details_title: "Détail de la Phrase (Jardin)",
    lbl_garden_details_placeholder: "Survolez une pousse dans le jardin pour voir son statut de répétition espacée.",
    lbl_detail_num: "Phrase:",
    lbl_detail_retention: "Rétention Estimée:",
    lbl_detail_stability: "Stabilité:",
    lbl_detail_box: "Niveau de Maîtrise:",
    lbl_detail_l2: "Phrase Cible (L2):"
  },
  de: {
    sidebar_learn: "Lernen (Karaoke)",
    sidebar_practice: "Üben (Recall)",
    sidebar_generate: "Inseln Generieren",
    sidebar_methodology: "Methodik & Anleitung",
    sidebar_settings: "Einstellungen",
    sidebar_about: "Über",
    
    lbl_practice_collection: "Übungssammlung:",
    lbl_all_islands: "Alle Inseln",
    lbl_smart_review: "🧠 Intelligente Wiederholung (FSRS)",
    lbl_export_recordings: "Meine Aufnahmen exportieren (ZIP)",
    lbl_active_practice: "Aktives Üben",
    lbl_writing_tab: "Schreiben (Recall)",
    lbl_speech_tab: "Aussprache (Stimme)",
    lbl_translate_prompt: "In die Zielsprache übersetzen:",
    lbl_placeholder_input: "Schreiben Sie Ihre Übersetzung hier...",
    lbl_btn_hint: "Hinweis",
    lbl_btn_submit: "Versuch Validieren",
    lbl_mic_prompt: "Klicken Sie auf das Mikrofon und sprechen Sie die Übersetzung laut aus:",
    lbl_mic_status: "Zum Sprechen drücken",
    lbl_listening: "Zuhören...",
    lbl_listen_model: "Modell Anhören",
    lbl_validate_speech: "Aussprache Validieren",
    lbl_feedback_title: "Bewertungsergebnis",
    lbl_your_attempt: "Ihr Versuch:",
    lbl_correct_translation: "Richtige Übersetzung:",
    lbl_next_exercise: "Nächste Übung",
    
    lbl_grade_prompt: "Wie würden Sie Ihre Erinnerung an diesen Satz bewerten?",
    lbl_grade_again: "Vergessen",
    lbl_grade_hard: "Schwer",
    lbl_grade_good: "Gut",
    lbl_grade_easy: "Einfach",
    
    lbl_metrics_title: "Sitzungsmetriken",
    lbl_metric_sessions: "Sitzungen",
    lbl_metric_accuracy: "Genauigkeit",
    lbl_metric_streak: "Serie",
    lbl_metric_speech_accuracy: "Stimmgenauigkeit",
    lbl_metric_attempts: "Versuche",
    lbl_metric_words: "Wörter",
    lbl_metric_daily_goal: "Tägliches Meisterschaftsziel",
    
    lbl_garden_title: "Garten der Erinnerung (Aktive Insel)",
    lbl_garden_seed: "🌱 Samen",
    lbl_garden_sprout: "🌿 Spross",
    lbl_garden_tree: "🌳 Baum",
    lbl_ebbinghaus_title: "Projektion der Vergessenskurve (Ebbinghaus)",
    
    lbl_settings_byok: "KI-Anbieter-Konfiguration (BYOK)",
    lbl_settings_provider: "LLM-Anbieter",
    lbl_settings_key: "API-Schlüssel",
    lbl_btn_save_settings: "API-Konfiguration Speichern",
    lbl_settings_profile: "Lokales Benutzerprofil",
    lbl_btn_save_profile: "Profil aktualisieren",
    lbl_settings_ui_title: "Oberflächensprache",
    lbl_settings_ui_desc: "Wählen Sie die Sprache aus, in der die Anwendungsoberfläche angezeigt werden soll.",
    lbl_settings_ui_label: "App-Sprache",

    lbl_garden_details_title: "Satzdetail (Garten)",
    lbl_garden_details_placeholder: "Führen Sie den Mauszeiger über einen Spross im Garten, um dessen Wiederholungsstatus anzuzeigen.",
    lbl_detail_num: "Satz:",
    lbl_detail_retention: "Geschätzte Retention:",
    lbl_detail_stability: "Stabilität:",
    lbl_detail_box: "Meisterschaftsstufe:",
    lbl_detail_l2: "Zielsatz (L2):"
  },
  it: {
    sidebar_learn: "Imparare (Karaoke)",
    sidebar_practice: "Praticare (Recall)",
    sidebar_generate: "Generare Isole",
    sidebar_methodology: "Metodologia e Guida",
    sidebar_settings: "Impostazioni",
    sidebar_about: "Informazioni",
    
    lbl_practice_collection: "Collezione di Pratica:",
    lbl_all_islands: "Tutte le Isole",
    lbl_smart_review: "🧠 Ripasso Intelligente (FSRS)",
    lbl_export_recordings: "Esporta le mie Registrazioni (ZIP)",
    lbl_active_practice: "Pratica Attiva",
    lbl_writing_tab: "Scrittura (Recall)",
    lbl_speech_tab: "Pronuncia (Voce)",
    lbl_translate_prompt: "Traduci nella lingua di destinazione:",
    lbl_placeholder_input: "Scrivi la tua traduzione qui...",
    lbl_btn_hint: "Suggerimento",
    lbl_btn_submit: "Valuta Tentativo",
    lbl_mic_prompt: "Fai clic sul microfono e pronuncia la traduzione ad alta voce:",
    lbl_mic_status: "Premi per parlare",
    lbl_listening: "Ascolto...",
    lbl_listen_model: "Ascolta Modello",
    lbl_validate_speech: "Valuta Pronuncia",
    lbl_feedback_title: "Risultato della Valutazione",
    lbl_your_attempt: "Il tuo tentativo:",
    lbl_correct_translation: "Traduzione Corretta:",
    lbl_next_exercise: "Prossimo Esercizio",
    
    lbl_grade_prompt: "Come valuti il tuo ricordo di questa frase?",
    lbl_grade_again: "Dimenticato",
    lbl_grade_hard: "Difficile",
    lbl_grade_good: "Bene",
    lbl_grade_easy: "Facile",
    
    lbl_metrics_title: "Metriche della Sessione",
    lbl_metric_sessions: "Sessioni",
    lbl_metric_accuracy: "Precisione",
    lbl_metric_streak: "Striscia",
    lbl_metric_speech_accuracy: "Precisione Voce",
    lbl_metric_attempts: "Tentativi",
    lbl_metric_words: "Parole",
    lbl_metric_daily_goal: "Obiettivo Giornaliero di Padronanza",
    
    lbl_garden_title: "Giardino della Memoria (Isola Attiva)",
    lbl_garden_seed: "🌱 Seme",
    lbl_garden_sprout: "🌿 Germoglio",
    lbl_garden_tree: "🌳 Albero",
    lbl_ebbinghaus_title: "Proiezione della Curva dell'Oblio (Ebbinghaus)",
    
    lbl_settings_byok: "Configurazione del Provider IA (BYOK)",
    lbl_settings_provider: "Provider LLM",
    lbl_settings_key: "Chiave API",
    lbl_btn_save_settings: "Salva Configurazione API",
    lbl_settings_profile: "Profilo Utente Locale",
    lbl_btn_save_profile: "Aggiorna Profilo",
    lbl_settings_ui_title: "Lingua dell'Interfaccia",
    lbl_settings_ui_desc: "Seleziona la lingua in cui desideri visualizzare l'interfaccia dell'applicazione.",
    lbl_settings_ui_label: "Lingua dell'App",

    lbl_garden_details_title: "Dettaglio della Frase (Giardino)",
    lbl_garden_details_placeholder: "Passa il cursore su un germoglio nel giardino per vedere lo stato di ripetizione dilazionata.",
    lbl_detail_num: "Frase:",
    lbl_detail_retention: "Ritenzione Stimata:",
    lbl_detail_stability: "Stabilità:",
    lbl_detail_box: "Livello di Padronanza:",
    lbl_detail_l2: "Frase Target (L2):"
  }
};

function applyUiLanguage(langCode) {
  const t = UI_TRANSLATIONS[langCode] || UI_TRANSLATIONS['es'];
  
  const sideLearn = document.querySelector('[data-tab="learn"] .nav-label');
  const sidePractice = document.querySelector('[data-tab="practice"] .nav-label');
  const sideGenerate = document.querySelector('[data-tab="generate"] .nav-label');
  const sideMethodology = document.querySelector('[data-tab="methodology"] .nav-label');
  const sideSettings = document.querySelector('[data-tab="settings"] .nav-label');
  const sideAbout = document.querySelector('[data-tab="about"] .nav-label');
  
  if (sideLearn) sideLearn.textContent = t.sidebar_learn;
  if (sidePractice) sidePractice.textContent = t.sidebar_practice;
  if (sideGenerate) sideGenerate.textContent = t.sidebar_generate;
  if (sideMethodology) sideMethodology.textContent = t.sidebar_methodology;
  if (sideSettings) sideSettings.textContent = t.sidebar_settings;
  if (sideAbout) sideAbout.textContent = t.sidebar_about || "Acerca de";
  
  const titleMap = {
    learn: t.sidebar_learn,
    practice: t.sidebar_practice,
    generate: t.sidebar_generate,
    methodology: t.sidebar_methodology,
    settings: t.sidebar_settings,
    about: t.sidebar_about || "Acerca de"
  };
  
  window.uiTitleMap = titleMap;
  
  // Re-aplicar título de la vista activa actual
  const activeLink = document.querySelector('.sidebar-nav a.active, .mobile-nav-link.active');
  if (activeLink) {
    const tabId = activeLink.getAttribute('data-tab');
    const titleEl = document.getElementById('view-title');
    if (titleEl && titleMap[tabId]) {
      titleEl.textContent = titleMap[tabId];
    }
  }
  
  const lblPracticeColl = document.querySelector('label[for="recall-island-select"]');
  if (lblPracticeColl) lblPracticeColl.textContent = t.lbl_practice_collection;
  
  // Traducir controles de Karaoke
  const lblLoopLabel = document.getElementById('lbl-loop-label');
  if (lblLoopLabel) lblLoopLabel.textContent = t.lbl_loop_label || "Bucle de Frase";
  
  const lblKaraokeOrder = document.getElementById('lbl-karaoke-order');
  if (lblKaraokeOrder) lblKaraokeOrder.textContent = t.lbl_karaoke_order || "Orden de Reproducción";
  
  const optOrderNormal = document.getElementById('opt-order-normal');
  if (optOrderNormal) optOrderNormal.textContent = t.opt_order_normal || "Secuencial";
  
  const optOrderFsrs = document.getElementById('opt-order-fsrs');
  if (optOrderFsrs) optOrderFsrs.textContent = t.opt_order_fsrs || "Repetición Espaciada (FSRS)";
  
  const lblFilterDifficulty = document.getElementById('lbl-filter-difficulty');
  if (lblFilterDifficulty) lblFilterDifficulty.textContent = t.lbl_filter_difficulty || "Filtrar por Dominio de Memoria";
  
  const select = document.getElementById('recall-island-select');
  if (select) {
    const optionFsrs = select.querySelector('option[value="fsrs"]');
    const optionAll = select.querySelector('option[value="all"]');
    if (optionFsrs) optionFsrs.textContent = t.lbl_smart_review;
    if (optionAll) optionAll.textContent = t.lbl_all_islands;
  }
  
  const btnExport = document.getElementById('btn-recall-export-audio');
  if (btnExport) {
    const span = btnExport.querySelector('span:not(.material-symbols-rounded)');
    if (span) span.textContent = t.lbl_export_recordings;
  }
  
  const badgeActive = document.querySelector('#tab-practice .badge-accent');
  if (badgeActive) badgeActive.textContent = t.lbl_active_practice;
  
  const tabWriting = document.getElementById('btn-mode-writing');
  if (tabWriting) {
    const span = tabWriting.querySelector('span:not(.material-symbols-rounded)');
    if (span) span.textContent = t.lbl_writing_tab;
  }
  
  const tabSpeech = document.getElementById('btn-mode-speech');
  if (tabSpeech) {
    const span = tabSpeech.querySelector('span:not(.material-symbols-rounded)');
    if (span) span.textContent = t.lbl_speech_tab;
  }
  
  const lblPrompt = document.querySelector('.recall-prompt-card p.small') || document.querySelector('.recall-prompt p.small');
  if (lblPrompt) lblPrompt.textContent = t.lbl_translate_prompt;
  
  const txtInput = document.getElementById('recall-user-input');
  if (txtInput) txtInput.setAttribute('placeholder', t.lbl_placeholder_input);
  
  const btnHint = document.getElementById('btn-recall-hint');
  if (btnHint) {
    const span = btnHint.querySelector('span:not(.material-symbols-rounded)');
    if (span) span.textContent = t.lbl_btn_hint;
  }
  
  const btnSubmit = document.getElementById('btn-recall-submit');
  if (btnSubmit) {
    const span = btnSubmit.querySelector('span:not(.material-symbols-rounded)');
    if (span) span.textContent = t.lbl_btn_submit;
  }
  
  const speechPrompt = document.querySelector('#recall-speech-group p.small');
  if (speechPrompt) speechPrompt.textContent = t.lbl_mic_prompt;
  
  const micStatus = document.getElementById('speech-status');
  if (micStatus) {
    if (micStatus.textContent === 'Presiona para hablar' || micStatus.textContent === 'Press to speak' || micStatus.textContent === 'Pressione para falar' || micStatus.textContent === 'Appuyez pour parler' || micStatus.textContent === 'Zum Sprechen drücken' || micStatus.textContent === 'Premi per parlare') {
      micStatus.textContent = t.lbl_mic_status;
    }
  }
  
  const btnListenModel = document.getElementById('btn-speech-play-target');
  if (btnListenModel) {
    const span = btnListenModel.querySelector('span:not(.material-symbols-rounded)');
    if (span) span.textContent = t.lbl_listen_model;
  }
  
  const btnValidateSpeech = document.getElementById('btn-speech-submit');
  if (btnValidateSpeech) {
    const span = btnValidateSpeech.querySelector('span:not(.material-symbols-rounded)');
    if (span) span.textContent = t.lbl_validate_speech;
  }
  
  const feedbackTitle = document.getElementById('feedback-title');
  if (feedbackTitle && (feedbackTitle.textContent === 'Resultado de Evaluación' || feedbackTitle.textContent === 'Evaluation Result' || feedbackTitle.textContent === 'Resultado da Avaliação' || feedbackTitle.textContent === 'Résultat de l\'Évaluation' || feedbackTitle.textContent === 'Bewertungsergebnis' || feedbackTitle.textContent === 'Risultato della Valutazione')) {
    feedbackTitle.textContent = t.lbl_feedback_title;
  }
  
  const lblYourAtt = document.querySelector('#recall-feedback-card .compare-group span.label:not(.text-success)');
  if (lblYourAtt) lblYourAtt.textContent = t.lbl_your_attempt;
  
  const lblCorrect = document.getElementById('lbl-correct-translation');
  if (lblCorrect) lblCorrect.textContent = t.lbl_correct_translation;
  
  const srPrompt = document.getElementById('sr-grade-prompt');
  if (srPrompt) srPrompt.textContent = t.lbl_grade_prompt;
  
  const btnGradeAgain = document.getElementById('btn-grade-again');
  const btnGradeHard = document.getElementById('btn-grade-hard');
  const btnGradeGood = document.getElementById('btn-grade-good');
  const btnGradeEasy = document.getElementById('btn-grade-easy');
  if (btnGradeAgain) btnGradeAgain.textContent = t.lbl_grade_again;
  if (btnGradeHard) btnGradeHard.textContent = t.lbl_grade_hard;
  if (btnGradeGood) btnGradeGood.textContent = t.lbl_grade_good;
  if (btnGradeEasy) btnGradeEasy.textContent = t.lbl_grade_easy;
  
  const btnTextNext = document.getElementById('btn-text-next-exercise');
  if (btnTextNext) btnTextNext.textContent = t.lbl_next_exercise;
  
  const metricsTitle = document.querySelector('#tab-practice .panel-sidebar h3');
  if (metricsTitle) metricsTitle.textContent = t.lbl_metrics_title;
  
  const lblSessions = document.querySelector('.metric-box[title*="Sesiones"] .metric-lbl, .metric-box[title*="sessions"] .metric-lbl, .metric-box[title*="sessões"] .metric-lbl, .metric-box[title*="sitzungen"] .metric-lbl, .metric-box[title*="sessioni"] .metric-lbl');
  if (lblSessions) lblSessions.textContent = t.lbl_metric_sessions;
  
  const lblAccuracy = document.querySelector('.metric-box[title*="traducción escrita"] .metric-lbl, .metric-box[title*="translation accuracy"] .metric-lbl, .metric-box[title*="tradução escrita"] .metric-lbl, .metric-box[title*="traduction écrite"] .metric-lbl, .metric-box[title*="schriftlicher Übersetzung"] .metric-lbl, .metric-box[title*="traduzione scritta"] .metric-lbl');
  if (lblAccuracy) lblAccuracy.textContent = t.lbl_metric_accuracy;
  
  const lblStreak = document.querySelector('.metric-box[title*="Racha"] .metric-lbl, .metric-box[title*="Streak"] .metric-lbl, .metric-box[title*="Série"] .metric-lbl, .metric-box[title*="Serie"] .metric-lbl, .metric-box[title*="Striscia"] .metric-lbl');
  if (lblStreak) lblStreak.textContent = t.lbl_metric_streak;
  
  const lblSpeechAcc = document.querySelector('.metric-box[title*="pronunciación"] .metric-lbl, .metric-box[title*="pronunciation accuracy"] .metric-lbl, .metric-box[title*="pronúncia"] .metric-lbl, .metric-box[title*="prononciation"] .metric-lbl, .metric-box[title*="Aussprache"] .metric-lbl, .metric-box[title*="pronuncia"] .metric-lbl');
  if (lblSpeechAcc) lblSpeechAcc.textContent = t.lbl_metric_speech_accuracy;
  
  const lblAttempts = document.querySelector('.metric-box[title*="intentos"] .metric-lbl, .metric-box[title*="attempts"] .metric-lbl, .metric-box[title*="tentativas"] .metric-lbl, .metric-box[title*="tentatives"] .metric-lbl, .metric-box[title*="Versuche"] .metric-lbl, .metric-box[title*="tentativi"] .metric-lbl');
  if (lblAttempts) lblAttempts.textContent = t.lbl_metric_attempts;
  
  const lblWords = document.querySelector('.metric-box[title*="palabras"] .metric-lbl, .metric-box[title*="words"] .metric-lbl, .metric-box[title*="palavras"] .metric-lbl, .metric-box[title*="mots"] .metric-lbl, .metric-box[title*="Wörter"] .metric-lbl, .metric-box[title*="parole"] .metric-lbl');
  if (lblWords) lblWords.textContent = t.lbl_metric_words;
  
  const lblDailyGoal = document.querySelector('.progress-bar-container .small');
  if (lblDailyGoal) lblDailyGoal.textContent = t.lbl_metric_daily_goal;
  
  const lblRetention = document.getElementById('lbl-metric-retention');
  if (lblRetention) lblRetention.textContent = t.lbl_metric_retention;
  const lblConsolidation = document.getElementById('lbl-metric-consolidation');
  if (lblConsolidation) lblConsolidation.textContent = t.lbl_metric_consolidation;
  
  const lblGarden = document.getElementById('lbl-garden-title');
  if (lblGarden) lblGarden.textContent = t.lbl_garden_title;
  const lblGardenSeed = document.getElementById('lbl-garden-seed');
  const lblGardenSprout = document.getElementById('lbl-garden-sprout');
  const lblGardenTree = document.getElementById('lbl-garden-tree');
  if (lblGardenSeed) lblGardenSeed.textContent = t.lbl_garden_seed;
  if (lblGardenSprout) lblGardenSprout.textContent = t.lbl_garden_sprout;
  if (lblGardenTree) lblGardenTree.textContent = t.lbl_garden_tree;
  
  const lblEbbinghaus = document.getElementById('lbl-ebbinghaus-title');
  if (lblEbbinghaus) lblEbbinghaus.textContent = t.lbl_ebbinghaus_title;
  
  const flipFrontLabel = document.getElementById('flip-front-label');
  const flipBackLabel = document.getElementById('flip-back-label');
  if (flipFrontLabel) {
    flipFrontLabel.textContent = langCode === 'es' ? 'Idioma Nativo (Toca para voltear y escuchar)' : 
                                  langCode === 'en' ? 'Native Language (Tap to flip and listen)' :
                                  langCode === 'pt' ? 'Idioma Nativo (Toque para girar e ouvir)' :
                                  langCode === 'fr' ? 'Langue Maternelle (Tapez pour retourner et écouter)' :
                                  langCode === 'de' ? 'Muttersprache (Tippen zum Wenden und Anhören)' :
                                  'Lingua Madre (Tocca per capovolgere e ascoltare)';
  }
  if (flipBackLabel) {
    flipBackLabel.textContent = langCode === 'es' ? 'Idioma Objetivo (TTS Reproducido)' : 
                                 langCode === 'en' ? 'Target Language (TTS Played)' :
                                 langCode === 'pt' ? 'Idioma de Destino (TTS Reproduzido)' :
                                 langCode === 'fr' ? 'Langue Cible (TTS Joué)' :
                                 langCode === 'de' ? 'Zielsprache (TTS Abgespielt)' :
                                 'Lingua di Destinazione (TTS Riprodottò)';
  }
  
  const settingsTitle = document.querySelector('#tab-settings h3');
  if (settingsTitle) settingsTitle.textContent = t.lbl_settings_byok;
  
  const lblProv = document.querySelector('label[for="api-provider"]');
  if (lblProv) lblProv.textContent = t.lbl_settings_provider;
  
  const lblKey = document.querySelector('label[for="api-key"]');
  if (lblKey) lblKey.textContent = t.lbl_settings_key;
  
  const btnSaveSettings = document.querySelector('#settings-form button[type="submit"]');
  if (btnSaveSettings) {
    const span = btnSaveSettings.querySelector('span:not(.material-symbols-rounded)');
    if (span) span.textContent = t.lbl_btn_save_settings;
  }
  
  const profileTitle = document.querySelector('#tab-settings .settings-card:nth-of-type(2) h3');
  if (profileTitle) profileTitle.textContent = t.lbl_settings_profile;
  
  const btnSaveProfile = document.getElementById('btn-text-update-profile');
  if (btnSaveProfile) btnSaveProfile.textContent = t.lbl_btn_save_profile;
  
  const uiSettingsTitle = document.getElementById('ui-settings-title');
  const uiSettingsDesc = document.getElementById('ui-settings-desc');
  const uiSettingsLabel = document.getElementById('ui-settings-label');
  if (uiSettingsTitle) uiSettingsTitle.textContent = t.lbl_settings_ui_title;
  if (uiSettingsDesc) uiSettingsDesc.textContent = t.lbl_settings_ui_desc;
  if (uiSettingsLabel) uiSettingsLabel.textContent = t.lbl_settings_ui_label;

  // Localizar la nueva tarjeta de detalles de frase
  const lblDetailsTitle = document.getElementById('lbl-garden-details-title');
  if (lblDetailsTitle) {
    const span = lblDetailsTitle.querySelector('span:not(.material-symbols-rounded)');
    if (span) span.textContent = t.lbl_garden_details_title;
  }
  
  const detailsPlaceholder = document.getElementById('garden-details-placeholder');
  if (detailsPlaceholder) {
    detailsPlaceholder.textContent = t.lbl_garden_details_placeholder;
  }
  
  const lblDetNum = document.getElementById('lbl-detail-num');
  if (lblDetNum) lblDetNum.textContent = t.lbl_detail_num;
  
  const lblDetRetention = document.getElementById('lbl-detail-retention');
  if (lblDetRetention) lblDetRetention.textContent = t.lbl_detail_retention;
  
  const lblDetStability = document.getElementById('lbl-detail-stability');
  if (lblDetStability) lblDetStability.textContent = t.lbl_detail_stability;
  
  const lblDetBox = document.getElementById('lbl-detail-box');
  if (lblDetBox) lblDetBox.textContent = t.lbl_detail_box;
  
  const lblDetL2 = document.getElementById('lbl-detail-l2');
  if (lblDetL2) lblDetL2.textContent = t.lbl_detail_l2;
}

// Lógica de cambio de sub-pestañas de donaciones
function switchDonationTab(tabId) {
  // Desactivar todos los botones de donaciones
  document.querySelectorAll('.donation-tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // Ocultar todos los paneles de donaciones
  document.querySelectorAll('.donation-tab-panel').forEach(panel => {
    panel.classList.add('hidden');
  });
  
  // Activar el botón seleccionado
  const activeBtn = document.querySelector(`.donation-tab-btn[data-donation-tab="${tabId}"]`);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
  
  // Mostrar el panel seleccionado
  const activePanel = document.getElementById(`donation-panel-${tabId}`);
  if (activePanel) {
    activePanel.classList.remove('hidden');
  }
}

// Inicializar controladores de eventos de donaciones y feedback
function initDonationControls() {
  // Event listeners para los botones de pestañas
  document.querySelectorAll('.donation-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-donation-tab');
      switchDonationTab(tabId);
    });
  });
  
  // Inyectar dinámicamente la URL actual para la redirección de FormSubmit.co
  const redirectInput = document.getElementById('feedback-redirect-url');
  if (redirectInput) {
    // Si la app está en un hash o subruta, redirigir limpio a la misma página
    redirectInput.value = window.location.origin + window.location.pathname + '#about';
  }

  // Auto-rellenar el formulario con los datos del perfil si ya está autenticado
  autofillFeedbackForm();
}

// Auto-completar los datos de nombre y correo del formulario de sugerencias
function autofillFeedbackForm() {
  const fbName = document.getElementById('fb-name');
  const fbEmail = document.getElementById('fb-email');
  
  if (appState && appState.profile) {
    if (fbName) {
      const firstName = appState.profile.firstName || '';
      const lastName = appState.profile.lastName || '';
      const fullName = `${firstName} ${lastName}`.trim();
      if (fullName) {
        fbName.value = fullName;
      }
    }
    if (fbEmail && appState.profile.email) {
      fbEmail.value = appState.profile.email;
    }
  }
}

// -------------------------------------------------------------
// NAVEGACIÓN GLOBAL Y CONTROLADORES DE INTERFAZ POLYGLOTLAB
// -------------------------------------------------------------
function switchMainTab(tabId) {
  if (!tabId) return;

  // Actualizar enlaces del sidebar
  document.querySelectorAll('.nav-link').forEach(link => {
    const isTarget = link.getAttribute('data-tab') === tabId || link.getAttribute('href') === `#${tabId}`;
    if (isTarget) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Ocultar todos los paneles de pestañas principales
  document.querySelectorAll('main.main-content > .workspace-area > section.tab-panel').forEach(panel => {
    panel.classList.add('hidden');
  });

  // Mostrar el panel de pestaña seleccionado
  const targetPanel = document.getElementById(`tab-${tabId}`);
  if (targetPanel) {
    targetPanel.classList.remove('hidden');
  }

  // Actualizar el título de la vista en el topbar
  const titlesMap = {
    'learn': 'Aprender (Karaoke)',
    'practice': 'Practicar (Recall)',
    'generate': 'Generar Islas',
    'guide': 'Metodología y Guía',
    'settings': 'Configuración',
    'about': 'Acerca de'
  };

  const titleEl = document.getElementById('view-title');
  if (titleEl && titlesMap[tabId]) {
    titleEl.textContent = titlesMap[tabId];
  }

  // Actualizar hash de URL sin recargar
  window.location.hash = `#${tabId}`;

  // Actualizaciones según la pestaña
  if (tabId === 'learn') {
    initLearnPanel();
  } else if (tabId === 'practice') {
    if (typeof buildPracticeQueue === 'function') buildPracticeQueue();
    if (typeof loadPracticeExercise === 'function') loadPracticeExercise();
  } else if (tabId === 'settings') {
    updateTargetLanguageUI();
  }
}

function openTargetLangModal() {
  const modal = document.getElementById('target-lang-modal');
  if (!modal) return;
  
  renderTargetLanguagesGrid();
  modal.classList.remove('hidden');
}

function closeTargetLangModal() {
  const modal = document.getElementById('target-lang-modal');
  if (modal) modal.classList.add('hidden');
}

function renderTargetLanguagesGrid() {
  const grid = document.getElementById('target-languages-grid');
  if (!grid) return;

  grid.innerHTML = '';
  const activeLang = appState.activeTargetLanguage || 'Inglés';

  (appState.targetLanguages || ['Inglés', 'Portugués', 'Francés', 'Alemán', 'Italiano']).forEach(lang => {
    const isActive = lang === activeLang;
    const islandCount = (appState.islands || []).filter(isl => isl.language === lang).length;
    const card = document.createElement('div');
    card.className = `target-lang-card ${isActive ? 'active' : ''}`;
    card.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 14px 10px;
      border-radius: 16px;
      border: 2px solid ${isActive ? 'hsl(var(--md-sys-color-primary))' : 'hsl(var(--md-sys-color-outline-variant))'};
      background: ${isActive ? 'hsl(var(--md-sys-color-primary-container))' : 'hsl(var(--md-sys-color-surface-container-low))'};
      color: ${isActive ? 'hsl(var(--md-sys-color-primary))' : 'inherit'};
      cursor: pointer;
      transition: all 0.2s ease;
    `;

    card.innerHTML = `
      <span style="font-size: 28px;">${getLangFlag(lang)}</span>
      <span style="font-weight: 700; font-size: 14px;">${escapeHtml(lang)}</span>
      <span style="font-size: 11px; opacity: 0.8;">${islandCount} ${islandCount === 1 ? 'isla' : 'islas'}</span>
      ${isActive ? '<span class="material-symbols-rounded" style="font-size: 18px; margin-top: 2px;">check_circle</span>' : ''}
    `;

    card.addEventListener('click', () => {
      setActiveTargetLanguage(lang);
      renderTargetLanguagesGrid();
      closeTargetLangModal();
      showNotification(`Idioma activo cambiado a: ${getLangFlag(lang)} ${lang}`, "success");
    });

    grid.appendChild(card);
  });
}

function handleAddTargetLanguage() {
  const input = document.getElementById('new-target-lang-input');
  if (!input) return;
  
  const newLang = input.value.trim();
  if (!newLang) {
    showNotification("Por favor ingresa el nombre de un idioma.", "warning");
    return;
  }

  if (!appState.targetLanguages) appState.targetLanguages = [];
  if (appState.targetLanguages.map(l => l.toLowerCase()).includes(newLang.toLowerCase())) {
    showNotification("Ese idioma ya existe en tu lista.", "warning");
    return;
  }

  appState.targetLanguages.push(newLang);
  appState.activeTargetLanguage = newLang;
  saveAppState();

  input.value = '';
  renderTargetLanguagesGrid();
  updateTargetLanguageUI();
  renderIslandSelectors();
  buildKaraokeQueue();
  loadCurrentSentence();

  showNotification(`¡Nuevo idioma "${newLang}" añadido y seleccionado!`, "success");
}

function initPolyglotLabCore() {
  console.log("Inicializando PolyglotLab Core Navigation & Controls...");

  // 1. Enlaces de navegación del Sidebar
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const tabId = link.getAttribute('data-tab') || link.getAttribute('href').replace('#', '');
      switchMainTab(tabId);
    });
  });

  // 2. Selector de Idioma Objetivo (Topbar Pill & Modal)
  const topbarLangBtn = document.getElementById('topbar-target-lang-btn');
  if (topbarLangBtn) {
    topbarLangBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openTargetLangModal();
    });
  }

  const closeLangModalBtn = document.getElementById('btn-close-target-lang-modal');
  if (closeLangModalBtn) {
    closeLangModalBtn.addEventListener('click', closeTargetLangModal);
  }

  const addLangBtn = document.getElementById('btn-add-target-lang');
  if (addLangBtn) {
    addLangBtn.addEventListener('click', handleAddTargetLanguage);
  }

  const newLangInput = document.getElementById('new-target-lang-input');
  if (newLangInput) {
    newLangInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddTargetLanguage();
      }
    });
  }

  // 3. Botones de Cierre de Sesión (Topbar y Sidebar)
  const sidebarLogoutBtn = document.getElementById('sidebar-logout-btn');
  const topbarLogoutBtn = document.getElementById('topbar-logout-btn');

  if (sidebarLogoutBtn) {
    sidebarLogoutBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      handleLogout();
    });
  }

  if (topbarLogoutBtn) {
    topbarLogoutBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      handleLogout();
    });
  }

  // 4. Modal de Exportación TXT/DOC
  const closeExportBtn = document.getElementById('btn-close-export-txt-doc');
  const cancelExportBtn = document.getElementById('btn-cancel-export-txt-doc');
  if (closeExportBtn) closeExportBtn.addEventListener('click', () => {
    const modal = document.getElementById('export-txt-doc-modal');
    if (modal) modal.classList.add('hidden');
  });
  if (cancelExportBtn) cancelExportBtn.addEventListener('click', () => {
    const modal = document.getElementById('export-txt-doc-modal');
    if (modal) modal.classList.add('hidden');
  });

  // 5. Botón de Acerca de en Topbar
  const aboutTopBtn = document.getElementById('about-top-btn');
  if (aboutTopBtn) {
    aboutTopBtn.addEventListener('click', () => {
      switchMainTab('about');
    });
  }

  // 6. Cargar pestaña inicial basada en hash de la URL o por defecto 'learn'
  const initialHash = window.location.hash.replace('#', '');
  const validTabs = ['learn', 'practice', 'generate', 'guide', 'settings', 'about'];
  const startTab = validTabs.includes(initialHash) ? initialHash : 'learn';
  switchMainTab(startTab);

  // 7. Actualizar UI inicial del idioma activo
  updateTargetLanguageUI();
}

// Escuchar DOMContentLoaded o ejecutar inmediatamente si el documento ya cargó
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPolyglotLabCore);
} else {
  initPolyglotLabCore();
}

