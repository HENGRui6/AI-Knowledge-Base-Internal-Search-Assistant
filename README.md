# AI Knowledge Base & Internal Search Assistant

![Java](https://img.shields.io/badge/Java-17-orange?logo=openjdk)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2.0-brightgreen?logo=springboot)
![React](https://img.shields.io/badge/React-18.2-blue?logo=react)
![AWS](https://img.shields.io/badge/AWS-Lambda%20%7C%20S3%20%7C%20DynamoDB-orange?logo=amazonaws)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4-412991?logo=openai)
![License](https://img.shields.io/badge/License-MIT-yellow)

An intelligent document management and search system powered by AI embeddings and semantic search. Upload documents, perform semantic search, and get AI-powered Q&A responses based on your document corpus.

**Live Demo:** Coming soon (Vercel deployment in progress)  
**Documentation:** [Technical Deep Dive](./TECHNICAL_DEEP_DIVE.md) | [Quick Start](./QUICK_START.md)

---

## Project Overview

This project is a full-stack enterprise-grade knowledge base system that allows users to:
- **Upload documents** (PDF, TXT) to cloud storage
- **Semantic search** using OpenAI embeddings for finding relevant content
- **AI-powered Q&A** using GPT models with RAG (Retrieval-Augmented Generation)
- **Download documents** from the search results

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
│   │   │   │   │   └── AwsConfig.java           # AWS SDK setup
│   │   │   │   ├── controller/                  # REST API endpoints
│   │   │   │   │   ├── DocumentController.java  # /api/documents
│   │   │   │   │   ├── SearchController.java    # /api/search
│   │   │   │   │   └── QAController.java        # /api/qa
│   │   │   │   ├── model/                       # Data models
│   │   │   │   │   └── Document.java            # Document entity
│   │   │   │   ├── repository/                  # Database access
│   │   │   │   │   └── DocumentRepository.java  # DynamoDB operations
│   │   │   │   └── service/                     # Business logic
│   │   │   │       ├── S3Service.java           # S3 operations
│   │   │   │       ├── SNSService.java          # SNS publishing
│   │   │   │       ├── SearchService.java       # Vector search
│   │   │   │       └── QAService.java           # Q&A logic
│   │   │   └── resources/
│   │   │       └── application.properties       # Configuration
│   │   └── test/                                # Unit tests
│   ├── target/                                  # Compiled files
│   ├── pom.xml                                  # Maven dependencies
│   └── start-backend.ps1                        # Backend startup script
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
├── cleanup-s3-only.ps1               # Clean all documents
├── list-all-documents.ps1            # View all documents
├── recreate-dynamodb-tables.ps1      # Recreate DynamoDB tables
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

### **Manual Start**

**Backend:**
```powershell
cd backend
.\start-backend.ps1
```

**Frontend:**
```powershell
cd frontend/ai-knowledge-base
npm start
```

---

## API Documentation

### **Upload Document**
```http
POST /api/documents/upload
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

### **Delete Document**
```http
DELETE /api/documents/{documentId}

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

## Maintenance Scripts

| Script | Purpose |
|--------|---------|
| `start-project.ps1` | Compile and start backend + frontend |
| `cleanup-s3-only.ps1` | Delete all documents (S3 + DynamoDB) |
| `list-all-documents.ps1` | View all uploaded documents |
| `recreate-dynamodb-tables.ps1` | Recreate DynamoDB tables |
| `backend/start-backend.ps1` | Start backend only |

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

1. **AWS Credentials**: Never commit credentials to git; use environment variables or IAM roles
2. **OpenAI API Key**: Store in environment variable, not in code
3. **CORS**: Backend only allows requests from localhost:3000/3001 (change for production)
4. **File validation**: Backend validates file type and size before upload
5. **Input sanitization**: All user inputs are escaped before querying

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
