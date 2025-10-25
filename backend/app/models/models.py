from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Float, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    role = Column(String, nullable=False)  # 'admin', 'teacher', 'student'
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_active = Column(DateTime, default=datetime.utcnow)
    
    # Student specific fields
    student_id = Column(String, unique=True, nullable=True, index=True)
    department = Column(String, nullable=True)
    class_year = Column(String, nullable=True)  # '1st Year', '2nd Year', etc.
    phone_number = Column(String, nullable=True)
    
    # Relationships
    quizzes_created = relationship("Quiz", back_populates="creator", foreign_keys="Quiz.creator_id")
    quiz_attempts = relationship("QuizAttempt", back_populates="student")
    subjects_created = relationship("Subject", back_populates="creator")
    questions_created = relationship("QuestionBank", back_populates="creator")

class Quiz(Base):
    __tablename__ = "quizzes"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=True)
    department = Column(String, nullable=True)
    class_year = Column(String, nullable=True)
    
    # Timing and scheduling
    scheduled_at = Column(DateTime, nullable=True)  # When quiz becomes available
    duration_minutes = Column(Integer, nullable=True)  # Quiz duration
    grace_period_minutes = Column(Integer, default=5)  # Late start grace period
    
    # Marking scheme
    total_marks = Column(Float, default=0)
    marks_per_correct = Column(Float, default=1)  # Default marks for correct answer
    negative_marking = Column(Float, default=0)  # Negative marks for incorrect answer
    
    # Status
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    creator = relationship("User", back_populates="quizzes_created", foreign_keys=[creator_id])
    subject = relationship("Subject", back_populates="quizzes")
    questions = relationship("Question", back_populates="quiz", cascade="all, delete-orphan")
    attempts = relationship("QuizAttempt", back_populates="quiz")

class Question(Base):
    __tablename__ = "questions"
    
    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"), nullable=False)
    question_bank_id = Column(Integer, ForeignKey("question_bank.id"), nullable=True)  # If pulled from bank
    question_text = Column(Text, nullable=False)
    question_type = Column(String, nullable=False)  # 'mcq', 'true_false', 'short_answer'
    
    # MCQ options
    option_a = Column(String, nullable=True)
    option_b = Column(String, nullable=True)
    option_c = Column(String, nullable=True)
    option_d = Column(String, nullable=True)
    correct_answer = Column(String, nullable=False)
    
    # Marks
    marks = Column(Float, default=1)
    order = Column(Integer, default=0)  # Question order in quiz
    
    # Relationships
    quiz = relationship("Quiz", back_populates="questions")
    question_bank = relationship("QuestionBank", back_populates="quiz_questions")

class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"
    
    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Scores
    score = Column(Float, nullable=True)
    total_marks = Column(Float, nullable=False)
    percentage = Column(Float, nullable=True)
    
    # Timing
    started_at = Column(DateTime, default=datetime.utcnow)
    submitted_at = Column(DateTime, nullable=True)
    time_taken_minutes = Column(Float, nullable=True)  # Actual time taken
    
    # Status
    is_completed = Column(Boolean, default=False)
    is_graded = Column(Boolean, default=False)
    
    # Relationships
    quiz = relationship("Quiz", back_populates="attempts")
    student = relationship("User", back_populates="quiz_attempts")
    answers = relationship("Answer", back_populates="attempt", cascade="all, delete-orphan")


class Answer(Base):
    __tablename__ = "answers"
    
    id = Column(Integer, primary_key=True, index=True)
    attempt_id = Column(Integer, ForeignKey("quiz_attempts.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    answer_text = Column(Text, nullable=True)
    is_correct = Column(Boolean, nullable=True)
    marks_awarded = Column(Float, default=0)
    
    # Relationships
    attempt = relationship("QuizAttempt", back_populates="answers")


# NEW MODELS FOR ENHANCED FEATURES

class Subject(Base):
    __tablename__ = "subjects"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    code = Column(String, nullable=False, unique=True)
    description = Column(Text, nullable=True)
    department = Column(String, nullable=True)
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    creator = relationship("User", back_populates="subjects_created")
    quizzes = relationship("Quiz", back_populates="subject")
    question_bank = relationship("QuestionBank", back_populates="subject")


class QuestionBank(Base):
    __tablename__ = "question_bank"
    
    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Question details
    question_text = Column(Text, nullable=False)
    question_type = Column(String, nullable=False)  # 'mcq', 'true_false', 'short_answer'
    
    # MCQ options
    option_a = Column(String, nullable=True)
    option_b = Column(String, nullable=True)
    option_c = Column(String, nullable=True)
    option_d = Column(String, nullable=True)
    correct_answer = Column(String, nullable=False)
    
    # Organization
    topic = Column(String, nullable=True)
    difficulty = Column(String, default='medium')  # 'easy', 'medium', 'hard'
    marks = Column(Float, default=1)
    
    # Metadata
    times_used = Column(Integer, default=0)  # How many times used in quizzes
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    subject = relationship("Subject", back_populates="question_bank")
    creator = relationship("User", back_populates="questions_created")
    quiz_questions = relationship("Question", back_populates="question_bank")
