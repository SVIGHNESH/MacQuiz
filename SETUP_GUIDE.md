# MacQuiz Setup Guide

This guide will help you set up and run the QuizzApp-RBMI project on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed:
- **Python 3.8+** (for backend)
- **Node.js 16+** and npm (for frontend)
- **Git** (optional, for version control)

## Project Structure

```
QuizzApp-RBMI/
├── backend/          # FastAPI backend
│   ├── app/          # Application code
│   ├── .env          # Environment variables (create from .env.example)
│   └── requirements.txt
└── frontend/         # React frontend
    ├── src/          # Source code
    ├── .env          # Environment variables (create from .env.example)
    └── package.json
```

## Backend Setup

### 1. Navigate to backend directory
```bash
cd backend
```

### 2. Create and activate virtual environment

**Windows (Command Prompt):**
```cmd
python -m venv venv
venv\Scripts\activate
```

**Windows (PowerShell):**
```powershell
python -m venv venv
venv\Scripts\Activate.ps1
```

**macOS/Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

### 3. Install dependencies
```bash
pip install -r requirements.txt
```

### 4. Set up environment variables

Create a `.env` file in the `backend` directory by copying `.env.example`:

```bash
copy .env.example .env    # Windows
cp .env.example .env      # macOS/Linux
```

Edit the `.env` file and configure the following variables:

```env
# Database Configuration
DATABASE_URL=sqlite:///./quizapp.db

# Security
SECRET_KEY=your-secret-key-here-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS Origins
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

# Admin User Credentials
ADMIN_EMAIL=admin@macquiz.com
ADMIN_PASSWORD=admin123
```

**Important:** Change the `SECRET_KEY` to a secure random string in production. You can generate one using:
```python
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### 5. Run the backend server

```bash
uvicorn app.main:app --reload
```

The backend will start at `http://localhost:8000`

You can access the API documentation at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Frontend Setup

### 1. Navigate to frontend directory

Open a **new terminal** and run:
```bash
cd frontend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file in the `frontend` directory by copying `.env.example`:

```bash
copy .env.example .env    # Windows
cp .env.example .env      # macOS/Linux
```

Edit the `.env` file:

```env
# Backend API URL
VITE_API_URL=http://localhost:8000

# Optional: Gemini API Key for AI-powered insights
# Get your API key from: https://aistudio.google.com/app/apikey
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

**Note:** The Gemini API key is optional. The app will work without it, but AI-powered report insights won't be available.

### 4. Run the frontend development server

```bash
npm run dev
```

The frontend will start at `http://localhost:5173`

## Accessing the Application

1. Open your browser and navigate to `http://localhost:5173`
2. You should see the login page
3. Use the default admin credentials:
   - **Email:** `admin@macquiz.com`
   - **Password:** `admin123`

## Common Issues and Solutions

### Backend Issues

**Issue: `ModuleNotFoundError: No module named 'app'`**
- **Solution:** Make sure you're in the `backend` directory and your virtual environment is activated

**Issue: `sqlalchemy.exc.OperationalError`**
- **Solution:** Check your `DATABASE_URL` in `.env`. For SQLite, ensure the path is correct

**Issue: `fastapi.exceptions.FastAPIError: ... CORS ...`**
- **Solution:** Verify `CORS_ORIGINS` in `.env` includes `http://localhost:5173`

### Frontend Issues

**Issue: `Cannot connect to server`**
- **Solution:** Ensure the backend is running at `http://localhost:8000`
- Check if `VITE_API_URL` in frontend `.env` is correct

**Issue: `401 Unauthorized` after login**
- **Solution:** Check backend logs for errors. Verify admin credentials in backend `.env`

**Issue: `Module not found` errors**
- **Solution:** Delete `node_modules` and `package-lock.json`, then run `npm install` again

### Database Issues

**Issue: Want to reset the database**
- **Solution:** 
  1. Stop the backend server
  2. Delete `quizapp.db` file in the backend directory
  3. Restart the backend (it will create a new database automatically)

## Development Workflow

1. **Start Backend:** Open terminal 1, navigate to `backend`, activate venv, run `uvicorn app.main:app --reload`
2. **Start Frontend:** Open terminal 2, navigate to `frontend`, run `npm run dev`
3. Make changes to your code
4. Both servers will auto-reload on file changes

## Building for Production

### Backend
```bash
cd backend
# Use a production WSGI server like gunicorn
pip install gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker
```

### Frontend
```bash
cd frontend
npm run build
# The build output will be in the 'dist' directory
```

## Environment Variables Reference

### Backend (.env)
| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DATABASE_URL` | Database connection string | `sqlite:///./quizapp.db` | Yes |
| `SECRET_KEY` | JWT secret key | - | Yes |
| `ALGORITHM` | JWT algorithm | `HS256` | Yes |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token expiration time | `30` | Yes |
| `CORS_ORIGINS` | Allowed CORS origins (comma-separated) | - | Yes |
| `ADMIN_EMAIL` | Default admin email | `admin@macquiz.com` | Yes |
| `ADMIN_PASSWORD` | Default admin password | `admin123` | Yes |

### Frontend (.env)
| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `VITE_API_URL` | Backend API URL | `http://localhost:8000` | No |
| `VITE_GEMINI_API_KEY` | Gemini API key for AI features | - | No |

## Additional Resources

- FastAPI Documentation: https://fastapi.tiangolo.com/
- React Documentation: https://react.dev/
- Vite Documentation: https://vitejs.dev/
- SQLAlchemy Documentation: https://docs.sqlalchemy.org/

## Support

If you encounter any issues not covered in this guide, please:
1. Check the console/terminal for error messages
2. Verify all environment variables are set correctly
3. Ensure all dependencies are installed
4. Check that both backend and frontend servers are running

Happy coding! 🚀
