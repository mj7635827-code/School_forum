@echo off
echo 🚀 Pushing to GitHub...
echo.
echo If this fails, you need to authenticate with GitHub first.
echo.
echo Options:
echo 1. Use GitHub Desktop (recommended)
echo 2. Or run: git push -u origin main
echo    (it will ask for username/password)
echo.
pause

git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ✅ SUCCESS! Code pushed to GitHub!
    echo.
    echo 🌐 Now go back to Railway and:
    echo 1. Refresh the page
    echo 2. Look for "School_forum" repository
    echo 3. Click on it to deploy
    echo.
    echo Your app will be live in ~5 minutes!
) else (
    echo.
    echo ❌ Push failed. Please:
    echo 1. Download GitHub Desktop: https://desktop.github.com/
    echo 2. Sign in and add this folder
    echo 3. Push from there
)

pause