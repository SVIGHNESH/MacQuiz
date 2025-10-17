@echo off
cd /d C:\Users\DELL\QuizzApp-RBMI\frontend
if not exist node_modules (
    echo Installing dependencies...
    call npm install
    call npm install lucide-react
)
echo Starting frontend server...
call npm run dev
pause
