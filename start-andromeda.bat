@echo off
title ANDROMEDA — Local AI Operating System
echo ========================================================
echo   ANDROMEDA OS
echo   "One Soul. Hundreds of Minds."
echo ========================================================
echo.
echo [1/3] Checking Node.js environment...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH!
    echo Please install Node.js v18+ from https://nodejs.org
    pause
    exit /b 1
)

echo [2/3] Checking local dependencies...
if not exist node_modules (
    echo Installing required packages...
    call npm install
)

echo [3/3] Launching Andromeda Local AI Operating System on http://localhost:3000...
call npm run dev
pause
