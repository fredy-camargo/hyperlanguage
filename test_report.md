# Informe Oficial de Auditoría y Certificación - Metodología del Árbitro (PolyglotLab)

Este informe detalla las evaluaciones cuantitativas y cualitativas ejecutadas por los **9 Árbitros Especializados** más el **Escáner Estático Zero-Trust (`security_scan.py`)** para certificar la seguridad, experiencia de uso (UX/UI), responsividad web/móvil y precisión funcional de **PolyglotLab**.

## 📊 Resumen Ejecutivo del Juez Supremo
- **Fecha de Ejecución**: 3/11/2026, 9:46:31 p. m.
- **Árbitros Desplegados**: 9 Árbitros de Dominio + 1 Juez Orquestador
- **Total de Evaluaciones Ejecutadas**: 61
- **Evaluaciones Aprobadas**: 61 ✅
- **Evaluaciones Fallidas**: 0 ❌
- **Tasa de Aprobación Global**: 100.0%

---

## ⚖️ Tabla de Calificación por Árbitro

| # | Árbitro Especializado | Evaluaciones | Aprobadas | Puntaje | Veredicto |
|---|-----------------------|--------------|-----------|---------|-----------|
| 1 | **Árbitro 1: Seguridad Zero-Trust y Criptografía (OWASP 2025)** | 7 | 7 | 100% | ✅ APROBADO |
| 2 | **Árbitro 2: Autenticación, Sesiones y Control de Acceso** | 6 | 6 | 100% | ✅ APROBADO |
| 3 | **Árbitro 3: Motor de Input Comprensible y Bucle Karaoke** | 8 | 8 | 100% | ✅ APROBADO |
| 4 | **Árbitro 4: Motor de Recuerdo Activo (Recall) y Algoritmo FSRS** | 7 | 7 | 100% | ✅ APROBADO |
| 5 | **Árbitro 5: Generación Contextual IA (BYOK), Manual e Importación** | 6 | 6 | 100% | ✅ APROBADO |
| 6 | **Árbitro 6: Metodología Científica y Doblaje Neuronal Multilingüe** | 6 | 6 | 100% | ✅ APROBADO |
| 7 | **Árbitro 7: Configuración, Internacionalización (i18n) y Comunidad** | 7 | 7 | 100% | ✅ APROBADO |
| 8 | **Árbitro 8: Experiencia de Uso (UX/UI), Responsividad Móvil/Web y Accesibilidad** | 7 | 7 | 100% | ✅ APROBADO |
| 9 | **Árbitro 9: Recorrido Integral del Usuario (End-to-End User Journey)** | 7 | 7 | 100% | ✅ APROBADO |

---

## 🔬 Detalle de Aserciones y Métricas por Componente

