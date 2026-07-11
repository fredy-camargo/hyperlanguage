# island_agent.py - Language Island Agent (Mikel Method)
import os
import json
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding='utf-8')

STATE_PATH = os.path.join(os.path.dirname(__file__), "..", "memory", "state.json")

def load_state():
    if not os.path.exists(STATE_PATH):
        print(f"ERROR: state.json not found at {STATE_PATH}.", file=sys.stderr)
        sys.exit(1)
    with open(STATE_PATH, 'r', encoding='utf-8-sig') as f:
        return json.load(f)

def save_state(state):
    with open(STATE_PATH, 'w', encoding='utf-8') as f:
        json.dump(state, f, indent=2, ensure_ascii=False)

def generate_language_islands(state):
    print("Island Agent: Generating/optimizing language islands for the student...")
    
    # Core domain of student
    domain = state.get("student_profile", {}).get("domain", "General Finance")
    
    # Pre-populate sample premium sentences tailored for Corporate Finance, IFRS 17, and Data Analytics
    sample_sentences = [
        {
            "id": "li_001",
            "l1": "Los ajustes de transición bajo IFRS 17 afectarán las ganancias acumuladas iniciales.",
            "l2": "Transition adjustments under IFRS 17 will impact the opening retained earnings.",
            "domain": "IFRS 17",
            "review_count": 0,
            "mastery": 0.0
        },
        {
            "id": "li_002",
            "l1": "Necesitamos conciliar el libro mayor con el sistema de flujo de caja antes de la auditoría.",
            "l2": "We need to reconcile the general ledger with the cash flow system prior to the audit.",
            "domain": "Corporate Finance",
            "review_count": 0,
            "mastery": 0.0
        },
        {
            "id": "li_003",
            "l1": "El script de Python procesa los datos financieros utilizando concurrencia para optimizar el rendimiento.",
            "l2": "The Python script parses the financial data using concurrency to optimize performance.",
            "domain": "Data Analytics",
            "review_count": 0,
            "mastery": 0.0
        },
        {
            "id": "li_004",
            "l1": "Debemos imputar los gastos indirectos a los grupos de contratos de seguros correspondientes.",
            "l2": "We must impute indirect expenses to the corresponding groups of insurance contracts.",
            "domain": "IFRS 17",
            "review_count": 0,
            "mastery": 0.0
        },
        {
            "id": "li_005",
            "l1": "Pronosticar los flujos de efectivo netos requiere un modelo robusto de análisis de varianza.",
            "l2": "Forecasting net cash flows requires a robust variance analysis model.",
            "domain": "Corporate Finance",
            "review_count": 0,
            "mastery": 0.0
        }
    ]
    
    # Update or add if empty
    current_islands = state.get("language_islands", [])
    if not current_islands:
        state["language_islands"] = sample_sentences
        print(f"Island Agent: Seeded {len(sample_sentences)} technical sentences into the state.")
    else:
        print(f"Island Agent: {len(current_islands)} sentences already exist. Checking for updates.")
        
    return state

def main():
    print("--- STARTING ISLAND AGENT ---")
    state = load_state()
    state = generate_language_islands(state)
    save_state(state)
    print("--- ISLAND AGENT COMPLETE ---")

if __name__ == "__main__":
    main()
