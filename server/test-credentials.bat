@echo off
echo ========================================
echo   iiko Credentials Test
echo ========================================
echo.

cd /d "%~dp0"

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed!
    echo.
    echo Please install Node.js from: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [INFO] Testing iiko API credentials...
echo.

node test-iiko-credentials.js

echo.
pause
