@echo off
echo ========================================
echo   JARVIS Desktop AI Assistant
echo ========================================
echo.
echo Installing dependencies...
call npm install
if errorlevel 1 goto error
echo.
echo Building JARVIS...
call npm run build
if errorlevel 1 goto error
echo.
echo Starting JARVIS...
call npm start
goto end

:error
echo.
echo ERROR: Setup failed. Ensure Node.js 18+ is installed.
pause
exit /b 1

:end
