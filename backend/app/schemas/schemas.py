from pydantic import BaseModel, EmailStr, Field
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
    password: Optional[str] = None  # Allow password reset

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
    user: UserResponse

class TokenData(BaseModel):
    email: Optional[str] = None

class LoginRequest(BaseModel):
    username: str  # email
    password: str

# Subject Schemas
class SubjectBase(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    department: Optional[str] = None

class SubjectCreate(SubjectBase):
    pass

class SubjectUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    department: Optional[str] = None
    is_active: Optional[bool] = None

class SubjectResponse(SubjectBase):
    id: int
    creator_id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# Question Bank Schemas
class QuestionBankBase(BaseModel):
    subject_id: int
    question_text: str
    question_type: str = Field(..., pattern="^(mcq|true_false|short_answer)$")
    option_a: Optional[str] = None
    option_b: Optional[str] = None
    option_c: Optional[str] = None
    option_d: Optional[str] = None
    correct_answer: str
    topic: Optional[str] = None
    difficulty: str = Field(default="medium", pattern="^(easy|medium|hard)$")
    marks: float = 1.0

class QuestionBankCreate(QuestionBankBase):
    pass

class QuestionBankUpdate(BaseModel):
    question_text: Optional[str] = None
    question_type: Optional[str] = None
    option_a: Optional[str] = None
    option_b: Optional[str] = None
    option_c: Optional[str] = None
    option_d: Optional[str] = None
    correct_answer: Optional[str] = None
    topic: Optional[str] = None
    difficulty: Optional[str] = None
    marks: Optional[float] = None
    is_active: Optional[bool] = None

class QuestionBankResponse(QuestionBankBase):
    id: int
    creator_id: int
    times_used: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Quiz Question Schemas
class QuestionCreate(BaseModel):
    question_text: str
    question_type: str = Field(..., pattern="^(mcq|true_false|short_answer)$")
    option_a: Optional[str] = None
    option_b: Optional[str] = None
    option_c: Optional[str] = None
    option_d: Optional[str] = None
    correct_answer: str
    marks: float = 1.0
    question_bank_id: Optional[int] = None  # If pulling from question bank
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
    marks: float
    order: int
    
    class Config:
        from_attributes = True

class QuestionWithAnswer(QuestionResponse):
    correct_answer: str
    
    class Config:
        from_attributes = True

# Quiz Schemas
class QuizCreate(BaseModel):
    title: str
    description: Optional[str] = None
    subject_id: Optional[int] = None
    department: Optional[str] = None
    class_year: Optional[str] = None
    
    # Timing
    scheduled_at: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    grace_period_minutes: int = 5
    
    # Marking scheme
    marks_per_correct: float = 1.0
    negative_marking: float = 0.0
    
    questions: List[QuestionCreate]

class QuizUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    subject_id: Optional[int] = None
    department: Optional[str] = None
    class_year: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    grace_period_minutes: Optional[int] = None
    marks_per_correct: Optional[float] = None
    negative_marking: Optional[float] = None
    is_active: Optional[bool] = None

class QuizResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    creator_id: int
    subject_id: Optional[int]
    department: Optional[str]
    class_year: Optional[str]
    scheduled_at: Optional[datetime]
    duration_minutes: Optional[int]
    grace_period_minutes: int
    total_marks: float
    marks_per_correct: float
    negative_marking: float
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class QuizDetailResponse(QuizResponse):
    questions: List[QuestionResponse]
    creator: UserResponse
    
    class Config:
        from_attributes = True

class QuizWithAnswers(QuizResponse):
    questions: List[QuestionWithAnswer]
    
    class Config:
        from_attributes = True

# Quiz Attempt Schemas
class AnswerSubmit(BaseModel):
    question_id: int
    answer_text: str

class QuizAttemptStart(BaseModel):
    quiz_id: int

class QuizAttemptSubmit(BaseModel):
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
    time_taken_minutes: Optional[float]
    is_completed: bool
    is_graded: bool
    
    class Config:
        from_attributes = True

class QuizAttemptDetail(QuizAttemptResponse):
    quiz: QuizResponse
    student: UserResponse
    answers: List[AnswerResponse]
    
    class Config:
        from_attributes = True

# Analytics & Stats Schemas
class TeacherStats(BaseModel):
    total_quizzes_created: int
    total_questions_authored: int
    students_attempted: int
    average_quiz_score: Optional[float]
    last_quiz_created: Optional[datetime]
    active_quizzes: int
    subjects_taught: int

class StudentStats(BaseModel):
    total_quizzes_attempted: int
    quizzes_completed: int
    average_score: Optional[float]
    average_percentage: Optional[float]
    highest_score: Optional[float]
    lowest_score: Optional[float]
    last_attempt: Optional[datetime]
    pending_quizzes: int

class DashboardStats(BaseModel):
    total_quizzes: int
    active_quizzes: int
    total_students: int
    active_students: int
    total_teachers: int
    active_teachers: int
    total_subjects: int
    total_questions_bank: int
    yesterday_assessments: int
    total_attempts: int

class ActivityItem(BaseModel):
    id: int
    user_name: str
    user_role: str
    action: str
    timestamp: datetime
    details: Optional[str] = None

class UserActivityResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    department: Optional[str]
    class_year: Optional[str]
    student_id: Optional[str]
    last_active: datetime
    is_active: bool
    
    class Config:
        from_attributes = True

class PerformanceAnalytics(BaseModel):
    subject_wise_performance: List[dict]
    difficulty_wise_accuracy: dict
    time_based_trends: List[dict]
    top_performers: List[dict]
    struggling_students: List[dict]

# Bulk Operations
class BulkUserCreate(BaseModel):
    users: List[UserCreate]

class BulkUploadResponse(BaseModel):
    created_count: int
    error_count: int
    errors: List[dict]
    skipped_count: int = 0

class QuestionFilter(BaseModel):
    subject_id: Optional[int] = None
    difficulty: Optional[str] = None
    topic: Optional[str] = None
    question_type: Optional[str] = None
