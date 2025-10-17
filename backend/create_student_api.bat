@echo off
echo Creating test student account...
echo.

curl -X POST "http://localhost:8000/api/v1/users/" ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer %1" ^
  -d "{\"email\":\"student@macquiz.com\",\"password\":\"student123\",\"first_name\":\"John\",\"last_name\":\"Doe\",\"role\":\"student\",\"department\":\"Computer Science\",\"class_year\":\"2024\",\"student_id\":\"STD001\"}"

echo.
echo Done!
pause
