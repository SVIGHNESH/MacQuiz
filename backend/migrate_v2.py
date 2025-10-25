"""
Database Migration Script for MacQuiz v2.0
Adds new tables and columns for enhanced features
"""

import sqlite3
import os
from datetime import datetime

DB_PATH = "quizapp.db"
BACKUP_PATH = f"quizapp_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.db"

def backup_database():
    """Create a backup of the existing database"""
    if os.path.exists(DB_PATH):
        import shutil
        shutil.copy2(DB_PATH, BACKUP_PATH)
        print(f"✅ Database backed up to: {BACKUP_PATH}")
        return True
    return False

def migrate_database():
    """Apply database migrations"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print("\n🔄 Starting database migration...")
    
    try:
        # Create subjects table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS subjects (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR NOT NULL UNIQUE,
                code VARCHAR NOT NULL UNIQUE,
                description TEXT,
                department VARCHAR,
                creator_id INTEGER NOT NULL,
                is_active BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (creator_id) REFERENCES users(id)
            )
        """)
        print("✅ Created subjects table")
        
        # Create question_bank table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS question_bank (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                subject_id INTEGER NOT NULL,
                creator_id INTEGER NOT NULL,
                question_text TEXT NOT NULL,
                question_type VARCHAR NOT NULL,
                option_a VARCHAR,
                option_b VARCHAR,
                option_c VARCHAR,
                option_d VARCHAR,
                correct_answer VARCHAR NOT NULL,
                topic VARCHAR,
                difficulty VARCHAR DEFAULT 'medium',
                marks FLOAT DEFAULT 1.0,
                times_used INTEGER DEFAULT 0,
                is_active BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (subject_id) REFERENCES subjects(id),
                FOREIGN KEY (creator_id) REFERENCES users(id)
            )
        """)
        print("✅ Created question_bank table")
        
        # Add new columns to quizzes table
        try:
            cursor.execute("ALTER TABLE quizzes ADD COLUMN subject_id INTEGER")
            print("✅ Added subject_id to quizzes")
        except sqlite3.OperationalError:
            print("⚠️  subject_id already exists in quizzes")
        
        try:
            cursor.execute("ALTER TABLE quizzes ADD COLUMN scheduled_at DATETIME")
            print("✅ Added scheduled_at to quizzes")
        except sqlite3.OperationalError:
            print("⚠️  scheduled_at already exists in quizzes")
        
        try:
            cursor.execute("ALTER TABLE quizzes ADD COLUMN grace_period_minutes INTEGER DEFAULT 5")
            print("✅ Added grace_period_minutes to quizzes")
        except sqlite3.OperationalError:
            print("⚠️  grace_period_minutes already exists in quizzes")
        
        try:
            cursor.execute("ALTER TABLE quizzes ADD COLUMN marks_per_correct FLOAT DEFAULT 1.0")
            print("✅ Added marks_per_correct to quizzes")
        except sqlite3.OperationalError:
            print("⚠️  marks_per_correct already exists in quizzes")
        
        try:
            cursor.execute("ALTER TABLE quizzes ADD COLUMN negative_marking FLOAT DEFAULT 0.0")
            print("✅ Added negative_marking to quizzes")
        except sqlite3.OperationalError:
            print("⚠️  negative_marking already exists in quizzes")
        
        try:
            cursor.execute("ALTER TABLE quizzes ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP")
            print("✅ Added updated_at to quizzes")
        except sqlite3.OperationalError:
            print("⚠️  updated_at already exists in quizzes")
        
        # Add new columns to questions table
        try:
            cursor.execute("ALTER TABLE questions ADD COLUMN question_bank_id INTEGER")
            print("✅ Added question_bank_id to questions")
        except sqlite3.OperationalError:
            print("⚠️  question_bank_id already exists in questions")
        
        try:
            cursor.execute("ALTER TABLE questions ADD COLUMN `order` INTEGER DEFAULT 0")
            print("✅ Added order to questions")
        except sqlite3.OperationalError:
            print("⚠️  order already exists in questions")
        
        # Add new columns to quiz_attempts table
        try:
            cursor.execute("ALTER TABLE quiz_attempts ADD COLUMN time_taken_minutes FLOAT")
            print("✅ Added time_taken_minutes to quiz_attempts")
        except sqlite3.OperationalError:
            print("⚠️  time_taken_minutes already exists in quiz_attempts")
        
        try:
            cursor.execute("ALTER TABLE quiz_attempts ADD COLUMN is_completed BOOLEAN DEFAULT 0")
            print("✅ Added is_completed to quiz_attempts")
        except sqlite3.OperationalError:
            print("⚠️  is_completed already exists in quiz_attempts")
        
        try:
            cursor.execute("ALTER TABLE quiz_attempts ADD COLUMN is_graded BOOLEAN DEFAULT 0")
            print("✅ Added is_graded to quiz_attempts")
        except sqlite3.OperationalError:
            print("⚠️  is_graded already exists in quiz_attempts")
        
        conn.commit()
        print("\n✅ Migration completed successfully!")
        
        # Display table info
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = cursor.fetchall()
        print(f"\n📊 Total tables in database: {len(tables)}")
        for table in tables:
            print(f"   - {table[0]}")
        
    except Exception as e:
        conn.rollback()
        print(f"\n❌ Migration failed: {str(e)}")
        raise
    finally:
        conn.close()

def verify_migration():
    """Verify that all changes were applied correctly"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print("\n🔍 Verifying migration...")
    
    # Check if new tables exist
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='subjects'")
    if cursor.fetchone():
        print("✅ subjects table exists")
    else:
        print("❌ subjects table missing")
    
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='question_bank'")
    if cursor.fetchone():
        print("✅ question_bank table exists")
    else:
        print("❌ question_bank table missing")
    
    # Check quizzes table columns
    cursor.execute("PRAGMA table_info(quizzes)")
    quiz_columns = [col[1] for col in cursor.fetchall()]
    required_columns = ['subject_id', 'scheduled_at', 'grace_period_minutes', 
                       'marks_per_correct', 'negative_marking', 'updated_at']
    
    for col in required_columns:
        if col in quiz_columns:
            print(f"✅ quizzes.{col} exists")
        else:
            print(f"❌ quizzes.{col} missing")
    
    conn.close()
    print("\n✅ Verification complete!")

if __name__ == "__main__":
    print("="*60)
    print("MacQuiz v2.0 Database Migration")
    print("="*60)
    
    # Backup existing database
    if backup_database():
        print("✅ Backup created successfully")
    else:
        print("ℹ️  No existing database to backup")
    
    # Run migration
    migrate_database()
    
    # Verify migration
    verify_migration()
    
    print("\n" + "="*60)
    print("🎉 Migration process completed!")
    print("="*60)
    print("\nNext steps:")
    print("1. Start the backend server: uvicorn app.main:app --reload")
    print("2. Access API docs at: http://localhost:8000/docs")
    print("3. Test the new features with the frontend")
    print("\n" + "="*60)
