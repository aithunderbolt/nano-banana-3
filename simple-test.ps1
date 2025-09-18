Write-Host "=== Simple SSO Test ===" -ForegroundColor Cyan

# Check current user
Write-Host "Current User: $env:USERDOMAIN\$env:USERNAME"

# Check IE trusted sites
$ieZones = Get-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Internet Settings\ZoneMap\Domains\srv-hq-ai01" -ErrorAction SilentlyContinue
if ($ieZones -and $ieZones.http -eq 1) {
    Write-Host "✓ IE Trusted Sites: Configured" -ForegroundColor Green
} else {
    Write-Host "✗ IE Trusted Sites: Not configured" -ForegroundColor Red
}

# Check Chrome policies
$chromeAuth = Get-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Google\Chrome" -ErrorAction SilentlyContinue
if ($chromeAuth -and $chromeAuth.AuthServerWhitelist) {
    Write-Host "✓ Chrome Auth: $($chromeAuth.AuthServerWhitelist)" -ForegroundColor Green
} else {
    Write-Host "✗ Chrome Auth: Not configured" -ForegroundColor Red
}

# Test server
try {
    $health = Invoke-RestMethod -Uri "http://srv-hq-ai01:5200/health" -TimeoutSec 5
    Write-Host "✓ Server Health: $($health.status)" -ForegroundColor Green
} catch {
    Write-Host "✗ Server Health: Failed" -ForegroundColor Red
}

Write-Host "`nNext Steps:" -ForegroundColor Yellow
Write-Host "1. Run as Administrator: fix-browser-auth.bat"
Write-Host "2. Restart browser completely"
Write-Host "3. Try: http://srv-hq-ai01:5173"