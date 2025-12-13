# Test DynamoDB Integration
# This script tests all user API endpoints with DynamoDB

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "  Testing DynamoDB Integration" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

# Test 1: Register User
Write-Host "1. Testing User Registration..." -ForegroundColor Cyan
$registerResponse = curl.exe -X POST http://localhost:8080/api/users/register `
    -H "Content-Type: application/json" `
    -d '{\"username\":\"john_doe\",\"email\":\"john@example.com\",\"password\":\"secure123\"}' `
    2>$null
Write-Host "Response: $registerResponse" -ForegroundColor Yellow

# Extract user ID (simple parsing)
$userId = ($registerResponse | ConvertFrom-Json).id
Write-Host "User ID: $userId`n" -ForegroundColor Green

# Test 2: Login
Write-Host "2. Testing Login..." -ForegroundColor Cyan
$loginResponse = curl.exe -X POST http://localhost:8080/api/users/login `
    -H "Content-Type: application/json" `
    -d '{\"username\":\"john_doe\",\"password\":\"secure123\"}' `
    2>$null
Write-Host "Response: $loginResponse`n" -ForegroundColor Yellow

# Test 3: Get All Users
Write-Host "3. Testing Get All Users..." -ForegroundColor Cyan
$allUsersResponse = curl.exe http://localhost:8080/api/users 2>$null
Write-Host "Response: $allUsersResponse`n" -ForegroundColor Yellow

# Test 4: Get User by ID
Write-Host "4. Testing Get User by ID..." -ForegroundColor Cyan
$userByIdResponse = curl.exe http://localhost:8080/api/users/$userId 2>$null
Write-Host "Response: $userByIdResponse`n" -ForegroundColor Yellow

# Test 5: Update User
Write-Host "5. Testing Update User..." -ForegroundColor Cyan
$updateResponse = curl.exe -X PUT http://localhost:8080/api/users/$userId `
    -H "Content-Type: application/json" `
    -d '{\"username\":\"john_updated\",\"email\":\"john.updated@example.com\",\"password\":\"newsecure123\"}' `
    2>$null
Write-Host "Response: $updateResponse`n" -ForegroundColor Yellow

# Test 6: Verify Update
Write-Host "6. Verifying Update..." -ForegroundColor Cyan
$verifyResponse = curl.exe http://localhost:8080/api/users/$userId 2>$null
Write-Host "Response: $verifyResponse`n" -ForegroundColor Yellow

# Test 7: Delete User
Write-Host "7. Testing Delete User..." -ForegroundColor Cyan
$deleteResponse = curl.exe -X DELETE http://localhost:8080/api/users/$userId 2>$null
Write-Host "Response: $deleteResponse`n" -ForegroundColor Yellow

# Test 8: Verify Deletion
Write-Host "8. Verifying Deletion (should fail)..." -ForegroundColor Cyan
$verifyDeleteResponse = curl.exe http://localhost:8080/api/users/$userId 2>$null
Write-Host "Response: $verifyDeleteResponse`n" -ForegroundColor Yellow

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "  All Tests Completed!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Check AWS DynamoDB Console to verify data" -ForegroundColor White
Write-Host "2. Go to: https://console.aws.amazon.com/dynamodb" -ForegroundColor White
Write-Host "3. Click on 'Users' table" -ForegroundColor White
Write-Host "4. Click 'Explore table items' to see the data" -ForegroundColor White




