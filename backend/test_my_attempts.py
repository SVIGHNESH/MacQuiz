"""
Test the my-attempts endpoint
"""
from app.db.database import SessionLocal
from app.models.models import User, QuizAttempt, Quiz, Question, Answer
from app.core.security import create_access_token

def test_my_attempts_endpoint():
    db = SessionLocal()
    try:
        # Get student 2
        student = db.query(User).filter(User.id == 2).first()
        print(f"Testing for student: {student.first_name} {student.last_name} (ID: {student.id})")
        
        # Get their attempts
        attempts = db.query(QuizAttempt).filter(
            QuizAttempt.student_id == student.id,
            QuizAttempt.is_completed == True
        ).order_by(QuizAttempt.started_at.desc()).all()
        
        print(f"\nFound {len(attempts)} completed attempts")
        
        # Process each like the endpoint does
        result = []
        for attempt in attempts:
            quiz = db.query(Quiz).filter(Quiz.id == attempt.quiz_id).first()
            total_questions = db.query(Question).filter(Question.quiz_id == attempt.quiz_id).count()
            correct_answers = db.query(Answer).filter(
                Answer.attempt_id == attempt.id,
                Answer.is_correct == True
            ).count()
            
            # Format time taken
            time_taken_str = None
            if attempt.time_taken_minutes is not None:
                minutes = int(attempt.time_taken_minutes)
                seconds = int((attempt.time_taken_minutes - minutes) * 60)
                time_taken_str = f"{minutes}m {seconds}s"
            
            attempt_dict = {
                "id": attempt.id,
                "quiz_id": attempt.quiz_id,
                "student_id": attempt.student_id,
                "score": float(attempt.score) if attempt.score is not None else None,
                "total_marks": float(attempt.total_marks),
                "percentage": float(attempt.percentage) if attempt.percentage is not None else None,
                "started_at": attempt.started_at.isoformat() if attempt.started_at else None,
                "submitted_at": attempt.submitted_at.isoformat() if attempt.submitted_at else None,
                "time_taken_minutes": float(attempt.time_taken_minutes) if attempt.time_taken_minutes is not None else None,
                "is_completed": bool(attempt.is_completed),
                "is_graded": bool(attempt.is_graded),
                "quiz_title": quiz.title if quiz else None,
                "correct_answers": correct_answers,
                "total_questions": total_questions,
                "quiz_total_marks": float(quiz.total_marks) if quiz else float(attempt.total_marks),
                "time_taken": time_taken_str
            }
            result.append(attempt_dict)
            
            print(f"\nAttempt {attempt.id}:")
            print(f"  Quiz: {quiz.title if quiz else 'Unknown'}")
            print(f"  Score: {attempt_dict['score']}/{attempt_dict['total_marks']}")
            print(f"  Percentage: {attempt_dict['percentage']}%")
            print(f"  Correct: {attempt_dict['correct_answers']}/{attempt_dict['total_questions']}")
            print(f"  Time: {attempt_dict['time_taken']}")
        
        print(f"\n✅ Endpoint would return {len(result)} attempts")
        
        # Calculate stats like frontend does
        if len(result) > 0:
            total_score = sum(att['percentage'] or 0 for att in result)
            avg_score = total_score / len(result)
            best_score = max(att['percentage'] or 0 for att in result)
            
            print(f"\nCalculated Stats:")
            print(f"  Total Attempts: {len(result)}")
            print(f"  Average Score: {avg_score:.1f}%")
            print(f"  Best Score: {best_score:.1f}%")
            print(f"  Quizzes Taken: {len(set(att['quiz_id'] for att in result))}")
        
    finally:
        db.close()

if __name__ == "__main__":
    test_my_attempts_endpoint()
