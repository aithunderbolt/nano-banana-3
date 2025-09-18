@echo off
echo Configuring browser for Windows SSO...
echo.

echo Adding srv-hq-ai01 to Internet Explorer trusted sites...
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Internet Settings\ZoneMap\Domains\srv-hq-ai01" /v http /t REG_DWORD /d 1 /f >nul 2>&1

if %errorlevel% equ 0 (
    echo ✓ Successfully added to IE trusted sites
) else (
    echo ✗ Failed to add to IE trusted sites - run as Administrator
)

echo.
echo Configuring Chrome authentication (if Chrome is installed)...
reg add "HKLM\SOFTWARE\Policies\Google\Chrome" /v AuthServerWhitelist /t REG_SZ /d "srv-hq-ai01" /f >nul 2>&1
reg add "HKLM\SOFTWARE\Policies\Google\Chrome" /v AuthNegotiateDelegateWhitelist /t REG_SZ /d "srv-hq-ai01" /f >nul 2>&1

if %errorlevel% equ 0 (
    echo ✓ Chrome authentication configured
) else (
    echo ! Chrome configuration requires Administrator privileges
)

echo.
echo Configuration complete!
echo.
echo Next steps:
echo 1. Restart your browser
echo 2. Run: restart-services.bat
echo 3. Access: http://srv-hq-ai01:5173
echo.
echo If you still see login popups, check BROWSER_SETUP.md for manual configuration.
echo.
pause