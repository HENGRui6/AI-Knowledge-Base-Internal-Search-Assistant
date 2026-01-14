# Quick Start

## Prerequisites
- Java 17+, Maven 3.9+
- Node.js 18+ (npm)
- AWS credentials (env vars or `aws configure`)
- OpenAI API key

## Setup
```powershell
# 1) Copy config template and add your keys
cd backend/src/main/resources
copy application.properties.example application.properties
# Edit application.properties with AWS / OpenAI keys and bucket/topic names
```

## One-Click Start (recommended)
```powershell
# From project root
.\start-project.ps1
```
- Backend: http://localhost:8080
- Frontend: http://localhost:3000

## Manual Start (if needed)
```powershell
# Backend
cd backend
mvn clean package -DskipTests
java -jar target/spring-boot-demo-0.0.1-SNAPSHOT.jar

# Frontend
cd frontend/ai-knowledge-base
npm install
npm start
```

## User Setup

Before using the system, you need to:
1. Create a Users table in AWS DynamoDB with partition key `id` (String)
2. Add user accounts to the Users table (manually or via DataInitializer)
3. Configure user credentials based on your security requirements

## Verify

1. **Login**: Use your configured credentials to login at http://localhost:3000
2. **Upload**: Upload a TXT/PDF via UI (ADMIN role only); expect "Upload successful!"
3. **Search**: Search "machine learning"; expect relevant docs with similarity scores
4. **Ask AI**: Ask "What is machine learning?"; expect cited sources
5. **Test Roles**: Verify USER role cannot upload/delete documents, only ADMIN can

## Project Management

**Start Project:**
```powershell
.\start-project.ps1
```

**Stop Project:**
Close the PowerShell terminal windows that were opened for backend and frontend servers.

**Logs:**
Check the terminal windows for backend and frontend logs.


