# Testing Your User Management API

## 🎉 Congratulations! You've created your first Spring Boot API!

### What You've Built:
- ✅ User model class (User.java)
- ✅ User controller with 7 endpoints
- ✅ Complete CRUD operations
- ✅ User registration and login

---

## 🚀 Step 1: Start Your Application

### Open Terminal and Run:
```bash
cd "C:\Users\zbx20\OneDrive\Desktop\8BitProject\AI Knowledge Base & Internal Search Assistant"

# Set Maven path (if needed)
$env:MAVEN_HOME = "C:\Program Files\Apache\maven\apache-maven-3.9.11"
$env:PATH += ";$env:MAVEN_HOME\bin"

# Start Spring Boot
mvn spring-boot:run
```

### Wait for:
```
Started DemoApplication in X seconds
```

Your API is now running on `http://localhost:8080`!

---

## 📡 Step 2: Test Your API Endpoints

### Method A: Using PowerShell (curl)

#### 1. Register a New User
```powershell
$body = @{
    username = "john"
    email = "john@example.com"
    password = "password123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8080/api/users/register" -Method POST -Body $body -ContentType "application/json"
```

**Expected Response:**
```json
{
  "message": "User registered successfully",
  "id": "1",
  "username": "john"
}
```

---

#### 2. Login
```powershell
$loginBody = @{
    username = "john"
    password = "password123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8080/api/users/login" -Method POST -Body $loginBody -ContentType "application/json"
```

**Expected Response:**
```json
{
  "message": "Login successful",
  "id": "1",
  "username": "john"
}
```

---

#### 3. Get All Users
```powershell
Invoke-RestMethod -Uri "http://localhost:8080/api/users" -Method GET
```

**Expected Response:**
```json
[
  {
    "id": "1",
    "username": "john",
    "email": "john@example.com",
    "password": "password123"
  }
]
```

---

#### 4. Get User by ID
```powershell
Invoke-RestMethod -Uri "http://localhost:8080/api/users/1" -Method GET
```

---

#### 5. Create Another User
```powershell
$newUser = @{
    username = "jane"
    email = "jane@example.com"
    password = "jane456"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8080/api/users" -Method POST -Body $newUser -ContentType "application/json"
```

---

#### 6. Update User
```powershell
$updateUser = @{
    username = "john_updated"
    email = "john.new@example.com"
    password = "newpassword"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8080/api/users/1" -Method PUT -Body $updateUser -ContentType "application/json"
```

---

#### 7. Delete User
```powershell
Invoke-RestMethod -Uri "http://localhost:8080/api/users/1" -Method DELETE
```

**Expected Response:**
```json
{
  "message": "User deleted successfully",
  "id": "1"
}
```

---

### Method B: Using Browser

You can test GET endpoints directly in browser:

```
http://localhost:8080/api/users
http://localhost:8080/api/users/1
http://localhost:8080/hello
http://localhost:8080/api/status
```

---

## 📊 Your Complete API Reference

| Method | Endpoint | Description | Body Required |
|--------|----------|-------------|---------------|
| GET | `/api/users` | Get all users | No |
| GET | `/api/users/{id}` | Get user by ID | No |
| POST | `/api/users` | Create new user | Yes |
| PUT | `/api/users/{id}` | Update user | Yes |
| DELETE | `/api/users/{id}` | Delete user | No |
| POST | `/api/users/register` | Register user | Yes |
| POST | `/api/users/login` | Login | Yes |

---

## 🎯 Quick Test Script

Save this as `test-api.ps1`:

```powershell
# Test Spring Boot User API

Write-Host "=== Testing User Registration ===" -ForegroundColor Green
$registerBody = @{
    username = "testuser"
    email = "test@example.com"
    password = "test123"
} | ConvertTo-Json

$registerResult = Invoke-RestMethod -Uri "http://localhost:8080/api/users/register" -Method POST -Body $registerBody -ContentType "application/json"
Write-Host "Result:" -ForegroundColor Yellow
$registerResult | ConvertTo-Json

Start-Sleep -Seconds 1

Write-Host "`n=== Testing Login ===" -ForegroundColor Green
$loginBody = @{
    username = "testuser"
    password = "test123"
} | ConvertTo-Json

$loginResult = Invoke-RestMethod -Uri "http://localhost:8080/api/users/login" -Method POST -Body $loginBody -ContentType "application/json"
Write-Host "Result:" -ForegroundColor Yellow
$loginResult | ConvertTo-Json

Start-Sleep -Seconds 1

Write-Host "`n=== Getting All Users ===" -ForegroundColor Green
$users = Invoke-RestMethod -Uri "http://localhost:8080/api/users" -Method GET
Write-Host "Result:" -ForegroundColor Yellow
$users | ConvertTo-Json

Write-Host "`n=== All Tests Completed! ===" -ForegroundColor Green
```

Run it:
```powershell
.\test-api.ps1
```

---

## 🎉 Success Checklist

After testing, you should be able to:
- ✅ Register a new user
- ✅ Login with username/password
- ✅ Get list of all users
- ✅ Get a specific user by ID
- ✅ Create a new user
- ✅ Update user information
- ✅ Delete a user

---

## 🐛 Troubleshooting

### Port 8080 Already in Use:
```powershell
# Find and kill process
netstat -ano | findstr :8080
taskkill /F /PID [PID]
```

### Application Won't Start:
```powershell
# Clean and rebuild
mvn clean compile
mvn spring-boot:run
```

### Can't Connect:
- Make sure application is running
- Check console for "Started DemoApplication"
- Verify port 8080 is not blocked by firewall

---

## 🎓 What You Learned

1. ✅ Created a REST API with Spring Boot
2. ✅ Implemented CRUD operations
3. ✅ Handled HTTP requests (GET, POST, PUT, DELETE)
4. ✅ Processed JSON data
5. ✅ Used in-memory storage
6. ✅ Tested API endpoints

---

## 🚀 Next Steps

Now you can:
1. Add more features (search, pagination)
2. Connect to a real database (DynamoDB)
3. Implement JWT authentication
4. Add input validation
5. Build React frontend

Congratulations on building your first Spring Boot API! 🎉
