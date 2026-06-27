# init.ps1 - Scaffold a clean schema state for the Hyperpolyglot Harness

$MemoryDir = ".harness/memory"
$StateFile = "$MemoryDir/state.json"

# Create directories
New-Item -ItemType Directory -Force -Path $MemoryDir | Out-Null
New-Item -ItemType Directory -Force -Path ".harness/hooks" | Out-Null
New-Item -ItemType Directory -Force -Path ".harness/agents" | Out-Null

if (-not (Test-Path $StateFile)) {
    Write-Host "Creating new state.json schema..."
    $InitialState = @{
        student_profile = @{
            name = "Professional"
            target_language = "English"
            native_language = "Spanish"
            domain = "Corporate Finance / IFRS 17 Accounting / Advanced Data Analytics"
        }
        learning_metrics = @{
            sessions_completed = 0
            accuracy_rate = 0.0
            last_active = $null
        }
        language_islands = @()
        mnemonic_associations = @()
        high_frequency_verbs = @(
            @{ verb = "forecast"; meaning = "pronosticar"; mastery = 0.0 }
            @{ verb = "reconcile"; meaning = "conciliar"; mastery = 0.0 }
            @{ verb = "impute"; meaning = "imputar / atribuir"; mastery = 0.0 }
            @{ verb = "parse"; meaning = "analizar sintácticamente / procesar"; mastery = 0.0 }
            @{ verb = "audit"; meaning = "auditar"; mastery = 0.0 }
        )
        spaced_repetition = @{
            queue = @()
            history = @()
        }
        agent_states = @{
            orchestrator = @{}
            island_agent = @{}
            mnemonic_agent = @{}
            recall_agent = @{}
            feedback_agent = @{}
            git_agent = @{}
        }
    }
    
    # Depth 10 is necessary to serialize nested objects/arrays correctly
    $InitialState | ConvertTo-Json -Depth 10 | Out-File -FilePath $StateFile -Encoding utf8
    Write-Host "State scaffolded successfully at $StateFile"
} else {
    Write-Host "state.json already exists. Skipping scaffolding."
}

# Virtual Environment check and requirements installation
if (Test-Path ".venv") {
    Write-Host "`n[VENV] Entorno virtual detectado."
    Write-Host "[VENV] Para activarlo, ejecuta: .venv\Scripts\Activate.ps1"
    
    if (Test-Path "requirements.txt") {
        Write-Host "[VENV] Instalando dependencias de requirements.txt..."
        & .venv\Scripts\python.exe -m pip install --upgrade pip
        & .venv\Scripts\python.exe -m pip install -r requirements.txt
    }
}
