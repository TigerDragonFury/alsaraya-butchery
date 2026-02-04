@echo off
echo ========================================
echo   Al Saraya - iiko Integration Server
echo ========================================
echo.

cd /d "%~dp0"

REM Check if .env exists
if not exist ".env" (
    echo [ERROR] .env file not found!
    echo.
    echo Please create .env file with your iiko credentials:
    echo 1. Copy .env.example to .env
    echo 2. Fill in your iiko API credentials
    echo 3. Run this script again
    echo.
    pause
    exit /b 1
)

REM Check if node_modules exists
if not exist "node_modules" (
    echo [INFO] Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo.
        echo [ERROR] Failed to install dependencies
        echo Make sure Node.js is installed: https://nodejs.org/
        echo.
        pause
        exit /b 1
    )
    echo.
    echo [SUCCESS] Dependencies installed
    echo.
)

echo [INFO] Starting iiko integration server...
echo.
echo Server will be available at: http://localhost:3000
echo.
echo Endpoints:
echo   GET  /api/health           - Health check
echo   GET  /api/iiko/test        - Test iiko connection
echo   GET  /api/iiko/menu        - Get iiko menu
echo   POST /api/iiko/create-order - Create order in iiko
echo.
echo Press Ctrl+C to stop the server
echo.
echo ========================================
echo.

call npm start
