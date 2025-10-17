#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting MacQuiz Backend Server...${NC}"

# Navigate to backend directory
cd "$(dirname "$0")"

# Activate virtual environment
if [ -d "venv" ]; then
    source venv/bin/activate
    echo -e "${GREEN}Virtual environment activated${NC}"
else
    echo -e "${BLUE}Creating virtual environment...${NC}"
    python3 -m venv venv
    source venv/bin/activate
    echo -e "${GREEN}Installing dependencies...${NC}"
    pip install -r requirements.txt -q
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${BLUE}Creating .env file...${NC}"
    cat > .env << EOL
# Environment Configuration
DATABASE_URL=sqlite:///./quizapp.db
SECRET_KEY=$(python3 -c 'import secrets; print(secrets.token_urlsafe(32))')
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS Origins (comma-separated)
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Admin Default Credentials
ADMIN_EMAIL=admin@macquiz.com
ADMIN_PASSWORD=admin123
EOL
    echo -e "${GREEN}.env file created${NC}"
fi

# Start the server
echo -e "${GREEN}Starting server on http://localhost:8000${NC}"
echo -e "${GREEN}API Documentation available at http://localhost:8000/docs${NC}"
echo -e "${BLUE}Press Ctrl+C to stop the server${NC}"
echo ""

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
