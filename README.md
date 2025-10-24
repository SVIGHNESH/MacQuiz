"# QuizzApp-RBMI

A comprehensive Quiz Application with Role-Based Management Interface built with React (Frontend) and FastAPI (Backend). Features advanced quiz timing, question bank management, custom scoring, and detailed analytics.

## Features

### Admin Dashboard
- **User Management**: Create and manage teachers and students
- **Subject Management**: Organize quizzes and questions by subject (NEW)
- **Question Bank**: Centralized repository of reusable questions (NEW)
- **Quiz Management**: Oversee all quizzes with timing controls
- **Analytics Dashboard**: Real-time statistics and activity tracking
- **Teacher Statistics**: Monitor quiz creation, student reach, and performance (NEW)
- **Student Statistics**: Track quiz attempts, scores, and completion rates (NEW)
- **Detailed Reports**: AI-powered insights using Gemini API
- **Bulk User Upload**: Import users via Excel/CSV files

### Teacher Features
- Create and manage subjects for organization
- Build question banks with difficulty levels and topics (NEW)
- Create quizzes with flexible options:
  - Mix questions from question bank and manual entry (NEW)
  - Set scheduled start times with grace periods (NEW)
  - Configure custom marking schemes (+/- points) (NEW)
  - Multiple question types (MCQ, True/False, Short Answer)
- View comprehensive statistics about their quizzes (NEW)
- Track student performance and quiz attempts
- Department and class-based filtering

### Student Features
- Check quiz availability based on timing rules (NEW)
- Browse and attempt available quizzes within scheduled windows
- Instant result calculation with custom scoring
- View detailed statistics: average score, highest/lowest, completion rate (NEW)
- Track quiz history and performance trends
- Department and class-specific quizzes

## Tech Stack

### Frontend
- **React** with Vite
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Lucide React** for icons

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - ORM for database management
- **MySQL/PostgreSQL** - Production-grade databases (NEW)
- **PyMySQL** - MySQL database driver (NEW)
- **Alembic** - Database migrations (NEW)
- **JWT** - Authentication and authorization
- **Bcrypt** - Password hashing
- **Pydantic** - Data validation

## Project Structure

```
QuizzApp-RBMI/
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── pages/           # Login, Dashboard pages
│   │   ├── components/      # Reusable components
│   │   └── assets/          # Images, SVGs
│   └── package.json
│
└── backend/                  # FastAPI backend
    ├── app/
    │   ├── api/v1/          # API endpoints
    │   │   ├── auth.py      # Authentication
    │   │   ├── users.py     # User management
    │   │   ├── quizzes.py   # Quiz management
    │   │   ├── attempts.py  # Quiz attempts
    │   │   ├── subjects.py  # Subject management (NEW)
    │   │   ├── question_bank.py  # Question bank (NEW)
    │   │   └── stats.py     # Statistics API (NEW)
    │   ├── core/            # Config, security
    │   ├── models/          # Database models (enhanced)
    │   ├── schemas/         # Pydantic schemas (enhanced)
    │   ├── services/        # Business logic (NEW)
    │   │   └── quiz_service.py  # Quiz timing & scoring (NEW)
    │   └── db/              # Database setup
    ├── .env                 # Environment variables (MySQL config)
    ├── requirements.txt     # Python dependencies (updated)
    └── run.sh               # Quick start script
```

## Quick Start

### Prerequisites

- Python 3.9 or higher
- Node.js 16 or higher
- MySQL 8.0 or higher (NEW)

### Database Setup (NEW)

1. Install MySQL and create database:
```bash
# Login to MySQL
mysql -u root -p

# Create database and user
CREATE DATABASE quizapp_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'quizapp_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON quizapp_db.* TO 'quizapp_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

2. Update `.env` file with database credentials (see Environment Variables section)

For detailed setup instructions, see [SETUP_GUIDE_NEW.md](SETUP_GUIDE_NEW.md)

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Run the startup script (creates venv, installs dependencies, starts server):
```bash
./run.sh
```

Or manually:
```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations (NEW)
alembic upgrade head

