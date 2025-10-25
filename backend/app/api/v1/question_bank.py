from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.deps import get_db, get_current_user, require_role
from app.models.models import QuestionBank, User, Subject
from app.schemas.schemas import (
    QuestionBankCreate, QuestionBankUpdate, QuestionBankResponse, QuestionFilter
)

router = APIRouter()

@router.post("/", response_model=QuestionBankResponse, status_code=status.HTTP_201_CREATED)
def create_question(
    question: QuestionBankCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "teacher"]))
):
    """
    Add a question to the question bank (Admin and Teacher only)
    """
    # Verify subject exists
    subject = db.query(Subject).filter(Subject.id == question.subject_id).first()
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subject not found"
        )
    
    db_question = QuestionBank(
        **question.dict(),
        creator_id=current_user.id
    )
    db.add(db_question)
    db.commit()
    db.refresh(db_question)
    return db_question


@router.get("/", response_model=List[QuestionBankResponse])
def get_questions(
    skip: int = 0,
    limit: int = 100,
    subject_id: Optional[int] = None,
    difficulty: Optional[str] = Query(None, regex="^(easy|medium|hard)$"),
    topic: Optional[str] = None,
    question_type: Optional[str] = Query(None, regex="^(mcq|true_false|short_answer)$"),
    active_only: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get questions from question bank with filtering
    """
    query = db.query(QuestionBank)
    
    if active_only:
        query = query.filter(QuestionBank.is_active == True)
    
    if subject_id:
        query = query.filter(QuestionBank.subject_id == subject_id)
    
    if difficulty:
        query = query.filter(QuestionBank.difficulty == difficulty)
    
    if topic:
        query = query.filter(QuestionBank.topic.ilike(f"%{topic}%"))
    
    if question_type:
        query = query.filter(QuestionBank.question_type == question_type)
    
    questions = query.offset(skip).limit(limit).all()
    return questions


@router.get("/{question_id}", response_model=QuestionBankResponse)
def get_question(
    question_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a specific question from the bank
    """
    question = db.query(QuestionBank).filter(QuestionBank.id == question_id).first()
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )
    return question


@router.put("/{question_id}", response_model=QuestionBankResponse)
def update_question(
    question_id: int,
    question_update: QuestionBankUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "teacher"]))
):
    """
    Update a question in the bank (Admin and Teacher only)
    """
    question = db.query(QuestionBank).filter(QuestionBank.id == question_id).first()
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )
    
    # Check permissions (creator or admin)
    if current_user.role != "admin" and question.creator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to update this question"
        )
    
    # Update fields
    update_data = question_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(question, field, value)
    
    from datetime import datetime
    question.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(question)
    return question


@router.delete("/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_question(
    question_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "teacher"]))
):
    """
    Delete a question from the bank (Admin and Teacher only)
    """
    question = db.query(QuestionBank).filter(QuestionBank.id == question_id).first()
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )
    
    # Check permissions (creator or admin)
    if current_user.role != "admin" and question.creator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to delete this question"
        )
    
    # Soft delete
    question.is_active = False
    db.commit()
    return None


@router.get("/subjects/{subject_id}/topics")
def get_topics_by_subject(
    subject_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all unique topics for a subject
    """
    from sqlalchemy import func
    
    topics = db.query(QuestionBank.topic).filter(
        QuestionBank.subject_id == subject_id,
        QuestionBank.is_active == True,
        QuestionBank.topic.isnot(None)
    ).distinct().all()
    
    return {"topics": [topic[0] for topic in topics if topic[0]]}


@router.get("/subjects/{subject_id}/statistics")
def get_subject_question_statistics(
    subject_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get statistics about questions for a subject
    """
    total_questions = db.query(QuestionBank).filter(
        QuestionBank.subject_id == subject_id,
        QuestionBank.is_active == True
    ).count()
    
    easy = db.query(QuestionBank).filter(
        QuestionBank.subject_id == subject_id,
        QuestionBank.difficulty == "easy",
        QuestionBank.is_active == True
    ).count()
    
    medium = db.query(QuestionBank).filter(
        QuestionBank.subject_id == subject_id,
        QuestionBank.difficulty == "medium",
        QuestionBank.is_active == True
    ).count()
    
    hard = db.query(QuestionBank).filter(
        QuestionBank.subject_id == subject_id,
        QuestionBank.difficulty == "hard",
        QuestionBank.is_active == True
    ).count()
    
    mcq = db.query(QuestionBank).filter(
        QuestionBank.subject_id == subject_id,
        QuestionBank.question_type == "mcq",
        QuestionBank.is_active == True
    ).count()
    
    true_false = db.query(QuestionBank).filter(
        QuestionBank.subject_id == subject_id,
        QuestionBank.question_type == "true_false",
        QuestionBank.is_active == True
    ).count()
    
    short_answer = db.query(QuestionBank).filter(
        QuestionBank.subject_id == subject_id,
        QuestionBank.question_type == "short_answer",
        QuestionBank.is_active == True
    ).count()
    
    return {
        "subject_id": subject_id,
        "total_questions": total_questions,
        "by_difficulty": {
            "easy": easy,
            "medium": medium,
            "hard": hard
        },
        "by_type": {
            "mcq": mcq,
            "true_false": true_false,
            "short_answer": short_answer
        }
    }
