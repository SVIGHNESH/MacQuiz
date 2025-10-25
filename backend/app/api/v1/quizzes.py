from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from app.db.database import get_db
from app.models.models import User, Quiz, Question, QuestionBank, Subject
from app.schemas.schemas import (
    QuizCreate, QuizResponse, QuizDetailResponse, QuizUpdate, QuizWithAnswers
)
from app.core.deps import get_current_active_user, require_role

router = APIRouter()

@router.post("/", response_model=QuizResponse, dependencies=[Depends(require_role(["admin", "teacher"]))])
async def create_quiz(
    quiz_data: QuizCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Create a new quiz with questions (Admin and Teacher only)
    Supports:
    - Manual questions
    - Questions from question bank
    - Custom marking scheme
    - Scheduled start time
    - Grace period for late starts
    """
    # Verify subject if provided
    if quiz_data.subject_id:
        subject = db.query(Subject).filter(Subject.id == quiz_data.subject_id).first()
        if not subject:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Subject not found"
            )
    
    # Calculate total marks
    total_marks = sum(q.marks for q in quiz_data.questions)
    
    # Create quiz
    db_quiz = Quiz(
        title=quiz_data.title,
        description=quiz_data.description,
        creator_id=current_user.id,
        subject_id=quiz_data.subject_id,
        department=quiz_data.department,
        class_year=quiz_data.class_year,
        scheduled_at=quiz_data.scheduled_at,
        duration_minutes=quiz_data.duration_minutes,
        grace_period_minutes=quiz_data.grace_period_minutes,
        total_marks=total_marks,
        marks_per_correct=quiz_data.marks_per_correct,
        negative_marking=quiz_data.negative_marking
    )
    
    db.add(db_quiz)
    db.commit()
    db.refresh(db_quiz)
    
    # Create questions
    for idx, question_data in enumerate(quiz_data.questions):
        # If question is from bank, increment usage count
        if question_data.question_bank_id:
            bank_question = db.query(QuestionBank).filter(
                QuestionBank.id == question_data.question_bank_id
            ).first()
            if bank_question:
                bank_question.times_used += 1
        
        db_question = Question(
            quiz_id=db_quiz.id,
            question_bank_id=question_data.question_bank_id,
            question_text=question_data.question_text,
            question_type=question_data.question_type,
            option_a=question_data.option_a,
            option_b=question_data.option_b,
            option_c=question_data.option_c,
            option_d=question_data.option_d,
            correct_answer=question_data.correct_answer,
            marks=question_data.marks,
            order=idx
        )
        db.add(db_question)
    
    db.commit()
    db.refresh(db_quiz)
    
    return db_quiz

@router.get("/", response_model=List[QuizResponse])
async def get_all_quizzes(
    skip: int = 0,
    limit: int = 100,
    is_active: Optional[bool] = None,
    subject_id: Optional[int] = None,
    department: Optional[str] = None,
    class_year: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get quizzes with filtering options
    - Students: Only active quizzes available to them
    - Teachers: Only their created quizzes
    - Admin: All quizzes
    """
    query = db.query(Quiz)
    
    # Role-based filtering
    if current_user.role == "student":
        query = query.filter(Quiz.is_active == True)
        # Student-specific filters
        if current_user.department:
            query = query.filter(
                (Quiz.department == current_user.department) | 
                (Quiz.department == None)
            )
        if current_user.class_year:
            query = query.filter(
                (Quiz.class_year == current_user.class_year) | 
                (Quiz.class_year == None)
            )
    elif current_user.role == "teacher":
        query = query.filter(Quiz.creator_id == current_user.id)
    
    # Additional filters
    if is_active is not None:
        query = query.filter(Quiz.is_active == is_active)
    
    if subject_id:
        query = query.filter(Quiz.subject_id == subject_id)
    
    if department:
        query = query.filter(Quiz.department == department)
    
    if class_year:
        query = query.filter(Quiz.class_year == class_year)
    
    quizzes = query.order_by(Quiz.created_at.desc()).offset(skip).limit(limit).all()
    return quizzes

@router.get("/{quiz_id}", response_model=QuizDetailResponse)
async def get_quiz(
    quiz_id: int,
    include_answers: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get quiz details with questions
    - include_answers: Only for teachers/admin after quiz submission
    """
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz not found"
        )
    
    # Check permissions
    if current_user.role == "student":
        if not quiz.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Quiz not available"
            )
        # Check if quiz is scheduled and within grace period
        if quiz.scheduled_at:
            now = datetime.utcnow()
            grace_end = quiz.scheduled_at + timedelta(minutes=quiz.grace_period_minutes)
            if now < quiz.scheduled_at:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Quiz not started yet. Starts at {quiz.scheduled_at}"
                )
            if now > grace_end:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Quiz grace period expired. Cannot start now."
                )
    
    return quiz


@router.get("/{quiz_id}/eligibility")
async def check_quiz_eligibility(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Check if student can take the quiz
    """
    from app.models.models import QuizAttempt
    
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz not found"
        )
    
    if not quiz.is_active:
        return {
            "eligible": False,
            "reason": "Quiz is not active"
        }
    
    # Check if already attempted
    existing_attempt = db.query(QuizAttempt).filter(
        QuizAttempt.quiz_id == quiz_id,
        QuizAttempt.student_id == current_user.id
    ).first()
    
    if existing_attempt:
        return {
            "eligible": False,
            "reason": "Already attempted this quiz"
        }
    
    # Check schedule and grace period
    if quiz.scheduled_at:
        now = datetime.utcnow()
        grace_end = quiz.scheduled_at + timedelta(minutes=quiz.grace_period_minutes)
        
        if now < quiz.scheduled_at:
            return {
                "eligible": False,
                "reason": f"Quiz starts at {quiz.scheduled_at}",
                "scheduled_at": quiz.scheduled_at
            }
        
        if now > grace_end:
            return {
                "eligible": False,
                "reason": "Quiz grace period expired"
            }
    
    return {
        "eligible": True,
        "quiz_id": quiz_id,
        "title": quiz.title,
        "duration_minutes": quiz.duration_minutes,
        "total_marks": quiz.total_marks
    }

@router.put("/{quiz_id}", response_model=QuizResponse, dependencies=[Depends(require_role(["admin", "teacher"]))])
async def update_quiz(
    quiz_id: int,
    quiz_data: QuizUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz not found"
        )
    
    # Check if user can update (creator or admin)
    if current_user.role != "admin" and quiz.creator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    update_data = quiz_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(quiz, field, value)
    
    db.commit()
    db.refresh(quiz)
    
    return quiz

@router.delete("/{quiz_id}", dependencies=[Depends(require_role(["admin", "teacher"]))])
async def delete_quiz(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz not found"
        )
    
    # Check if user can delete (creator or admin)
    if current_user.role != "admin" and quiz.creator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    db.delete(quiz)
    db.commit()
    
    return {"message": "Quiz deleted successfully"}


@router.get("/{quiz_id}/statistics")
async def get_quiz_statistics(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "teacher"]))
):
    """
    Get detailed statistics for a quiz (Teacher/Admin only)
    """
    from app.models.models import QuizAttempt
    from sqlalchemy import func
    
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz not found"
        )
    
    # Check permissions
    if current_user.role == "teacher" and quiz.creator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this quiz's statistics"
        )
    
    total_attempts = db.query(QuizAttempt).filter(
        QuizAttempt.quiz_id == quiz_id
    ).count()
    
    completed_attempts = db.query(QuizAttempt).filter(
        QuizAttempt.quiz_id == quiz_id,
        QuizAttempt.is_completed == True
    ).count()
    
    average_score = db.query(func.avg(QuizAttempt.score)).filter(
        QuizAttempt.quiz_id == quiz_id,
        QuizAttempt.is_completed == True
    ).scalar() or 0
    
    average_percentage = db.query(func.avg(QuizAttempt.percentage)).filter(
        QuizAttempt.quiz_id == quiz_id,
        QuizAttempt.is_completed == True
    ).scalar() or 0
    
    highest_score = db.query(func.max(QuizAttempt.score)).filter(
        QuizAttempt.quiz_id == quiz_id,
        QuizAttempt.is_completed == True
    ).scalar() or 0
    
    lowest_score = db.query(func.min(QuizAttempt.score)).filter(
        QuizAttempt.quiz_id == quiz_id,
        QuizAttempt.is_completed == True,
        QuizAttempt.score > 0
    ).scalar() or 0
    
    return {
        "quiz_id": quiz_id,
        "quiz_title": quiz.title,
        "total_marks": quiz.total_marks,
        "total_attempts": total_attempts,
        "completed_attempts": completed_attempts,
        "in_progress": total_attempts - completed_attempts,
        "average_score": round(average_score, 2),
        "average_percentage": round(average_percentage, 2),
        "highest_score": highest_score,
        "lowest_score": lowest_score,
        "pass_rate": round((completed_attempts / total_attempts * 100), 2) if total_attempts > 0 else 0
    }


@router.get("/{quiz_id}/attempts")
async def get_quiz_attempts(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "teacher"]))
):
    """
    Get all attempts for a quiz (Teacher/Admin only)
    """
    from app.models.models import QuizAttempt
    
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz not found"
        )
    
    # Check permissions
    if current_user.role == "teacher" and quiz.creator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this quiz's attempts"
        )
    
    attempts = db.query(QuizAttempt).filter(
        QuizAttempt.quiz_id == quiz_id
    ).all()
    
    return attempts