# Run server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

3. Access the API:
- **API**: http://localhost:8000
- **API Docs (Swagger)**: http://localhost:8000/docs
- **API Docs (ReDoc)**: http://localhost:8000/redoc

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

4. Access the app:
- **Frontend**: http://localhost:5173

## Default Credentials

**Admin Login:**
- Email: `admin@macquiz.com`
- Password: `admin123`

⚠️ **Important**: Change these credentials in production!

## API Documentation

Full API documentation: [BACKEND_ARCHITECTURE.md](BACKEND_ARCHITECTURE.md)

### Authentication
- `POST /api/v1/auth/login` - OAuth2 form login
- `POST /api/v1/auth/login-json` - JSON login

### User Management
- `POST /api/v1/users/` - Create user (Admin)
- `GET /api/v1/users/` - List all users (Admin)
- `GET /api/v1/users/me` - Get current user
- `GET /api/v1/users/{id}` - Get user by ID (Admin)
- `PUT /api/v1/users/{id}` - Update user (Admin)
- `DELETE /api/v1/users/{id}` - Delete user (Admin)
- `GET /api/v1/users/activity/teachers` - Teacher activity (Admin)
- `GET /api/v1/users/activity/students` - Student activity (Admin)

### Subject Management (NEW)
- `POST /api/v1/subjects/` - Create subject (Teacher/Admin)
- `GET /api/v1/subjects/` - List all subjects
- `GET /api/v1/subjects/{id}` - Get subject details
- `PUT /api/v1/subjects/{id}` - Update subject (Admin)
- `DELETE /api/v1/subjects/{id}` - Delete subject (Admin)

### Question Bank (NEW)
- `POST /api/v1/question-bank/` - Add question (Teacher/Admin)
- `GET /api/v1/question-bank/` - List questions with filters
- `GET /api/v1/question-bank/{id}` - Get question details
- `PUT /api/v1/question-bank/{id}` - Update question (Creator/Admin)
- `DELETE /api/v1/question-bank/{id}` - Delete question (Creator/Admin)
- `GET /api/v1/question-bank/subjects/{id}/stats` - Subject stats

### Quiz Management
- `POST /api/v1/quizzes/` - Create quiz with timing & marking (Teacher/Admin)
- `GET /api/v1/quizzes/` - List quizzes (filtered by role)
- `GET /api/v1/quizzes/{id}` - Get quiz details
- `GET /api/v1/quizzes/{id}/availability` - Check quiz timing (NEW)
- `PUT /api/v1/quizzes/{id}` - Update quiz (Teacher/Admin)
- `DELETE /api/v1/quizzes/{id}` - Delete quiz (Teacher/Admin)

### Quiz Attempts
- `POST /api/v1/attempts/start` - Start quiz (with timing validation)
- `POST /api/v1/attempts/submit` - Submit answers (with custom scoring)
- `GET /api/v1/attempts/my-attempts` - Get user attempts
- `GET /api/v1/attempts/quiz/{id}` - Get quiz attempts (Teacher/Admin)
- `GET /api/v1/attempts/student/{id}` - Get student attempts (Teacher/Admin)
- `GET /api/v1/attempts/{id}` - Get attempt details

### Statistics & Analytics (NEW)
- `GET /api/v1/stats/dashboard` - Dashboard stats (Admin)
- `GET /api/v1/stats/teachers` - All teacher statistics (Admin)
- `GET /api/v1/stats/teachers/{id}` - Specific teacher stats
- `GET /api/v1/stats/students` - All student statistics (Admin/Teacher)
- `GET /api/v1/stats/students/{id}` - Specific student stats

**Total: 40+ API endpoints**

See [backend/API_EXAMPLES.md](backend/API_EXAMPLES.md) for detailed API usage examples.

## Database Schema

### Users
- Authentication and profile information
- Phone number field (NEW)
- Roles: admin, teacher, student (Enum type)
- Student-specific: student_id, department, class_year

### Subjects (NEW)
- Subject name, code, and description
- Department organization
- Links to quizzes and question bank

