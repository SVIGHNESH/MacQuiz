@echo off
echo ================================
echo   Starting MacQuiz Frontend
echo ================================
cd /d "%~dp0"
if not exist ".env" (
    echo Creating .env file from template...
    copy .env.example .env
)
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
)
echo Starting Vite dev server...
echo Frontend will be available at: http://localhost:5173
echo.
call npm run dev
