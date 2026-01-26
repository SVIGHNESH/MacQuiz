from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.config import settings
from app.db.database import engine, Base, SessionLocal
from app.models.models import User
from app.core.security import get_password_hash
from app.api.v1 import auth, users, quizzes, attempts, subjects, question_bank, analytics

def init_admin() -> None:
    """Create the initial admin user if it doesn't exist.

    This should run during startup, not at import time.
    """
    if not settings.ADMIN_EMAIL or not settings.ADMIN_PASSWORD:
        print("ℹ️  ADMIN_EMAIL/ADMIN_PASSWORD not set; skipping admin bootstrap")
        return

    db = SessionLocal()
    try:
        admin_exists = db.query(User).filter(User.email == settings.ADMIN_EMAIL).first()
        if admin_exists:
            print("ℹ️  Admin user already exists")
            return

        admin_user = User(
            email=settings.ADMIN_EMAIL,
            hashed_password=get_password_hash(settings.ADMIN_PASSWORD),
            first_name="Admin",
            last_name="User",
            role="admin",
            is_active=True,
        )
        db.add(admin_user)
        db.commit()
        print(f"✅ Admin user created: {settings.ADMIN_EMAIL}")
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    Base.metadata.create_all(bind=engine)
    init_admin()
    yield
    # Shutdown (nothing to do)

app = FastAPI(
    title="MacQuiz API",
    description="Comprehensive Backend API for MacQuiz - Advanced Quiz Management System",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("X-Frame-Options", "DENY")
    response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
    response.headers.setdefault(
        "Permissions-Policy",
        "geolocation=(), microphone=(), camera=()",
    )
    return response

# Include routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])
app.include_router(subjects.router, prefix="/api/v1/subjects", tags=["Subjects"])
app.include_router(question_bank.router, prefix="/api/v1/question-bank", tags=["Question Bank"])
app.include_router(quizzes.router, prefix="/api/v1/quizzes", tags=["Quizzes"])
app.include_router(attempts.router, prefix="/api/v1/attempts", tags=["Quiz Attempts"])
app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["Analytics & Reports"])

@app.get("/")
async def root():
    return {
        "message": "Welcome to MacQuiz API v2.0",
        "version": "2.0.0",
        "features": [
            "JWT Authentication with Role-Based Access Control",
            "Comprehensive User Management (Admin, Teacher, Student)",
            "Subject Management System",
            "Question Bank with Difficulty Levels",
            "Advanced Quiz Creation with Scheduling",
            "Custom Marking Schemes (Positive & Negative)",
            "Time-Based Quiz Control with Grace Periods",
            "Automatic Grading Engine",
            "Comprehensive Analytics & Reporting",
            "Department & Class-Based Filtering"
        ],
        "docs": "/docs",
        "redoc": "/redoc"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "version": "2.0.0",
        "database": "connected"
    }
