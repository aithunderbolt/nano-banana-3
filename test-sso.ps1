# Test SSO Configuration Script
Write-Host "Testing AI Photo Editor SSO Configuration..." -ForegroundColor Green

# Test basic server health
Write-Host "`nTesting server health (no auth required)..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-RestMethod -Uri "http://srv-hq-ai01:5200/health" -Method GET
    Write-Host "✓ Server is running: $($healthResponse.status)" -ForegroundColor Green
} catch {
    Write-Host "✗ Server health check failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test SSO endpoint
Write-Host "`nTesting SSO endpoint..." -ForegroundColor Yellow
try {
    $ssoResponse = Invoke-RestMethod -Uri "http://srv-hq-ai01:5200/api/me" -Method GET -UseDefaultCredentials
    Write-Host "✓ SSO Authentication successful" -ForegroundColor Green
    Write-Host "  User: $($ssoResponse.name)" -ForegroundColor Cyan
    Write-Host "  Domain: $($ssoResponse.domain)" -ForegroundColor Cyan
    Write-Host "  Display Name: $($ssoResponse.displayName)" -ForegroundColor Cyan
} catch {
    Write-Host "✗ SSO Authentication failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "  This might be expected if running from PowerShell" -ForegroundColor Yellow
}

# Test CORS preflight
Write-Host "`nTesting CORS preflight..." -ForegroundColor Yellow
try {
    $headers = @{
        'Origin' = 'http://srv-hq-ai01:5173'
        'Access-Control-Request-Method' = 'POST'
        'Access-Control-Request-Headers' = 'Content-Type'
    }
    $corsResponse = Invoke-WebRequest -Uri "http://srv-hq-ai01:5200/api/me" -Method OPTIONS -Headers $headers
    if ($corsResponse.StatusCode -eq 200) {
        Write-Host "✓ CORS preflight successful" -ForegroundColor Green
    }
} catch {
    Write-Host "✗ CORS preflight failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nTest completed. If SSO failed, try accessing http://srv-hq-ai01:5173 in Chrome or Edge." -ForegroundColor Green
Write-Host "Make sure the browser is configured for Windows Authentication." -ForegroundColor Yellow