# before_agent.py - Session initiation hook
import os
import json
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding='utf-8')

STATE_PATH = os.path.join(os.path.dirname(__file__), "..", "memory", "state.json")

def load_state():
    if not os.path.exists(STATE_PATH):
        print(f"ERROR: state.json not found at {STATE_PATH}. Run initialization first.", file=sys.stderr)
        sys.exit(1)
        
    try:
        with open(STATE_PATH, 'r', encoding='utf-8-sig') as f:
            state = json.load(f)
        return state
    except json.JSONDecodeError as e:
        print(f"ERROR: state.json is corrupted: {e}", file=sys.stderr)
        sys.exit(1)

def optimize_state_pre_session(state):
    # Optimize queues, clean expired or duplicate entries, etc.
    # Keep spaced repetition queue clean
    if "spaced_repetition" in state:
        queue = state["spaced_repetition"].get("queue", [])
        seen = set()
        deduped_queue = []
        for item in queue:
            key = item.get("target") or item.get("verb")
            if key and key not in seen:
                seen.add(key)
                deduped_queue.append(item)
        state["spaced_repetition"]["queue"] = deduped_queue
    
    return state

def save_state(state):
    os.makedirs(os.path.dirname(STATE_PATH), exist_ok=True)
    with open(STATE_PATH, 'w', encoding='utf-8') as f:
        json.dump(state, f, indent=2, ensure_ascii=False)

def main():
    print("Executing before_agent hook...")
    state = load_state()
    optimized_state = optimize_state_pre_session(state)
    save_state(optimized_state)
    print("before_agent hook: State validated and optimized.")

if __name__ == "__main__":
    main()
