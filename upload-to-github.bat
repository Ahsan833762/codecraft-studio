@echo off
echo ========================================
echo CodeCraft Studio - GitHub Upload Script
echo ========================================
echo.

REM Check if Git is installed
where git >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Git is not installed!
    echo Please install Git from: https://git-scm.com/download/win
    echo After installation, restart your computer and run this script again.
    pause
    exit /b 1
)

echo Git is installed. Continuing...
echo.

REM Initialize Git if not already initialized
if not exist ".git" (
    echo Initializing Git repository...
    git init
    echo.
)

REM Configure Git (if not already configured)
echo Configuring Git...
git config user.email "your-email@example.com"
git config user.name "Your Name"
echo.

REM Add all files
echo Adding files to Git...
git add .
echo.

REM Create initial commit
echo Creating initial commit...
git commit -m "Initial commit - CodeCraft Studio"
echo.

echo ========================================
echo NEXT STEPS:
echo ========================================
echo.
echo 1. Go to https://github.com and create a new repository
echo    Repository name: codecraft-studio
echo.
echo 2. Run these commands to push to GitHub:
echo.
echo    git branch -M main
echo    git remote add origin https://github.com/YOUR_USERNAME/codecraft-studio.git
echo    git push -u origin main
echo.
echo 3. After pushing to GitHub, deploy for FREE:
echo    - Go to https://render.com and sign up
echo    - Connect your GitHub account
echo    - Create a new Web Service
echo    - Select your codecraft-studio repository
echo    - Use these settings:
echo        Build Command: npm install
echo        Start Command: node server.js
echo    - Add environment variables:
echo        NODE_ENV = production
echo        PORT = 3000
echo    - Select Free plan
echo    - Click Deploy
echo.
echo Your app will be live for FREE at: https://codecraft-studio.onrender.com
echo.
pause
