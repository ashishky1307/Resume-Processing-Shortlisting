@echo off
title Sen AI - Stop All Servers
color 0C
echo ===============================================
echo      Sen AI - Stop All Servers
echo ===============================================
echo.

echo Stopping all Sen AI servers...
echo.

REM Kill processes running on specific ports
echo Stopping Frontend (Port 3000)...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3000" ^| find "LISTENING"') do taskkill /f /pid %%a >nul 2>&1

echo Stopping Backend (Port 4000)...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":4000" ^| find "LISTENING"') do taskkill /f /pid %%a >nul 2>&1

echo Stopping Auth Backend (Port 8000)...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":8000" ^| find "LISTENING"') do taskkill /f /pid %%a >nul 2>&1

REM Also kill by process name as backup
echo Cleaning up any remaining processes...
taskkill /f /im "node.exe" /fi "WINDOWTITLE eq Sen AI*" >nul 2>&1
taskkill /f /im "python.exe" /fi "WINDOWTITLE eq Sen AI*" >nul 2>&1

echo.
echo ===============================================
echo        All Sen AI Servers Stopped!
echo ===============================================
echo.
echo Press any key to exit...
pause >nul
