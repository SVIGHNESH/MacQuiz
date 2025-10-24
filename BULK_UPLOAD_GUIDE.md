# Bulk User Upload Guide

## Overview
The bulk upload feature allows administrators to create multiple users at once by uploading a CSV file with user details.

## How to Use

### Step 1: Download Template
1. Login as admin (admin@macquiz.com / admin123)
2. Go to Dashboard
3. Click on "Add New User" button
4. Click "Download Sample CSV Template" link in the bulk upload section

### Step 2: Fill the Template
The CSV file should have the following columns:

| Column | Required | Description | Example |
|--------|----------|-------------|---------|
| role | Yes | User role (student/teacher/admin) | student |
| first_name | Yes | First name | John |
| last_name | Yes | Last name | Doe |
| email | Yes | Email address (must be unique) | john.doe@example.com |
| password | Yes | Password | password123 |
| student_id | Yes (for students) | Student/Roll Number (must be unique for students) | CS001 |
| department | No | Department name | Computer Science |
| class_year | No | Class/Year (for students) | 1st Year |

**Important Notes:**
- For **students**: `student_id` is required
- For **teachers**: Leave `student_id` empty or blank
- Email addresses must be unique across all users
- Student IDs must be unique across all students
- Role must be lowercase: `student`, `teacher`, or `admin`

### Step 3: Upload the File
1. Click "Choose File" in the bulk upload section
2. Select your CSV file
3. Click "Create User" button
4. Wait for the upload to complete

### Step 4: Review Results
- Success message will show number of users created
- If there are errors, they will be logged in browser console
- Errors can include:
  - Missing required fields
  - Duplicate email addresses
  - Duplicate student IDs
  - Invalid data format

## Sample CSV Format

```csv
role,first_name,last_name,email,password,student_id,department,class_year
student,John,Doe,john.doe@example.com,password123,CS001,Computer Science,1st Year
student,Jane,Smith,jane.smith@example.com,password123,CS002,Computer Science,2nd Year
teacher,Alice,Johnson,alice.johnson@example.com,password123,,Mathematics,
teacher,Bob,Williams,bob.williams@example.com,password123,,Physics,
student,Charlie,Brown,charlie.brown@example.com,password123,EE001,Electrical Engineering,3rd Year
```

## Error Handling

If some rows have errors, the system will:
- Create all valid users
- Skip rows with errors
- Return a summary with:
  - Number of users created successfully
  - Number of rows with errors
  - Details of each error (row number, email, error message)

Check the browser console (F12) for detailed error information.

## Technical Details

### Backend Endpoint
- **URL**: `POST /api/v1/users/bulk-upload`
- **Authentication**: Requires admin role
- **Accepts**: CSV files only (Excel support coming soon)
- **Returns**: JSON with created users and errors

### Frontend Implementation
- File upload handled via FormData
- Real-time validation
- Progress feedback via toast notifications
- Automatic form reset on success

## Troubleshooting

### "Only CSV files are supported"
- Currently only CSV (.csv) files work
- Excel files (.xlsx, .xls) require additional libraries
- Convert Excel files to CSV format before uploading

### "Email already registered"
- Check if the email already exists in the system
- Each email must be unique across all users

### "Student ID already registered"
- Check if student ID is duplicated in your CSV
- Check if student ID already exists in database

### "Missing required fields"
- Ensure all required columns are present
- Check for empty cells in required fields
- Verify CSV format is correct

### Upload fails silently
- Check browser console (F12) for errors
- Ensure you're logged in as admin
- Verify backend server is running (http://localhost:8000)
- Check that CSV file is properly formatted

## Future Enhancements
- Excel file support (.xlsx, .xls)
- Progress bar for large uploads
- Duplicate detection before upload
- Downloadable error report
- Email validation preview
