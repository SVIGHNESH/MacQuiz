# Start MacQuiz Backend Server
# This script starts the backend server accessible on all network interfaces

Write-Host "========================================" -ForegroundColor Blue
Write-Host "  MacQuiz Backend Server" -ForegroundColor Blue
Write-Host "========================================" -ForegroundColor Blue
Write-Host ""

# Change to backend directory
Set-Location $PSScriptRoot

Write-Host "Starting backend server on 0.0.0.0:8000..." -ForegroundColor Green
Write-Host "Backend will be accessible on:" -ForegroundColor Yellow
Write-Host "  - http://localhost:8000" -ForegroundColor Yellow
Write-Host "  - http://172.16.8.154:8000" -ForegroundColor Yellow
Write-Host "  - API Docs: http://localhost:8000/docs" -ForegroundColor Yellow
Write-Host ""

# Start uvicorn with all network interfaces (without reload to prevent shutdowns)
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
