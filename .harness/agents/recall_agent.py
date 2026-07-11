# recall_agent.py - Active Recall Translation Loop Agent
import os
import json
import sys
import random

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

def run_recall_session(state):
    print("Recall Agent: Preparing active recall translation loop...")
    
    islands = state.get("language_islands", [])
    if not islands:
        print("Recall Agent: No sentences available. Run Island Agent first.", file=sys.stderr)
        return state
        
    # Choose a random sentence to test
    selected_sentence = random.choice(islands)
    
    print("\n--- RECALL EXERCISE ---")
    print(f"Context/Domain: {selected_sentence['domain']}")
    print(f"Oración en Español (L1): {selected_sentence['l1']}")
    
    # Check if we are running in non-interactive mode (tests, scripts)
    non_interactive = os.environ.get("NON_INTERACTIVE") == "true" or not sys.stdin.isatty()
    
    if non_interactive:
        # Simulate attempt for automated validation
        print("Running in non-interactive mode. Simulating user attempt...")
        # Introduce a minor error on purpose to showcase the feedback loop occasionally
        if random.random() > 0.5:
            user_attempt = selected_sentence['l2']  # Perfect match
        else:
            # Simulated typo/error (reconciliation vs reconciling)
            user_attempt = selected_sentence['l2'].replace("reconcile", "reconcilating").replace("Transition", "Transitional")
    else:
        # Interactive mode
        try:
            user_attempt = input("Traduce al Inglés (L2): ").strip()
        except KeyboardInterrupt:
            print("\nSession aborted by user.")
            sys.exit(0)
            
    print(f"Tu intento: '{user_attempt}'")
    
    # Write session data to state for Feedback Agent to process
    state["agent_states"]["recall_agent"] = {
        "last_attempt": {
            "sentence_id": selected_sentence["id"],
            "prompt_l1": selected_sentence["l1"],
            "ground_truth_l2": selected_sentence["l2"],
            "user_attempt_l2": user_attempt
        }
    }
    
    return state

def main():
    print("--- STARTING RECALL AGENT ---")
    state = load_state()
    state = run_recall_session(state)
    save_state(state)
    print("--- RECALL AGENT COMPLETE ---")

if __name__ == "__main__":
    main()
