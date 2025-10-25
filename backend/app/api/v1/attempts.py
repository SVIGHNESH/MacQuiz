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
    """
    Start a quiz attempt with eligibility checks
    - Validates quiz is active
    - Checks schedule and grace period
    - Prevents duplicate attempts
    """
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
    
    # Check if already attempted
    existing_attempt = db.query(QuizAttempt).filter(
        QuizAttempt.quiz_id == quiz.id,
        QuizAttempt.student_id == current_user.id
    ).first()
    
    if existing_attempt:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already attempted this quiz"
        )
    
    # Check schedule and grace period
    if quiz.scheduled_at:
        now = datetime.utcnow()
        grace_end = quiz.scheduled_at + timedelta(minutes=quiz.grace_period_minutes)
        
        if now < quiz.scheduled_at:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Quiz has not started yet. Starts at {quiz.scheduled_at}"
            )
        
        if now > grace_end:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Grace period for starting this quiz has expired"
            )
    
    # Create attempt
    db_attempt = QuizAttempt(
        quiz_id=quiz.id,
        student_id=current_user.id,
        total_marks=quiz.total_marks,
        is_completed=False,
        is_graded=False
    )
    
    db.add(db_attempt)
    db.commit()
    db.refresh(db_attempt)
    
    return db_attempt

@router.post("/submit", response_model=QuizAttemptResponse)
async def submit_quiz_attempt(
    attempt_id: int,
    submission: QuizAttemptSubmit,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Submit quiz attempt with custom marking scheme
    - Applies positive marking for correct answers
    - Applies negative marking for incorrect answers
    - Validates deadline if quiz has duration
    - Calculates time taken
    """
    # Get attempt
    attempt = db.query(QuizAttempt).filter(QuizAttempt.id == attempt_id).first()
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
    
    if attempt.is_completed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quiz already submitted"
        )
    
    # Get quiz
    quiz = db.query(Quiz).filter(Quiz.id == attempt.quiz_id).first()
    
    # Validate deadline
    if quiz.duration_minutes:
        deadline = attempt.started_at + timedelta(minutes=quiz.duration_minutes)
        if datetime.utcnow() > deadline:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Submission deadline has passed"
            )
    
    # Calculate score with custom marking scheme
    total_score = 0
    correct_count = 0
    incorrect_count = 0
    
    for answer_data in submission.answers:
        question = db.query(Question).filter(Question.id == answer_data.question_id).first()
        if question:
            # Check answer correctness
            is_correct = answer_data.answer_text.strip().lower() == question.correct_answer.strip().lower()
            
            # Apply marking scheme
            if is_correct:
                marks_awarded = quiz.marks_per_correct * question.marks
                correct_count += 1
            else:
                marks_awarded = -quiz.negative_marking if quiz.negative_marking > 0 else 0
                incorrect_count += 1
            
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
    
    # Calculate time taken
    time_taken = (datetime.utcnow() - attempt.started_at).total_seconds() / 60  # in minutes
    
    # Update attempt
    attempt.score = max(0, total_score)  # Don't allow negative total scores
    attempt.percentage = (attempt.score / attempt.total_marks * 100) if attempt.total_marks > 0 else 0
    attempt.submitted_at = datetime.utcnow()
    attempt.time_taken_minutes = round(time_taken, 2)
    attempt.is_completed = True
    attempt.is_graded = True
    
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
