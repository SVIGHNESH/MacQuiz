@echo off
echo ================================
echo   Starting MacQuiz Backend
echo ================================
cd /d "%~dp0"
if not exist ".env" (
    echo Creating .env file from template...
    copy .env.example .env
)
echo Activating virtual environment...
call C:\Users\DELL\QuizzApp-RBMI\.venv\Scripts\activate.bat
echo Starting Uvicorn server...
echo Backend will be available at: http://localhost:8000
echo API Docs at: http://localhost:8000/docs
echo.
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
