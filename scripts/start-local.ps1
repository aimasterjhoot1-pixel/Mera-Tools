# Mera Dost - Local Startup Script (PowerShell)

Write-Host "🚀 Starting Mera Dost..." -ForegroundColor Green

# Check Node.js version
$nodeVersion = (node -v).Replace('v', '').Split('.')[0]
if ([int]$nodeVersion -lt 18) {
    Write-Host "❌ Node.js 18+ required. Current: $(node -v)" -ForegroundColor Red
    exit 1
}

# Create necessary directories
New-Item -ItemType Directory -Force -Path "backend\tmp" | Out-Null
New-Item -ItemType Directory -Force -Path "backend\uploads" | Out-Null

# Install dependencies if needed
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing root dependencies..." -ForegroundColor Yellow
    npm install
}

if (-not (Test-Path "frontend\node_modules")) {
    Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Yellow
    Set-Location frontend
    npm install
    Set-Location ..
}

if (-not (Test-Path "backend\node_modules")) {
    Write-Host "📦 Installing backend dependencies..." -ForegroundColor Yellow
    Set-Location backend
    npm install
    Set-Location ..
}

# Start services
Write-Host "🎯 Starting services..." -ForegroundColor Green
npm run dev

