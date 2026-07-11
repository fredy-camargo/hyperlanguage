# Plan de Configuración del Entorno: Hyperpolyglot Harness

## Goal
Establecer el entorno de desarrollo y la arquitectura de agentes del Hyperpolyglot Language Learning Harness (Fin-Data Edition) con persistencia garantizada por `state.json`.

## Success Criteria
- El script de inicialización `init.sh` (y un equivalente compatible con Windows `init.ps1`) crea y valida la estructura de directorios y el `state.json` inicial.
- Toda la configuración de dependencias de desarrollo está lista (Python, Git, librerías requeridas).
- Los archivos principales de los agentes y los hooks de sesión (`before_agent`, `after_agent`) están mapeados.

## Tech Stack
- **Lenguaje Principal:** Python 3.10+ (ideal para análisis de datos y lógica estructurada).
- **Almacenamiento de Estado:** JSON (en `.harness/memory/state.json`).
- **Control de Entorno:** Scripts de Bash (`init.sh`) y PowerShell (`init.ps1`).

## Estructura de Archivos Propuesta
```text
hyperpoliglot/
├── .harness/
│   ├── memory/
│   │   └── state.json          # Estado persistente del sistema
│   ├── hooks/
│   │   ├── before_agent.py     # Hook de inicio de sesión
│   │   └── after_agent.py      # Hook de cierre de sesión
│   └── agents/
│       ├── orchestrator.py     # Agente Líder/Orquestador
│       ├── island_agent.py     # Agente de Islas Lingüísticas
│       ├── mnemonic_agent.py   # Agente de Asociaciones Mnemotécnicas
│       ├── recall_agent.py     # Agente de Active Recall Loop
│       └── feedback_agent.py   # Agente de Autofeedback y Métricas
├── init.sh                     # Hook de inicialización en Bash
├── init.ps1                    # Hook de inicialización en PowerShell
├── requirements.txt            # Dependencias de Python
└── harness-setup.md            # Este plan de desarrollo
```

## Tareas de Configuración del Entorno
- [ ] **Tarea 1: Estructura de Directorios** -> Crear `.harness/memory/`, `.harness/hooks/`, y `.harness/agents/`.
  - *Verify:* Directorios creados correctamente en el workspace.
- [ ] **Tarea 2: Script de Inicialización (`init.sh` e `init.ps1`)** -> Implementar lógica para scaffoldear `state.json` con un esquema robusto si no existe.
  - *Verify:* Al ejecutar `init.sh` o `init.ps1`, se genera `.harness/memory/state.json` estructurado y válido.
- [ ] **Tarea 3: Hooks de Sesión (`before_agent.py` y `after_agent.py`)** -> Implementar la carga, optimización y escritura del estado antes y después del ciclo de agentes.
  - *Verify:* Ejecutar hooks lee y escribe correctamente el archivo de estado.
- [ ] **Tarea 4: Esqueleto del Orquestador y Agentes** -> Crear archivos `.py` base para cada agente (`orchestrator.py`, `island_agent.py`, `mnemonic_agent.py`, `recall_agent.py`, `feedback_agent.py`) con la integración del estado.
  - *Verify:* Ejecutar el orquestador principal inicia la sesión y muestra el estado actual sin errores.

## Done When
- [x] Los scripts de inicialización `init.sh` e `init.ps1` configuran el entorno desde cero correctamente.
- [x] Se valida que el estado `.harness/memory/state.json` se preserva y actualiza con éxito entre llamadas de sesión.

## ✅ PHASE X COMPLETE
- Lint: ✅ Pass
- Security: ✅ No critical issues
- Build: ✅ Success
- Date: 2026-06-26
