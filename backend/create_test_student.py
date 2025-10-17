"""
Script to create a test student account
"""
import sys
from pathlib import Path

# Add the backend directory to the Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from app.db.database import SessionLocal, init_db
from app.models.models import User
from app.core.security import get_password_hash

def create_test_student():
    """Create a test student account"""
    init_db()
    db = SessionLocal()
    
    try:
        # Check if student already exists
        existing_student = db.query(User).filter(User.email == "student@macquiz.com").first()
        if existing_student:
            print("✅ Test student already exists!")
            print(f"   Email: student@macquiz.com")
            print(f"   Password: student123")
            print(f"   Role: {existing_student.role}")
            return
        
        # Create test student
        test_student = User(
            email="student@macquiz.com",
            hashed_password=get_password_hash("student123"),
            first_name="John",
            last_name="Doe",
            role="student",
            department="Computer Science",
            class_year="2024",
            student_id="STD001",
            is_active=True
        )
        
        db.add(test_student)
        db.commit()
        db.refresh(test_student)
        
        print("✅ Test student account created successfully!")
        print(f"   Email: student@macquiz.com")
        print(f"   Password: student123")
        print(f"   Name: {test_student.first_name} {test_student.last_name}")
        print(f"   Role: {test_student.role}")
        print(f"   Department: {test_student.department}")
        print(f"   Student ID: {test_student.student_id}")
        
    except Exception as e:
        print(f"❌ Error creating test student: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_test_student()
