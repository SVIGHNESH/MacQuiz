# MacQuiz - Troubleshooting Guide

## Current Status Check

### ✅ What's Working:
1. Backend server is running on port 8000 (PID: 16712)
2. Frontend server is running on port 5173 (PID: 6824)
3. All dependencies are installed
4. Environment files are configured

## Common Issues and Solutions

### Issue 1: "Cannot connect to server" or API errors

**Solution:**
1. Make sure both servers are running:
   - Backend: http://localhost:8000/health
   - Frontend: http://localhost:5173

2. Check if ports are in use:
```cmd
netstat -ano | findstr :8000
netstat -ano | findstr :5173
```

3. Restart both servers using the master script:
```cmd
START_ALL.bat
```

### Issue 2: Login not working

**Checklist:**
1. ✅ Backend is running at http://localhost:8000
2. ✅ Check backend health: http://localhost:8000/health
3. ✅ Verify .env file exists in backend folder
4. ✅ Admin user should be created (check backend console logs)

**Test the API manually:**
```cmd
curl -X POST "http://localhost:8000/api/v1/auth/login" ^
  -H "Content-Type: application/x-www-form-urlencoded" ^
  -d "username=admin@macquiz.com&password=admin123"
```

**Expected response:**
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer"
}
```

### Issue 3: Frontend shows blank page or errors

**Solution:**
1. Open browser DevTools (F12)
2. Check Console tab for errors
3. Check Network tab for failed requests

**Common errors:**
- `Module not found`: Missing npm package
  ```cmd
  cd frontend
  npm install
  ```

- `lucide-react not found`:
  ```cmd
  cd frontend
  npm install lucide-react
  ```

- CORS errors: Backend .env should have:
  ```env
  CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
  ```

### Issue 4: Database errors

**Solution: Reset the database**
```cmd
cd backend
del quizapp.db
# Restart backend - it will create new database
```

### Issue 5: Port already in use

**Find and kill the process:**
```cmd
# Find process on port 8000
netstat -ano | findstr :8000
# Kill process (replace XXXX with PID)
taskkill /PID XXXX /F

# Find process on port 5173
netstat -ano | findstr :5173
# Kill process (replace XXXX with PID)
taskkill /PID XXXX /F
```

## Quick Tests

### Test 1: Backend Health Check
Open: http://localhost:8000/health
Expected: `{"status":"healthy"}`

### Test 2: API Documentation
Open: http://localhost:8000/docs
Expected: Swagger UI with all endpoints

### Test 3: Frontend Loading
Open: http://localhost:5173
Expected: Login page with MacQuiz branding

### Test 4: Login Flow
1. Go to http://localhost:5173
2. Enter:
   - Email: admin@macquiz.com
   - Password: admin123
3. Click Login
4. Expected: Redirect to /dashboard

## Manual Startup (If scripts don't work)

### Backend:
```cmd
cd C:\Users\DELL\QuizzApp-RBMI\backend
C:\Users\DELL\QuizzApp-RBMI\.venv\Scripts\activate
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### Frontend:
```cmd
cd C:\Users\DELL\QuizzApp-RBMI\frontend
npm run dev
```

## Verification Checklist

- [ ] Backend responding at http://localhost:8000/health
- [ ] Frontend loading at http://localhost:5173
- [ ] Can see login page
- [ ] Login form accepts input
- [ ] Can login with admin credentials
- [ ] Redirects to dashboard after login
- [ ] Dashboard loads without errors

## Still Not Working?

1. **Check backend console** for error messages
2. **Check browser console** (F12 -> Console tab)
3. **Check Network tab** for failed API requests
4. **Verify environment variables**:
   - backend/.env exists and has all required variables
   - frontend/.env exists (optional but recommended)

## Contact Information

For issues, check the logs in:
- Backend terminal window
- Frontend terminal window  
- Browser DevTools Console (F12)

## Emergency Reset

If nothing works, try this complete reset:

```cmd
# 1. Stop all servers (Ctrl+C in both terminals)

# 2. Kill any remaining processes
taskkill /F /IM python.exe
taskkill /F /IM node.exe

# 3. Delete and recreate virtual environment
cd C:\Users\DELL\QuizzApp-RBMI
rmdir /s /q .venv
python -m venv .venv

# 4. Reinstall backend dependencies
cd backend
..\\.venv\Scripts\activate
pip install -r requirements.txt

# 5. Reinstall frontend dependencies
cd ..\frontend
rmdir /s /q node_modules
npm install
npm install lucide-react

# 6. Reset database
cd ..\backend
del quizapp.db

# 7. Start both servers
cd ..
START_ALL.bat
```
