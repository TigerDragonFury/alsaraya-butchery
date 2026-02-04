@echo off
echo Starting Al Saraya Auto-Sync Service...
echo.
cd /d "%~dp0"
node auto-sync-products.js
pause
