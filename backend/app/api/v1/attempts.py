from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from typing import List, Optional
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

    # Students can only start attempts for quizzes assigned to them
    if current_user.role == "student":
        from app.models.models import QuizAssignment
        assignment = db.query(QuizAssignment).filter(
            QuizAssignment.quiz_id == quiz.id,
            QuizAssignment.student_id == current_user.id,
        ).first()
        if not assignment:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Quiz not assigned to you"
            )
    
    # Teachers and admins can preview anytime (bypass restrictions)
    is_teacher_or_admin = current_user.role in ["teacher", "admin"]
    
    if not quiz.is_active and not is_teacher_or_admin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quiz is not active"
        )
    
    # For teachers/admins previewing: delete any existing incomplete attempts to start fresh
    if is_teacher_or_admin:
        existing_incomplete = db.query(QuizAttempt).filter(
            QuizAttempt.quiz_id == quiz.id,
            QuizAttempt.student_id == current_user.id,
            QuizAttempt.is_completed == False
        ).first()
        if existing_incomplete:
            db.delete(existing_incomplete)
            db.commit()
    else:
        # For students: check if already attempted - if incomplete, return existing attempt (for reconnection)
        existing_attempt = db.query(QuizAttempt).filter(
            QuizAttempt.quiz_id == quiz.id,
            QuizAttempt.student_id == current_user.id,
            QuizAttempt.is_completed == False
        ).first()
        
        if existing_attempt:
            # Return existing incomplete attempt to allow continuation after refresh
            return existing_attempt
    
    # Check if already completed this quiz (only for students)
    # DISABLED: Allow students to retake quizzes for practice
    # if not is_teacher_or_admin:
    #     completed_attempt = db.query(QuizAttempt).filter(
    #         QuizAttempt.quiz_id == quiz.id,
    #         QuizAttempt.student_id == current_user.id,
    #         QuizAttempt.is_completed == True
    #     ).first()
    #     
    #     if completed_attempt:
    #         raise HTTPException(
    #             status_code=status.HTTP_400_BAD_REQUEST,
    #             detail="You have already completed this quiz"
    #         )
    
    # Check live session timing (only for students)
    now = datetime.now()
    if quiz.is_live_session and not is_teacher_or_admin:
        if not quiz.live_start_time or not quiz.live_end_time:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Live session times not configured properly"
            )
        
        # Check if session hasn't started yet (must wait until start time)
        if now < quiz.live_start_time:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Live session has not started yet. Starts at {quiz.live_start_time.strftime('%H:%M:%S')}"
            )
        
        # Check if within grace period (5 minutes after start)
        grace_end = quiz.live_start_time + timedelta(minutes=5)
        if now > grace_end:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Grace period for joining this quiz has expired (5 minutes after start time)"
            )
        
        # Check if session has ended
        if now > quiz.live_end_time:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Live session has ended"
            )
        
        # Student is joining during the live session - ALWAYS ALLOWED
        # This allows reconnection at any time during the session
    # Check schedule and grace period (for non-live quizzes, only for students)
    elif quiz.scheduled_at and not is_teacher_or_admin:
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
    now = datetime.now()
    if quiz.is_live_session:
        # For live sessions, deadline is the live_end_time regardless of when student started
        if now > quiz.live_end_time:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Live session has ended. Submission deadline has passed."
            )
    elif quiz.duration_minutes:
        # For regular quizzes, deadline is based on individual start time
        deadline = attempt.started_at + timedelta(minutes=quiz.duration_minutes)
        if now > deadline:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Submission deadline has passed"
            )
    
    # Calculate score with custom marking scheme
    total_score = 0
    correct_count = 0
    incorrect_count = 0

    # Remove any previously autosaved answers for this attempt to avoid duplicates
    db.query(Answer).filter(Answer.attempt_id == attempt.id).delete(synchronize_session=False)
    
    # If no answers provided, still mark as completed with 0 score
    if not submission.answers or len(submission.answers) == 0:
        attempt.score = 0
        attempt.percentage = 0
        attempt.submitted_at = datetime.now()
        time_taken = (datetime.now() - attempt.started_at).total_seconds() / 60
        attempt.time_taken_minutes = round(time_taken, 2)
        attempt.is_completed = True
        attempt.is_graded = True
        db.commit()
        db.refresh(attempt)
        return attempt
    
    for answer_data in submission.answers:
        question = db.query(Question).filter(Question.id == answer_data.question_id).first()
        if question:
            # Check answer correctness
            is_correct = answer_data.answer_text.strip().lower() == question.correct_answer.strip().lower()
            
            # Apply marking scheme
            if is_correct:
                marks_awarded = question.marks  # Award full question marks for correct answer
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
    submission_time = datetime.now()
    time_taken = (submission_time - attempt.started_at).total_seconds() / 60  # in minutes
    
    # Cap time taken at quiz duration (if quiz has duration)
    # This prevents unrealistic times when students leave quiz open for long periods
    if quiz.duration_minutes and time_taken > quiz.duration_minutes:
        time_taken = quiz.duration_minutes
    
    # Update attempt
    attempt.score = max(0, total_score)  # Don't allow negative total scores
    attempt.percentage = (attempt.score / attempt.total_marks * 100) if attempt.total_marks > 0 else 0
    attempt.submitted_at = submission_time
    attempt.time_taken_minutes = round(time_taken, 2)
    attempt.is_completed = True
    attempt.is_graded = True
    
    db.commit()
    db.refresh(attempt)
    
    return attempt

