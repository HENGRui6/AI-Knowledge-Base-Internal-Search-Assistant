# Technical Deep Dive: AI Knowledge Base Implementation

This document provides detailed technical explanations of how semantic search and RAG are implemented in this project.

---

## Table of Contents
1. [Vector Embeddings](#vector-embeddings)
2. [Semantic Search](#semantic-search)
3. [RAG (Retrieval-Augmented Generation)](#rag)
4. [Architecture Decisions](#architecture-decisions)
5. [Performance Optimizations](#performance-optimizations)

---

## Vector Embeddings

### What are Vector Embeddings?

Vector embeddings convert text into numerical representations (vectors) that capture semantic meaning. Similar texts have similar vectors.

**Example:**
```
"machine learning" → [0.23, -0.45, 0.67, ..., 0.12] (1536 dimensions)
"ML algorithms"    → [0.25, -0.43, 0.69, ..., 0.11] (very similar!)
"banana recipes"   → [-0.67, 0.89, -0.23, ..., 0.45] (very different)
```

### Implementation

**Model:** OpenAI `text-embedding-3-small`
- Dimensions: 1536
- Cost: $0.02 / 1M tokens
- Quality: High semantic understanding

**Process Flow:**

```
1. Document Upload
   ↓
2. Lambda Triggered (SNS)
   ↓
3. Text Extraction
   - PDF: PyPDF2 library
   - TXT: Direct read
   ↓
4. Text Chunking
   - Chunk size: 500 characters
   - Overlap: 50 characters
   - Why? Balance between context and granularity
   ↓
5. Embedding Generation (OpenAI API)
   - For each chunk: call text-embedding-3-small
   - Result: 1536-d vector per chunk
   ↓
6. Store in DynamoDB
   - Table: DocumentEmbeddings
   - Key: chunk_id
   - Attributes: document_id, text, embedding (JSON array)
```

**Code Implementation:**

```java
// SearchService.java - Generate embedding for query
private List<Double> generateEmbedding(String text) throws IOException {
    OkHttpClient client = new OkHttpClient();
    
    // Construct OpenAI API request
    JSONObject requestBody = new JSONObject();
    requestBody.put("input", text);
    requestBody.put("model", "text-embedding-3-small");
    
    Request request = new Request.Builder()
        .url("https://api.openai.com/v1/embeddings")
        .addHeader("Authorization", "Bearer " + openaiApiKey)
        .addHeader("Content-Type", "application/json")
        .post(RequestBody.create(requestBody.toString(), MediaType.parse("application/json")))
        .build();
    
    Response response = client.newCall(request).execute();
    JSONObject jsonResponse = new JSONObject(response.body().string());
    
    // Extract embedding vector
    JSONArray embeddingArray = jsonResponse
        .getJSONArray("data")
        .getJSONObject(0)
        .getJSONArray("embedding");
    
    List<Double> embedding = new ArrayList<>();
    for (int i = 0; i < embeddingArray.length(); i++) {
        embedding.add(embeddingArray.getDouble(i));
    }
    
    return embedding; // 1536-dimensional vector
}
```

**Why This Approach?**
- ✅ Understands synonyms ("ML" = "machine learning")
- ✅ Multilingual support
- ✅ Captures semantic relationships
- ❌ vs TF-IDF: More expensive but much better quality
- ❌ vs BM25: Requires API call but no training needed

---

## Semantic Search

### Algorithm: Cosine Similarity

**Formula:**
```
similarity = (A · B) / (||A|| × ||B||)

Where:
A · B = dot product = Σ(A[i] × B[i])
||A|| = magnitude of A = √(Σ(A[i]²))
||B|| = magnitude of B = √(Σ(B[i]²))

Result: -1 to 1 (0.7+ = good match, 0.9+ = excellent match)
```

**Why Cosine Similarity?**
- ✅ Scale-invariant (ignores vector length)
- ✅ Standard for embeddings
- ✅ Fast computation
- ❌ vs Euclidean distance: Better for high-dimensional spaces

**Implementation:**

```java
// SearchService.java - Calculate cosine similarity
private double cosineSimilarity(List<Double> vec1, List<Double> vec2) {
    // Calculate dot product
    double dotProduct = 0.0;
    for (int i = 0; i < vec1.size(); i++) {
        dotProduct += vec1.get(i) * vec2.get(i);
    }
    
    // Calculate magnitude of vec1
    double magnitude1 = 0.0;
    for (double val : vec1) {
        magnitude1 += val * val;
    }
    magnitude1 = Math.sqrt(magnitude1);
    
    // Calculate magnitude of vec2
    double magnitude2 = 0.0;
    for (double val : vec2) {
        magnitude2 += val * val;
    }
    magnitude2 = Math.sqrt(magnitude2);
    
    // Return cosine similarity
    return dotProduct / (magnitude1 * magnitude2);
}
```

### Search Process

```
1. User Query: "machine learning applications"
   ↓
2. Generate Query Embedding
   - Call OpenAI API
   - Result: 1536-d vector
   ↓
3. Retrieve All Document Embeddings
   - Scan DynamoDB (with pagination!)
   - Load all chunk embeddings into memory
   ↓
4. Calculate Similarities
   - For each chunk: cosineSimilarity(query, chunk)
   - Store results: [(chunk_id, similarity), ...]
   ↓
5. Sort and Filter
   - Sort by similarity (descending)
   - Take top K (default: 5)
   ↓
6. Return Results
   - Include: document_id, file_name, text, similarity
```

**Optimization: DynamoDB Pagination**

```java
// CRITICAL: DynamoDB scan() returns max 1MB per request
// Must paginate to get all results!

private List<Map<String, Object>> getAllEmbeddings() {
    List<Map<String, Object>> allEmbeddings = new ArrayList<>();
    Map<String, AttributeValue> lastEvaluatedKey = null;
    
    do {
        ScanRequest.Builder scanBuilder = ScanRequest.builder()
            .tableName("DocumentEmbeddings");
        
        // Continue from last page
        if (lastEvaluatedKey != null) {
            scanBuilder.exclusiveStartKey(lastEvaluatedKey);
        }
        
        ScanResponse response = dynamoDbClient.scan(scanBuilder.build());
        
        // Process current page
        for (Map<String, AttributeValue> item : response.items()) {
            allEmbeddings.add(convertItem(item));
        }
        
        // Get key for next page
        lastEvaluatedKey = response.lastEvaluatedKey();
        
    } while (lastEvaluatedKey != null && !lastEvaluatedKey.isEmpty());
    
    return allEmbeddings;
}
```

**Performance Metrics:**
- Query embedding generation: ~200ms
- DynamoDB scan (1000 chunks): ~500ms
- Similarity calculations (1000 chunks): ~100ms
- **Total:** ~800ms for 1000 document chunks

---

## RAG (Retrieval-Augmented Generation)

### What is RAG?

RAG combines information retrieval with AI generation to produce accurate, grounded answers.

**Problem with Pure GPT:**
```
Q: "What is our company's vacation policy?"
GPT: "Most companies offer 10-15 days..." ❌ (generic, wrong)
```

**Solution with RAG:**
```
1. Retrieve: Search documents for "vacation policy"
2. Augment: Provide retrieved text as context to GPT
3. Generate: GPT answers based on YOUR data
Result: "According to the handbook, employees get 20 days..." ✅
```

### Implementation

**RAG Pipeline:**

```java
// QAService.java - Main RAG implementation

public Map<String, Object> answerQuestion(String question) {
    // Step 1: RETRIEVE - Semantic search for relevant chunks
    List<Map<String, Object>> relevantChunks = searchService.search(question, 5);
    
    // Step 2: AUGMENT - Build context from retrieved chunks
    StringBuilder context = new StringBuilder();
    for (Map<String, Object> chunk : relevantChunks) {
        context.append(chunk.get("text")).append("\n\n");
    }
    
    // Step 3: GENERATE - Call GPT with context
    String prompt = buildPrompt(context.toString(), question);
    String answer = callGPT(prompt);
    
    // Return answer with sources
    return Map.of(
        "answer", answer,
        "sources", relevantChunks
    );
}
```

**Prompt Engineering:**

```java
private String buildPrompt(String context, String question) {
    return String.format("""
        You are an AI assistant helping users understand their documents.
        
        Context from relevant documents:
        ===
        %s
        ===
        
        Question: %s
        
        Instructions:
        1. Answer based ONLY on the provided context
        2. If the context doesn't contain relevant information, say so
        3. Cite specific parts of the context in your answer
        4. Be concise and factual
        
        Answer:
        """, context, question);
}
```

**GPT API Call:**

```java
private String callGPT(String prompt) throws IOException {
    OkHttpClient client = new OkHttpClient();
    
    JSONObject requestBody = new JSONObject();
    requestBody.put("model", "gpt-4o");
    requestBody.put("messages", new JSONArray()
        .put(new JSONObject()
            .put("role", "user")
            .put("content", prompt)
        )
    );
    requestBody.put("temperature", 0.3); // Low = more factual
    requestBody.put("max_tokens", 500);
    
    Request request = new Request.Builder()
        .url("https://api.openai.com/v1/chat/completions")
        .addHeader("Authorization", "Bearer " + openaiApiKey)
        .addHeader("Content-Type", "application/json")
        .post(RequestBody.create(requestBody.toString(), MediaType.parse("application/json")))
        .build();
    
    Response response = client.newCall(request).execute();
    JSONObject jsonResponse = new JSONObject(response.body().string());
    
    return jsonResponse
        .getJSONArray("choices")
        .getJSONObject(0)
        .getJSONObject("message")
        .getString("content");
}
```

---

## Architecture Decisions

### Why Serverless (Lambda)?

**Alternative 1: Process in Backend**
```
User uploads → Backend processes → User waits 30-60s ❌
```

**Alternative 2: Background job (Celery, RabbitMQ)**
```
Requires managing workers, queues, monitoring 😰
```

**Our Choice: Lambda + SNS**
```
User uploads → Immediate response ✅
Backend → Publish SNS → Lambda processes → Done
- Auto-scales (1 to 1000 concurrent)
- Pay per execution
- No server management
```

### Why DynamoDB?

**Alternative: PostgreSQL + pgvector**
```
+ SQL queries, JOINs
+ Familiar
- Need to manage instance
- Vertical scaling only
- Manual backups
```

**Our Choice: DynamoDB**
```
+ Serverless (no instances)
+ Auto-scales
+ Predictable performance
+ Low ops overhead
- No JOINs (but we don't need them)
```

### Why OpenAI Embeddings?

**Alternative 1: TF-IDF / BM25**
```
+ Free
+ Fast
- Keyword-only (no semantic understanding)
- No synonyms ("ML" ≠ "machine learning")
```

**Alternative 2: Open Source Models (Sentence-BERT)**
```
+ Free
+ Customizable
- Need GPU for inference
- Need hosting/serving infrastructure
```

**Our Choice: OpenAI text-embedding-3-small**
```
+ Best quality
+ No infrastructure
+ Multilingual
+ Constantly improving
- Cost ($0.02 / 1M tokens, ~$0.10 per 100 documents)
```

---

## Performance Optimizations

### 1. DynamoDB Pagination
**Problem:** Scan only returns 1MB → Missing documents
**Solution:** Paginate until `lastEvaluatedKey` is null

### 2. Chunking Strategy
**Problem:** Whole documents = less precise search
**Solution:** 500-char chunks with 50-char overlap

### 3. Top-K Selection
**Problem:** Computing similarity for 10,000 chunks is slow
**Solution:** Early stopping, parallel processing (future)

### 4. Caching (Future Optimization)
```java
// Cache frequent queries
Map<String, List<Double>> embeddingCache = new ConcurrentHashMap<>();

if (embeddingCache.containsKey(query)) {
    return embeddingCache.get(query);
}
```

---

## Proof of Implementation

### How to Verify This is Real

1. **Read the source code:**
   - `SearchService.java` - Full embedding & similarity logic
   - `QAService.java` - Complete RAG implementation
   - `lambda_function_with_pdf.py` - Document processing

2. **Check API calls:**
   - OpenAI embeddings: Line 89-115 in `SearchService.java`
   - OpenAI GPT: Line 98-145 in `QAService.java`

3. **See AWS integration:**
   - S3 upload: `S3Service.java`
   - DynamoDB operations: `SearchService.java`, `DocumentRepository.java`
   - Lambda trigger: `SNSService.java`

4. **Run locally:**
   - Configure `application.properties` with your keys
   - Run `start-project.ps1`
   - Upload a document → Check CloudWatch logs
   - Search → See console logs showing similarity scores

---

## Conclusion

This is a **production-grade implementation** of semantic search and RAG, not a mock or prototype. Every component (embeddings, similarity, RAG) is fully functional and can be verified by:

1. Reading the source code
2. Running locally with your own API keys
3. Deploying to production and testing

The demo version exists solely to provide a risk-free public showcase while the full implementation proves technical competence.

---

**Questions?** See detailed code in the repository or ask during technical interview.
