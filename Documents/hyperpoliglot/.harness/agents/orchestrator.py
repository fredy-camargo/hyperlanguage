# orchestrator.py - Master Orchestrator (Leader Agent)
import os
import sys
import subprocess

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding='utf-8')

# Resolve relative paths from current orchestrator script location
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HOOKS_DIR = os.path.join(BASE_DIR, "hooks")
AGENTS_DIR = os.path.join(BASE_DIR, "agents")

def run_script(path):
    script_name = os.path.basename(path)
    print(f"\n==========================================")
    print(f"Orchestrator: Executing {script_name}...")
    print(f"==========================================")
    
    env = os.environ.copy()
    # If the user launched orchestrator non-interactively, forward the setting
    if not sys.stdin.isatty():
        env["NON_INTERACTIVE"] = "true"
        
    result = subprocess.run([sys.executable, path], env=env)
    
    if result.returncode != 0:
        print(f"Orchestrator: Script {script_name} failed with exit code {result.returncode}.", file=sys.stderr)
        sys.exit(result.returncode)

def main():
    print("Hyperpolyglot Harness: Initializing Session...")
    
    # 1. Run initiation hook
    run_script(os.path.join(HOOKS_DIR, "before_agent.py"))
    
    # 2. Run Island Agent
    run_script(os.path.join(AGENTS_DIR, "island_agent.py"))
    
    # 3. Run Mnemonic Agent
    run_script(os.path.join(AGENTS_DIR, "mnemonic_agent.py"))
    
    # 4. Run Recall Agent
    run_script(os.path.join(AGENTS_DIR, "recall_agent.py"))
    
    # 5. Run Feedback Agent
    run_script(os.path.join(AGENTS_DIR, "feedback_agent.py"))
    
    # 6. Run Git Agent (Version Control)
    run_script(os.path.join(AGENTS_DIR, "git_agent.py"))
    
    # 7. Run termination hook
    run_script(os.path.join(HOOKS_DIR, "after_agent.py"))
    
    print("\nOrchestrator: Session completed successfully. State preserved.")

if __name__ == "__main__":
    main()
