from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.models.models import User
from app.schemas.schemas import UserCreate, UserResponse, UserUpdate, UserActivityResponse
from app.core.security import get_password_hash
from app.core.deps import get_current_active_user, require_role

router = APIRouter()

@router.post("/", response_model=UserResponse, dependencies=[Depends(require_role(["admin"]))])
async def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Check if student_id already exists (for students)
    if user_data.role == "student" and user_data.student_id:
        existing_student = db.query(User).filter(User.student_id == user_data.student_id).first()
        if existing_student:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Student ID already registered"
            )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    db_user = User(
        email=user_data.email,
        hashed_password=hashed_password,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        role=user_data.role.lower(),
        department=user_data.department,
        class_year=user_data.class_year,
        student_id=user_data.student_id if user_data.role.lower() == "student" else None
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return db_user

@router.get("/", response_model=List[UserResponse], dependencies=[Depends(require_role(["admin"]))])
async def get_all_users(
    skip: int = 0,
    limit: int = 100,
    role: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(User)
    
    if role:
        query = query.filter(User.role == role.lower())
    
    users = query.offset(skip).limit(limit).all()
    return users

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_active_user)
):
    return current_user

@router.get("/{user_id}", response_model=UserResponse, dependencies=[Depends(require_role(["admin"]))])
async def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user

@router.put("/{user_id}", response_model=UserResponse, dependencies=[Depends(require_role(["admin"]))])
async def update_user(
    user_id: int,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    update_data = user_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)
    
    db.commit()
    db.refresh(user)
    
    return user

@router.delete("/{user_id}", dependencies=[Depends(require_role(["admin"]))])
async def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    db.delete(user)
    db.commit()
    
    return {"message": "User deleted successfully"}

@router.get("/activity/teachers", response_model=List[UserActivityResponse], dependencies=[Depends(require_role(["admin"]))])
async def get_teacher_activity(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    teachers = db.query(User).filter(User.role == "teacher").all()
    return [
        {
            "id": teacher.id,
            "name": f"{teacher.first_name} {teacher.last_name}",
            "email": teacher.email,
            "role": teacher.role,
            "department": teacher.department,
            "class_year": teacher.class_year,
            "student_id": teacher.student_id,
            "last_active": teacher.last_active
        }
        for teacher in teachers
    ]

@router.get("/activity/students", response_model=List[UserActivityResponse], dependencies=[Depends(require_role(["admin"]))])
async def get_student_activity(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    students = db.query(User).filter(User.role == "student").all()
    return [
        {
            "id": student.id,
            "name": f"{student.first_name} {student.last_name}",
            "email": student.email,
            "role": student.role,
            "department": student.department,
            "class_year": student.class_year,
            "student_id": student.student_id,
            "last_active": student.last_active
        }
        for student in students
    ]
