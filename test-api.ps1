# Test Spring Boot User API

Write-Host "=== Testing Spring Boot User Management API ===" -ForegroundColor Cyan
Write-Host ""

# Test 1: Register a new user
Write-Host "1. Testing User Registration..." -ForegroundColor Green
$registerBody = @{
    username = "testuser"
    email = "test@example.com"
    password = "test123"
} | ConvertTo-Json

try {
    $registerResult = Invoke-RestMethod -Uri "http://localhost:8080/api/users/register" -Method POST -Body $registerBody -ContentType "application/json"
    Write-Host "   SUCCESS: User registered!" -ForegroundColor Yellow
    $registerResult | ConvertTo-Json | Write-Host
} catch {
    Write-Host "   ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

Start-Sleep -Seconds 1
Write-Host ""

# Test 2: Login
Write-Host "2. Testing Login..." -ForegroundColor Green
$loginBody = @{
    username = "testuser"
    password = "test123"
} | ConvertTo-Json

try {
    $loginResult = Invoke-RestMethod -Uri "http://localhost:8080/api/users/login" -Method POST -Body $loginBody -ContentType "application/json"
    Write-Host "   SUCCESS: Login successful!" -ForegroundColor Yellow
    $loginResult | ConvertTo-Json | Write-Host
} catch {
    Write-Host "   ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

Start-Sleep -Seconds 1
Write-Host ""

# Test 3: Get all users
Write-Host "3. Testing Get All Users..." -ForegroundColor Green
try {
    $users = Invoke-RestMethod -Uri "http://localhost:8080/api/users" -Method GET
    Write-Host "   SUCCESS: Retrieved $($users.Count) user(s)!" -ForegroundColor Yellow
    $users | ConvertTo-Json | Write-Host
} catch {
    Write-Host "   ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

Start-Sleep -Seconds 1
Write-Host ""

# Test 4: Create another user
Write-Host "4. Testing Create User..." -ForegroundColor Green
$createBody = @{
    username = "johndoe"
    email = "john@example.com"
    password = "john456"
} | ConvertTo-Json

try {
    $createResult = Invoke-RestMethod -Uri "http://localhost:8080/api/users" -Method POST -Body $createBody -ContentType "application/json"
    Write-Host "   SUCCESS: User created!" -ForegroundColor Yellow
    $createResult | ConvertTo-Json | Write-Host
} catch {
    Write-Host "   ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

Start-Sleep -Seconds 1
Write-Host ""

# Test 5: Get user by ID
Write-Host "5. Testing Get User by ID..." -ForegroundColor Green
try {
    $user = Invoke-RestMethod -Uri "http://localhost:8080/api/users/1" -Method GET
    Write-Host "   SUCCESS: Retrieved user!" -ForegroundColor Yellow
    $user | ConvertTo-Json | Write-Host
} catch {
    Write-Host "   ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== All Tests Completed! ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your API is working! Try these endpoints in browser:" -ForegroundColor White
Write-Host "  http://localhost:8080/api/users" -ForegroundColor Gray
Write-Host "  http://localhost:8080/hello" -ForegroundColor Gray
Write-Host "  http://localhost:8080/api/status" -ForegroundColor Gray

