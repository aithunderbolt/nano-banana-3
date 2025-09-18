# IIS Setup Script for AI Photo Editor with Windows SSO
# Run as Administrator

param(
    [string]$SiteName = "AIPhotoEditor",
    [string]$AppPath = "D:\Dev\RnD\nano-banana-3",
    [int]$Port = 80
)

Write-Host "=== IIS Setup for AI Photo Editor ===" -ForegroundColor Cyan

# Check if running as Administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "ERROR: This script must be run as Administrator" -ForegroundColor Red
    exit 1
}

# Enable IIS Features
Write-Host "Enabling IIS Features..." -ForegroundColor Yellow
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServerRole -All
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServer -All
Enable-WindowsOptionalFeature -Online -FeatureName IIS-CommonHttpFeatures -All
Enable-WindowsOptionalFeature -Online -FeatureName IIS-HttpErrors -All
Enable-WindowsOptionalFeature -Online -FeatureName IIS-HttpLogging -All
Enable-WindowsOptionalFeature -Online -FeatureName IIS-Security -All
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WindowsAuthentication -All
Enable-WindowsOptionalFeature -Online -FeatureName IIS-RequestFiltering -All

# Install IISNode (if not already installed)
Write-Host "Checking IISNode installation..." -ForegroundColor Yellow
$iisNodePath = "${env:ProgramFiles}\iisnode"
if (-not (Test-Path $iisNodePath)) {
    Write-Host "IISNode not found. Please install from: https://github.com/Azure/iisnode/releases" -ForegroundColor Red
    Write-Host "Download and install iisnode-full-v0.2.26-x64.msi" -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "✓ IISNode is installed" -ForegroundColor Green
}

# Import WebAdministration module
Import-Module WebAdministration

# Remove existing site if it exists
if (Get-Website -Name $SiteName -ErrorAction SilentlyContinue) {
    Write-Host "Removing existing site: $SiteName" -ForegroundColor Yellow
    Remove-Website -Name $SiteName
}

# Create new website
Write-Host "Creating IIS site: $SiteName" -ForegroundColor Yellow
New-Website -Name $SiteName -Port $Port -PhysicalPath "$AppPath\server" -ApplicationPool "DefaultAppPool"

# Configure Application Pool
Write-Host "Configuring Application Pool..." -ForegroundColor Yellow
Set-ItemProperty -Path "IIS:\AppPools\DefaultAppPool" -Name "processModel.identityType" -Value "ApplicationPoolIdentity"
Set-ItemProperty -Path "IIS:\AppPools\DefaultAppPool" -Name "enable32BitAppOnWin64" -Value $false

# Configure Windows Authentication
Write-Host "Configuring Windows Authentication..." -ForegroundColor Yellow
Set-WebConfigurationProperty -Filter "/system.webServer/security/authentication/windowsAuthentication" -Name "enabled" -Value "True" -PSPath "IIS:\" -Location "$SiteName"
Set-WebConfigurationProperty -Filter "/system.webServer/security/authentication/anonymousAuthentication" -Name "enabled" -Value "False" -PSPath "IIS:\" -Location "$SiteName"

# Set permissions
Write-Host "Setting permissions..." -ForegroundColor Yellow
$acl = Get-Acl "$AppPath\server"
$accessRule = New-Object System.Security.AccessControl.FileSystemAccessRule("IIS_IUSRS", "FullControl", "ContainerInherit,ObjectInherit", "None", "Allow")
$acl.SetAccessRule($accessRule)
Set-Acl "$AppPath\server" $acl

Write-Host "✓ IIS setup complete!" -ForegroundColor Green
Write-Host "Site URL: http://srv-hq-ai01" -ForegroundColor Cyan
Write-Host "Make sure to:" -ForegroundColor Yellow
Write-Host "1. Copy web.config to server folder" -ForegroundColor White
Write-Host "2. Install Node.js dependencies in server folder" -ForegroundColor White
Write-Host "3. Build client and serve static files" -ForegroundColor White