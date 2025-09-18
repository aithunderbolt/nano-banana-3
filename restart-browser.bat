@echo off
echo Restarting browsers for SSO configuration...
echo.

echo Closing Chrome...
taskkill /f /im chrome.exe >nul 2>&1
taskkill /f /im msedge.exe >nul 2>&1
taskkill /f /im firefox.exe >nul 2>&1

echo Waiting for processes to close...
timeout /t 3 /nobreak >nul

echo.
echo Starting Chrome with SSO configuration...
start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --auth-server-whitelist="srv-hq-ai01" --auth-negotiate-delegate-whitelist="srv-hq-ai01" http://srv-hq-ai01:5173

echo.
echo Chrome started with Windows Authentication enabled.
echo If Chrome is not installed, manually open Edge or Firefox and go to:
echo http://srv-hq-ai01:5173
echo.
pause