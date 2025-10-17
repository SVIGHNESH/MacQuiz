# MacQuiz Application - Project Structure

## 📁 Complete Directory Structure

```
QuizzApp-RBMI/
│
├── 📄 .gitignore                          # Git ignore rules
├── 📄 PROJECT_SUMMARY.md                  # Project overview and features
├── 📄 QUICKSTART.md                       # Quick setup guide
├── 📄 README.md                           # Main documentation
├── 📄 STUDENT_DASHBOARD_GUIDE.md          # Student dashboard user guide
├── 📄 PROJECT_STRUCTURE.md                # This file - structure overview
│
├── 📂 backend/                            # FastAPI Backend Server
│   ├── 📄 .env                           # Environment variables (SECRET_KEY, DATABASE_URL)
│   ├── 📄 .env.example                   # Example environment file
│   ├── 📄 requirements.txt               # Python dependencies
│   ├── 📄 run.sh                         # Unix startup script
│   ├── 📄 start_backend.bat              # Windows startup script
│   ├── 📄 create_test_student.py         # Script to create test student
│   ├── 📄 create_student_api.bat         # API call to create student
│   ├── 📄 API_EXAMPLES.md                # API endpoint documentation
│   ├── 📄 README.md                      # Backend-specific documentation
│   │
│   ├── 📂 venv/                          # Python virtual environment (ignored in git)
│   │
│   └── 📂 app/                           # Main application package
│       ├── 📄 __init__.py
│       ├── 📄 main.py                    # FastAPI app entry point & CORS config
│       │
│       ├── 📂 api/                       # API Routes
│       │   ├── 📄 __init__.py
│       │   └── 📂 v1/                    # Version 1 API endpoints
│       │       ├── 📄 __init__.py
│       │       ├── 📄 auth.py            # Authentication endpoints (login, token)
│       │       ├── 📄 users.py           # User CRUD operations
│       │       ├── 📄 quizzes.py         # Quiz management endpoints
│       │       └── 📄 attempts.py        # Quiz attempt & submission endpoints
│       │
│       ├── 📂 core/                      # Core functionality
│       │   ├── 📄 __init__.py
│       │   ├── 📄 config.py              # App configuration settings
│       │   ├── 📄 security.py            # Password hashing, JWT token handling
│       │   └── 📄 deps.py                # Dependency injection (get_db, get_current_user)
│       │
│       ├── 📂 db/                        # Database configuration
│       │   ├── 📄 __init__.py
│       │   └── 📄 database.py            # SQLAlchemy setup, session management
│       │
│       ├── 📂 models/                    # Database Models (ORM)
│       │   ├── 📄 __init__.py
│       │   └── 📄 models.py              # User, Quiz, Question, Attempt models
│       │
│       └── 📂 schemas/                   # Pydantic Schemas (validation)
│           ├── 📄 __init__.py
│           └── 📄 schemas.py             # Request/response schemas
│
└── 📂 frontend/                          # React Frontend Application
    ├── 📄 .env                           # Frontend environment variables
    ├── 📄 .env.example                   # Example frontend env file
    ├── 📄 package.json                   # Node dependencies & scripts
    ├── 📄 package-lock.json              # Locked dependency versions
    ├── 📄 vite.config.js                 # Vite build configuration
    ├── 📄 tailwind.config.js             # Tailwind CSS configuration
    ├── 📄 postcss.config.js              # PostCSS configuration
    ├── 📄 eslint.config.js               # ESLint rules
    ├── 📄 index.html                     # Main HTML entry point
    ├── 📄 start_frontend.bat             # Windows startup script
    ├── 📄 start_both_servers.bat         # Start backend + frontend
    │
    ├── 📂 node_modules/                  # Node packages (ignored in git)
    │
    ├── 📂 public/                        # Static assets
    │   └── 📄 vite.svg                   # Vite logo
    │
    └── 📂 src/                           # Source code
        ├── 📄 main.jsx                   # React app entry point
        ├── 📄 App.jsx                    # Root component with routing
        ├── 📄 App.css                    # App-specific styles
        ├── 📄 index.css                  # Global styles & Tailwind imports
        │
        ├── 📂 assets/                    # Images & media
        │   └── 📄 Lbg.svg                # Login background SVG
        │
        ├── 📂 components/                # Reusable components
        │   ├── 📄 footer.jsx             # Footer component
        │   └── 📄 ProtectedRoute.jsx     # Route guards for auth
        │
        ├── 📂 context/                   # React Context (Global State)
        │   ├── 📄 AuthContext.jsx        # Authentication state management
        │   └── 📄 ToastContext.jsx       # Toast notification system
        │
        ├── 📂 pages/                     # Page components
        │   ├── 📄 login.jsx              # Login page with role-based redirect
        │   ├── 📄 dashBoard.jsx          # Admin/Teacher dashboard
        │   └── 📄 studentDashboard.jsx   # Student-specific dashboard
        │
        └── 📂 services/                  # API integration
            └── 📄 api.js                 # Centralized API service layer
```

