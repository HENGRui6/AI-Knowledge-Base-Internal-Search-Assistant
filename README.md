# AI Knowledge Base & Internal Search Assistant

![Java](https://img.shields.io/badge/Java-17-orange?logo=openjdk)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2.0-brightgreen?logo=springboot)
![React](https://img.shields.io/badge/React-18.2-blue?logo=react)
![AWS](https://img.shields.io/badge/AWS-Lambda%20%7C%20S3%20%7C%20DynamoDB-orange?logo=amazonaws)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4-412991?logo=openai)
![License](https://img.shields.io/badge/License-MIT-yellow)

An intelligent document management and search system powered by AI embeddings and semantic search. Upload documents, perform semantic search, and get AI-powered Q&A responses based on your document corpus.

**Documentation:** [Technical Deep Dive](./TECHNICAL_DEEP_DIVE.md) | [Quick Start](./QUICK_START.md)

---

## Project Overview

This project is a full-stack enterprise-grade knowledge base system that allows users to:
- **User Authentication** with JWT-based login system
- **Role-based Access Control** (ADMIN and USER roles)
- **Upload documents** (PDF, TXT) to cloud storage (ADMIN only)
- **Semantic search** using OpenAI embeddings for finding relevant content
- **AI-powered Q&A** using GPT models with RAG (Retrieval-Augmented Generation)
- **Download documents** from the search results
- **Document Management** with delete functionality (ADMIN only)

---

## Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Frontend  │ ◄─────► │    Backend   │ ◄─────► │     AWS     │
│  React SPA  │         │  Spring Boot │         │  Services   │
└─────────────┘         └──────────────┘         └─────────────┘
                               │                         │
                               ▼                         ▼
                        ┌──────────────┐         ┌─────────────┐
                        │  OpenAI API  │         │   Lambda    │
                        │  Embeddings  │         │  Function   │
                        │     GPT      │         │ (Document   │
                        └──────────────┘         │ Processing) │
                                                 └─────────────┘
```

---

## Database Schema

### DynamoDB Tables

#### **Users Table**
```
Partition Key: id (String) - UUID
Attributes:
  - username (String) - Unique username
  - password (String) - BCrypt hashed password
  - role (String) - "USER" or "ADMIN"
  - createdAt (Number) - Timestamp
```

#### **Documents Table**
```
Partition Key: id (String) - Document UUID
Attributes:
  - fileName (String) - Original file name
  - fileSize (Number) - File size in bytes
  - uploadDate (Number) - Upload timestamp
  - status (String) - "PENDING" or "PROCESSED"
  - userId (String) - Uploader's user ID
  - s3Key (String) - S3 object key
```

#### **DocumentChunks Table**
```
Partition Key: documentId (String)
Sort Key: chunkIndex (Number)
Attributes:
  - text (String) - Chunk text content
  - embedding (List of Numbers) - 1536-dimension vector
  - fileName (String) - Source file name
```

---

## Technology Stack

### **Frontend**

| Technology | Version | Purpose | Why This Choice |
|-----------|---------|---------|-----------------|
| **React** | 18.3.1 | UI Framework | Industry-standard for building interactive SPAs; component-based architecture enables code reusability and maintainability |
| **JavaScript (ES6+)** | Latest | Programming Language | Native web language with modern features (async/await, arrow functions, destructuring) for clean code |
| **CSS3** | Latest | Styling | Custom CSS for full design control; ChatGPT-inspired minimalist interface; responsive design with flexbox |
| **Axios** (via fetch API) | Native | HTTP Client | Built-in fetch API for REST API communication; modern Promise-based approach |

**Why React?**
- **Component reusability**: Upload, Search, Q&A components are modular
- **State management**: useState hooks for managing file uploads, search results, chat history
- **Fast development**: Hot reload for instant feedback during development
- **Industry standard**: Most in-demand frontend framework (2024)

---

### **Backend**

| Technology | Version | Purpose | Why This Choice |
|-----------|---------|---------|-----------------|
| **Spring Boot** | 3.2.0 | Backend Framework | Enterprise-grade Java framework; built-in dependency injection, RESTful API support, production-ready features |
| **Java** | 17 LTS | Programming Language | Type-safe, robust, excellent for enterprise applications; long-term support ensures stability |
| **Maven** | 3.9+ | Build Tool | Industry standard for Java dependency management; reproducible builds; central repository |
| **Spring Web** | Included | REST API | @RestController annotations for clean API design; built-in request/response handling |
| **Spring Security** | 6.2.0 | Authentication & Authorization | Industry-standard security framework; JWT token management; role-based access control |
| **JJWT** | 0.11.5 | JWT Library | JSON Web Token generation and validation; secure stateless authentication |
| **BCrypt** | Included | Password Encryption | Industry-standard password hashing; salted hashing prevents rainbow table attacks |

**Why Spring Boot?**
- **Production-ready**: Built-in health checks, metrics, and error handling
- **Microservices-ready**: Can easily scale to distributed architecture
- **Ecosystem**: Massive community, extensive documentation, tested libraries
- **Enterprise adoption**: Used by Fortune 500 companies

---

### **AWS Cloud Services**

| Service | Purpose | Why This Choice |
|---------|---------|-----------------|
| **Amazon S3** | Document Storage | Scalable object storage; 99.999999999% durability; cost-effective for file storage; supports any file type |
| **Amazon DynamoDB** | NoSQL Database | Serverless database for document metadata and embeddings; single-digit millisecond latency; auto-scaling |
| **Amazon SNS** | Message Queue | Decouples upload from processing; asynchronous event-driven architecture; reliable message delivery |
| **AWS Lambda** | Serverless Compute | Processes documents on-demand; auto-scales; pay-per-execution (no idle costs); Python 3.12 runtime |

**Why AWS?**
- **Scalability**: Handles 1 document or 1 million documents with same architecture
- **Reliability**: 99.99% SLA for most services
- **Cost-effective**: Pay only for what you use; serverless components eliminate idle costs
- **Integration**: Services work seamlessly together (S3 → SNS → Lambda)

**Why Serverless?**
- **No server management**: Lambda auto-scales from 0 to 1000+ concurrent executions
- **Cost optimization**: Backend server runs 24/7 ($X/month), Lambda only runs during uploads ($0.20 per 1M requests)
- **Fault tolerance**: AWS manages retries, error handling, dead-letter queues

---

### **AI & Machine Learning**

| Technology | Model | Purpose | Why This Choice |
|-----------|-------|---------|-----------------|
| **OpenAI Embeddings API** | text-embedding-3-small | Convert text to vectors | Industry-leading semantic understanding; 1536-dimension vectors capture meaning; $0.02 per 1M tokens |
| **OpenAI GPT API** | gpt-4 / gpt-3.5-turbo | Question answering | State-of-the-art language model; context-aware responses; RAG integration |

**Why OpenAI Embeddings?**
- **Semantic search**: Finds documents by meaning, not just keywords
  - Query: "machine learning" → Finds "ML", "artificial intelligence", "neural networks"
- **Multi-language**: Works across 100+ languages without configuration
- **Proven accuracy**: Consistently ranks #1 in MTEB benchmark

**Why GPT for Q&A?**
- **Context understanding**: Synthesizes information from multiple documents
- **Natural language**: Responds in conversational tone
- **Source attribution**: Can cite which documents were used

---

## Data Flow

### 1. **Document Upload Flow**
```
User → Frontend (React) → Backend (Spring Boot) → S3 (Store file)
                                                 ↓
                                             DynamoDB (Store metadata)
                                                 ↓
                                             SNS (Publish event)
                                                 ↓
                                       Lambda (Triggered automatically)
                                                 ↓
                          OpenAI API (Generate embeddings for chunks)
                                                 ↓
                               DynamoDB (Store embeddings)
```

### 2. **Semantic Search Flow**
```
User query → Frontend → Backend → OpenAI API (Convert query to embedding)
                                      ↓
                              DynamoDB (Scan all embeddings)
                                      ↓
                        Cosine similarity calculation (Compare vectors)
                                      ↓
                              Return top 5 results
```

### 3. **Q&A Flow**
```
User question → Frontend → Backend → Semantic Search (Find relevant docs)
                                           ↓
                             Build context from top 5 results
                                           ↓
                       OpenAI GPT API (Generate answer with context)
                                           ↓
                           Return answer + sources
```

### 4. **Authentication Flow**
```
User Login → Frontend → Backend → UserRepository (Find user by username)
                                       ↓
                            BCrypt password verification
                                       ↓
                         JwtUtil (Generate JWT token)
                                       ↓
                    Return token + user info to Frontend
                                       ↓
                  Frontend stores token in localStorage
                                       ↓
           All subsequent API calls include Authorization header
                                       ↓
            JwtAuthenticationFilter validates token
                                       ↓
              @PreAuthorize checks role permissions
```

---

## Authentication & Authorization

### User Roles

- **ADMIN**: Full access to all features
  - Upload documents
  - Delete documents
  - View all documents
  - Search documents
  - Ask questions

- **USER**: Read-only access
  - Search documents
  - Ask questions
  - Cannot upload or delete documents

### Security Features

- JWT-based stateless authentication (24-hour token validity)
- BCrypt password hashing with salts
- Role-based access control with @PreAuthorize
- Protected endpoints requiring authentication
- Automatic token validation on all requests

### User Setup

The system uses DynamoDB Users table for authentication. You need to:
1. Create a Users table in AWS DynamoDB with partition key `id` (String)
2. Add users manually or use the DataInitializer to create default users on first startup
3. Configure your own user accounts based on your security requirements

**Note:** Default users are only created if you have DataInitializer enabled and the Users table is empty.

---

## Project Structure

```
AI Knowledge Base & Internal Search Assistant/
│
├── backend/                          # Spring Boot Backend
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/example/demo/
│   │   │   │   ├── DemoApplication.java         # Main entry point
│   │   │   │   ├── config/                      # Configuration classes
│   │   │   │   │   ├── AwsConfig.java           # AWS SDK setup
│   │   │   │   │   ├── SecurityConfig.java      # Spring Security configuration
│   │   │   │   │   ├── JwtAuthenticationFilter.java  # JWT filter
│   │   │   │   │   └── DataInitializer.java     # Database initialization
│   │   │   │   ├── controller/                  # REST API endpoints
│   │   │   │   │   ├── AuthController.java      # /api/auth (login, register)
│   │   │   │   │   ├── DocumentController.java  # /api/documents
│   │   │   │   │   ├── SearchController.java    # /api/search
│   │   │   │   │   └── QAController.java        # /api/qa
│   │   │   │   ├── model/                       # Data models
│   │   │   │   │   ├── User.java                # User entity
│   │   │   │   │   ├── Role.java                # Role enum (USER, ADMIN)
│   │   │   │   │   └── Document.java            # Document entity
│   │   │   │   ├── repository/                  # Database access
│   │   │   │   │   ├── UserRepository.java      # User operations
│   │   │   │   │   └── DocumentRepository.java  # DynamoDB operations
│   │   │   │   ├── service/                     # Business logic
│   │   │   │   │   ├── S3Service.java           # S3 operations
│   │   │   │   │   ├── SNSService.java          # SNS publishing
│   │   │   │   │   ├── SearchService.java       # Vector search
│   │   │   │   │   └── QAService.java           # Q&A logic
│   │   │   │   └── util/                        # Utility classes
│   │   │   │       └── JwtUtil.java             # JWT token generation & validation
│   │   │   └── resources/
│   │   │       └── application.properties       # Configuration
│   │   └── test/                                # Unit tests
│   ├── pom.xml                                  # Maven dependencies
│
├── frontend/                         # React Frontend
│   └── ai-knowledge-base/
│       ├── public/                              # Static files
│       │   ├── index.html                       # HTML template
│       │   └── favicon.ico                      # Website icon
│       ├── src/
│       │   ├── App.js                           # Main React component
│       │   ├── App.css                          # Styles
│       │   ├── index.js                         # React entry point
│       │   └── index.css                        # Global styles
│       ├── package.json                         # npm dependencies
│       └── package-lock.json                    # Locked versions
│
├── start-project.ps1                 # One-click compile & run
└── README.md                         # This file
```

---

## Quick Start

### **Prerequisites**
- **Java 17+** (OpenJDK or Oracle JDK)
- **Maven 3.9+**
- **Node.js 18+** and npm
- **AWS Account** with configured credentials
- **OpenAI API Key**

### **AWS Setup**
1. Create DynamoDB tables: `Documents`, `DocumentEmbeddings`
2. Create S3 bucket for document storage
3. Create SNS topic for upload notifications
4. Deploy Lambda function for document processing
5. Set IAM permissions

### **Configuration**

1. **Create configuration file**:
```powershell
# Copy the example configuration
cd backend/src/main/resources
copy application.properties.example application.properties
```

2. **Edit `backend/src/main/resources/application.properties`** with your credentials:
```properties
# AWS Configuration
aws.accessKeyId=YOUR_AWS_ACCESS_KEY
aws.secretKey=YOUR_AWS_SECRET_KEY
aws.region=us-east-1

# S3 Configuration
s3.bucketName=your-bucket-name

# SNS Configuration
sns.topicArn=arn:aws:sns:us-east-1:YOUR_ACCOUNT_ID:DocumentProcessingTopic

# OpenAI Configuration
openai.api.key=sk-YOUR_OPENAI_API_KEY
openai.model=gpt-4o
```

**Important**: Never commit `application.properties` to git! It's already in `.gitignore`.

### **One-Click Start**
```powershell
.\start-project.ps1
```

This script will:
1. Compile backend with Maven
2. Start backend on http://localhost:8080
3. Install frontend dependencies (if needed)
4. Start frontend on http://localhost:3000


## API Documentation

### **Authentication Endpoints**

#### **User Registration**
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "newuser",
  "password": "password123",
  "role": "USER"
}

Response:
{
  "message": "User registered successfully",
  "username": "newuser",
  "role": "USER"
}
```

#### **User Login**
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}

Response:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "username": "admin",
  "role": "ADMIN",
  "message": "Login successful"
}
```

#### **Verify Token**
```http
GET /api/auth/verify
Authorization: Bearer <token>

Response:
{
  "username": "admin",
  "role": "ADMIN",
  "valid": "true"
}
```

### **Document Endpoints**

#### **Get All Documents** (ADMIN only)
```http
GET /api/documents/all
Authorization: Bearer <token>

Response:
[
  {
    "id": "doc123",
    "fileName": "example.pdf",
    "fileSize": 1024000,
    "uploadDate": "2024-01-15T10:30:00Z",
    "status": "PROCESSED",
    "userId": "admin"
  }
]
```

### **Upload Document** (ADMIN only)
```http
POST /api/documents/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

Parameters:
- file: File (PDF or TXT)
- userId: String

Response:
{
  "message": "Document uploaded successfully",
  "documentId": "uuid",
  "fileName": "example.pdf",
  "fileSize": 102400,
  "uploadDate": "2026-01-07T00:00:00Z"
}
```

### **Search Documents**
```http
POST /api/search
Content-Type: application/json

Body:
{
  "query": "machine learning",
  "topK": 5
}

Response:
{
  "query": "machine learning",
  "topK": 5,
  "count": 5,
  "results": [
    {
      "chunk_id": "doc123_chunk_0",
      "document_id": "doc123",
      "file_name": "ai_ml_guide.txt",
      "text": "Machine learning is...",
      "similarity": 0.85
    }
  ]
}
```

### **Ask Question (Q&A)**
```http
POST /api/qa
Content-Type: application/json

Body:
{
  "question": "What is machine learning?",
  "maxSources": 5
}

Response:
{
  "question": "What is machine learning?",
  "answer": "Machine learning is a subset of artificial intelligence...",
  "sources": [
    {
      "file_name": "ai_ml_guide.txt",
      "similarity": 0.85,
      "text": "Machine learning is..."
    }
  ],
  "model": "gpt-4"
}
```

### **Download Document**
```http
GET /api/documents/{documentId}/download

Response:
File stream with appropriate Content-Type header
```

### **Delete Document** (ADMIN only)
```http
DELETE /api/documents/{documentId}
Authorization: Bearer <token>

Response:
{
  "message": "Document deleted successfully",
  "id": "doc123",
  "fileName": "example.pdf"
}
```

---

## Key Features Explained

### **1. Semantic Search (Vector Similarity)**

**How it works:**
1. Document text is split into chunks (500 characters each, 50 character overlap)
2. Each chunk is converted to a 1536-dimension embedding vector using OpenAI
3. User query is also converted to an embedding vector
4. Cosine similarity is calculated between query vector and all document vectors
5. Top K results are returned, sorted by similarity score

**Why vector search vs keyword search?**
| Keyword Search | Vector Search |
|----------------|---------------|
| "ML" ≠ "machine learning" | "ML" = "machine learning" = "AI training" |
| Requires exact match | Understands synonyms, context |
| "buy iPhone" ≠ "purchase Apple phone" | "buy iPhone" = "purchase Apple phone" |

### **2. RAG (Retrieval-Augmented Generation)**

**Problem:** GPT models have a knowledge cutoff (e.g., April 2023) and don't know your private documents.

**Solution:** RAG combines semantic search + GPT:
```
1. Search: Find top 5 most relevant document chunks
2. Augment: Inject those chunks into GPT prompt as context
3. Generate: GPT answers based on provided context
```

**Benefit:** GPT responses are grounded in your documents, reducing hallucinations.

### **3. Asynchronous Document Processing**

**Why not process documents synchronously?**
- Uploading a 50-page PDF takes 2-3 seconds
- Generating 100 embeddings takes 15-20 seconds
- User would wait 20+ seconds for upload to complete (bad UX)

**Our approach:**
1. Backend saves file to S3 (2 seconds) - User sees "Upload successful!"
2. Backend publishes SNS event and returns
3. Lambda processes document in background (15 seconds)
4. User can upload more files immediately

### **4. DynamoDB Pagination**

**Problem:** DynamoDB `scan()` returns max 1MB of data per request.

**Solution:** Implemented pagination loop:
```java
do {
    ScanResponse response = dynamoDbClient.scan(request);
    results.addAll(response.items());
    lastKey = response.lastEvaluatedKey();
} while (lastKey != null);
```

**Why this matters:** Without pagination, system only searched first ~10 documents. With pagination, searches all documents.

---


## Performance & Scalability

| Metric | Value |
|--------|-------|
| **Search latency** | < 500ms for 1000 documents |
| **Upload latency** | < 3 seconds (sync) + 15 seconds (async embedding) |
| **Q&A latency** | 2-5 seconds (depends on GPT model) |
| **Max document size** | 10MB (configurable) |
| **Concurrent users** | 100+ (Spring Boot default) |
| **Storage cost** | $0.023/GB/month (S3 Standard) |
| **Embedding cost** | $0.02 per 1M tokens (~4M words) |
| **DynamoDB cost** | Pay-per-request ($1.25 per million writes) |

**Scaling considerations:**
- **Frontend**: Can deploy to CDN (CloudFront) for global distribution
- **Backend**: Can run multiple instances behind load balancer
- **Database**: DynamoDB auto-scales; no manual intervention needed
- **Lambda**: Auto-scales to 1000 concurrent executions

---

## Security Considerations

1. **JWT Authentication**: 24-hour token validity; stateless authentication
2. **Password Security**: BCrypt hashing with salts; passwords never stored in plain text
3. **Role-Based Access Control**: @PreAuthorize annotations protect sensitive endpoints
4. **AWS Credentials**: Never commit credentials to git; use environment variables or IAM roles
5. **OpenAI API Key**: Store in environment variable, not in code
6. **CORS**: Backend only allows requests from localhost:3000/3001 and configured production domains
7. **File validation**: Backend validates file type and size before upload
8. **Input sanitization**: All user inputs are escaped before querying
9. **Token Storage**: Frontend stores JWT in localStorage (consider httpOnly cookies for production)

---

## Troubleshooting

### **Backend won't start**
- Check Java version: `java -version` (should be 17+)
- Check if port 8080 is in use: `netstat -ano | findstr :8080`
- Verify AWS credentials: `aws sts get-caller-identity`

### **Frontend shows CORS error**
- Ensure backend is running on port 8080
- Check `@CrossOrigin` annotations in controllers
- Clear browser cache

### **Search returns no results**
- Verify documents were uploaded (check S3 bucket)
- Verify Lambda processed documents (check CloudWatch logs)
- Check DynamoDB has embeddings: `aws dynamodb scan --table-name DocumentEmbeddings --select COUNT`

### **Q&A gives irrelevant answers**
- Check if correct documents are being retrieved (similarity scores)
- Adjust `topK` parameter (try 3 or 10 instead of 5)
- Verify embedding model matches between upload and search

---

## Code Standards

- **Language**: All code, comments, and documentation in English only
- **Style**: Java - Google Java Style Guide; JavaScript - Airbnb Style Guide
- **No emojis in code**: Emojis in documentation and UI only
- **Comments**: Explain WHY, not WHAT (code should be self-documenting)

---

## Contributing

This is a personal project for learning and portfolio purposes. Contributions are welcome via pull requests.

---

## License

MIT License - Feel free to use for learning or commercial purposes.

---

## Author

Built as a co-op term project demonstrating full-stack development, cloud architecture, and AI integration skills.

**Technologies learned:**
- Spring Boot REST API development
- React state management and component design
- AWS serverless architecture (Lambda, SNS, DynamoDB)
- Vector embeddings and semantic search
- RAG (Retrieval-Augmented Generation) for Q&A systems
- CI/CD concepts and build automation

---

## Learning Resources

- Spring Boot: https://spring.io/guides
- React: https://react.dev/learn
- AWS SDK for Java: https://docs.aws.amazon.com/sdk-for-java/
- OpenAI API: https://platform.openai.com/docs
- DynamoDB: https://docs.aws.amazon.com/dynamodb/
- Vector embeddings: https://www.pinecone.io/learn/vector-embeddings/

---

**Last Updated:** January 2026
