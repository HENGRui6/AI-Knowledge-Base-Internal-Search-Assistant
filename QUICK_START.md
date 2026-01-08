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

## Verify
- Upload a TXT/PDF via UI; expect “Upload successful!”
- Search “machine learning”; expect relevant BBC/ML docs
- Ask AI “What is machine learning?”; expect cited sources

## Useful Scripts
- `list-all-documents.ps1` — list uploaded docs via backend
- `cleanup-s3-only.ps1` — remove all docs (S3 + DynamoDB) **(destructive)**
- `recreate-dynamodb-tables.ps1` — recreate tables (needs AWS CLI)


