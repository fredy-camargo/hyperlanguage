# mnemonic_agent.py - Mnemonic Association Agent (Mikel Method)
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

def generate_mnemonics(state):
    print("Mnemonic Agent: Analyzing high-frequency verbs and technical vocabulary...")
    
    # We create high-impact mnemonic stories for our target verbs
    mnemonics_bank = [
        {
            "word": "forecast",
            "mnemonic": "Imagina un gato con un telescopio gigante parado sobre un gran bloque de hielo (cast/castillo) tratando de 'pronosticar' si va a llover monedas de oro.",
            "association_image": "Cat on an icy castle predicting gold coin rain"
        },
        {
            "word": "reconcile",
            "mnemonic": "Visualiza dos columnas de números furiosos peleándose a puñetazos en un cuadrilátero, hasta que llega un árbitro vestido de monje budista y los abraza para 'conciliarlos'.",
            "association_image": "Buddhist monk referee hugging angry numbers in a boxing ring"
        },
        {
            "word": "impute",
            "mnemonic": "Imagínate a un programador acusando con el dedo a un duendecillo verde y travieso que tiene una etiqueta que dice 'costo indirecto', imputándole a él toda la culpa de los desfases de IFRS 17.",
            "association_image": "Programmer pointing at a little green elf labeled indirect cost"
        },
        {
            "word": "parse",
            "mnemonic": "Imagina un enorme robot de cocina triturando y analizando sintácticamente una montaña de rollos de contabilidad antiguos para convertirlos en una sopa de gráficos limpios y ordenados.",
            "association_image": "Food processor robot slicing balance sheets into clean charts"
        },
        {
            "word": "audit",
            "mnemonic": "Un sabueso gigante con lentes de lectura y una lupa dorada, revisando obsesivamente las huellas de un ratón de oficina que intentó desviar centavos de la cuenta de resultados.",
            "association_image": "Giant bloodhound with reading glasses investigating tiny tracks on spreadsheets"
        }
    ]
    
    current_mnemonics = state.get("mnemonic_associations", [])
    if not current_mnemonics:
        state["mnemonic_associations"] = mnemonics_bank
        print(f"Mnemonic Agent: Scaffolded {len(mnemonics_bank)} mnemonic cards.")
    else:
        print(f"Mnemonic Agent: {len(current_mnemonics)} mnemonics already cached.")
        
    return state

def main():
    print("--- STARTING MNEMONIC AGENT ---")
    state = load_state()
    state = generate_mnemonics(state)
    save_state(state)
    print("--- MNEMONIC AGENT COMPLETE ---")

if __name__ == "__main__":
    main()
