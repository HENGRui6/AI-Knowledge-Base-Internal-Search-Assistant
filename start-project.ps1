# AI Knowledge Base - One-Click Start Script
# This script compiles and starts both backend and frontend

Write-Host ""
Write-Host "════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   AI Knowledge Base & Search Assistant" -ForegroundColor Green
Write-Host "════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Function to stop processes using a specific port
function Stop-ProcessOnPort {
    param([int]$Port, [string]$ServiceName)
    
    Write-Host "Checking port $Port ($ServiceName)..." -ForegroundColor Gray -NoNewline
    
    $stopped = $false
    $maxAttempts = 3
    
    for ($attempt = 1; $attempt -le $maxAttempts; $attempt++) {
        try {
            $connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
            if ($connections) {
                $processIds = $connections | Select-Object -ExpandProperty OwningProcess -Unique | Where-Object { $_ -gt 0 }
                if ($processIds) {
                    if ($attempt -eq 1) {
                        Write-Host " [FOUND]" -ForegroundColor Yellow
                    }
                    foreach ($processId in $processIds) {
                        try {
                            $proc = Get-Process -Id $processId -ErrorAction SilentlyContinue
                            if ($proc) {
                                Write-Host "  Attempt ${attempt}: Stopping $($proc.ProcessName) (PID: $processId)..." -ForegroundColor Yellow
                                # Try graceful shutdown first
                                if ($proc.ProcessName -eq "node") {
                                    # For node processes, try to kill the process tree
                                    try {
                                        taskkill /F /T /PID $processId 2>$null | Out-Null
                                    } catch {
                                        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
                                    }
                                } else {
                                    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
                                }
                                $stopped = $true
                            }
                        } catch {
                            # Process might have already terminated
                        }
                    }
                }
            }
        } catch {
            # Ignore errors
        }
        
        # Also check for node processes that might be running React (common for port 3000)
        if ($Port -eq 3000) {
            try {
                $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
                if ($nodeProcesses) {
                    foreach ($nodeProc in $nodeProcesses) {
                        try {
                            $nodeConnections = Get-NetTCPConnection -OwningProcess $nodeProc.Id -LocalPort $Port -ErrorAction SilentlyContinue
                            if ($nodeConnections) {
                                Write-Host "  Attempt ${attempt}: Stopping Node.js process: PID $($nodeProc.Id)..." -ForegroundColor Yellow
                                try {
                                    taskkill /F /T /PID $nodeProc.Id 2>$null | Out-Null
                                } catch {
                                    Stop-Process -Id $nodeProc.Id -Force -ErrorAction SilentlyContinue
                                }
                                $stopped = $true
                            }
                        } catch {
                            # Ignore
                        }
                    }
                }
            } catch {
                # Ignore
            }
        }
        
        if ($stopped) {
            Start-Sleep -Seconds 2
            # Verify port is now free
            $verify = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
            if (-not $verify) {
                Write-Host "  [OK] Port $Port freed" -ForegroundColor Green
                return
            } elseif ($attempt -lt $maxAttempts) {
                Write-Host "  Port still in use, retrying..." -ForegroundColor Yellow
            }
        } else {
            Write-Host " [FREE]" -ForegroundColor Green
            return
        }
    }
    
    # Final check
    $finalCheck = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    if ($finalCheck) {
        Write-Host "  [WARN] Port $Port may still be in use after $maxAttempts attempts" -ForegroundColor Yellow
        Write-Host "  You may need to manually stop the process or restart your computer" -ForegroundColor Yellow
    } else {
        Write-Host "  [OK] Port $Port freed" -ForegroundColor Green
    }
}

