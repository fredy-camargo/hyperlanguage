# feedback_agent.py - Autofeedback and Metrics Agent
import os
import json
import sys
import difflib

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

def analyze_feedback(state):
    print("Feedback Agent: Analyzing session attempt...")
    
    recall_state = state.get("agent_states", {}).get("recall_agent", {})
    last_attempt = recall_state.get("last_attempt")
    
    if not last_attempt:
        print("Feedback Agent: No recent user attempt found to evaluate.")
        return state
        
    ground_truth = last_attempt["ground_truth_l2"].strip()
    user_attempt = last_attempt["user_attempt_l2"].strip()
    sentence_id = last_attempt["sentence_id"]
    
    # Simple similarity calculation
    similarity = difflib.SequenceMatcher(None, ground_truth.lower(), user_attempt.lower()).ratio()
    is_correct = similarity >= 0.95
    
    print("\n--- FEEDBACK REPORT ---")
    print(f"Oración Original: {last_attempt['prompt_l1']}")
    print(f"Esperado (Ground Truth): '{ground_truth}'")
    print(f"Ingresado:               '{user_attempt}'")
    print(f"Precisión de Similitud:  {similarity:.2%}")
    
    if is_correct:
        print("✅ ¡EXCELENTE! Traducción precisa.")
        score = 1.0
    else:
        print("❌ DETECTADO ERROR O VARIACIÓN:")
        # Highlight differences
        diff = list(difflib.ndiff(user_attempt.split(), ground_truth.split()))
        print("Diferencias encontradas ([-]=tu entrada, [+]=correcto):")
        print(" ".join(diff))
        score = similarity
        
    # Update metrics in state
    metrics = state.get("learning_metrics", {})
    sessions = metrics.get("sessions_completed", 0) + 1
    prev_accuracy = metrics.get("accuracy_rate", 0.0)
    # Moving average of accuracy
    new_accuracy = (prev_accuracy * (sessions - 1) + score) / sessions
    
    state["learning_metrics"]["sessions_completed"] = sessions
    state["learning_metrics"]["accuracy_rate"] = round(new_accuracy, 4)
    
    # Update mastery for that specific sentence in language islands
    for li in state.get("language_islands", []):
        if li["id"] == sentence_id:
            li["review_count"] = li.get("review_count", 0) + 1
            # Adjust mastery
            current_mastery = li.get("mastery", 0.0)
            if is_correct:
                li["mastery"] = min(1.0, current_mastery + 0.25)
            else:
                li["mastery"] = max(0.0, current_mastery - 0.15)
            print(f"Nueva maestría de la oración '{sentence_id}': {li['mastery']:.2f}")
            break
            
    # Clean up the processed attempt
    state["agent_states"]["recall_agent"]["last_attempt"] = None
    
    return state

def main():
    print("--- STARTING FEEDBACK AGENT ---")
    state = load_state()
    state = analyze_feedback(state)
    save_state(state)
    print("--- FEEDBACK REPORT COMPLETE ---")

if __name__ == "__main__":
    main()