### Question Bank (NEW)
- Reusable questions by subject
- Difficulty levels: easy, medium, hard
- Topic-based organization
- Multiple question types
- Creator tracking

### Quizzes
- Title, description, creator
- Subject linking (NEW)
- Department and class filters
- **Timing configuration** (NEW):
  - Scheduled start time
  - Duration in minutes
  - Grace period for late starts
- **Custom marking scheme** (NEW):
  - Marks per correct answer
  - Marks per incorrect answer (negative marking)
- Total marks and active status

### Questions
- Multiple types: MCQ, True/False, Short Answer
- Options and correct answers
- Individual marks allocation
- Question order within quiz (NEW)

### Quiz Attempts
- Student attempts tracking
- Score and percentage calculation
- Timing information (started, submitted)
- Completion status (NEW)
- Time taken in minutes (NEW)

### Answers
- Student responses
- Correctness evaluation
- Marks awarded (based on custom scheme)

## Development

### Backend Testing
```bash
cd backend
source venv/bin/activate
pytest  # (setup tests as needed)
```

### Frontend Testing
```bash
cd frontend
npm run test  # (setup tests as needed)
```

### Code Quality
```bash
# Backend
black app/
flake8 app/

# Frontend
npm run lint
```

## Production Deployment

### Backend Checklist
- [ ] Change `SECRET_KEY` in `.env` to a strong random value
- [ ] Change default admin credentials
- [ ] Set up MySQL with proper user privileges (NEW)
- [ ] Run database migrations: `alembic upgrade head` (NEW)
- [ ] Configure proper CORS origins
- [ ] Enable HTTPS
- [ ] Set up logging and monitoring
- [ ] Configure rate limiting
- [ ] Use environment-specific configs
- [ ] Set up database backups (NEW)
- [ ] Configure connection pooling (NEW)

### Frontend Checklist
- [ ] Update API endpoint URLs
- [ ] Build for production: `npm run build`
- [ ] Configure proper CORS
- [ ] Set up CDN for static assets
- [ ] Enable HTTPS

### Docker Deployment (Optional)

Backend Dockerfile:
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Frontend Dockerfile:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
CMD ["npm", "run", "preview"]
```

## Environment Variables

### Backend (.env)
```env
# Database Configuration (MySQL/PostgreSQL)
DATABASE_URL=mysql+pymysql://quizapp_user:your_password@localhost:3306/quizapp_db

# Alternative PostgreSQL
# DATABASE_URL=postgresql://username:password@localhost:5432/quizapp_db

# Security
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Admin Credentials
ADMIN_EMAIL=admin@macquiz.com
ADMIN_PASSWORD=admin123
```

**Generate a secure SECRET_KEY:**
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:8000
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
- Check the [Setup Guide](SETUP_GUIDE_NEW.md) for detailed installation
- Check the [Backend Architecture](BACKEND_ARCHITECTURE.md) for API details
- Check the [API Examples](backend/API_EXAMPLES.md)
- Check the [Backend README](backend/README.md)
- Check the [Project Summary](PROJECT_SUMMARY.md) for feature overview
- Create an issue in the repository

## Documentation

- **[QUICKSTART.md](QUICKSTART.md)** - 5-minute quick start guide
- **[SETUP_GUIDE_NEW.md](SETUP_GUIDE_NEW.md)** - Comprehensive setup guide (NEW)
- **[BACKEND_ARCHITECTURE.md](BACKEND_ARCHITECTURE.md)** - Complete API reference (NEW)
- **[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)** - Feature overview and architecture
- **[backend/API_EXAMPLES.md](backend/API_EXAMPLES.md)** - Detailed API usage examples
- **[backend/README.md](backend/README.md)** - Backend-specific documentation

## Acknowledgments

- React and Vite teams for excellent frontend tools
- FastAPI team for the amazing Python framework
- SQLAlchemy and Alembic for robust database management
- Tailwind CSS for the utility-first CSS framework
- Lucide for beautiful icons
- MySQL and PostgreSQL communities for reliable databases
" 
