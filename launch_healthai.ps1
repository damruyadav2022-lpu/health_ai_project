Param(
    [switch]$Fast,
    [switch]$Install
)

# HealthAI Turbo Launcher (v2.0)
$ProjectRoot = $PSScriptRoot;
if (!$ProjectRoot) { $ProjectRoot = Get-Location; }

Clear-Host
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "HEALTHAI PLATFORM -- TURBO MODE" -ForegroundColor White
Write-Host "=============================================" -ForegroundColor Cyan

# 1. Faster Process Cleanup
if (!$Fast) {
    Write-Host "STATUS: Purging active sessions..." -ForegroundColor Gray
    Stop-Process -Name python, node -Force -ErrorAction SilentlyContinue
}

# 2. Self-Healing Dependency Logic
$BackendPath = Join-Path $ProjectRoot "backend"
$FrontendPath = Join-Path $ProjectRoot "frontend"

if (!$Fast -or $Install) {
    Write-Host "STATUS: Inspecting environments..." -ForegroundColor Gray
    
    # Auto-create Backend Venv
    if (!(Test-Path "$BackendPath\venv")) {
        Write-Host "STATUS: Virtual environment missing. Creating now..." -ForegroundColor Yellow
        Start-Process python -ArgumentList "-m venv `"$BackendPath\venv`"" -Wait
        Write-Host "STATUS: Installing backend requirements..." -ForegroundColor Yellow
        Start-Process "$BackendPath\venv\Scripts\pip.exe" -ArgumentList "install -r `"$BackendPath\requirements.txt`"" -Wait
    }
    
    # Auto-sync Frontend
    if (!(Test-Path "$FrontendPath\node_modules")) {
        Write-Host "STATUS: node_modules missing. Synchronizing..." -ForegroundColor Yellow
        Start-Process cmd.exe -ArgumentList ("/c cd `"$FrontendPath`" && npm install") -Wait
    }
}


# 3. Parallel Launch
Write-Host "STATUS: Igniting Neural Core & Clinical Nexus..." -ForegroundColor Green

# Start Backend
$BackendArgs = @("-NoExit", "-Command", "cd `"$BackendPath`"; .\venv\Scripts\python.exe run.py")
Start-Process powershell -ArgumentList $BackendArgs -WindowStyle Normal

# Start Frontend
$FrontendArgs = @("-NoExit", "-Command", "cd `"$FrontendPath`"; npm.cmd run dev")
Start-Process powershell -ArgumentList $FrontendArgs -WindowStyle Normal

Write-Host ""
Write-Host "🚀 SYSTEM ONLINE" -ForegroundColor White -BackgroundColor DarkGreen
Write-Host "DASHBOARD: http://localhost:5173" -ForegroundColor Cyan
Write-Host "API DOCS:  http://localhost:8000/api/docs" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

