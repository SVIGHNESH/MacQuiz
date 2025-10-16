from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from typing import List
from app.db.database import get_db
from app.models.models import User, Quiz, QuizAttempt, Answer, Question
from app.schemas.schemas import (
    QuizAttemptStart, QuizAttemptSubmit, QuizAttemptResponse,
    DashboardStats, ActivityItem
)
from app.core.deps import get_current_active_user, require_role

router = APIRouter()

@router.post("/start", response_model=QuizAttemptResponse)
async def start_quiz_attempt(
    attempt_data: QuizAttemptStart,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Verify quiz exists
    quiz = db.query(Quiz).filter(Quiz.id == attempt_data.quiz_id).first()
    if not quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz not found"
        )
    
    if not quiz.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quiz is not active"
        )
    
    # Create attempt
    db_attempt = QuizAttempt(
        quiz_id=quiz.id,
        student_id=current_user.id,
        total_marks=quiz.total_marks
    )
    
    db.add(db_attempt)
    db.commit()
    db.refresh(db_attempt)
    
    return db_attempt

@router.post("/submit", response_model=QuizAttemptResponse)
async def submit_quiz_attempt(
    submission: QuizAttemptSubmit,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Get attempt
    attempt = db.query(QuizAttempt).filter(QuizAttempt.id == submission.attempt_id).first()
    if not attempt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attempt not found"
        )
    
    # Verify ownership
    if attempt.student_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not your attempt"
        )
    
    # Calculate score
    total_score = 0
    for answer_data in submission.answers:
        question = db.query(Question).filter(Question.id == answer_data.question_id).first()
        if question:
            is_correct = answer_data.answer_text.strip().lower() == question.correct_answer.strip().lower()
            marks_awarded = question.marks if is_correct else 0
            total_score += marks_awarded
            
            # Save answer
            db_answer = Answer(
                attempt_id=attempt.id,
                question_id=question.id,
                answer_text=answer_data.answer_text,
                is_correct=is_correct,
                marks_awarded=marks_awarded
            )
            db.add(db_answer)
    
    # Update attempt
    attempt.score = total_score
    attempt.percentage = (total_score / attempt.total_marks * 100) if attempt.total_marks > 0 else 0
    attempt.submitted_at = datetime.utcnow()
    
    db.commit()
    db.refresh(attempt)
    
    return attempt

@router.get("/my-attempts", response_model=List[QuizAttemptResponse])
async def get_my_attempts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    attempts = db.query(QuizAttempt).filter(QuizAttempt.student_id == current_user.id).all()
    return attempts

@router.get("/quiz/{quiz_id}/attempts", response_model=List[QuizAttemptResponse], dependencies=[Depends(require_role(["admin", "teacher"]))])
async def get_quiz_attempts(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    attempts = db.query(QuizAttempt).filter(QuizAttempt.quiz_id == quiz_id).all()
    return attempts

@router.get("/stats/dashboard", response_model=DashboardStats, dependencies=[Depends(require_role(["admin"]))])
async def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Total quizzes
    total_quizzes = db.query(Quiz).count()
    
    # Students stats
    total_students = db.query(User).filter(User.role == "student").count()
    
    # Active students (students who attempted a quiz in last 30 days)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    active_students = db.query(func.count(func.distinct(QuizAttempt.student_id)))\
        .filter(QuizAttempt.started_at >= thirty_days_ago).scalar() or 0
    
    # Yesterday's assessments
    yesterday_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=1)
    yesterday_end = yesterday_start + timedelta(days=1)
    yesterday_assessments = db.query(QuizAttempt)\
        .filter(QuizAttempt.started_at >= yesterday_start, QuizAttempt.started_at < yesterday_end)\
        .count()
    
    yesterday_attendance = db.query(func.count(func.distinct(QuizAttempt.student_id)))\
        .filter(QuizAttempt.started_at >= yesterday_start, QuizAttempt.started_at < yesterday_end)\
        .scalar() or 0
    
    # Active teachers today (teachers who created quiz or whose quiz was attempted today)
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    total_teachers = db.query(User).filter(User.role == "teacher").count()
    active_teachers_today = 0  # Placeholder
    
    return {
        "total_quizzes": total_quizzes,
        "active_students": active_students,
        "total_students": total_students,
        "yesterday_assessments": yesterday_assessments,
        "yesterday_attendance": yesterday_attendance,
        "active_teachers_today": active_teachers_today,
        "total_teachers": total_teachers
    }

@router.get("/stats/activity", response_model=List[ActivityItem], dependencies=[Depends(require_role(["admin"]))])
async def get_recent_activity(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Get recent quiz attempts
    recent_attempts = db.query(QuizAttempt).order_by(QuizAttempt.started_at.desc()).limit(limit).all()
    
    activities = []
    for attempt in recent_attempts:
        user = db.query(User).filter(User.id == attempt.student_id).first()
        quiz = db.query(Quiz).filter(Quiz.id == attempt.quiz_id).first()
        
        if user and quiz:
            time_diff = datetime.utcnow() - attempt.started_at
            if time_diff.seconds < 3600:
                time_str = f"{time_diff.seconds // 60} mins ago"
            elif time_diff.seconds < 86400:
                time_str = f"{time_diff.seconds // 3600} hours ago"
            else:
                time_str = f"{time_diff.days} days ago"
            
            activities.append({
                "user": f"{user.first_name} {user.last_name}",
                "action": f"Attempted quiz: {quiz.title}",
                "time": time_str,
                "status": "success" if attempt.submitted_at else "in_progress"
            })
    
    return activities
