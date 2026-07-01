from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import List, Optional
from datetime import datetime, timedelta
import json
import time
import urllib.request
import urllib.error
from app.core.deps import get_db, get_current_user, require_role
from app.core.config import settings
from app.models.models import (
    User, Quiz, QuizAttempt, Question, QuestionBank, Subject, Answer
)
from app.schemas.schemas import (
    DashboardStats,
    TeacherStats,
    StudentStats,
    UserActivityResponse,
    AIInsightsRequest,
    AIInsightsResponse,
)

router = APIRouter()


def _build_ai_metrics(
    db: Session,
    request_payload: AIInsightsRequest,
    current_user: User,
) -> dict:
    completed_attempts = db.query(QuizAttempt).join(
        User, User.id == QuizAttempt.student_id
    ).filter(
        User.role == "student",
        QuizAttempt.is_completed == True,
    )

    quiz_title = None
    if request_payload.quiz_id is not None:
        quiz = db.query(Quiz).filter(Quiz.id == request_payload.quiz_id).first()
        if not quiz:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Quiz not found",
            )
        if current_user.role == "teacher" and quiz.creator_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to view AI insights for this quiz",
            )
        quiz_title = quiz.title
        completed_attempts = completed_attempts.filter(QuizAttempt.quiz_id == request_payload.quiz_id)
    elif current_user.role == "teacher":
        # Teachers can only generate global insights for their own quizzes.
        teacher_quiz_ids = db.query(Quiz.id).filter(Quiz.creator_id == current_user.id).subquery()
        completed_attempts = completed_attempts.filter(QuizAttempt.quiz_id.in_(teacher_quiz_ids))

    if request_payload.department:
        completed_attempts = completed_attempts.filter(User.department == request_payload.department)

    total_completed = completed_attempts.count()
    avg_percentage = completed_attempts.with_entities(func.avg(QuizAttempt.percentage)).scalar() or 0
    avg_score = completed_attempts.with_entities(func.avg(QuizAttempt.score)).scalar() or 0
    avg_total_marks = completed_attempts.with_entities(func.avg(QuizAttempt.total_marks)).scalar() or 0

    pass_threshold = 40.0
    pass_count = completed_attempts.filter(QuizAttempt.percentage >= pass_threshold).count()
    pass_rate = (pass_count / total_completed * 100.0) if total_completed else 0.0

    top_performers_rows = completed_attempts.join(
        Quiz, Quiz.id == QuizAttempt.quiz_id
    ).with_entities(
        User.first_name,
        User.last_name,
        User.department,
        Quiz.title,
        QuizAttempt.percentage,
    ).order_by(QuizAttempt.percentage.desc()).limit(3).all()

    low_performers_rows = completed_attempts.join(
        Quiz, Quiz.id == QuizAttempt.quiz_id
    ).with_entities(
        User.first_name,
        User.last_name,
        User.department,
        Quiz.title,
        QuizAttempt.percentage,
    ).order_by(QuizAttempt.percentage.asc()).limit(3).all()

    top_performers = [
        {
            "name": f"{row.first_name} {row.last_name}",
            "department": row.department,
            "quiz": row.title,
            "percentage": round(float(row.percentage or 0), 2),
        }
        for row in top_performers_rows
    ]

    low_performers = [
        {
            "name": f"{row.first_name} {row.last_name}",
            "department": row.department,
            "quiz": row.title,
            "percentage": round(float(row.percentage or 0), 2),
        }
        for row in low_performers_rows
    ]

    return {
        "quiz_id": request_payload.quiz_id,
        "quiz_title": quiz_title,
        "department": request_payload.department,
        "total_completed_attempts": total_completed,
        "average_percentage": round(float(avg_percentage), 2) if total_completed else 0.0,
        "average_score": round(float(avg_score), 2) if total_completed else 0.0,
        "average_total_marks": round(float(avg_total_marks), 2) if total_completed else 0.0,
        "pass_threshold": pass_threshold,
        "pass_rate": round(float(pass_rate), 2),
        "top_performers": top_performers,
        "low_performers": low_performers,
    }


