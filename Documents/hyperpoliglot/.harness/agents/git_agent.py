# git_agent.py - Git and GitHub Version Control Agent
import os
import json
import sys
import subprocess
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

def save_state(state):
    with open(STATE_PATH, 'w', encoding='utf-8') as f:
        json.dump(state, f, indent=2, ensure_ascii=False)

def check_ssh_connection():
    print("Git Agent: Verificando conexión SSH segura con GitHub...")
    try:
        # En Windows, ssh -T git@github.com retorna exit code 1 en caso de éxito (pero sin terminal).
        # Usamos BatchMode=yes para evitar que pida interactividad si la clave no está configurada.
        result = subprocess.run(
            ["ssh", "-o", "BatchMode=yes", "-o", "ConnectTimeout=5", "-T", "git@github.com"],
            capture_output=True,
            text=True
        )
        output = result.stdout + result.stderr
        if "successfully authenticated" in output:
            print("Git Agent: Conexión SSH con GitHub validada exitosamente.")
            return True, "Authenticated successfully"
        else:
            print(f"Git Agent: Conexión SSH fallida. Salida: {output.strip()}")
            return False, f"Authentication failed: {output.strip()}"
    except Exception as e:
        print(f"Git Agent: Error al intentar conectar por SSH: {e}", file=sys.stderr)
        return False, str(e)

def run_git_operations(state):
    print("Git Agent: Iniciando administración de control de versiones...")
    
    # 1. Verificar si estamos en un repositorio Git
    try:
        res = subprocess.run(["git", "rev-parse", "--is-inside-work-tree"], capture_output=True, text=True)
        if res.returncode != 0:
            print("Git Agent: No se detectó un repositorio Git. Inicializando uno nuevo...")
            subprocess.run(["git", "init"], check=True)
    except Exception as e:
        print(f"Git Agent: Error al verificar repositorio Git: {e}", file=sys.stderr)
        state["agent_states"]["git_agent"] = {
            "status": "error",
            "error": f"Git checking failed: {e}",
            "timestamp": datetime.now().isoformat()
        }
        return state

    # Configuración de variables de entorno de Git para deshabilitar prompts interactivos
    git_env = os.environ.copy()
    git_env["GIT_TERMINAL_PROMPT"] = "0"
    git_env["GIT_SSH_COMMAND"] = "ssh -o BatchMode=yes"

    # 2. Agregar el archivo de estado y la carpeta .harness
    try:
        subprocess.run(["git", "add", STATE_PATH], check=True, env=git_env)
        subprocess.run(["git", "add", os.path.dirname(os.path.dirname(STATE_PATH))], check=True, env=git_env)
    except subprocess.CalledProcessError as e:
        print(f"Git Agent: Error al agregar archivos a Git: {e}", file=sys.stderr)
        state["agent_states"]["git_agent"] = {
            "status": "error",
            "error": f"Git add failed: {e}",
            "timestamp": datetime.now().isoformat()
        }
        return state

    # 3. Comprobar si hay cambios listos para commit
    try:
        status_res = subprocess.run(["git", "status", "--porcelain"], capture_output=True, text=True, check=True, env=git_env)
        if not status_res.stdout.strip():
            print("Git Agent: No hay cambios pendientes para confirmar en el control de versiones.")
            state["agent_states"]["git_agent"] = {
                "status": "clean",
                "message": "No changes to commit",
                "timestamp": datetime.now().isoformat()
            }
            return state
    except subprocess.CalledProcessError as e:
        print(f"Git Agent: Error al revisar estado de Git: {e}", file=sys.stderr)
        return state

    # 4. Hacer commit de los cambios
    commit_msg = f"Auto-commit: update state.json - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
    try:
        subprocess.run(["git", "commit", "-m", commit_msg], check=True, env=git_env)
        print(f"Git Agent: Commit creado localmente: '{commit_msg}'")
    except subprocess.CalledProcessError as e:
        print(f"Git Agent: Error al realizar commit: {e}", file=sys.stderr)
        state["agent_states"]["git_agent"] = {
            "status": "error",
            "error": f"Commit failed: {e}",
            "timestamp": datetime.now().isoformat()
        }
        return state

    # 5. Intentar hacer push si hay un remoto y es SSH
    has_remote = False
    remote_url = ""
    try:
        remote_res = subprocess.run(["git", "remote", "get-url", "origin"], capture_output=True, text=True, env=git_env)
        if remote_res.returncode == 0:
            remote_url = remote_res.stdout.strip()
            has_remote = True
    except Exception:
        pass

    push_status = "skipped"
    push_msg = "No remote 'origin' configured"

    if has_remote:
        # Verificar conexión SSH con GitHub
        ssh_ok, ssh_msg = check_ssh_connection()
        if ssh_ok:
            try:
                # Obtener el nombre de la rama actual
                branch_res = subprocess.run(["git", "branch", "--show-current"], capture_output=True, text=True, check=True, env=git_env)
                current_branch = branch_res.stdout.strip() or "main"
                
                print(f"Git Agent: Realizando push a 'origin {current_branch}' usando SSH de forma segura...")
                subprocess.run(["git", "push", "origin", current_branch], check=True, env=git_env)
                print("Git Agent: Push realizado correctamente a GitHub.")
                push_status = "success"
                push_msg = f"Pushed successfully to origin/{current_branch}"
            except subprocess.CalledProcessError as e:
                print(f"Git Agent: Error al realizar push a GitHub: {e}", file=sys.stderr)
                push_status = "failed"
                push_msg = f"Push failed: {e}"
        else:
            print("Git Agent: Omitiendo push a GitHub porque la conexión SSH no está autenticada.")
            push_status = "auth_failed"
            push_msg = f"Push skipped due to SSH auth failure: {ssh_msg}"

    # Guardar estado final
    state["agent_states"]["git_agent"] = {
        "status": "success",
        "last_commit": commit_msg,
        "push_status": push_status,
        "push_message": push_msg,
        "timestamp": datetime.now().isoformat()
    }
    
    return state

def main():
    print("\n--- INICIANDO AGENTE DE GIT (CONTROL DE VERSIONES) ---")
    state = load_state()
    state = run_git_operations(state)
    save_state(state)
    print("--- AGENTE DE GIT COMPLETADO ---")

if __name__ == "__main__":
    main()
