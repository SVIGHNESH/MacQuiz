from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    role: str
    department: Optional[str] = None
    class_year: Optional[str] = None
    student_id: Optional[str] = None
    phone_number: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    department: Optional[str] = None
    class_year: Optional[str] = None
    phone_number: Optional[str] = None
    is_active: Optional[bool] = None

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    last_active: datetime
    
    class Config:
        from_attributes = True

# Authentication Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class LoginRequest(BaseModel):
    username: str  # email
    password: str

# Quiz Schemas
class QuestionCreate(BaseModel):
    question_text: str
    question_type: str
    option_a: Optional[str] = None
    option_b: Optional[str] = None
    option_c: Optional[str] = None
    option_d: Optional[str] = None
    correct_answer: str
    marks: float = 1.0

class QuestionResponse(QuestionCreate):
    id: int
    quiz_id: int
    
    class Config:
        from_attributes = True

class QuizCreate(BaseModel):
    title: str
    description: Optional[str] = None
    department: Optional[str] = None
    class_year: Optional[str] = None
    duration_minutes: Optional[int] = None
    questions: List[QuestionCreate]

class QuizUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

class QuizResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    creator_id: int
    department: Optional[str]
    class_year: Optional[str]
    total_marks: float
    duration_minutes: Optional[int]
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class QuizDetailResponse(QuizResponse):
    questions: List[QuestionResponse]
    
    class Config:
        from_attributes = True

# Quiz Attempt Schemas
class AnswerSubmit(BaseModel):
    question_id: int
    answer_text: str

class QuizAttemptStart(BaseModel):
    quiz_id: int

class QuizAttemptSubmit(BaseModel):
    attempt_id: int
    answers: List[AnswerSubmit]

class QuizAttemptResponse(BaseModel):
    id: int
    quiz_id: int
    student_id: int
    score: Optional[float]
    total_marks: float
    percentage: Optional[float]
    started_at: datetime
    submitted_at: Optional[datetime]
    
    class Config:
        from_attributes = True

# Stats Schemas
class DashboardStats(BaseModel):
    total_quizzes: int
    active_students: int
    total_students: int
    yesterday_assessments: int
    yesterday_attendance: int
    active_teachers_today: int
    total_teachers: int

class ActivityItem(BaseModel):
    user: str
    action: str
    time: str
    status: str

class UserActivityResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    department: Optional[str]
    class_year: Optional[str]
    student_id: Optional[str]
    last_active: datetime
    
    class Config:
        from_attributes = True
