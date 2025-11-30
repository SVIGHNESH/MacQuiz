"""
Migration script to transfer data from SQLite to MySQL
Run this after setting up your MySQL database
"""
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.models.models import Base, User, Subject, Quiz, Question, QuizAttempt, Answer

def migrate_sqlite_to_mysql():
    """
    Migrate data from SQLite to MySQL
    """
    # SQLite connection
    sqlite_url = "sqlite:///./quizapp.db"
    sqlite_engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})
    SQLiteSession = sessionmaker(bind=sqlite_engine)
    sqlite_db = SQLiteSession()
    
    # MySQL connection (read from .env or use direct string)
    mysql_url = os.getenv("DATABASE_URL", "mysql+pymysql://root:password@localhost:3306/macquiz_db")
    print(f"Connecting to MySQL: {mysql_url.split('@')[1] if '@' in mysql_url else mysql_url}")
    
    mysql_engine = create_engine(
        mysql_url,
        pool_pre_ping=True,
        pool_recycle=3600,
        echo=True
    )
    MySQLSession = sessionmaker(bind=mysql_engine)
    mysql_db = MySQLSession()
    
    try:
        # Create all tables in MySQL
        print("\n📋 Creating tables in MySQL...")
        Base.metadata.create_all(bind=mysql_engine)
        print("✅ Tables created successfully!")
        
        # Migrate Users
        print("\n👥 Migrating users...")
        users = sqlite_db.query(User).all()
        for user in users:
            # Check if user already exists
            existing = mysql_db.query(User).filter(User.email == user.email).first()
            if not existing:
                new_user = User(
                    id=user.id,
                    email=user.email,
                    hashed_password=user.hashed_password,
                    first_name=user.first_name,
                    last_name=user.last_name,
                    role=user.role,
                    is_active=user.is_active,
                    department=user.department,
                    student_id=user.student_id,
                    created_at=user.created_at
                )
                mysql_db.add(new_user)
        mysql_db.commit()
        print(f"✅ Migrated {len(users)} users")
        
        # Migrate Subjects
        print("\n📚 Migrating subjects...")
        subjects = sqlite_db.query(Subject).all()
        for subject in subjects:
            existing = mysql_db.query(Subject).filter(Subject.id == subject.id).first()
            if not existing:
                new_subject = Subject(
                    id=subject.id,
                    name=subject.name,
                    code=subject.code,
                    department=subject.department,
                    semester=subject.semester,
                    description=subject.description,
                    is_active=subject.is_active,
                    created_by=subject.created_by,
                    created_at=subject.created_at,
                    updated_at=subject.updated_at
                )
                mysql_db.add(new_subject)
        mysql_db.commit()
        print(f"✅ Migrated {len(subjects)} subjects")
        
        # Migrate Quizzes
        print("\n📝 Migrating quizzes...")
        quizzes = sqlite_db.query(Quiz).all()
        for quiz in quizzes:
            existing = mysql_db.query(Quiz).filter(Quiz.id == quiz.id).first()
            if not existing:
                new_quiz = Quiz(
                    id=quiz.id,
                    title=quiz.title,
                    description=quiz.description,
                    subject_id=quiz.subject_id,
                    created_by=quiz.created_by,
                    total_marks=quiz.total_marks,
                    passing_marks=quiz.passing_marks,
                    duration_minutes=quiz.duration_minutes,
                    is_active=quiz.is_active,
                    is_published=quiz.is_published,
                    scheduled_at=quiz.scheduled_at,
                    deadline=quiz.deadline,
                    allowed_departments=quiz.allowed_departments,
                    allowed_years=quiz.allowed_years,
                    attempt_limit=quiz.attempt_limit,
                    show_results_immediately=quiz.show_results_immediately,
                    shuffle_questions=quiz.shuffle_questions,
                    shuffle_options=quiz.shuffle_options,
                    is_live_session=quiz.is_live_session,
                    live_start_time=quiz.live_start_time,
                    live_end_time=quiz.live_end_time,
                    grace_period_minutes=quiz.grace_period_minutes,
                    marks_per_correct=quiz.marks_per_correct,
                    negative_marking=quiz.negative_marking,
                    created_at=quiz.created_at,
                    updated_at=quiz.updated_at
                )
                mysql_db.add(new_quiz)
        mysql_db.commit()
        print(f"✅ Migrated {len(quizzes)} quizzes")
        
        # Migrate Questions
        print("\n❓ Migrating questions...")
        questions = sqlite_db.query(Question).all()
        for question in questions:
            existing = mysql_db.query(Question).filter(Question.id == question.id).first()
            if not existing:
                new_question = Question(
                    id=question.id,
                    quiz_id=question.quiz_id,
                    question_text=question.question_text,
                    question_type=question.question_type,
                    option_a=question.option_a,
                    option_b=question.option_b,
                    option_c=question.option_c,
                    option_d=question.option_d,
                    correct_answer=question.correct_answer,
                    marks=question.marks,
                    explanation=question.explanation,
                    difficulty_level=question.difficulty_level,
                    order_index=question.order_index
                )
                mysql_db.add(new_question)
        mysql_db.commit()
        print(f"✅ Migrated {len(questions)} questions")
        
        # Migrate Quiz Attempts
        print("\n🎯 Migrating quiz attempts...")
        attempts = sqlite_db.query(QuizAttempt).all()
        for attempt in attempts:
            existing = mysql_db.query(QuizAttempt).filter(QuizAttempt.id == attempt.id).first()
            if not existing:
                new_attempt = QuizAttempt(
                    id=attempt.id,
                    quiz_id=attempt.quiz_id,
                    student_id=attempt.student_id,
                    score=attempt.score,
                    total_marks=attempt.total_marks,
                    percentage=attempt.percentage,
                    started_at=attempt.started_at,
                    submitted_at=attempt.submitted_at,
                    time_taken_minutes=attempt.time_taken_minutes,
                    is_completed=attempt.is_completed,
                    is_graded=attempt.is_graded
                )
                mysql_db.add(new_attempt)
        mysql_db.commit()
        print(f"✅ Migrated {len(attempts)} quiz attempts")
        
        # Migrate Answers
        print("\n✍️ Migrating answers...")
        answers = sqlite_db.query(Answer).all()
        for answer in answers:
            existing = mysql_db.query(Answer).filter(Answer.id == answer.id).first()
            if not existing:
                new_answer = Answer(
                    id=answer.id,
                    attempt_id=answer.attempt_id,
                    question_id=answer.question_id,
                    answer_text=answer.answer_text,
                    is_correct=answer.is_correct,
                    marks_awarded=answer.marks_awarded
                )
                mysql_db.add(new_answer)
        mysql_db.commit()
        print(f"✅ Migrated {len(answers)} answers")
        
        print("\n" + "="*50)
        print("🎉 Migration completed successfully!")
        print("="*50)
        print(f"\n📊 Summary:")
        print(f"  - Users: {len(users)}")
        print(f"  - Subjects: {len(subjects)}")
        print(f"  - Quizzes: {len(quizzes)}")
        print(f"  - Questions: {len(questions)}")
        print(f"  - Quiz Attempts: {len(attempts)}")
        print(f"  - Answers: {len(answers)}")
        
    except Exception as e:
        print(f"\n❌ Error during migration: {e}")
        mysql_db.rollback()
        raise
    finally:
        sqlite_db.close()
        mysql_db.close()

if __name__ == "__main__":
    print("="*50)
    print("SQLite to MySQL Migration")
    print("="*50)
    print("\n⚠️  IMPORTANT: Before running this script:")
    print("1. Install MySQL Server (https://dev.mysql.com/downloads/)")
    print("2. Create database: CREATE DATABASE macquiz_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
    print("3. Update .env file with your MySQL credentials")
    print("4. Install MySQL Python connector: pip install pymysql mysqlclient")
    print("\nPress Enter to continue or Ctrl+C to cancel...")
    input()
    
    migrate_sqlite_to_mysql()
