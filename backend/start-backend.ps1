# Start Spring Boot Backend
# This script runs the pre-compiled Spring Boot application

Write-Host ""
Write-Host "════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   Starting Spring Boot Backend Server" -ForegroundColor Green
Write-Host "════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$backendRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$jarFile = "$backendRoot\target\spring-boot-demo-0.0.1-SNAPSHOT.jar"

# Check if JAR file exists
if (-Not (Test-Path $jarFile)) {
    Write-Host "Error: JAR file not found!" -ForegroundColor Red
    Write-Host "   Expected: $jarFile" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please compile the project first using Maven" -ForegroundColor Yellow
    exit 1
}

Write-Host "Starting backend on port 8080..." -ForegroundColor Yellow
Write-Host "JAR file: spring-boot-demo-0.0.1-SNAPSHOT.jar" -ForegroundColor Gray
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""
Write-Host "════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Run the Spring Boot application using Java
& "C:\Program Files\Eclipse Adoptium\jdk-17.0.16.8-hotspot\bin\java.exe" -jar $jarFile

