@echo off
title Sen AI - Development Environment Setup
color 0A
echo ===============================================
echo    Sen AI - Development Environment Setup
echo ===============================================
echo.

REM Get the current directory (Sen_AI root)
set ROOT_DIR=%cd%

REM Check if we're in the correct directory
if not exist "frontend" (
    echo ERROR: frontend directory not found!
    echo Please run this script from the Sen_AI root directory.
    pause
    exit /b 1
)

if not exist "backend" (
    echo ERROR: backend directory not found!
    echo Please run this script from the Sen_AI root directory.
    pause
    exit /b 1
)

if not exist "auth-backend" (
    echo ERROR: auth-backend directory not found!
    echo Please run this script from the Sen_AI root directory.
    pause
    exit /b 1
)

echo Checking dependencies...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python from https://python.org/
    pause
    exit /b 1
)

echo Dependencies check passed!
echo.

REM Ask user if they want to install/update dependencies
set /p INSTALL_DEPS="Do you want to install/update dependencies? (y/n): "
if /i "%INSTALL_DEPS%"=="y" (
    echo.
    echo Installing Frontend dependencies...
    cd "%ROOT_DIR%\frontend"
    call npm install
    
    echo.
    echo Installing Auth Backend dependencies...
    cd "%ROOT_DIR%\auth-backend"
    call npm install
    
    echo.
    echo Installing Backend dependencies...
    cd "%ROOT_DIR%\backend"
    call pip install -r requirements.txt
    
    cd "%ROOT_DIR%"
    echo.
    echo Dependencies installation completed!
    echo.
)

echo Starting servers...
echo.

REM Start Frontend (Next.js)
echo [1/3] Starting Frontend Server (Next.js)...
start "Sen AI - Frontend (Port 3000)" cmd /k "cd /d %ROOT_DIR%\frontend && echo Starting Frontend... && npm run dev"

REM Wait a moment before starting next server
timeout /t 3 /nobreak >nul

REM Start Backend (Python Flask)
echo [2/3] Starting Backend Server (Python Flask)...
start "Sen AI - Backend (Port 5000)" cmd /k "cd /d %ROOT_DIR%\backend && echo Starting Backend... && python run.py"

REM Wait a moment before starting next server
timeout /t 3 /nobreak >nul

REM Start Auth Backend (Node.js)
echo [3/3] Starting Auth Backend Server (Node.js)...
start "Sen AI - Auth Backend (Port 8000)" cmd /k "cd /d %ROOT_DIR%\auth-backend && echo Starting Auth Backend... && npm start"

echo.
echo ===============================================
echo           All Servers Started!
echo ===============================================
echo.
echo Server URLs:
echo   Frontend:     http://localhost:3000
echo   Backend:      http://localhost:5000
echo   Auth Backend: http://localhost:8000
echo.
echo Each server is running in its own window.
echo Close the individual server windows to stop them.
echo.
echo Development environment is ready!
echo ===============================================
echo.
echo Press any key to close this setup window...
pause >nul
