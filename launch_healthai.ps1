# HealthAI Universal Launcher
$ProjectRoot = $PSScriptRoot;
if (!$ProjectRoot) { $ProjectRoot = Get-Location; }

Clear-Host
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "HEALTHAI PLATFORM -- COMPLETE CMD" -ForegroundColor White
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# 1. Identify Components
$BackendPath = Join-Path $ProjectRoot "backend"
$FrontendPath = Join-Path $ProjectRoot "frontend"

# 2. Check for Venv
if (!(Test-Path "$BackendPath\venv")) {
    Write-Host "ERROR: Virtual environment not found!" -ForegroundColor Red
    Write-Host "Please run: python -m venv backend/venv" -ForegroundColor Yellow
    Write-Host "Then run: .\backend\venv\Scripts\pip install -r backend/requirements.txt" -ForegroundColor Yellow
}

# 3. Check for Vite Binary
if (!(Test-Path "$FrontendPath\node_modules\.bin\vite.cmd")) {
    Write-Host "STATUS: Vite not found! Installing frontend dependencies..." -ForegroundColor Green
    Start-Process cmd.exe -ArgumentList ("/c cd `"$FrontendPath`" && npm install") -Wait -WindowStyle Normal
}

# 4. Kill existing sessions to prevent port conflicts
Write-Host "STATUS: Purging active sessions..." -ForegroundColor Gray
Get-Process python -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*$ProjectRoot*" } | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process node -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*$ProjectRoot*" } | Stop-Process -Force -ErrorAction SilentlyContinue

# 5. Start Backend
Write-Host "STATUS: Initializing Neural Backend (Port 8000)..." -ForegroundColor Green
$BackendArgs = @("-NoExit", "cd `"$BackendPath`"; .\venv\Scripts\python.exe run.py")
Start-Process powershell -ArgumentList $BackendArgs -WindowStyle Normal

# 6. Start Frontend
Write-Host "STATUS: Launching Clinical Nexus Dashboard (Port 5173)..." -ForegroundColor Green
$FrontendArgs = @("-NoExit", "cd `"$FrontendPath`"; npm.cmd run dev")
Start-Process powershell -ArgumentList $FrontendArgs -WindowStyle Normal

Write-Host ""
Write-Host "SUCCESS: SYSTEM SYNCED & LIVE" -ForegroundColor White -BackgroundColor DarkBlue
Write-Host "DASHBOARD: http://localhost:5173" -ForegroundColor Cyan
Write-Host "API DOCS:  http://localhost:8000/api/docs" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
