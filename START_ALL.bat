@echo off
title MacQuiz - Startup Manager
color 0A
echo.
echo ========================================
echo     MacQuiz Application Launcher
echo ========================================
echo.
echo This will start both Backend and Frontend servers
echo in separate windows.
echo.
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173
echo.
echo Default Login:
echo   Email: admin@macquiz.com
echo   Password: admin123
echo.
echo ========================================
echo.
pause

echo.
echo [1/2] Starting Backend Server...
start "MacQuiz Backend" cmd /k "cd /d %~dp0backend && start.bat"
timeout /t 3 /nobreak > nul

echo [2/2] Starting Frontend Server...
start "MacQuiz Frontend" cmd /k "cd /d %~dp0frontend && start.bat"
timeout /t 3 /nobreak > nul

echo.
echo ========================================
echo   Both servers are starting!
echo ========================================
echo.
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173
echo API Docs: http://localhost:8000/docs
echo.
echo Opening browser in 5 seconds...
timeout /t 5 /nobreak > nul

start http://localhost:5173

echo.
echo ========================================
echo   Application is ready!
echo ========================================
echo.
echo Press any key to exit this window...
echo (The servers will continue running)
pause > nul
