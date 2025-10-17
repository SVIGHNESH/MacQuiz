# 🚀 MacQuiz Startup Scripts

Quick start scripts to launch both backend and frontend servers with a single command.

## 📦 Prerequisites

Before running the startup scripts, make sure you have:

- **Python 3.8+** installed ([Download](https://www.python.org/))
- **Node.js 16+** installed ([Download](https://nodejs.org/))
- **Git** (optional, for cloning the repository)

## 🪟 Windows

### Start MacQuiz
Double-click `start.bat` or run in Command Prompt:
```cmd
start.bat
```

This will:
1. ✅ Check if Python and Node.js are installed
2. ✅ Create virtual environment for Python (if not exists)
3. ✅ Install backend dependencies (if needed)
4. ✅ Install frontend dependencies (if needed)
5. ✅ Open two terminal windows:
   - **Backend**: Python/FastAPI server on `http://localhost:8000`
   - **Frontend**: React/Vite server on `http://localhost:5174`

### Stop MacQuiz
Double-click `stop.bat` or run in Command Prompt:
```cmd
stop.bat
```

This will stop both backend and frontend servers.

## 🐧 Linux / macOS

### First Time Setup
Make the scripts executable:
```bash
chmod +x start.sh stop.sh
```

### Start MacQuiz
```bash
./start.sh
```

This will:
1. ✅ Check if Python and Node.js are installed
2. ✅ Create virtual environment for Python (if not exists)
3. ✅ Install backend dependencies (if needed)
4. ✅ Install frontend dependencies (if needed)
5. ✅ Start both servers in background
6. ✅ Create log files: `backend.log` and `frontend.log`

**Press `Ctrl+C` to stop both servers**

### Stop MacQuiz
```bash
./stop.sh
```

This will stop both backend and frontend servers.

## 🌐 Access the Application

After starting the servers:

- **Frontend (User Interface)**: [http://localhost:5174](http://localhost:5174)
- **Backend API**: [http://localhost:8000](http://localhost:8000)
- **API Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)

## 👤 Default Login Credentials

- **Email**: `admin@macquiz.com`
- **Password**: `admin123`

## 📁 Project Structure

```
MacQuiz/
├── start.bat          # Windows startup script
├── start.sh           # Linux/macOS startup script
├── stop.bat           # Windows stop script
├── stop.sh            # Linux/macOS stop script
├── backend/           # FastAPI backend
│   ├── app/
│   ├── requirements.txt
│   └── .venv/        # Created by script
├── frontend/          # React frontend
│   ├── src/
│   ├── package.json
│   └── node_modules/ # Created by script
└── README.md
```

## 🔧 Manual Start (Alternative)

If you prefer to start servers manually:

### Backend
```bash
# Windows
cd backend
.venv\Scripts\activate
uvicorn app.main:app --reload --port 8000

# Linux/macOS
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm run dev
```

## 📝 Logs (Linux/macOS)

When using `start.sh`, logs are written to:
- `backend.log` - Backend server output
- `frontend.log` - Frontend server output

View logs in real-time:
```bash
# Backend logs
tail -f backend.log

# Frontend logs
tail -f frontend.log
```

## ❗ Troubleshooting

### Port Already in Use

If you get a "port already in use" error:

**Windows:**
```cmd
# Find process using port 8000 (backend)
netstat -ano | findstr :8000

# Find process using port 5174 (frontend)
netstat -ano | findstr :5174

# Kill process by PID
taskkill /PID <PID> /F
```

**Linux/macOS:**
```bash
# Find and kill process using port 8000
lsof -ti:8000 | xargs kill -9

# Find and kill process using port 5174
lsof -ti:5174 | xargs kill -9
```

### Python/Node Not Found

Make sure Python and Node.js are installed and added to your system PATH.

**Check versions:**
```bash
python --version    # or python3 --version
node --version
npm --version
```

### Dependencies Not Installing

**Backend:**
```bash
cd backend
pip install -r requirements.txt
```

**Frontend:**
```bash
cd frontend
npm install
```

### Virtual Environment Issues (Windows)

If you get an execution policy error:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## 🎯 Features

- ✅ Automatic dependency installation
- ✅ Virtual environment management
- ✅ Error checking and validation
- ✅ Colored output (Linux/macOS)
- ✅ Graceful shutdown (Ctrl+C)
- ✅ Log file generation (Linux/macOS)
- ✅ Cross-platform support

## 📞 Support

If you encounter any issues:

1. Check the logs (backend.log, frontend.log on Linux/macOS)
2. Ensure Python 3.8+ and Node.js 16+ are installed
3. Make sure ports 8000 and 5174 are not in use
4. Try manual start to see detailed error messages

## 📄 License

This project is part of the MacQuiz application.

---

**Happy Quizzing! 🎓**
