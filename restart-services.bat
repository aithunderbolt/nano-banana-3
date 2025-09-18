@echo off
echo Restarting AI Photo Editor Services...

echo.
echo Stopping existing processes...
echo Attempting to stop Node.js processes gracefully...
for /f "tokens=2" %%i in ('tasklist /fi "imagename eq node.exe" /fo csv ^| find /c /v ""') do set nodecount=%%i
if %nodecount% gtr 1 (
    echo Found Node.js processes. Attempting to stop them...
    taskkill /f /im node.exe 2>nul
    timeout /t 2 /nobreak >nul
) else (
    echo No Node.js processes found.
)

echo.
echo Checking ports...
netstat -ano | findstr :5200 >nul
if %errorlevel% equ 0 (
    echo Port 5200 is in use. Attempting to free it...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5200') do taskkill /f /pid %%a 2>nul
)

netstat -ano | findstr :5173 >nul
if %errorlevel% equ 0 (
    echo Port 5173 is in use. Attempting to free it...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173') do taskkill /f /pid %%a 2>nul
)

echo.
echo Starting server...
cd server
start "AI Photo Editor Server" cmd /k "npm start"

echo.
echo Waiting for server to start...
timeout /t 5 /nobreak >nul

echo.
echo Starting client...
cd ..\client
start "AI Photo Editor Client" cmd /k "npm run dev"

echo.
echo Services started! 
echo Server: http://srv-hq-ai01:5200
echo Client: http://srv-hq-ai01:5173
echo.
echo If you see port conflicts, close any existing browser tabs
echo and wait a moment before trying again.
echo.
echo Press any key to exit...
pause >nul