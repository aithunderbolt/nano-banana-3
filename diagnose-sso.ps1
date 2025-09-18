# SSO Diagnostic Script for AI Photo Editor
param(
    [switch]$Detailed
)

Write-Host "=== AI Photo Editor SSO Diagnostics ===" -ForegroundColor Cyan
Write-Host ""

# Check if running as admin
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")
Write-Host "Running as Administrator: " -NoNewline
if ($isAdmin) {
    Write-Host "Yes" -ForegroundColor Green
} else {
    Write-Host "No" -ForegroundColor Yellow
}

# Check current user
Write-Host "Current User: $env:USERDOMAIN\$env:USERNAME" -ForegroundColor Cyan

# Check network connectivity
Write-Host "`n--- Network Connectivity ---" -ForegroundColor Yellow
try {
    $ping = Test-NetConnection -ComputerName "srv-hq-ai01" -Port 5200 -WarningAction SilentlyContinue
    if ($ping.TcpTestSucceeded) {
        Write-Host "✓ Server port 5200 is accessible" -ForegroundColor Green
    } else {
        Write-Host "✗ Cannot connect to server port 5200" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Network test failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Check server processes
Write-Host "`n--- Server Processes ---" -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "✓ Node.js processes running: $($nodeProcesses.Count)" -ForegroundColor Green
    if ($Detailed) {
        $nodeProcesses | ForEach-Object { Write-Host "  PID: $($_.Id), Path: $($_.Path)" -ForegroundColor Gray }
    }
} else {
    Write-Host "✗ No Node.js processes found" -ForegroundColor Red
}

# Check IE security zones
Write-Host "`n--- Internet Explorer Security Zones ---" -ForegroundColor Yellow
try {
    $ieZones = Get-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Internet Settings\ZoneMap\Domains\srv-hq-ai01" -ErrorAction SilentlyContinue
    if ($ieZones -and $ieZones.http -eq 1) {
        Write-Host "✓ srv-hq-ai01 is in Local Intranet zone" -ForegroundColor Green
    } else {
        Write-Host "✗ srv-hq-ai01 not configured in Local Intranet zone" -ForegroundColor Red
        Write-Host "  Run: fix-browser-auth.bat" -ForegroundColor Yellow
    }
} catch {
    Write-Host "✗ Cannot check IE security zones" -ForegroundColor Red
}

# Check Chrome policies
Write-Host "`n--- Chrome Authentication Policies ---" -ForegroundColor Yellow
try {
    $chromeAuth = Get-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Google\Chrome" -ErrorAction SilentlyContinue
    if ($chromeAuth -and $chromeAuth.AuthServerWhitelist) {
        Write-Host "✓ Chrome AuthServerWhitelist configured: $($chromeAuth.AuthServerWhitelist)" -ForegroundColor Green
    } else {
        Write-Host "✗ Chrome authentication not configured" -ForegroundColor Red
        Write-Host "  Run fix-browser-auth.bat as Administrator" -ForegroundColor Yellow
    }
} catch {
    Write-Host "! Cannot check Chrome policies (may not be installed)" -ForegroundColor Yellow
}

# Test server endpoints
Write-Host "`n--- Server Endpoint Tests ---" -ForegroundColor Yellow

# Test health endpoint
try {
    $health = Invoke-RestMethod -Uri "http://srv-hq-ai01:5200/health" -TimeoutSec 5
    Write-Host "✓ Health endpoint: $($health.status)" -ForegroundColor Green
} catch {
    Write-Host "✗ Health endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test SSO endpoint
try {
    $sso = Invoke-RestMethod -Uri "http://srv-hq-ai01:5200/api/me" -UseDefaultCredentials -TimeoutSec 5
    Write-Host "✓ SSO endpoint: Authenticated as $($sso.name)" -ForegroundColor Green
} catch {
    Write-Host "✗ SSO endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Message -like "*401*") {
        Write-Host "  This is expected from PowerShell - try in browser" -ForegroundColor Yellow
    }
}

# Recommendations
Write-Host "`n--- Recommendations ---" -ForegroundColor Cyan
Write-Host "1. Run 'fix-browser-auth.bat' as Administrator" -ForegroundColor White
Write-Host "2. Restart your browser completely" -ForegroundColor White
Write-Host "3. Run 'restart-services.bat' to restart the application" -ForegroundColor White
Write-Host "4. Access http://srv-hq-ai01:5173 in Chrome or Edge" -ForegroundColor White
Write-Host "5. Check BROWSER_SETUP.md for detailed browser configuration" -ForegroundColor White

Write-Host "`nDiagnostics complete!" -ForegroundColor Green