---

## 🎯 Component Responsibility Matrix

### Backend Components

| File | Purpose | Key Functions |
|------|---------|---------------|
| `main.py` | App initialization | FastAPI app, CORS, route inclusion |
| `auth.py` | Authentication | Login, token generation |
| `users.py` | User management | CRUD operations for users |
| `quizzes.py` | Quiz management | Create, read, update, delete quizzes |
| `attempts.py` | Quiz attempts | Start quiz, submit answers, calculate scores |
| `security.py` | Security functions | Password hashing, JWT tokens |
| `deps.py` | Dependencies | Database session, current user injection |
| `database.py` | Database setup | SQLAlchemy engine, session factory |
| `models.py` | ORM models | User, Quiz, Question, Attempt tables |
| `schemas.py` | Data validation | Pydantic models for request/response |

### Frontend Components

| File | Purpose | Key Features |
|------|---------|--------------|
| `main.jsx` | App entry | React DOM rendering |
| `App.jsx` | Routing | Route definitions, protected routes |
| `login.jsx` | Authentication | Login form, role-based redirect |
| `dashBoard.jsx` | Admin interface | User management, quiz creation, stats |
| `studentDashboard.jsx` | Student interface | View quizzes, take tests, view results |
| `ProtectedRoute.jsx` | Auth guards | Redirect unauthenticated users |
| `AuthContext.jsx` | Auth state | Login, logout, user data |
| `ToastContext.jsx` | Notifications | Success/error messages |
| `api.js` | API calls | Centralized HTTP requests |

---

## 🔐 Authentication Flow

```
1. User enters credentials in login.jsx
2. login.jsx calls AuthContext.login()
3. AuthContext calls authAPI.login() from api.js
4. api.js sends POST to /api/v1/auth/login
5. Backend validates credentials & returns JWT token
6. Token stored in localStorage
7. AuthContext fetches user data with token
8. User redirected based on role:
   - student → /student-dashboard
   - admin/teacher → /admin-dashboard
```

---

## 📊 Database Schema

### Users Table
- `id`: Primary key
- `email`: Unique, indexed
- `hashed_password`: Bcrypt hash
- `first_name`, `last_name`: User name
- `role`: "admin", "teacher", or "student"
- `department`, `class_year`, `student_id`: Optional fields
- `is_active`: Boolean
- `created_at`, `last_active`: Timestamps

### Quizzes Table
- `id`: Primary key
- `title`, `description`: Quiz info
- `creator_id`: Foreign key to Users
- `department`, `class_year`: Target audience
- `total_marks`, `duration_minutes`: Quiz settings
- `is_active`: Boolean
- `created_at`: Timestamp

### Questions Table
- `id`: Primary key
- `quiz_id`: Foreign key to Quizzes
- `question_text`: Question content
- `question_type`: "mcq", "short_answer", etc.
- `option_a`, `option_b`, `option_c`, `option_d`: MCQ options
- `correct_answer`: Correct answer text
- `marks`: Points for this question

### Attempts Table
- `id`: Primary key
- `quiz_id`: Foreign key to Quizzes
- `student_id`: Foreign key to Users
- `score`: Calculated score
- `total_marks`: Max possible score
- `percentage`: Score percentage
- `started_at`, `submitted_at`: Timestamps
- `answers`: JSON field with student responses

---

## 🚀 API Endpoints

### Authentication
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/auth/me` - Get current user

### Users
- `GET /api/v1/users/` - List all users
- `POST /api/v1/users/` - Create user
- `GET /api/v1/users/{id}` - Get user by ID
- `PUT /api/v1/users/{id}` - Update user
- `DELETE /api/v1/users/{id}` - Delete user

### Quizzes
- `GET /api/v1/quizzes/` - List quizzes
- `POST /api/v1/quizzes/` - Create quiz
- `GET /api/v1/quizzes/{id}` - Get quiz details
- `PUT /api/v1/quizzes/{id}` - Update quiz
- `DELETE /api/v1/quizzes/{id}` - Delete quiz

### Attempts
- `POST /api/v1/attempts/start` - Start quiz attempt
- `POST /api/v1/attempts/submit` - Submit answers
- `GET /api/v1/attempts/my-attempts` - Get student's attempts
- `GET /api/v1/attempts/{id}` - Get attempt details

---

## 🎨 UI Pages Overview

### Login Page (`login.jsx`)
- Email & password form
- Validation & error handling
- Role-based redirect after login
- Default credentials display

### Admin Dashboard (`dashBoard.jsx`)
- **Overview**: System statistics
- **Users Management**: Add/edit/delete users
- **Teachers/Students**: View user activity
- **Quizzes**: Create and manage quizzes
- **Reports**: Detailed analytics
- **Settings**: System configuration

### Student Dashboard (`studentDashboard.jsx`)
- **Dashboard**: Personal stats & recent attempts
- **Quizzes**: Browse and take quizzes
- **Results**: View all quiz scores
- **Profile**: Personal information

---

## 🔧 Configuration Files

### Backend `.env`
```env
DATABASE_URL=sqlite:///./quizapp.db
SECRET_KEY=<random-secret-key>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### Frontend `.env`
```env
VITE_API_BASE_URL=http://localhost:8000
```

