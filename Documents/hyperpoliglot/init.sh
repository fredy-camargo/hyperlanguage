#!/bin/bash
# init.sh - Scaffold a clean schema state for the Hyperpolyglot Harness

MEMORY_DIR=".harness/memory"
STATE_FILE="$MEMORY_DIR/state.json"

mkdir -p "$MEMORY_DIR"
mkdir -p ".harness/hooks"
mkdir -p ".harness/agents"

if [ ! -f "$STATE_FILE" ]; then
  echo "Creating new state.json schema..."
  cat << 'EOF' > "$STATE_FILE"
{
  "student_profile": {
    "name": "Professional",
    "target_language": "English",
    "native_language": "Spanish",
    "domain": "Corporate Finance / IFRS 17 Accounting / Advanced Data Analytics"
  },
  "learning_metrics": {
    "sessions_completed": 0,
    "accuracy_rate": 0.0,
    "last_active": null
  },
  "language_islands": [],
  "mnemonic_associations": [],
  "high_frequency_verbs": [
    {"verb": "forecast", "meaning": "pronosticar", "mastery": 0.0},
    {"verb": "reconcile", "meaning": "conciliar", "mastery": 0.0},
    {"verb": "impute", "meaning": "imputar / atribuir", "mastery": 0.0},
    {"verb": "parse", "meaning": "analizar sintácticamente / procesar", "mastery": 0.0},
    {"verb": "audit", "meaning": "auditar", "mastery": 0.0}
  ],
  "spaced_repetition": {
    "queue": [],
    "history": []
  },
  "agent_states": {
    "orchestrator": {},
    "island_agent": {},
    "mnemonic_agent": {},
    "recall_agent": {},
    "feedback_agent": {}
  }
}
EOF
  echo "State scaffolded successfully at $STATE_FILE"
else
  echo "state.json already exists. Skipping scaffolding."
fi

# Virtual Environment check and requirements installation
if [ -d ".venv" ]; then
  echo ""
  echo "[VENV] Entorno virtual detectado."
  echo "[VENV] Para activarlo, ejecuta: source .venv/bin/activate"
  
  if [ -f "requirements.txt" ]; then
    echo "[VENV] Instalando dependencias de requirements.txt..."
    .venv/bin/python -m pip install --upgrade pip
    .venv/bin/python -m pip install -r requirements.txt
  fi
fi

