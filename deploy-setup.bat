@echo off
echo 🚀 School Forum - Railway Deployment Setup
echo ==========================================
echo.

echo Step 1: Checking Git installation...
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Git not found! Please install Git first:
    echo    Download from: https://git-scm.com/download/win
    pause
    exit /b 1
)
echo ✅ Git is installed

echo.
echo Step 2: Initializing Git repository...
git init
git add .
git commit -m "Initial commit - School Forum project ready for Railway deployment"

echo.
echo ✅ Project prepared for deployment!
echo.
echo 📋 NEXT STEPS:
echo 1. Create GitHub repository at: https://github.com/new
echo 2. Name it: school-forum
echo 3. Make it PUBLIC
echo 4. Don't initialize with README
echo.
echo 5. Run these commands (replace YOUR_USERNAME):
echo    git remote add origin https://github.com/YOUR_USERNAME/school-forum.git
echo    git branch -M main
echo    git push -u origin main
echo.
echo 6. Go to https://railway.app and deploy from your GitHub repo
echo.
echo 📖 Full guide available in: DEPLOYMENT_GUIDE.md
echo.
pause