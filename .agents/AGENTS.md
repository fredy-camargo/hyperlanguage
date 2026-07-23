# Reglas de Proyecto: PolyglotLab

Este archivo define las reglas y restricciones específicas para los agentes que interactúan con el repositorio de PolyglotLab.

## Directrices de Terminología y Conceptos
- **PROHIBIDO utilizar el término "Método Mikel"** bajo ninguna circunstancia. Este término era solo una guía inicial y ha sido reemplazado oficialmente.
- En su lugar, cuando se haga referencia a la base metodológica de la aplicación, referirse a ella como la recopilación de **"las experiencias y mejores prácticas de reconocidos políglotas de YouTube"**.
- Mantener siempre las explicaciones visuales de la aplicación orientadas a los tres pilares: *Input Comprensible* (Bucle Karaoke), *Recuerdo Activo* (Active Recall) y *Repetición Espaciada* (FSRS / Spaced Repetition).
- La terminología para los idiomas debe ser siempre clara e intuitiva para el usuario: **"idioma nativo"** (en lugar de L1) e **"idioma objetivo / el idioma que estás aprendiendo"** (en lugar de L2).

## Regla Obligatoria de Despliegue y Publicación
- **Publicación Obligatoria al Finalizar:** Una vez que todas las tareas y pruebas hayan sido validadas exitosamente, el agente DEBE realizar automáticamente el commit, push a GitHub y la publicación/despliegue en Vercel y Firebase Hosting sin necesidad de que el usuario lo recuerde.

## Directriz de Máxima Autonomía y Rigor de Verificación
- **Autonomía Total End-to-End:** Cuando el usuario asigne una tarea o meta (`/goal`), el agente DEBE ejecutar de forma continua, autónoma e ininterrumpida todas las fases: análisis, desarrollo, auditoría de código, resolución de errores, suite de pruebas automatizadas y despliegue a producción en GitHub/Vercel/Firebase. No solicitar confirmaciones ni pausar a mitad del proceso.
- **Auditoría Exhaustiva de Componentes e Interfaz:** El agente debe auditar cada botón, modal, evento `click`, z-index, manejador de eventos `Escape`/backdrop y estado de UI antes de dar por completada una tarea. Prohibido asumir que un componente funciona sin antes verificar su marcado HTML, IDs únicos y binding de eventos en JS.

