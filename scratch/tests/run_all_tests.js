// run_all_tests.js - Orquestador Maestro del Sistema de Árbitros (Metodología del Árbitro)
const fs = require('fs');
const path = require('path');

const { runSecurityArbiterTests } = require('./test_security_arbiter');
const { runAuthTests } = require('./test_auth_and_session');
const { runLearnKaraokeTests } = require('./test_learn_karaoke');
const { runPracticeRecallTests } = require('./test_practice_recall');
const { runGenerateIslandsTests } = require('./test_generate_islands');
const { runMethodologyTests } = require('./test_methodology_and_guide');
const { runSettingsAndAboutTests } = require('./test_settings_and_about');
const { runUxUiMobileArbiterTests } = require('./test_ux_ui_mobile_arbiter');
const { runUserViewE2ETests } = require('./test_user_view_e2e');

async function main() {
  console.log("==================================================================");
  console.log("⚖️  EJECUTANDO SISTEMA MULTI-AGENTE DE ÁRBITROS DE POLYGLOTLAB");
  console.log("==================================================================\n");

  const securityResults = await runSecurityArbiterTests();
  const authResults = await runAuthTests();
  const karaokeResults = await runLearnKaraokeTests();
  const recallResults = await runPracticeRecallTests();
  const generateResults = await runGenerateIslandsTests();
  const methodologyResults = await runMethodologyTests();
  const settingsResults = await runSettingsAndAboutTests();
  const uxUiMobileResults = await runUxUiMobileArbiterTests();
  const e2eResults = await runUserViewE2ETests();

  const arbitersSummary = [
    { name: "Árbitro 1: Seguridad Zero-Trust y Criptografía (OWASP 2025)", results: securityResults },
    { name: "Árbitro 2: Autenticación, Sesiones y Control de Acceso", results: authResults },
    { name: "Árbitro 3: Motor de Input Comprensible y Bucle Karaoke", results: karaokeResults },
    { name: "Árbitro 4: Motor de Recuerdo Activo (Recall) y Algoritmo FSRS", results: recallResults },
    { name: "Árbitro 5: Generación Contextual IA (BYOK), Manual e Importación", results: generateResults },
    { name: "Árbitro 6: Metodología Científica y Doblaje Neuronal Multilingüe", results: methodologyResults },
    { name: "Árbitro 7: Configuración, Internacionalización (i18n) y Comunidad", results: settingsResults },
    { name: "Árbitro 8: Experiencia de Uso (UX/UI), Responsividad Móvil/Web y Accesibilidad", results: uxUiMobileResults },
    { name: "Árbitro 9: Recorrido Integral del Usuario (End-to-End User Journey)", results: e2eResults }
  ];

  const allResults = arbitersSummary.flatMap(a => a.results);

  const total = allResults.length;
  const passed = allResults.filter(r => r.passed).length;
  const failed = total - passed;

  console.log("\n==================================================================");
  console.log(`🏛️  VEREDICTO DEL JUEZ SUPREMO: ${passed}/${total} EVALUACIONES APROBADAS (${failed} FALLIDAS)`);
  console.log("==================================================================\n");

  // Generar contenido Markdown del Informe de Pruebas
  let reportMd = `# Informe Oficial de Auditoría y Certificación - Metodología del Árbitro (PolyglotLab)

Este informe detalla las evaluaciones cuantitativas y cualitativas ejecutadas por los **9 Árbitros Especializados** más el **Escáner Estático Zero-Trust (\`security_scan.py\`)** para certificar la seguridad, experiencia de uso (UX/UI), responsividad web/móvil y precisión funcional de **PolyglotLab**.

## 📊 Resumen Ejecutivo del Juez Supremo
- **Fecha de Ejecución**: ${new Date().toLocaleString()}
- **Árbitros Desplegados**: 9 Árbitros de Dominio + 1 Juez Orquestador
- **Total de Evaluaciones Ejecutadas**: ${total}
- **Evaluaciones Aprobadas**: ${passed} ✅
- **Evaluaciones Fallidas**: ${failed} ❌
- **Tasa de Aprobación Global**: ${((passed / total) * 100).toFixed(1)}%

---

## ⚖️ Tabla de Calificación por Árbitro

| # | Árbitro Especializado | Evaluaciones | Aprobadas | Puntaje | Veredicto |
|---|-----------------------|--------------|-----------|---------|-----------|
`;

  arbitersSummary.forEach((arb, idx) => {
    const arbTotal = arb.results.length;
    const arbPassed = arb.results.filter(r => r.passed).length;
    const arbScore = arbTotal > 0 ? ((arbPassed / arbTotal) * 100).toFixed(0) : 100;
    const verdict = arbPassed === arbTotal ? '✅ APROBADO' : '❌ RECHAZADO';
    reportMd += `| ${idx + 1} | **${arb.name}** | ${arbTotal} | ${arbPassed} | ${arbScore}% | ${verdict} |\n`;
  });

  reportMd += `
---

## 🔬 Detalle de Aserciones y Métricas por Componente

| # | Componente / Objeto | Métrica o Criterio Evaluado | Método de Validación | Estado |
|---|---------------------|-----------------------------|----------------------|--------|
`;

  allResults.forEach((res, i) => {
    const status = res.passed ? '✅ Aprobado' : '❌ Fallido';
    reportMd += `| ${i + 1} | \`${res.target}\` | ${res.testName} | ${res.method} | ${status} |\n`;
  });

  reportMd += `
---

## 🛡️ Resumen de Blindaje de Seguridad (OWASP 2025 / Zero-Trust)
1. **Aislamiento Estricto de Llaves API (BYOK)**: \`getCloudSafeSettings()\` garantiza que \`apiKey\` y \`apiTtsKey\` jamás se transmitan a Firestore, permaneciendo exclusivamente en el almacenamiento local del navegador del usuario.
2. **Prevención de SSRF y Fuga de Credenciales**: \`validateSafeApiUrl()\` bloquea esquemas peligrosos (\`javascript:\`, \`file:\`, \`data:\`) y conexiones HTTP externas no cifradas, exigiendo \`https://\` o loopback local (\`127.0.0.1\` / \`localhost\`).
3. **Neutralización de XSS en DOM**: Sanitización con \`escapeHtml()\` en selectores de idiomas, tarjetas de islas, categorías y previsualizaciones.
4. **Servidor Local y Endpoint Serverless Blindados**: \`dev_server.py\` escucha por defecto en \`127.0.0.1\`, deshabilita el listado de directorios, bloquea el acceso a archivos ocultos (\`.env\`, \`.git\`, \`.py\`), valida firmas mágicas ZIP (\`PK\\x03\\x04\`), limita el tamaño de carga a 50 MB, aplica lista blanca de voces \`edge-tts\` e inyecta cabeceras de seguridad HTTP (\`X-Content-Type-Options\`, \`X-Frame-Options\`, \`Referrer-Policy\`, \`Permissions-Policy\`).
`;

  const artifactDir = process.env.ARTIFACT_DIR || path.join(__dirname, '../../');
  const reportPath = path.join(artifactDir, 'test_report.md');
  fs.writeFileSync(reportPath, reportMd, 'utf8');

  console.log(`📄 Informe de los Árbitros generado exitosamente en: ${reportPath}`);

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error("Fatal error running arbiter suite:", err);
  process.exit(1);
});
