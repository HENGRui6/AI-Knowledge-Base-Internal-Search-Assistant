# AI Knowledge Base - One-Click Start Script
# This script compiles and starts both backend and frontend

Write-Host ""
Write-Host "════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   AI Knowledge Base & Search Assistant" -ForegroundColor Green
Write-Host "════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Step 1: Compile Backend
Write-Host "📦 Step 1: Compiling Backend..." -ForegroundColor Yellow
Write-Host ""

Set-Location "$scriptDir\backend"

# Check if Maven is available
$mavenPath = "C:\Users\zbx20\apache-maven-3.9.6\bin\mvn.cmd"
if (-Not (Test-Path $mavenPath)) {
    Write-Host "Maven not found at: $mavenPath" -ForegroundColor Red
    Write-Host "Please install Maven or update the path in this script" -ForegroundColor Yellow
    exit 1
}

# Compile backend
Write-Host "Running: mvn clean package -DskipTests" -ForegroundColor Gray
& $mavenPath clean package -DskipTests

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "Backend compilation failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✓ Backend compiled successfully!" -ForegroundColor Green
Write-Host ""

# Step 2: Start Backend
Write-Host "════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "📦 Step 2: Starting Backend Server..." -ForegroundColor Yellow
Write-Host ""

$javaPath = "C:\Program Files\Eclipse Adoptium\jdk-17.0.16.8-hotspot\bin\java.exe"
if (-Not (Test-Path $javaPath)) {
    Write-Host "Java not found at: $javaPath" -ForegroundColor Red
    Write-Host "Please install Java 17 or update the path in this script" -ForegroundColor Yellow
    exit 1
}

$jarFile = "$scriptDir\backend\target\spring-boot-demo-0.0.1-SNAPSHOT.jar"

Write-Host "Starting backend on http://localhost:8080" -ForegroundColor Green
Write-Host ""

Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host 'Backend Server' -ForegroundColor Green; Write-Host ''; & '$javaPath' -jar '$jarFile'"

Start-Sleep -Seconds 3

# Step 3: Start Frontend
Write-Host "════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "📦 Step 3: Starting Frontend Server..." -ForegroundColor Yellow
Write-Host ""

Set-Location "$scriptDir\frontend\ai-knowledge-base"

# Check if node_modules exists
if (-Not (Test-Path "node_modules")) {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    npm install
}

Write-Host ""
Write-Host "Starting frontend on http://localhost:3000" -ForegroundColor Green
Write-Host ""

Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host 'Frontend Server' -ForegroundColor Cyan; Write-Host ''; Set-Location '$scriptDir\frontend\ai-knowledge-base'; node node_modules\react-scripts\bin\react-scripts.js start"

Write-Host ""
Write-Host "════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "   Project Started Successfully!" -ForegroundColor Green
Write-Host "════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "Backend:  http://localhost:8080" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Two new PowerShell windows have been opened." -ForegroundColor Yellow
Write-Host "Close those windows to stop the servers." -ForegroundColor Yellow
Write-Host ""

Set-Location $scriptDir

