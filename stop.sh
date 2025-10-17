#!/bin/bash
# ===========================
# MacQuiz Stop Script (Linux/macOS)
# ===========================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

echo "========================================"
echo "Stopping MacQuiz Application"
echo "========================================"
echo ""

# Stop backend (uvicorn processes)
print_info "Stopping Backend Server..."
pkill -f "uvicorn app.main:app" 2>/dev/null
if [ $? -eq 0 ]; then
    print_success "Backend server stopped"
else
    print_info "No backend server running"
fi

# Stop frontend (npm/vite processes)
print_info "Stopping Frontend Server..."
pkill -f "vite" 2>/dev/null
if [ $? -eq 0 ]; then
    print_success "Frontend server stopped"
else
    print_info "No frontend server running"
fi

# Also kill any node processes related to vite
pkill -f "node.*vite" 2>/dev/null

echo ""
echo "========================================"
print_success "MacQuiz has been stopped"
echo "========================================"
echo ""
