@echo off
echo === Browser Configuration Test ===
echo.

echo Current User: %USERDOMAIN%\%USERNAME%
echo.

echo Checking IE Trusted Sites...
reg query "HKCU\Software\Microsoft\Windows\CurrentVersion\Internet Settings\ZoneMap\Domains\srv-hq-ai01" /v http >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ IE Trusted Sites: Configured
) else (
    echo ✗ IE Trusted Sites: Not configured
)

echo.
echo Checking Chrome Authentication...
reg query "HKLM\SOFTWARE\Policies\Google\Chrome" /v AuthServerWhitelist >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Chrome Auth: Configured
) else (
    echo ✗ Chrome Auth: Not configured - Run as Administrator
)

echo.
echo Testing server connection...
curl -s http://srv-hq-ai01:5200/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Server: Running
) else (
    echo ✗ Server: Not accessible
)

echo.
echo === Next Steps ===
echo 1. Run as Administrator: fix-browser-auth.bat
echo 2. Restart browser completely  
echo 3. Access: http://srv-hq-ai01:5173
echo.
pause