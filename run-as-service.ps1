# Run Node.js server as Windows Service for proper SSO context
# This provides better Windows Authentication support than running directly

param(
    [string]$ServiceName = "AIPhotoEditorService",
    [string]$AppPath = "D:\Dev\RnD\nano-banana-3\server"
)

Write-Host "=== Setting up Node.js as Windows Service ===" -ForegroundColor Cyan

# Check if running as Administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "ERROR: This script must be run as Administrator" -ForegroundColor Red
    exit 1
}

# Install node-windows if not present
Write-Host "Checking node-windows..." -ForegroundColor Yellow
$nodeWindows = npm list -g node-windows 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Installing node-windows..." -ForegroundColor Yellow
    npm install -g node-windows
}

# Create service installation script
$serviceScript = @"
var Service = require('node-windows').Service;

// Create a new service object
var svc = new Service({
  name: '$ServiceName',
  description: 'AI Photo Editor Node.js Server with Windows SSO',
  script: '$AppPath\\server.js',
  nodeOptions: [
    '--harmony',
    '--max_old_space_size=4096'
  ],
  env: {
    name: 'NODE_ENV',
    value: 'production'
  }
});

// Listen for the "install" event, which indicates the
// process is available as a service.
svc.on('install', function(){
  console.log('Service installed successfully');
  svc.start();
});

svc.on('alreadyinstalled', function(){
  console.log('Service already installed');
});

// Install the service
svc.install();
"@

$serviceScript | Out-File -FilePath "$AppPath\install-service.js" -Encoding UTF8

# Run the service installation
Write-Host "Installing Windows Service..." -ForegroundColor Yellow
Push-Location $AppPath
node install-service.js
Pop-Location

Write-Host "✓ Service setup complete!" -ForegroundColor Green
Write-Host "Service Name: $ServiceName" -ForegroundColor Cyan
Write-Host "Check Windows Services to verify it's running" -ForegroundColor Yellow