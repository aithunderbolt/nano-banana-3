@echo off
echo Starting AI Photo Editor with Windows Authentication...
echo.

echo Stopping existing processes...
taskkill /f /im node.exe >nul 2>&1

echo Setting up authentication context...
set SSO_DOMAIN=ASHARQIA
set SSO_DEBUG=true
set NODE_ENV=production

echo Starting server with elevated context...
cd server
runas /user:%USERDOMAIN%\%USERNAME% "node server.js"

pause