# Function to stop Java processes that might lock JAR files
function Stop-JavaProcesses {
    Write-Host "Checking for Java processes..." -ForegroundColor Gray -NoNewline
    
    try {
        $javaProcesses = Get-Process -Name "java" -ErrorAction SilentlyContinue
        if ($javaProcesses) {
            Write-Host " [FOUND $($javaProcesses.Count) process(es)]" -ForegroundColor Yellow
            foreach ($proc in $javaProcesses) {
                try {
                    Write-Host "  Stopping Java process: PID $($proc.Id)" -ForegroundColor Yellow
                    Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
                } catch {
                    # Process might have already terminated
                }
            }
            Start-Sleep -Seconds 1
            Write-Host "  [OK] Java processes stopped" -ForegroundColor Green
        } else {
            Write-Host " [NONE]" -ForegroundColor Green
        }
    } catch {
        Write-Host " [NONE]" -ForegroundColor Green
    }
}

# Function to delete locked JAR file
function Remove-LockedJar {
    param([string]$JarPath)
    
    if (Test-Path $JarPath) {
        Write-Host "Removing old JAR file..." -ForegroundColor Gray -NoNewline
        try {
            Remove-Item $JarPath -Force -ErrorAction Stop
            Write-Host " [OK]" -ForegroundColor Green
        } catch {
            Write-Host " [FAILED]" -ForegroundColor Yellow
            Write-Host "  Trying to delete target folder..." -ForegroundColor Yellow
            $targetDir = Split-Path $JarPath
            if (Test-Path $targetDir) {
                Remove-Item $targetDir -Recurse -Force -ErrorAction SilentlyContinue
                Write-Host "  [OK] Target folder deleted" -ForegroundColor Green
            }
        }
    }
}

# Step 0: Clean up any running processes
Write-Host "════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "Step 0: Checking for running processes..." -ForegroundColor Yellow
Write-Host ""

Stop-ProcessOnPort -Port 8080 -ServiceName "Backend"
Stop-ProcessOnPort -Port 3000 -ServiceName "Frontend"
Stop-JavaProcesses

$jarFile = "$scriptDir\backend\target\spring-boot-demo-0.0.1-SNAPSHOT.jar"
Remove-LockedJar -JarPath $jarFile

Write-Host ""

# Step 1: Compile Backend
Write-Host "════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "Step 1: Compiling Backend..." -ForegroundColor Yellow
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
Write-Host "[OK] Backend compiled successfully!" -ForegroundColor Green
Write-Host ""

# Step 2: Start Backend
Write-Host "════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "Step 2: Starting Backend Server..." -ForegroundColor Yellow
Write-Host ""

# Double-check port 8080 is free before starting
Stop-ProcessOnPort -Port 8080 -ServiceName "Backend"

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
Write-Host "Step 3: Starting Frontend Server..." -ForegroundColor Yellow
Write-Host ""

# Double-check port 3000 is free before starting
Stop-ProcessOnPort -Port 3000 -ServiceName "Frontend"

Set-Location "$scriptDir\frontend\ai-knowledge-base"

# Check if node_modules exists
if (-Not (Test-Path "node_modules")) {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    npm install
}

Write-Host ""
Write-Host "Starting frontend on http://localhost:3000" -ForegroundColor Green
Write-Host "Starting in FULL MODE (not demo) - connecting to real backend..." -ForegroundColor Yellow
Write-Host ""

# Set environment variable to ensure full mode (not demo)
$env:REACT_APP_DEMO_MODE = 'false'
$env:REACT_APP_BACKEND_URL = 'http://localhost:8080'

Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host 'Frontend Server (FULL MODE)' -ForegroundColor Cyan; Write-Host 'DEMO_MODE: false' -ForegroundColor Green; Write-Host 'BACKEND_URL: http://localhost:8080' -ForegroundColor Green; Write-Host ''; Set-Location '$scriptDir\frontend\ai-knowledge-base'; `$env:REACT_APP_DEMO_MODE = 'false'; `$env:REACT_APP_BACKEND_URL = 'http://localhost:8080'; node node_modules\react-scripts\bin\react-scripts.js start"

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

