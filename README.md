# AI Knowledge Base - Spring Boot Backend

## Current Progress: 55% 🚀

**Completed:**
- ✅ User API (7 endpoints) - DynamoDB ✅ WORKING!
- ✅ Document API (5 endpoints) - S3 + DynamoDB ✅ WORKING!
- ✅ File upload to S3 ✅ TESTED!
- ✅ File download from S3 ✅ TESTED!
- ✅ Multi-service AWS architecture (DynamoDB + S3)

**What's Working:**
- 📤 Upload PDF files to AWS S3
- 📥 Download files from S3
- 🗄️ Store metadata in DynamoDB
- 🗑️ Delete files from both S3 and DynamoDB
- 👤 User management with persistent storage

**Next Step:**
- 🔨 Add JWT authentication
- 🔨 Implement event-driven processing (SNS + Lambda)
- 🔨 Add OpenAI embeddings integration

## Quick Start

```powershell
# Set Maven path
$env:MAVEN_HOME = "C:\Program Files\Apache\maven\apache-maven-3.9.11"
$env:PATH += ";$env:MAVEN_HOME\bin"

# Run application
mvn spring-boot:run
```

## Test API

### Test with DynamoDB (Recommended)
```powershell
.\test-dynamodb.ps1
```

### Quick Test
```powershell
# Register a user
curl.exe -X POST http://localhost:8080/api/users/register -H "Content-Type: application/json" -d '{\"username\":\"testuser\",\"email\":\"test@example.com\",\"password\":\"password123\"}'

# Login
curl.exe -X POST http://localhost:8080/api/users/login -H "Content-Type: application/json" -d '{\"username\":\"testuser\",\"password\":\"password123\"}'

# Get all users
curl.exe http://localhost:8080/api/users
```

## Project Structure

```
src/main/java/com/example/demo/
├── DemoApplication.java          # Main entry point
├── config/
│   ├── DynamoDBConfig.java       # AWS DynamoDB configuration
│   └── S3Config.java             # AWS S3 configuration
├── controller/
│   ├── UserController.java       # User API (7 endpoints)
│   └── DocumentController.java   # Document API (5 endpoints)
├── model/
│   ├── User.java                 # User data model
│   └── Document.java             # Document data model
├── repository/
│   ├── UserRepository.java       # User data access layer
│   └── DocumentRepository.java   # Document data access layer
└── service/
    └── S3Service.java            # S3 file operations
```

## AWS Setup Required (Do This Now!)

### Step 1: Create S3 Bucket

1. **Go to S3 Console**: https://console.aws.amazon.com/s3
2. **Click "Create bucket"**
3. **Bucket name**: `ai-knowledge-base-documents` (must match application.properties)
4. **Region**: US East (N. Virginia) us-east-1
5. **Block Public Access**: Keep all boxes CHECKED (default - secure)
6. **Bucket Versioning**: Disabled (default)
7. **Click "Create bucket"**

### Step 2: Create DynamoDB Documents Table

1. **Go to DynamoDB Console**: https://console.aws.amazon.com/dynamodb
2. **Click "Create table"**
3. **Table name**: `Documents`
4. **Partition key**: `id` (String)
5. **Settings**: Use default settings
6. **Click "Create table"**
7. **Wait 30-60 seconds** for table status to become "Active"

### Step 3: Verify Setup

✅ **S3 Bucket**: Should see `ai-knowledge-base-documents` in bucket list  
✅ **DynamoDB Tables**: Should see both `Users` and `Documents` tables  
✅ **Both Active**: Green checkmarks on both services

## 📚 Learning Resources

**Complete Tutorial (English)**: [`learning-materials/COMPLETE-TUTORIAL.md`](learning-materials/COMPLETE-TUTORIAL.md)
- Detailed explanation of everything we built
- Step-by-step breakdown of all code
- Key concepts explained
- How everything works together

**完整教程（中文版）**: [`learning-materials/完整教程-中文版.md`](learning-materials/完整教程-中文版.md)
- 所有内容的详细中文解释
- 带英文术语对照
- 逐步代码分解
- 核心概念详解

## What We've Accomplished

✅ **User Management System**
- Registration and login
- CRUD operations
- DynamoDB integration
- UUID-based IDs

✅ **Document Management System**
- File upload to S3
- File download from S3
- Metadata storage in DynamoDB
- File lifecycle management

✅ **AWS Multi-Service Architecture**
- DynamoDB (2 tables: Users, Documents)
- S3 (1 bucket: ai-kb-documents-derekz)
- AWS SDK integration
- Secure credential management

## Troubleshooting

If you get errors:
- Check AWS credentials in `application.properties`
- Verify table name is exactly "Users"
- Ensure table status is "Active" in AWS Console
- Check IAM user has DynamoDB permissions
