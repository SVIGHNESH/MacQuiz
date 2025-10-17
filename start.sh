#!/bin/bash
# ===========================
# MacQuiz Startup Script (Linux/macOS)
# ===========================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "========================================"
echo "Starting MacQuiz Application"
echo "========================================"
echo ""

# Function to print colored messages
print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    print_error "Python 3 is not installed"
    echo "Please install Python 3.8+ from https://www.python.org/"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

print_success "Python and Node.js are installed"
echo ""

# ===========================
# BACKEND SETUP
# ===========================

echo "========================================"
echo "Setting up Backend..."
echo "========================================"

cd backend

# Check if virtual environment exists
if [ ! -d ".venv" ]; then
    print_info "Creating Python virtual environment..."
    python3 -m venv .venv
    if [ $? -ne 0 ]; then
        print_error "Failed to create virtual environment"
        exit 1
    fi
    print_success "Virtual environment created"
fi

# Activate virtual environment and install dependencies
print_info "Activating virtual environment..."
source .venv/bin/activate

print_info "Installing backend dependencies..."
pip install -r requirements.txt --quiet
if [ $? -ne 0 ]; then
    print_error "Failed to install backend dependencies"
    exit 1
fi
print_success "Backend dependencies installed"

cd ..

# ===========================
# FRONTEND SETUP
# ===========================

echo ""
echo "========================================"
echo "Setting up Frontend..."
echo "========================================"

cd frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    print_info "Installing frontend dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        print_error "Failed to install frontend dependencies"
        cd ..
        exit 1
    fi
    print_success "Frontend dependencies installed"
else
    print_success "Frontend dependencies already installed"
fi

cd ..

# ===========================
# START SERVERS
# ===========================

echo ""
echo "========================================"
echo "Starting Servers..."
echo "========================================"
echo ""
print_info "Backend API: http://localhost:8000"
print_info "Frontend UI: http://localhost:5174"
print_info "API Docs: http://localhost:8000/docs"
echo ""
print_warning "Press Ctrl+C to stop both servers"
echo "========================================"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    print_info "Shutting down servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    wait $BACKEND_PID 2>/dev/null
    wait $FRONTEND_PID 2>/dev/null
    print_success "Servers stopped"
    exit 0
}

# Trap Ctrl+C
trap cleanup SIGINT SIGTERM

# Start backend in background
print_info "Starting Backend Server..."
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000 > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 3

# Start frontend in background
print_info "Starting Frontend Server..."
cd frontend
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait a moment for servers to start
sleep 2

# Check if processes are running
if ps -p $BACKEND_PID > /dev/null; then
    print_success "Backend server started (PID: $BACKEND_PID)"
else
    print_error "Backend server failed to start. Check backend.log for details."
fi

if ps -p $FRONTEND_PID > /dev/null; then
    print_success "Frontend server started (PID: $FRONTEND_PID)"
else
    print_error "Frontend server failed to start. Check frontend.log for details."
fi

echo ""
echo "========================================"
print_success "MacQuiz is running!"
echo "========================================"
echo ""
echo "Open your browser to: http://localhost:5174"
echo ""
echo "Logs are being written to:"
echo "  - backend.log (Backend server output)"
echo "  - frontend.log (Frontend server output)"
echo ""
print_warning "Press Ctrl+C to stop both servers"
echo ""

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