@router.post("/{attempt_id}/save-answer")
async def save_answer_progress(
    attempt_id: int,
    answer_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Save a single answer during quiz (for auto-save on refresh)
    Expected answer_data: {"question_id": int, "answer_text": str}
    """
    attempt = db.query(QuizAttempt).filter(QuizAttempt.id == attempt_id).first()
    
    if not attempt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attempt not found"
        )
    
    if attempt.student_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not your attempt"
        )
    
    if attempt.is_completed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot save answers for completed quiz"
        )
    
    question_id = answer_data.get("question_id")
    answer_text = answer_data.get("answer_text")
    
    if not question_id or not answer_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="question_id and answer_text are required"
        )
    
    # Check if answer already exists, update it
    existing_answer = db.query(Answer).filter(
        Answer.attempt_id == attempt_id,
        Answer.question_id == question_id
    ).first()
    
    if existing_answer:
        existing_answer.answer_text = answer_text
    else:
        # Create new answer (without grading yet)
        new_answer = Answer(
            attempt_id=attempt_id,
            question_id=question_id,
            answer_text=answer_text,
            is_correct=False  # Will be graded on final submission
        )
        db.add(new_answer)
    
    db.commit()
    
    return {"status": "saved", "question_id": question_id}

@router.get("/{attempt_id}/answers")
async def get_saved_answers(
    attempt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get all saved answers for an in-progress attempt (for restore after refresh)
    """
    attempt = db.query(QuizAttempt).filter(QuizAttempt.id == attempt_id).first()
    
    if not attempt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attempt not found"
        )
    
    if attempt.student_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not your attempt"
        )
    
    # Get all saved answers
    answers = db.query(Answer).filter(Answer.attempt_id == attempt_id).all()
    
    return {
        "attempt_id": attempt_id,
        "answers": [
            {
                "question_id": ans.question_id,
                "answer_text": ans.answer_text
            }
            for ans in answers
        ]
    }

