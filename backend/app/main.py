from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from contextlib import asynccontextmanager
import logging
from sqlalchemy import text
from app.core.config import settings
from app.db.database import engine
from app.api.v1 import auth, users, quizzes, attempts, subjects, question_bank, analytics

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Schema creation and admin-user seeding are one-time deploy steps, not
    # per-boot work - run `python -m app.bootstrap` once per deploy instead.
    # Serverless cold starts should not pay for DB round-trips before the
    # first request; local dev/prod schema is expected to already exist.
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
    allow_origin_regex=settings.CORS_ORIGIN_REGEX or None,
    allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Compress larger JSON payloads (attempt lists, analytics) to improve response time on free-tier hosting.
app.add_middleware(GZipMiddleware, minimum_size=1024)


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
    # Checked live (not at boot) so this reflects current DB reachability
    # without requiring the app to touch the DB on every cold start.
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        database_status = "connected"
    except Exception:
        # Don't leak connection details (host, credentials) to callers of this public endpoint.
        logger.exception("Health check DB probe failed")
        database_status = "unavailable"

    return {
        "status": "healthy" if database_status == "connected" else "degraded",
        "version": "2.0.0",
        "database": database_status,
    }
