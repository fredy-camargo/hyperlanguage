# after_agent.py - Session termination hook
import os
import json
import sys
from datetime import datetime

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding='utf-8')

STATE_PATH = os.path.join(os.path.dirname(__file__), "..", "memory", "state.json")

def load_state():
    if not os.path.exists(STATE_PATH):
        print(f"ERROR: state.json not found at {STATE_PATH}.", file=sys.stderr)
        sys.exit(1)
    with open(STATE_PATH, 'r', encoding='utf-8-sig') as f:
        return json.load(f)

def optimize_state_post_session(state):
    # Update timestamp
    if "learning_metrics" in state:
        state["learning_metrics"]["last_active"] = datetime.now().isoformat()
        
    # Cap history length to avoid state bloat (e.g. max 100 historical records)
    if "spaced_repetition" in state and "history" in state["spaced_repetition"]:
        history = state["spaced_repetition"]["history"]
        if len(history) > 100:
            state["spaced_repetition"]["history"] = history[-100:]
            
    return state

def save_state(state):
    os.makedirs(os.path.dirname(STATE_PATH), exist_ok=True)
    with open(STATE_PATH, 'w', encoding='utf-8') as f:
        json.dump(state, f, indent=2, ensure_ascii=False)

def main():
    print("Executing after_agent hook...")
    state = load_state()
    optimized_state = optimize_state_post_session(state)
    save_state(optimized_state)
    print("after_agent hook: State finalized and saved.")

if __name__ == "__main__":
    main()