@router.get("/{attempt_id}/remaining-time")
async def get_remaining_time(
    attempt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get remaining time for a quiz attempt
    For live sessions: calculates based on live_end_time
    For regular quizzes: calculates based on started_at + duration
    """
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
        return {
            "remaining_seconds": 0,
            "is_expired": True,
            "message": "Quiz already submitted"
        }
    
    quiz = db.query(Quiz).filter(Quiz.id == attempt.quiz_id).first()
    now = datetime.now()
    
    if quiz.is_live_session:
        # For live sessions, remaining time is until live_end_time
        remaining = (quiz.live_end_time - now).total_seconds()
        is_expired = now > quiz.live_end_time
    else:
        # For regular quizzes, remaining time is based on individual start time
        if quiz.duration_minutes:
            deadline = attempt.started_at + timedelta(minutes=quiz.duration_minutes)
            remaining = (deadline - now).total_seconds()
            is_expired = now > deadline
        else:
            # No duration limit
            remaining = None
            is_expired = False
    
    return {
        "remaining_seconds": max(0, int(remaining)) if remaining is not None else None,
        "is_expired": is_expired,
        "is_live_session": quiz.is_live_session,
        "started_at": attempt.started_at,
        "live_end_time": quiz.live_end_time if quiz.is_live_session else None
    }

@router.get("/my-attempts")
async def get_my_attempts(
    include_incomplete: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all quiz attempts for the current student with enhanced details"""
    query = db.query(QuizAttempt).filter(QuizAttempt.student_id == current_user.id)
    
    # By default, only show completed attempts
    if not include_incomplete:
        query = query.filter(QuizAttempt.is_completed == True)
    
    attempts = query.order_by(QuizAttempt.started_at.desc()).all()
    
    # Enhance each attempt with calculated fields
    result = []
    for attempt in attempts:
        quiz = db.query(Quiz).filter(Quiz.id == attempt.quiz_id).first()
        total_questions = db.query(Question).filter(Question.quiz_id == attempt.quiz_id).count()
        correct_answers = db.query(Answer).filter(
            Answer.attempt_id == attempt.id,
            Answer.is_correct == True
        ).count() if attempt.is_completed else None
        
        # Format time taken - handle None case
        time_taken_str = None
        if attempt.time_taken_minutes is not None:
            minutes = int(attempt.time_taken_minutes)
            seconds = int((attempt.time_taken_minutes - minutes) * 60)
            time_taken_str = f"{minutes}m {seconds}s"
        
        # Create response dict with explicit type conversions
        attempt_dict = {
            "id": attempt.id,
            "quiz_id": attempt.quiz_id,
            "student_id": attempt.student_id,
            "score": float(attempt.score) if attempt.score is not None else None,
            "total_marks": float(attempt.total_marks),
            "percentage": float(attempt.percentage) if attempt.percentage is not None else None,
            "started_at": attempt.started_at.isoformat() if attempt.started_at else None,
            "submitted_at": attempt.submitted_at.isoformat() if attempt.submitted_at else None,
            "time_taken_minutes": float(attempt.time_taken_minutes) if attempt.time_taken_minutes is not None else None,
            "is_completed": bool(attempt.is_completed),
            "is_graded": bool(attempt.is_graded),
            "quiz_title": quiz.title if quiz else None,
            "correct_answers": correct_answers,
            "total_questions": total_questions,
            "quiz_total_marks": float(quiz.total_marks) if quiz else float(attempt.total_marks),
            "time_taken": time_taken_str
        }
        result.append(attempt_dict)
    
    return result

@router.get("/all-attempts", dependencies=[Depends(require_role(["admin", "teacher"]))])
async def get_all_attempts(
    quiz_id: int = None,
    student_id: int = None,
    completed_only: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all quiz attempts with enhanced details for teachers/admins"""
    now = datetime.now()
    query = db.query(QuizAttempt)

    # Teachers can only see attempts for their own quizzes
    if current_user.role == "teacher":
        query = query.join(Quiz, Quiz.id == QuizAttempt.quiz_id)
        query = query.filter(Quiz.creator_id == current_user.id)
    
    # Apply filters
    if completed_only:
        query = query.filter(QuizAttempt.is_completed == True)
    
    if quiz_id:
        query = query.filter(QuizAttempt.quiz_id == quiz_id)
    
    if student_id:
        query = query.filter(QuizAttempt.student_id == student_id)
    
    attempts = query.order_by(QuizAttempt.submitted_at.desc()).all()
    
    # Enhance each attempt with calculated fields
    result = []
    for attempt in attempts:
        quiz = db.query(Quiz).filter(Quiz.id == attempt.quiz_id).first()
        student = db.query(User).filter(User.id == attempt.student_id).first()
        total_questions = db.query(Question).filter(Question.quiz_id == attempt.quiz_id).count()
        correct_answers = db.query(Answer).filter(
            Answer.attempt_id == attempt.id,
            Answer.is_correct == True
        ).count()
        answered_count = db.query(Answer).filter(Answer.attempt_id == attempt.id).count()

        remaining_seconds = None
        if not attempt.is_completed and quiz:
            if quiz.is_live_session and quiz.live_end_time:
                remaining_seconds = max(0, int((quiz.live_end_time - now).total_seconds()))
            elif quiz.duration_minutes and attempt.started_at:
                deadline = attempt.started_at + timedelta(minutes=quiz.duration_minutes)
                remaining_seconds = max(0, int((deadline - now).total_seconds()))

        progress_percentage = 0.0
        if total_questions > 0:
            progress_percentage = round((answered_count / total_questions) * 100, 2)
        
        # Format time taken
        time_taken_str = None
        if attempt.time_taken_minutes is not None:
            minutes = int(attempt.time_taken_minutes)
            seconds = int((attempt.time_taken_minutes - minutes) * 60)
            time_taken_str = f"{minutes}m {seconds}s"
        
        # Create response dict
        attempt_dict = {
            "id": attempt.id,
            "quiz_id": attempt.quiz_id,
            "student_id": attempt.student_id,
            "student_name": f"{student.first_name} {student.last_name}" if student else None,
            "student_email": student.email if student else None,
            "score": float(attempt.score) if attempt.score is not None else None,
            "total_marks": float(attempt.total_marks),
            "percentage": float(attempt.percentage) if attempt.percentage is not None else None,
            "started_at": attempt.started_at.isoformat() if attempt.started_at else None,
            "submitted_at": attempt.submitted_at.isoformat() if attempt.submitted_at else None,
            "time_taken_minutes": float(attempt.time_taken_minutes) if attempt.time_taken_minutes is not None else None,
            "is_completed": bool(attempt.is_completed),
            "is_graded": bool(attempt.is_graded),
            "quiz_title": quiz.title if quiz else None,
            "correct_answers": correct_answers,
            "answered_count": answered_count,
            "progress_percentage": progress_percentage,
            "total_questions": total_questions,
            "quiz_total_marks": float(quiz.total_marks) if quiz else float(attempt.total_marks),
            "time_taken": time_taken_str,
            "remaining_seconds": remaining_seconds,
            "status": "completed" if attempt.is_completed else "in_progress"
        }
        result.append(attempt_dict)
    
    return result

@router.get("/quiz/{quiz_id}/attempts", response_model=List[QuizAttemptResponse], dependencies=[Depends(require_role(["admin", "teacher"]))])
async def get_quiz_attempts(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Teachers can only view attempts for quizzes they created
    if current_user.role == "teacher":
        quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
        if not quiz or quiz.creator_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to view attempts for this quiz"
            )

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
            time_diff = datetime.now() - attempt.started_at
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


@router.get("/{attempt_id}", response_model=QuizAttemptResponse)
async def get_attempt(
    attempt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get a specific quiz attempt by ID with detailed results"""
    attempt = db.query(QuizAttempt).filter(QuizAttempt.id == attempt_id).first()

    if not attempt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attempt not found"
        )

    # Students can only view their own attempts, teachers/admins can view any
    if current_user.role == "student" and attempt.student_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this attempt"
        )

    # Get quiz and calculate additional fields
    quiz = db.query(Quiz).filter(Quiz.id == attempt.quiz_id).first()
    total_questions = db.query(Question).filter(Question.quiz_id == attempt.quiz_id).count()
    correct_answers = db.query(Answer).filter(
        Answer.attempt_id == attempt.id,
        Answer.is_correct == True
    ).count()

    # Format time taken
    time_taken_str = None
    if attempt.time_taken_minutes:
        minutes = int(attempt.time_taken_minutes)
        seconds = int((attempt.time_taken_minutes - minutes) * 60)
        time_taken_str = f"{minutes}m {seconds}s"

    # Convert to dict and add extra fields
    attempt_dict = {
        "id": attempt.id,
        "quiz_id": attempt.quiz_id,
        "student_id": attempt.student_id,
        "score": attempt.score,
        "total_marks": attempt.total_marks,
        "percentage": attempt.percentage,
        "started_at": attempt.started_at,
        "submitted_at": attempt.submitted_at,
        "time_taken_minutes": attempt.time_taken_minutes,
        "is_completed": attempt.is_completed,
        "is_graded": attempt.is_graded,
        "correct_answers": correct_answers,
        "total_questions": total_questions,
        "quiz_total_marks": quiz.total_marks if quiz else attempt.total_marks,
        "time_taken": time_taken_str
    }

    return attempt_dict
