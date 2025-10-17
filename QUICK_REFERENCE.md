# QuizzApp - Quick Reference Card

## 🚀 Quick Start Commands

### Backend (Terminal 1)
```cmd
cd backend
venv\Scripts\activate
uvicorn app.main:app --reload
```
Backend runs at: http://localhost:8000

### Frontend (Terminal 2)
```cmd
cd frontend
npm run dev
```
Frontend runs at: http://localhost:5173

## 🔑 Default Credentials
- **Email:** admin@macquiz.com
- **Password:** admin123

## 📂 Important Files

### Configuration Files
```
backend/.env          # Backend environment variables
frontend/.env         # Frontend environment variables
backend/requirements.txt    # Python dependencies
frontend/package.json       # Node dependencies
```

### API Service
```
frontend/src/services/api.js    # All API calls
```

### Authentication
```
frontend/src/context/AuthContext.jsx       # Auth state
frontend/src/components/ProtectedRoute.jsx # Route protection
```

## 🔧 Common Tasks

### Reset Database
```cmd
cd backend
del quizapp.db  # or rm quizapp.db on Mac/Linux
# Restart backend - new DB created automatically
```

### Generate Secret Key
```python
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### Install New Backend Package
```cmd
cd backend
venv\Scripts\activate
pip install package-name
pip freeze > requirements.txt
```

### Install New Frontend Package
```cmd
cd frontend
npm install package-name
```

## 📡 API Endpoints

### Auth
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/login-json` - Login (JSON)

### Users
- `GET /api/v1/users/me` - Current user
- `GET /api/v1/users/` - All users (admin)
- `POST /api/v1/users/` - Create user
- `PUT /api/v1/users/{id}` - Update user
- `DELETE /api/v1/users/{id}` - Delete user

### Quizzes
- `GET /api/v1/quizzes/` - All quizzes
- `GET /api/v1/quizzes/{id}` - Quiz by ID
- `POST /api/v1/quizzes/` - Create quiz
- `PUT /api/v1/quizzes/{id}` - Update quiz
- `DELETE /api/v1/quizzes/{id}` - Delete quiz

### Health Check
- `GET /health` - Server health status

## 🎨 Using Toast Notifications

```jsx
import { useToast } from '../context/ToastContext';

function MyComponent() {
  const toast = useToast();
  
  // Show success message
  toast.success('Operation successful!');
  
  // Show error message
  toast.error('Something went wrong!');
  
  // Show warning
  toast.warning('Please be careful!');
  
  // Show info
  toast.info('FYI: Something happened');
}
```

## 🔐 Using Auth Context

```jsx
import { useAuth } from '../context/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, logout } = useAuth();
  
  if (!isAuthenticated) {
    return <div>Please login</div>;
  }
  
  return (
    <div>
      <p>Welcome {user.first_name}!</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

## 🌐 Using API Service

```jsx
import { userAPI, quizAPI, authAPI } from '../services/api';

// Login
const response = await authAPI.login(email, password);

// Get current user
const user = await userAPI.getCurrentUser();

// Get all quizzes
const quizzes = await quizAPI.getAllQuizzes();

// Create user
const newUser = await userAPI.createUser({
  email: 'user@example.com',
  password: 'password',
  first_name: 'John',
  last_name: 'Doe',
  role: 'student'
});
```

## 🐛 Debugging Tips

### Check Backend Logs
Backend terminal shows all API requests and errors

### Check Frontend Console
Open browser DevTools (F12) -> Console tab

### Check Network Requests
DevTools -> Network tab -> See all API calls

### Verify Environment Variables
Backend:
```cmd
cd backend
type .env  # Windows
cat .env   # Mac/Linux
```

Frontend:
```cmd
cd frontend
type .env  # Windows
cat .env   # Mac/Linux
```

## 📊 Database Access

Using SQLite browser or Python:
```python
import sqlite3
conn = sqlite3.connect('quizapp.db')
cursor = conn.cursor()
cursor.execute("SELECT * FROM users")
print(cursor.fetchall())
```

## 🎯 Development Ports

| Service | Port | URL |
|---------|------|-----|
| Frontend Dev | 5173 | http://localhost:5173 |
| Backend API | 8000 | http://localhost:8000 |
| API Docs | 8000 | http://localhost:8000/docs |

## 🔄 Auto-reload

Both servers support hot reload:
- **Backend:** Automatically reloads when Python files change
- **Frontend:** Automatically reloads when JS/JSX files change

## 📝 Environment Variables

### Backend Required
- `DATABASE_URL`
- `SECRET_KEY`
- `CORS_ORIGINS`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

### Frontend Optional
- `VITE_API_URL` (default: http://localhost:8000)
- `VITE_GEMINI_API_KEY` (optional for AI features)

---

**For detailed setup instructions, see `SETUP_GUIDE.md`**
**For all changes made, see `CHANGES_SUMMARY.md`**