def _fallback_ai_summary(metrics: dict, include_recommendations: bool) -> dict:
    total = metrics.get("total_completed_attempts", 0)
    avg_pct = metrics.get("average_percentage", 0.0)
    pass_rate = metrics.get("pass_rate", 0.0)

    if total == 0:
        summary = "No completed attempts were found for the selected filters, so there is not enough data for AI analysis yet."
        findings = [
            "No completed attempts available.",
            "Run at least one completed assessment to generate insights.",
        ]
        recommendations = [
            "Assign this quiz to students and collect attempts.",
            "Re-run AI insights after at least 10 completed attempts for better reliability.",
        ] if include_recommendations else []
        return {
            "summary": summary,
            "key_findings": findings,
            "recommendations": recommendations,
        }

    performance_band = "strong" if avg_pct >= 70 else ("moderate" if avg_pct >= 40 else "weak")
    summary = (
        f"The cohort shows {performance_band} performance with an average score of {avg_pct:.1f}% "
        f"and a pass rate of {pass_rate:.1f}% across {total} completed attempt(s)."
    )

    findings = [
        f"Average percentage: {avg_pct:.1f}%",
        f"Pass rate: {pass_rate:.1f}% (threshold {metrics.get('pass_threshold', 40):.0f}%)",
        f"Sample size: {total} completed attempt(s)",
    ]

    recommendations = []
    if include_recommendations:
        if avg_pct < 40:
            recommendations.extend([
                "Review foundational concepts before the next assessment.",
                "Introduce 1-2 low-stakes practice quizzes focused on weak areas.",
            ])
        elif avg_pct < 70:
            recommendations.extend([
                "Target medium-difficulty questions where partial understanding exists.",
                "Use feedback sessions for the three most-missed topics.",
            ])
        else:
            recommendations.extend([
                "Increase challenge level with more application-based questions.",
                "Use top performers to mentor students in lower bands.",
            ])

    return {
        "summary": summary,
        "key_findings": findings,
        "recommendations": recommendations,
    }


def _extract_json_object(raw_text: str) -> Optional[dict]:
    if not raw_text:
        return None
    raw_text = raw_text.strip()
    try:
        return json.loads(raw_text)
    except json.JSONDecodeError:
        pass

    start = raw_text.find("{")
    end = raw_text.rfind("}")
    if start == -1 or end == -1 or end <= start:
        return None
    try:
        return json.loads(raw_text[start : end + 1])
    except json.JSONDecodeError:
        return None


