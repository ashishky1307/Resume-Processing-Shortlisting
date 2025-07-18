@echo off
echo Starting Sen AI Development Environment...
echo.

REM Get the current directory (Sen_AI root)
set ROOT_DIR=%cd%

REM Start Frontend (Next.js)
echo Starting Frontend Server...
start "Sen AI - Frontend" cmd /k "cd /d %ROOT_DIR%\frontend && npm run dev"

REM Wait a moment before starting next server
timeout /t 2 /nobreak >nul

REM Start Backend (Python Flask)
echo Starting Backend Server...
start "Sen AI - Backend" cmd /k "cd /d %ROOT_DIR%\backend && python run.py"

REM Wait a moment before starting next server
timeout /t 2 /nobreak >nul

REM Start Auth Backend (Node.js)
echo Starting Auth Backend Server...
start "Sen AI - Auth Backend" cmd /k "cd /d %ROOT_DIR%\auth-backend && npm start"

echo.
echo All servers are starting up in separate windows...
echo Frontend: http://localhost:3000
echo Backend: http://localhost:5000
echo Auth Backend: http://localhost:8000
echo.
echo Press any key to exit this setup window...
pause >nul
