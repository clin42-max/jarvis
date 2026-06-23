@echo off
echo ====================================
echo    JARVIS AI Assistant
echo ====================================
echo.
echo Installing dependencies...
call npm install
echo.
echo Starting JARVIS...
echo Open your browser to: http://localhost:5173
echo.
echo To install as Windows app:
echo 1. Open Chrome/Edge
echo 2. Navigate to http://localhost:5173
echo 3. Click the install icon in the address bar
echo.
pause
npm run dev
