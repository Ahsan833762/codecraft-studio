@echo off
echo Starting CodeCraft Studio Server...
echo.

REM Kill any process on port 3000
echo Checking for existing servers on port 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
    echo Stopping existing server (PID: %%a)...
    taskkill /F /PID %%a >nul 2>&1
)

echo.
echo Starting server...
node server.js
