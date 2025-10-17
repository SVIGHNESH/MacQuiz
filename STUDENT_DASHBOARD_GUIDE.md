# Student Dashboard - User Guide

## Overview
The Student Dashboard is a dedicated interface for students to:
- View and take quizzes
- Track their progress and scores
- View detailed statistics
- Manage their profile

## Features

### 1. Dashboard (Home)
- **Welcome Message**: Personalized greeting
- **Statistics Cards**:
  - Total Attempts: Number of quizzes taken
  - Average Score: Overall performance percentage
  - Quizzes Taken: Unique quizzes attempted
  - Best Score: Highest score achieved
- **Recent Attempts**: List of latest quiz submissions with scores

### 2. Quizzes
- **Browse Available Quizzes**: View all active quizzes
- **Quiz Cards Display**:
  - Quiz title and description
  - Creation date
  - Number of previous attempts
  - Best score (if attempted before)
- **Start Quiz**: Click to begin or retake any quiz
- **Refresh**: Update quiz list with latest additions

### 3. Results
- **Complete History**: All quiz attempts in table format
- **Details Shown**:
  - Quiz name
  - Date and time of attempt
  - Score percentage
  - Pass/Fail status
- **Status Indicators**:
  - ✅ Passed (70%+): Green badge
  - ⚠️ Average (50-69%): Yellow badge
  - ❌ Needs Improvement (<50%): Red badge

### 4. Profile
- **Personal Information**:
  - Name and email
  - Student ID
  - Department
  - Class Year
  - Role
- **Performance Summary**: Quick stats overview

## How to Use

### Logging In
1. Navigate to the login page
2. Enter your credentials:
   - Email: student@macquiz.com
   - Password: student123 (test account)
3. Click "Login"
4. You'll be redirected to the student dashboard

### Taking a Quiz
1. Go to "Quizzes" section
2. Browse available quizzes
3. Click "Start Quiz" or "Retake Quiz"
4. Answer all questions
5. Submit your answers
6. View your score immediately

### Viewing Results
1. Click "Results" in the sidebar
2. View all your quiz attempts
3. See scores and status for each attempt
4. Track your progress over time

### Checking Profile
1. Click "Profile" in the sidebar
2. View your personal information
3. Check your performance summary
4. See overall statistics

## Navigation

### Sidebar Menu
- **Dashboard** 📊: Overview and recent activity
- **Quizzes** 📚: Browse and take quizzes
- **Results** 🏆: View all quiz scores
- **Profile** 👤: Personal information

### Logout
- Click the red "Logout" button at the bottom of the sidebar
- Confirm logout in the popup dialog

## Tips for Students

1. **Check Dashboard Regularly**: Stay updated with your progress
2. **Review Results**: Learn from past attempts before retaking
3. **Track Average Score**: Aim to improve with each attempt
4. **Complete All Quizzes**: Don't miss any available assessments
5. **Retake for Better Scores**: Most quizzes allow multiple attempts

## Test Credentials

### Student Account
- **Email**: student@macquiz.com
- **Password**: student123
- **Role**: Student
- **Department**: Computer Science
- **Student ID**: STD001

### Admin Account (for teachers/admin)
- **Email**: admin@macquiz.com
- **Password**: admin123
- **Role**: Admin

## Technical Details

### Dashboard Components
- **Stats Cards**: Real-time calculation from attempts
- **Recent Attempts**: Shows last 5 quiz submissions
- **Quiz Cards**: Dynamically loaded from API
- **Profile Data**: Fetched from user session

### Data Refresh
- Dashboard data refreshes on page load
- Click "Refresh" button to update quiz list
- Logout and login again for complete data reset

## Troubleshooting

### Can't See Quizzes
- Check if backend server is running (port 8000)
- Verify quiz creation by admin/teacher
- Try clicking the "Refresh" button

### Scores Not Showing
- Ensure quiz was submitted (not just started)
- Check "Results" page for complete history
- Contact admin if data is missing

### Login Issues
- Verify credentials are correct
- Check backend server status
- Clear browser cache and try again

### Dashboard Not Loading
- Check network connection
- Verify frontend server is running (port 5173)
- Check browser console for errors

## Differences from Admin Dashboard

### Student Dashboard Features:
- ✅ View available quizzes
- ✅ Take quizzes
- ✅ View personal scores
- ✅ Track personal progress
- ✅ Manage profile

### Admin Dashboard Features:
- ✅ Create and manage quizzes
- ✅ View all students
- ✅ Add/remove users
- ✅ View system statistics
- ✅ Manage all data

Students and admins/teachers have completely different interfaces based on their role!
