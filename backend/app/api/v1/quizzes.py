from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.models.models import User, Quiz, Question
from app.schemas.schemas import QuizCreate, QuizResponse, QuizDetailResponse, QuizUpdate
from app.core.deps import get_current_active_user, require_role

router = APIRouter()

@router.post("/", response_model=QuizResponse, dependencies=[Depends(require_role(["admin", "teacher"]))])
async def create_quiz(
    quiz_data: QuizCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Calculate total marks
    total_marks = sum(q.marks for q in quiz_data.questions)
    
    # Create quiz
    db_quiz = Quiz(
        title=quiz_data.title,
        description=quiz_data.description,
        creator_id=current_user.id,
        department=quiz_data.department,
        class_year=quiz_data.class_year,
        total_marks=total_marks,
        duration_minutes=quiz_data.duration_minutes
    )
    
    db.add(db_quiz)
    db.commit()
    db.refresh(db_quiz)
    
    # Create questions
    for question_data in quiz_data.questions:
        db_question = Question(
            quiz_id=db_quiz.id,
            question_text=question_data.question_text,
            question_type=question_data.question_type,
            option_a=question_data.option_a,
            option_b=question_data.option_b,
            option_c=question_data.option_c,
            option_d=question_data.option_d,
            correct_answer=question_data.correct_answer,
            marks=question_data.marks
        )
        db.add(db_question)
    
    db.commit()
    db.refresh(db_quiz)
    
    return db_quiz

@router.get("/", response_model=List[QuizResponse])
async def get_all_quizzes(
    skip: int = 0,
    limit: int = 100,
    is_active: bool = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(Quiz)
    
    if is_active is not None:
        query = query.filter(Quiz.is_active == is_active)
    
    # Students see only active quizzes, teachers/admins see all their quizzes
    if current_user.role == "student":
        query = query.filter(Quiz.is_active == True)
    elif current_user.role == "teacher":
        query = query.filter(Quiz.creator_id == current_user.id)
    
    quizzes = query.offset(skip).limit(limit).all()
    return quizzes

@router.get("/{quiz_id}", response_model=QuizDetailResponse)
async def get_quiz(
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
    
    # Check permissions
    if current_user.role == "student" and not quiz.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Quiz not available"
        )
    
    return quiz

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
