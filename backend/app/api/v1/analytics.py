from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import List, Optional
from datetime import datetime, timedelta
from app.core.deps import get_db, get_current_user, require_role
from app.models.models import (
    User, Quiz, QuizAttempt, Question, QuestionBank, Subject, Answer
)
from app.schemas.schemas import (
    DashboardStats, TeacherStats, StudentStats, UserActivityResponse
)

router = APIRouter()

@router.get("/dashboard", response_model=DashboardStats)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    """
    Comprehensive dashboard statistics for admin
    """
    # Total quizzes
    total_quizzes = db.query(Quiz).count()
    active_quizzes = db.query(Quiz).filter(Quiz.is_active == True).count()
    
    # Students stats
    total_students = db.query(User).filter(User.role == "student").count()
    active_students = db.query(User).filter(
        User.role == "student",
        User.is_active == True
    ).count()
    
    # Teachers stats
    total_teachers = db.query(User).filter(User.role == "teacher").count()
    active_teachers = db.query(User).filter(
        User.role == "teacher",
        User.is_active == True
    ).count()
    
    # Subjects and questions
    total_subjects = db.query(Subject).filter(Subject.is_active == True).count()
    total_questions_bank = db.query(QuestionBank).filter(
        QuestionBank.is_active == True
    ).count()
    
    # Yesterday's assessments
    yesterday_start = datetime.utcnow().replace(
        hour=0, minute=0, second=0, microsecond=0
    ) - timedelta(days=1)
    yesterday_end = yesterday_start + timedelta(days=1)
    
    yesterday_assessments = db.query(QuizAttempt).filter(
        QuizAttempt.started_at >= yesterday_start,
        QuizAttempt.started_at < yesterday_end
    ).count()
    
    # Total attempts
    total_attempts = db.query(QuizAttempt).count()
    
    return {
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
    ).filter(Quiz.creator_id == teacher_id).scalar() or 0
    
    # Average quiz score
    avg_score = db.query(func.avg(QuizAttempt.percentage)).join(
        Quiz, Quiz.id == QuizAttempt.quiz_id
    ).filter(
        Quiz.creator_id == teacher_id,
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
    activities = []
    
    # Recent quiz attempts
    recent_attempts = db.query(QuizAttempt).order_by(
        QuizAttempt.started_at.desc()
    ).limit(limit).all()
    
    for attempt in recent_attempts:
        student = db.query(User).filter(User.id == attempt.student_id).first()
        quiz = db.query(Quiz).filter(Quiz.id == attempt.quiz_id).first()
        
        if student and quiz:
            activities.append({
                "id": attempt.id,
                "user_name": f"{student.first_name} {student.last_name}",
                "user_role": "student",
                "action": f"Attempted quiz: {quiz.title}",
                "timestamp": attempt.started_at,
                "details": f"Score: {attempt.score}/{attempt.total_marks}" if attempt.is_completed else "In progress"
            })
    
    return activities


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