| # | Componente / Objeto | Métrica o Criterio Evaluado | Método de Validación | Estado |
|---|---------------------|-----------------------------|----------------------|--------|
| 1 | `escapeHtml()` | Seguridad XSS: La función escapeHtml neutraliza etiquetas HTML, atributos y vectores de inyección DOM | OWASP 2025 Zero-Trust & XSS/SSRF Penetration Assertion | ✅ Aprobado |
| 2 | `#target-languages-grid` | Seguridad XSS: El grid y listado de idiomas objetivo escapan nombres de idioma maliciosos sin ejecutar scripts | OWASP 2025 Zero-Trust & XSS/SSRF Penetration Assertion | ✅ Aprobado |
| 3 | `#topics-manager-list` | Seguridad XSS: El gestor de categorías y carpetas laterales escapan nombres de temas maliciosos | OWASP 2025 Zero-Trust & XSS/SSRF Penetration Assertion | ✅ Aprobado |
| 4 | `getCloudSafeSettings()` | Seguridad BYOK: getCloudSafeSettings elimina estrictamente apiKey y apiTtsKey antes de sincronizar con Firestore | OWASP 2025 Zero-Trust & XSS/SSRF Penetration Assertion | ✅ Aprobado |
| 5 | `validateSafeApiUrl()` | Seguridad SSRF: validateSafeApiUrl bloquea esquemas javascript:/http: externos y permite solo HTTPS o loopback 127.0.0.1 | OWASP 2025 Zero-Trust & XSS/SSRF Penetration Assertion | ✅ Aprobado |
| 6 | `dev_server.py & api/tts.py` | Seguridad Backend: dev_server.py y api/tts.py aplican escucha 127.0.0.1, whitelist de voces, límite de payload y bloqueo de escritura arbitraria | OWASP 2025 Zero-Trust & XSS/SSRF Penetration Assertion | ✅ Aprobado |
| 7 | `InfraConfig` | Seguridad Infraestructura: .gitignore, .dockerignore, firebase.json y vercel.json cumplen con el blindaje OWASP 2025 | OWASP 2025 Zero-Trust & XSS/SSRF Penetration Assertion | ✅ Aprobado |
| 8 | `#onboarding-screen` | Sin sesión activa, el modal de Login/Onboarding (#onboarding-screen) se muestra visible de forma obligatoria | DOM Assertion & State Validation | ✅ Aprobado |
| 9 | `#onboarding-form` | Tras completar el formulario de acceso, el modal de Login se oculta exitosamente | DOM Assertion & State Validation | ✅ Aprobado |
| 10 | `#user-display-name` | El badge del perfil de usuario en el sidebar se actualiza con el nombre completo ('TestUser Polyglot') | DOM Assertion & State Validation | ✅ Aprobado |
| 11 | `#sidebar-logout-btn` | El botón de cerrar sesión en el sidebar (#sidebar-logout-btn) existe y está vinculado | DOM Assertion & State Validation | ✅ Aprobado |
| 12 | `#sidebar-logout-btn` | Al cerrar sesión (Logout), el modal de Login (#onboarding-screen) vuelve a desplegarse y bloquea la interfaz | DOM Assertion & State Validation | ✅ Aprobado |
| 13 | `window.appState.profile` | El estado del perfil de usuario (appState.profile) se restablece a null | DOM Assertion & State Validation | ✅ Aprobado |
| 14 | `.island-item` | La lista de islas en el sidebar (#island-selector-list) renderiza correctamente las tarjetas de isla | DOM Element Event & State Mutator | ✅ Aprobado |
| 15 | `.change-island-topic-select` | El selector de categoría (.change-island-topic-select) está presente en cada tarjeta de isla | DOM Element Event & State Mutator | ✅ Aprobado |
| 16 | `island.topicId` | Cambiar la opción en el selector desplegable actualiza reactivamente la propiedad 'topicId' de la isla | DOM Element Event & State Mutator | ✅ Aprobado |
| 17 | `#btn-edit-active-island` | El botón 'Editar' (#btn-edit-active-island) existe en la barra de herramientas del reproductor | DOM Element Event & State Mutator | ✅ Aprobado |
| 18 | `#edit-island-screen` | Abrir el modal de edición desplega el modal (#edit-island-screen) | DOM Element Event & State Mutator | ✅ Aprobado |
| 19 | `#edit-island-topic-input` | El modal de edición incluye un selector de Categoría/Tema (#edit-island-topic-input) | DOM Element Event & State Mutator | ✅ Aprobado |
| 20 | `#btn-speed-reset` | El botón '1.0x' (#btn-speed-reset) restablece la velocidad de reproducción a 1.0x | DOM Element Event & State Mutator | ✅ Aprobado |
| 21 | `.controls-row` | Los botones de navegación de oraciones (#btn-prev-sentence y #btn-next-sentence) están correctamente vinculados | DOM Element Event & State Mutator | ✅ Aprobado |
| 22 | `.practice-modes` | Los botones de selección de modo (Escritura vs Pronunciación) existen | Interactive Recall Engine Verification | ✅ Aprobado |
| 23 | `#recall-speech-group` | Hacer clic en 'Pronunciación (Voz)' habilita el contenedor de voz (#recall-speech-group) | Interactive Recall Engine Verification | ✅ Aprobado |
| 24 | `#recall-writing-group` | Hacer clic en 'Escritura (Recall)' habilita el contenedor de texto (#recall-writing-group) | Interactive Recall Engine Verification | ✅ Aprobado |
| 25 | `#recall-writing-group` | El campo de texto y botón de validación de intento existen | Interactive Recall Engine Verification | ✅ Aprobado |
| 26 | `#recall-feedback-card` | Existe la tarjeta de evaluación y feedback (#recall-feedback-card) | Interactive Recall Engine Verification | ✅ Aprobado |
| 27 | `.sr-buttons-group` | Los botones de calificación FSRS (Olvidé, Difícil, Bien, Fácil) existen en el panel | Interactive Recall Engine Verification | ✅ Aprobado |
| 28 | `#memory-garden` | El Jardín de la Memoria (#memory-garden) está presente para renderizar los brotes de repaso | Interactive Recall Engine Verification | ✅ Aprobado |
| 29 | `.sub-tabs-container` | Las subpestañas de modo (IA, Manual, Archivo Plano) están presentes | Subtab Navigation & Form Processing Assertion | ✅ Aprobado |
| 30 | `#panel-gen-manual` | Hacer clic en 'Crear Manualmente' activa el panel manual (#panel-gen-manual) | Subtab Navigation & Form Processing Assertion | ✅ Aprobado |
| 31 | `#panel-gen-import` | Hacer clic en 'Cargar Archivo Plano' activa el panel de importación (#panel-gen-import) | Subtab Navigation & Form Processing Assertion | ✅ Aprobado |
| 32 | `#panel-gen-ai` | Hacer clic en 'Generar con IA' retorna al panel principal de IA (#panel-gen-ai) | Subtab Navigation & Form Processing Assertion | ✅ Aprobado |
| 33 | `#manual-list-preview-area` | Añadir oración en modo manual despliega la tabla de vista previa (#manual-list-preview-area) | Subtab Navigation & Form Processing Assertion | ✅ Aprobado |
| 34 | `#import-preview-area` | Pegar texto delimitado procesa y muestra la vista previa de importación (#import-preview-area) | Subtab Navigation & Form Processing Assertion | ✅ Aprobado |
| 35 | `.tutorial-video-container` | Los 4 contenedores de video tutoriales (Karaoke, Práctica, Creación de Islas, Categorías) están presentes en la interfaz | Interactive Video & Neural Audio Assertion | ✅ Aprobado |
| 36 | `.btn-play` | El botón 'Reproducir' (.btn-play) está presente y configurado para el video de Karaoke | Interactive Video & Neural Audio Assertion | ✅ Aprobado |
| 37 | `#video-placeholder-karaoke` | Reproducir el video remueve el overlay de pausa (#video-placeholder-karaoke) | Interactive Video & Neural Audio Assertion | ✅ Aprobado |
| 38 | `.narration-controls` | El selector de idioma de doblaje (.narration-lang) y el texto de narración (#narration-categories-text) existen | Interactive Video & Neural Audio Assertion | ✅ Aprobado |
| 39 | `#narration-categories-text` | Cambiar el idioma a 'Inglés' actualiza el texto de la narración al inglés de forma instantánea | Interactive Video & Neural Audio Assertion | ✅ Aprobado |
| 40 | `.btn-play-narration` | El botón 'Reproducir Doblaje' (.btn-play-narration) está presente en la interfaz | Interactive Video & Neural Audio Assertion | ✅ Aprobado |
| 41 | `#tab-settings` | El campo de clave API (#api-key) y el botón de visibilidad existen | Settings Form & Feedback Agent Assertion | ✅ Aprobado |
| 42 | `#btn-toggle-key-visibility` | Hacer clic en el botón de visibilidad alterna el tipo de input a 'text' | Settings Form & Feedback Agent Assertion | ✅ Aprobado |
| 43 | `#btn-toggle-key-visibility` | Volver a hacer clic restablece el tipo de input a 'password' | Settings Form & Feedback Agent Assertion | ✅ Aprobado |
| 44 | `#settings-ui-lang` | El selector de idioma de la interfaz (#settings-ui-lang) existe | Settings Form & Feedback Agent Assertion | ✅ Aprobado |
| 45 | `#settings-ui-lang` | Cambiar el idioma a 'en' actualiza las etiquetas de la barra lateral al inglés ('Learn (Karaoke)') | Settings Form & Feedback Agent Assertion | ✅ Aprobado |
| 46 | `#about-feedback-form` | El formulario de comentarios (#about-feedback-form) está presente en la vista Acerca de | Settings Form & Feedback Agent Assertion | ✅ Aprobado |
| 47 | `#about-feedback-form` | Enviar el formulario registra la sugerencia en el historial local (appState.feedbackHistory) | Settings Form & Feedback Agent Assertion | ✅ Aprobado |
| 48 | `nav.mobile-nav` | UX Móvil: Existe exactamente una barra de navegación inferior unificada para dispositivos móviles (sin duplicación) | Responsive DOM, Keyboard Shortcut & Accessibility Audit | ✅ Aprobado |
| 49 | `#karaoke-sentence-mastery-container` | UX Karaoke: El indicador visual de Dominio de la Frase y Palabra Objetivo se renderiza dinámicamente en el reproductor | Responsive DOM, Keyboard Shortcut & Accessibility Audit | ✅ Aprobado |
| 50 | `.recall-prompt-card & #recall-speech-flip-card` | UX Práctica: La tarjeta de prompt escrito y la tarjeta 3D de voz alternan limpiamente sin dejar cajas vacías residuales | Responsive DOM, Keyboard Shortcut & Accessibility Audit | ✅ Aprobado |
| 51 | `#recall-user-input` | UX Web (Atajos de Teclado): El atajo Ctrl+Enter en el área de traducción ejecuta inmediatamente la validación del ejercicio | Responsive DOM, Keyboard Shortcut & Accessibility Audit | ✅ Aprobado |
| 52 | `document.keydown` | UX Web (Atajos de Teclado): Las teclas de dirección (ArrowRight/ArrowLeft) permiten avanzar y retroceder frases en Karaoke | Responsive DOM, Keyboard Shortcut & Accessibility Audit | ✅ Aprobado |
| 53 | `UI_TRANSLATIONS & DEFAULT_STATE` | UX Contenido e i18n: Los textos predeterminados en español e inglés están libres de erratas tipográficas | Responsive DOM, Keyboard Shortcut & Accessibility Audit | ✅ Aprobado |
| 54 | `index.css` | UI/CSS Responsivo: index.css incluye soporte para safe-area-inset-bottom móvil, anillos de enfoque accesibles (:focus-visible) y media queries | Responsive DOM, Keyboard Shortcut & Accessibility Audit | ✅ Aprobado |
| 55 | `#onboarding-screen` | PASO 1: Al iniciar la app sin sesión previa, la pantalla de Login/Registro se despliega obligatoriamente | End-to-End User Journey Simulation | ✅ Aprobado |
| 56 | `#onboarding-screen` | PASO 2: Al registrarse / iniciar sesión, se concede acceso al área de trabajo | End-to-End User Journey Simulation | ✅ Aprobado |
| 57 | `appState.profile` | El perfil del usuario autenticado se almacena correctamente | End-to-End User Journey Simulation | ✅ Aprobado |
| 58 | `#player-island-name` | PASO 3: El reproductor de Karaoke carga y muestra el nombre de la isla activa | End-to-End User Journey Simulation | ✅ Aprobado |
| 59 | `island.topicId` | PASO 4: Cambiar la categoría de la isla modifica exitosamente la agrupación en el panel lateral | End-to-End User Journey Simulation | ✅ Aprobado |
| 60 | `#sidebar-logout-btn` | PASO 5: Al presionar 'Cerrar Sesión', el usuario retorna a la pantalla de Login y se borra la sesión | End-to-End User Journey Simulation | ✅ Aprobado |
| 61 | `appState.profile` | El estado del perfil vuelve a ser nulo | End-to-End User Journey Simulation | ✅ Aprobado |

---

## 🛡️ Resumen de Blindaje de Seguridad (OWASP 2025 / Zero-Trust)
1. **Aislamiento Estricto de Llaves API (BYOK)**: `getCloudSafeSettings()` garantiza que `apiKey` y `apiTtsKey` jamás se transmitan a Firestore, permaneciendo exclusivamente en el almacenamiento local del navegador del usuario.
2. **Prevención de SSRF y Fuga de Credenciales**: `validateSafeApiUrl()` bloquea esquemas peligrosos (`javascript:`, `file:`, `data:`) y conexiones HTTP externas no cifradas, exigiendo `https://` o loopback local (`127.0.0.1` / `localhost`).
3. **Neutralización de XSS en DOM**: Sanitización con `escapeHtml()` en selectores de idiomas, tarjetas de islas, categorías y previsualizaciones.
4. **Servidor Local y Endpoint Serverless Blindados**: `dev_server.py` escucha por defecto en `127.0.0.1`, deshabilita el listado de directorios, bloquea el acceso a archivos ocultos (`.env`, `.git`, `.py`), valida firmas mágicas ZIP (`PK\x03\x04`), limita el tamaño de carga a 50 MB, aplica lista blanca de voces `edge-tts` e inyecta cabeceras de seguridad HTTP (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`).
