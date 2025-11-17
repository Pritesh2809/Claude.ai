@echo off
REM Firebase Setup Script for Trip Expense Manager (Windows)

echo.
echo ========================================
echo   Trip Expense Manager - Firebase Setup
echo ========================================
echo.
echo This script will help you set up Firebase for your project.
echo.
echo PREREQUISITES:
echo 1. You must have a Firebase account (Google account)
echo 2. Firebase CLI must be installed: npm install -g firebase-tools
echo.
pause

REM Check if firebase-tools is installed
where firebase >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo ❌ Firebase CLI is not installed!
    echo.
    echo Please install it first:
    echo   npm install -g firebase-tools
    echo.
    pause
    exit /b 1
)

echo ✅ Firebase CLI found
echo.

echo Step 1: Login to Firebase
echo -------------------------
echo This will open a browser window for you to login...
echo.
pause

firebase login

echo.
echo Step 2: Initialize Firebase
echo --------------------------
echo.
echo When prompted:
echo   - Select: Firestore, Hosting, Storage (use SPACE to select, ENTER to confirm)
echo   - Choose: Use an existing project (or create new)
echo   - Accept default file names (just press ENTER)
echo.
pause

firebase init

echo.
echo ✅ Firebase initialization complete!
echo.
echo Next steps:
echo 1. Edit public\js\config.js and add your Firebase credentials
echo 2. Run: firebase deploy --only firestore:rules,storage:rules
echo 3. Run: firebase deploy --only hosting
echo.
echo See SETUP_GUIDE.md for detailed instructions!
echo.
pause