---

## 📦 Dependencies

### Backend (`requirements.txt`)
- fastapi
- uvicorn[standard]
- sqlalchemy
- python-jose[cryptography]
- passlib[bcrypt]
- python-multipart
- pydantic[email]

### Frontend (`package.json`)
- react ^19.0.0
- react-router ^7.1.1
- lucide-react ^0.468.0
- tailwindcss ^3.4.17
- vite ^6.0.5

---

## 🔄 Data Flow Examples

### Creating a Quiz (Admin)
```
Admin Dashboard → Quiz Form → quizAPI.createQuiz() → 
POST /api/v1/quizzes/ → Backend validates → 
Save to database → Return quiz data → Update UI
```

### Taking a Quiz (Student)
```
Student Dashboard → Click "Start Quiz" → attemptAPI.startAttempt() →
POST /api/v1/attempts/start → Get questions → 
Student answers → Click "Submit" → attemptAPI.submitAttempt() →
POST /api/v1/attempts/submit → Calculate score → 
Update database → Return results → Show score
```

---

## 🎯 Key Features by Role

### Admin/Teacher Features
✅ Create and manage quizzes
✅ Add/remove users (teachers & students)
✅ View all student attempts
✅ System statistics dashboard
✅ User activity tracking
✅ Generate reports

### Student Features
✅ Browse available quizzes
✅ Take quizzes multiple times
✅ View personal scores and history
✅ Track progress over time
✅ View profile information
✅ See performance statistics

---

## 🛡️ Security Features

- **Password Hashing**: Bcrypt with salt
- **JWT Tokens**: Secure token-based auth
- **Protected Routes**: Frontend & backend guards
- **CORS**: Configured for frontend origin
- **Input Validation**: Pydantic schemas
- **SQL Injection Protection**: SQLAlchemy ORM
- **XSS Protection**: React automatic escaping

---

## 📝 Testing Credentials

### Admin Account
```
Email: admin@macquiz.com
Password: admin123
Role: Admin
```

### Student Account
```
Email: student@macquiz.com
Password: student123
Role: Student
```

---

## 🚀 Quick Start Commands

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate      # Windows
source venv/bin/activate   # Unix
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Using Batch Files (Windows)
```bash
# Backend only
backend\start_backend.bat

# Frontend only
frontend\start_frontend.bat

# Both servers
frontend\start_both_servers.bat
```

---

## 📊 Project Statistics

- **Total Files**: 40+
- **Backend Files**: 15+
- **Frontend Files**: 15+
- **API Endpoints**: 15+
- **Database Tables**: 4
- **React Components**: 10+
- **Context Providers**: 2
- **Protected Routes**: 2

---

## 🔍 File Naming Conventions

- **Backend**: `snake_case.py`
- **Frontend Components**: `camelCase.jsx` or `PascalCase.jsx`
- **Config Files**: `kebab-case.js`
- **Documentation**: `UPPER_CASE.md`
- **Scripts**: `snake_case.bat` / `snake_case.sh`

---

## 📚 Documentation Files

1. **README.md** - Main project documentation
2. **PROJECT_SUMMARY.md** - Feature overview
3. **QUICKSTART.md** - Setup instructions
4. **STUDENT_DASHBOARD_GUIDE.md** - Student user guide
5. **PROJECT_STRUCTURE.md** - This file
6. **API_EXAMPLES.md** - Backend API documentation

---

## 🎓 Learning Resources

- **FastAPI**: https://fastapi.tiangolo.com/
- **React**: https://react.dev/
- **Tailwind CSS**: https://tailwindcss.com/
- **React Router**: https://reactrouter.com/
- **SQLAlchemy**: https://www.sqlalchemy.org/

---

## 📌 Important Notes

1. **Database**: SQLite is used for development. Switch to PostgreSQL for production.
2. **Secret Key**: Generate a secure SECRET_KEY for production.
3. **CORS**: Update allowed origins for production deployment.
4. **Environment Files**: Never commit `.env` files to git.
5. **Virtual Environment**: Always activate venv before running backend.
6. **Node Modules**: Run `npm install` after cloning the repository.

---

*Last Updated: October 17, 2025*
