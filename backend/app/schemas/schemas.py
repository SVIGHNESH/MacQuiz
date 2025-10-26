from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

# Enums - Updated to match database uppercase values
class RoleEnum(str, Enum):
    ADMIN = "ADMIN"
    TEACHER = "TEACHER"
    STUDENT = "STUDENT"

class QuestionTypeEnum(str, Enum):
    SINGLE_CHOICE = "SINGLE_CHOICE"
    MULTIPLE_CHOICE = "MULTIPLE_CHOICE"
    TRUE_FALSE = "TRUE_FALSE"
    SHORT_ANSWER = "SHORT_ANSWER"

class DifficultyLevel(str, Enum):
    EASY = "EASY"
    MEDIUM = "MEDIUM"
    HARD = "HARD"

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    role: RoleEnum
    phone_number: Optional[str] = None
    department: Optional[str] = None
    class_year: Optional[str] = None
    student_id: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone_number: Optional[str] = None
    department: Optional[str] = None
    class_year: Optional[str] = None
    is_active: Optional[bool] = None

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    last_active: datetime
    
    class Config:
        from_attributes = True

class BulkUserCreate(BaseModel):
    users: List[UserCreate]

# Subject Schemas
class SubjectBase(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    department: Optional[str] = None

class SubjectCreate(SubjectBase):
    pass

class SubjectResponse(SubjectBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Question Bank Schemas
class QuestionBankBase(BaseModel):
    subject_id: int
    question_text: str
    question_type: QuestionTypeEnum
    option_a: Optional[str] = None
    option_b: Optional[str] = None
    option_c: Optional[str] = None
    option_d: Optional[str] = None
    correct_answer: str
    difficulty_level: Optional[DifficultyLevel] = None
    topic: Optional[str] = None

class QuestionBankCreate(QuestionBankBase):
    pass

class QuestionBankResponse(QuestionBankBase):
    id: int
    created_by: Optional[int]
    created_at: datetime
    
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
    question_type: QuestionTypeEnum
    option_a: Optional[str] = None
    option_b: Optional[str] = None
    option_c: Optional[str] = None
    option_d: Optional[str] = None
    correct_answer: str
    marks: float = 1.0
    order: int = 0

class QuestionFromBank(BaseModel):
    question_bank_id: int
    marks: float = 1.0
    order: int = 0

class QuestionResponse(BaseModel):
    id: int
    quiz_id: int
    question_text: str
    question_type: str
    option_a: Optional[str]
    option_b: Optional[str]
    option_c: Optional[str]
    option_d: Optional[str]
    correct_answer: str
    marks: float
    order: int
    
    class Config:
        from_attributes = True

class QuizCreate(BaseModel):
    title: str
    description: Optional[str] = None
    subject_id: Optional[int] = None
    department: Optional[str] = None
    class_year: Optional[str] = None
    scheduled_start_time: Optional[datetime] = None
    duration_minutes: int = 30
    grace_period_minutes: int = 5
    marks_per_correct: float = 1.0
    marks_per_incorrect: float = 0.0  # For negative marking
    questions: List[QuestionCreate] = []
    questions_from_bank: List[QuestionFromBank] = []

class QuizUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    scheduled_start_time: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    grace_period_minutes: Optional[int] = None
    marks_per_correct: Optional[float] = None
    marks_per_incorrect: Optional[float] = None
    is_active: Optional[bool] = None

class QuizResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    creator_id: int
    subject_id: Optional[int]
    department: Optional[str]
    class_year: Optional[str]
    scheduled_start_time: Optional[datetime]
    duration_minutes: int
    grace_period_minutes: int
    marks_per_correct: float
    marks_per_incorrect: float
    total_marks: float
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class QuizDetailResponse(QuizResponse):
    questions: List[QuestionResponse]
    subject: Optional[SubjectResponse] = None
    
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

class AnswerResponse(BaseModel):
    id: int
    question_id: int
    answer_text: Optional[str]
    is_correct: Optional[bool]
    marks_awarded: float
    
    class Config:
        from_attributes = True

class QuizAttemptResponse(BaseModel):
    id: int
    quiz_id: int
    student_id: int
    score: Optional[float]
    total_marks: float
    percentage: Optional[float]
    started_at: datetime
    submitted_at: Optional[datetime]
    is_completed: bool
    time_taken_minutes: Optional[int]
    
    class Config:
        from_attributes = True

class QuizAttemptDetailResponse(QuizAttemptResponse):
    answers: List[AnswerResponse]
    quiz: QuizResponse
    
    class Config:
        from_attributes = True

# Stats Schemas
class TeacherStats(BaseModel):
    teacher_id: int
    teacher_name: str
    email: str
    department: Optional[str]
    total_quizzes_created: int
    total_questions_created: int
    total_students_attempted: int
    average_quiz_score: Optional[float]
    last_quiz_created: Optional[datetime]

class StudentStats(BaseModel):
    student_id: int
    student_name: str
    email: str
    student_code: Optional[str]
    department: Optional[str]
    class_year: Optional[str]
    total_quizzes_attempted: int
    total_quizzes_completed: int
    average_score: Optional[float]
    average_percentage: Optional[float]
    highest_score: Optional[float]
    lowest_score: Optional[float]
    last_quiz_attempted: Optional[datetime]

class DashboardStats(BaseModel):
    total_quizzes: int
    active_students: int
    total_students: int
    total_teachers: int
    active_teachers_today: int
    yesterday_assessments: int
    total_subjects: int
    total_question_bank_items: int

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

# Quiz Timing Validation
class QuizAvailability(BaseModel):
    is_available: bool
    message: str
    can_start: bool
    scheduled_start: Optional[datetime]
    grace_period_end: Optional[datetime]
    quiz_end: Optional[datetime]