def _generate_with_gemini(metrics: dict, include_recommendations: bool) -> Optional[dict]:
    api_key = (settings.GEMINI_API_KEY or "").strip()
    if not settings.AI_ENABLED or not api_key:
        return None

    prompt = (
        "You are an educational analytics assistant. "
        "Given metrics, produce concise actionable insights. "
        "Return strictly JSON with keys: summary (string), key_findings (array of strings), "
        "recommendations (array of strings).\n\n"
        f"Include recommendations: {str(include_recommendations).lower()}\n"
        f"Metrics: {json.dumps(metrics, ensure_ascii=True)}"
    )

    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/{settings.GEMINI_MODEL}:generateContent"
        f"?key={api_key}"
    )
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.3,
            "maxOutputTokens": 500,
            "responseMimeType": "application/json",
        },
    }

    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=20) as response:
            body = response.read().decode("utf-8")
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError):
        return None

    try:
        parsed = json.loads(body)
        text = parsed["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError, TypeError, json.JSONDecodeError):
        return None

    output = _extract_json_object(text)
    if not output:
        return None

    summary = str(output.get("summary") or "").strip()
    key_findings = [str(item).strip() for item in (output.get("key_findings") or []) if str(item).strip()]
    recommendations = [str(item).strip() for item in (output.get("recommendations") or []) if str(item).strip()]

    if not summary or not key_findings:
        return None

    if not include_recommendations:
        recommendations = []

    return {
        "summary": summary,
        "key_findings": key_findings,
        "recommendations": recommendations,
    }

_DASHBOARD_STATS_CACHE_TTL_SECONDS = 45
_dashboard_stats_cache = {"data": None, "expires_at": 0.0}


@router.get("/dashboard", response_model=DashboardStats)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    """
    Comprehensive dashboard statistics for admin.

    Dashboard stats change slowly, so results are cached in-process for a
    short TTL to absorb a room full of admins/teachers refreshing at once.
    """
    now = time.monotonic()
    cached = _dashboard_stats_cache["data"]
    if cached is not None and now < _dashboard_stats_cache["expires_at"]:
        return cached

    # Quizzes: total + active in one query via FILTER aggregates.
    total_quizzes, active_quizzes = db.query(
        func.count(Quiz.id),
        func.count(Quiz.id).filter(Quiz.is_active == True),
    ).one()

    # Students + teachers: total/active for both roles in one query.
    total_students, active_students, total_teachers, active_teachers = db.query(
        func.count(User.id).filter(User.role == "student"),
        func.count(User.id).filter(User.role == "student", User.is_active == True),
        func.count(User.id).filter(User.role == "teacher"),
        func.count(User.id).filter(User.role == "teacher", User.is_active == True),
    ).one()

    # Subjects and question bank.
    total_subjects = db.query(Subject).filter(Subject.is_active == True).count()
    total_questions_bank = db.query(QuestionBank).filter(
        QuestionBank.is_active == True
    ).count()

    # Yesterday's assessments + total attempts (students only) in one query.
    yesterday_start = datetime.utcnow().replace(
        hour=0, minute=0, second=0, microsecond=0
    ) - timedelta(days=1)
    yesterday_end = yesterday_start + timedelta(days=1)

    yesterday_assessments, total_attempts = db.query(
        func.count(QuizAttempt.id).filter(
            QuizAttempt.started_at >= yesterday_start,
            QuizAttempt.started_at < yesterday_end,
        ),
        func.count(QuizAttempt.id),
    ).join(User, User.id == QuizAttempt.student_id).filter(
        User.role == "student"
    ).one()

    result = {
        "total_quizzes": total_quizzes,
        "active_quizzes": active_quizzes,
        "total_students": total_students,
        "active_students": active_students,
        "total_teachers": total_teachers,
        "active_teachers": active_teachers,
        "total_subjects": total_subjects,
        "total_questions_bank": total_questions_bank,
        "yesterday_assessments": yesterday_assessments,
        "total_attempts": total_attempts
    }

    _dashboard_stats_cache["data"] = result
    _dashboard_stats_cache["expires_at"] = now + _DASHBOARD_STATS_CACHE_TTL_SECONDS

    return result


@router.get("/teacher/{teacher_id}/stats", response_model=TeacherStats)
def get_teacher_statistics(
    teacher_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get detailed statistics for a teacher
    """
    # Check permissions
    if current_user.role not in ["admin", "teacher"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    if current_user.role == "teacher" and current_user.id != teacher_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view other teacher's stats"
        )
    
    teacher = db.query(User).filter(
        User.id == teacher_id,
        User.role == "teacher"
    ).first()
    
    if not teacher:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Teacher not found"
        )
    
    # Total quizzes created
    total_quizzes = db.query(Quiz).filter(Quiz.creator_id == teacher_id).count()
    active_quizzes = db.query(Quiz).filter(
        Quiz.creator_id == teacher_id,
        Quiz.is_active == True
    ).count()
    
    # Total questions authored (in question bank)
    total_questions = db.query(QuestionBank).filter(
        QuestionBank.creator_id == teacher_id
    ).count()
    
    # Students who attempted their quizzes
    students_attempted = db.query(func.count(func.distinct(QuizAttempt.student_id))).join(
        Quiz, Quiz.id == QuizAttempt.quiz_id
    ).join(
        User, User.id == QuizAttempt.student_id
    ).filter(
        Quiz.creator_id == teacher_id,
        User.role == "student"
    ).scalar() or 0
    
    # Average quiz score
    avg_score = db.query(func.avg(QuizAttempt.percentage)).join(
        Quiz, Quiz.id == QuizAttempt.quiz_id
    ).join(
        User, User.id == QuizAttempt.student_id
    ).filter(
        Quiz.creator_id == teacher_id,
        User.role == "student",
        QuizAttempt.is_completed == True
    ).scalar() or 0
    
    # Last quiz created
    last_quiz = db.query(Quiz).filter(
        Quiz.creator_id == teacher_id
    ).order_by(Quiz.created_at.desc()).first()
    
    # Subjects taught (unique subjects in their quizzes)
    subjects_taught = db.query(func.count(func.distinct(Quiz.subject_id))).filter(
        Quiz.creator_id == teacher_id,
        Quiz.subject_id.isnot(None)
    ).scalar() or 0
    
    return {
        "total_quizzes_created": total_quizzes,
        "total_questions_authored": total_questions,
        "students_attempted": students_attempted,
        "average_quiz_score": round(avg_score, 2) if avg_score else None,
        "last_quiz_created": last_quiz.created_at if last_quiz else None,
        "active_quizzes": active_quizzes,
        "subjects_taught": subjects_taught
    }


@router.get("/student/{student_id}/stats", response_model=StudentStats)
def get_student_statistics(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get detailed statistics for a student
    """
    # Check permissions
    if current_user.role == "student" and current_user.id != student_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view other student's stats"
        )
    
    student = db.query(User).filter(
        User.id == student_id,
        User.role == "student"
    ).first()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    # Total attempts
    total_attempts = db.query(QuizAttempt).filter(
        QuizAttempt.student_id == student_id
    ).count()
    
    completed_attempts = db.query(QuizAttempt).filter(
        QuizAttempt.student_id == student_id,
        QuizAttempt.is_completed == True
    ).count()
    
    # Average score and percentage
    avg_score = db.query(func.avg(QuizAttempt.score)).filter(
        QuizAttempt.student_id == student_id,
        QuizAttempt.is_completed == True
    ).scalar() or 0
    
    avg_percentage = db.query(func.avg(QuizAttempt.percentage)).filter(
        QuizAttempt.student_id == student_id,
        QuizAttempt.is_completed == True
    ).scalar() or 0
    
    # Highest and lowest scores
    highest = db.query(func.max(QuizAttempt.score)).filter(
        QuizAttempt.student_id == student_id,
        QuizAttempt.is_completed == True
    ).scalar() or 0
    
    lowest = db.query(func.min(QuizAttempt.score)).filter(
        QuizAttempt.student_id == student_id,
        QuizAttempt.is_completed == True,
        QuizAttempt.score > 0
    ).scalar() or 0
    
    # Last attempt
    last_attempt = db.query(QuizAttempt).filter(
        QuizAttempt.student_id == student_id
    ).order_by(QuizAttempt.started_at.desc()).first()
    
    # Pending quizzes (active quizzes not attempted)
    attempted_quiz_ids = db.query(QuizAttempt.quiz_id).filter(
        QuizAttempt.student_id == student_id
    ).subquery()
    
    pending_quizzes = db.query(Quiz).filter(
        Quiz.is_active == True,
        ~Quiz.id.in_(attempted_quiz_ids)
    ).count()
    
    return {
        "total_quizzes_attempted": total_attempts,
        "quizzes_completed": completed_attempts,
        "average_score": round(avg_score, 2) if avg_score else None,
        "average_percentage": round(avg_percentage, 2) if avg_percentage else None,
        "highest_score": highest if highest else None,
        "lowest_score": lowest if lowest else None,
        "last_attempt": last_attempt.started_at if last_attempt else None,
        "pending_quizzes": pending_quizzes
    }


@router.get("/activity/recent")
def get_recent_activity(
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    """
    Get recent activity across the system
    """
    # Single joined query instead of two lookups per attempt (N+1).
    rows = db.query(
        QuizAttempt.id,
        QuizAttempt.started_at,
        QuizAttempt.is_completed,
        QuizAttempt.score,
        QuizAttempt.total_marks,
        User.first_name,
        User.last_name,
        Quiz.title,
    ).join(
        User, User.id == QuizAttempt.student_id
    ).join(
        Quiz, Quiz.id == QuizAttempt.quiz_id
    ).order_by(
        QuizAttempt.started_at.desc()
    ).limit(limit).all()

    return [
        {
            "id": row.id,
            "user_name": f"{row.first_name} {row.last_name}",
            "user_role": "student",
            "action": f"Attempted quiz: {row.title}",
            "timestamp": row.started_at,
            "details": f"Score: {row.score}/{row.total_marks}" if row.is_completed else "In progress"
        }
        for row in rows
    ]


@router.get("/activity/users", response_model=List[UserActivityResponse])
def get_user_activity(
    role: Optional[str] = None,
    department: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    """
    Get user activity list with filters
    """
    query = db.query(User).filter(User.role != "admin")
    
    if role:
        query = query.filter(User.role == role)
    
    if department:
        query = query.filter(User.department == department)
    
    users = query.order_by(User.last_active.desc()).limit(limit).all()
    
    return [
        {
            "id": user.id,
            "name": f"{user.first_name} {user.last_name}",
            "email": user.email,
            "role": user.role,
            "department": user.department,
            "class_year": user.class_year,
            "student_id": user.student_id,
            "last_active": user.last_active,
            "is_active": user.is_active
        }
        for user in users
    ]


@router.get("/performance/subject/{subject_id}")
def get_subject_performance(
    subject_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get performance analytics for a subject
    """
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subject not found"
        )
    
    # Quizzes in this subject
    quizzes = db.query(Quiz).filter(Quiz.subject_id == subject_id).all()
    quiz_ids = [q.id for q in quizzes]
    
    if not quiz_ids:
        return {
            "subject_id": subject_id,
            "subject_name": subject.name,
            "total_quizzes": 0,
            "total_attempts": 0,
            "average_performance": 0
        }
    
    # Total attempts
    total_attempts = db.query(QuizAttempt).filter(
        QuizAttempt.quiz_id.in_(quiz_ids)
    ).count()
    
    # Average performance
    avg_performance = db.query(func.avg(QuizAttempt.percentage)).filter(
        QuizAttempt.quiz_id.in_(quiz_ids),
        QuizAttempt.is_completed == True
    ).scalar() or 0
    
    return {
        "subject_id": subject_id,
        "subject_name": subject.name,
        "subject_code": subject.code,
        "total_quizzes": len(quizzes),
        "total_attempts": total_attempts,
        "average_performance": round(avg_performance, 2)
    }


@router.get("/performance/department/{department}")
def get_department_performance(
    department: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "teacher"]))
):
    """
    Get performance analytics for a department
    """
    # Students in department
    students = db.query(User).filter(
        User.role == "student",
        User.department == department
    ).all()
    
    student_ids = [s.id for s in students]
    
    if not student_ids:
        return {
            "department": department,
            "total_students": 0,
            "total_attempts": 0,
            "average_performance": 0
        }
    
    # Attempts by students in this department
    total_attempts = db.query(QuizAttempt).filter(
        QuizAttempt.student_id.in_(student_ids)
    ).count()
    
    completed_attempts = db.query(QuizAttempt).filter(
        QuizAttempt.student_id.in_(student_ids),
        QuizAttempt.is_completed == True
    ).count()
    
    avg_performance = db.query(func.avg(QuizAttempt.percentage)).filter(
        QuizAttempt.student_id.in_(student_ids),
        QuizAttempt.is_completed == True
    ).scalar() or 0
    
    return {
        "department": department,
        "total_students": len(students),
        "total_attempts": total_attempts,
        "completed_attempts": completed_attempts,
        "average_performance": round(avg_performance, 2)
    }


@router.post("/reports/ai-insights", response_model=AIInsightsResponse)
def get_ai_insights(
    request_payload: AIInsightsRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "teacher"])),
):
    metrics = _build_ai_metrics(db, request_payload, current_user)

    ai_output = _generate_with_gemini(metrics, request_payload.include_recommendations)
    fallback_used = ai_output is None
    if fallback_used:
        ai_output = _fallback_ai_summary(metrics, request_payload.include_recommendations)

    return {
        "provider": "gemini" if not fallback_used else "rule-based",
        "model": settings.GEMINI_MODEL if not fallback_used else "deterministic-v1",
        "generated_at": datetime.utcnow(),
        "summary": ai_output["summary"],
        "key_findings": ai_output["key_findings"],
        "recommendations": ai_output["recommendations"],
        "fallback_used": fallback_used,
        "source_metrics": metrics,
    }
