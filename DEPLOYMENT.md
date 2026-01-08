# Deployment Guide

This guide explains how to deploy the AI Knowledge Base to production using Vercel (frontend) and Railway (backend).

---

## Architecture

```
Internet Users
      ↓
Vercel (React Frontend)
      ↓
Railway (Spring Boot Backend)
      ↓
AWS Services (S3, DynamoDB, Lambda, SNS)
      ↓
OpenAI API
```

---

## Prerequisites

1. GitHub account with this repository
2. Vercel account (free): https://vercel.com
3. Railway account (free $5 credit): https://railway.app
4. AWS account with configured services (S3, DynamoDB, SNS, Lambda)
5. OpenAI API key

---

## Part 1: Deploy Backend to Railway

### Step 1: Create Railway Project

1. Go to https://railway.app
2. Click "Start a New Project"
3. Select "Deploy from GitHub repo"
4. Choose this repository
5. Railway will auto-detect the project

### Step 2: Configure Environment Variables

In Railway Dashboard, add these variables:

```bash
# AWS Configuration
AWS_ACCESSKEYID=your_aws_access_key
AWS_SECRETKEY=your_aws_secret_key
AWS_REGION=us-east-1

# S3 Configuration
S3_BUCKETNAME=your-bucket-name

# SNS Configuration
SNS_TOPICARN=arn:aws:sns:us-east-1:YOUR_ACCOUNT:DocumentProcessingTopic

# OpenAI Configuration
OPENAI_API_KEY=sk-your_openai_key
OPENAI_MODEL=gpt-4o

# Server Configuration
PORT=8080
```

**IMPORTANT:** Variable names must match `application.properties` (without dots)
- `aws.accessKeyId` → `AWS_ACCESSKEYID`
- `aws.secretKey` → `AWS_SECRETKEY`

### Step 3: Deploy

1. Railway will automatically build and deploy
2. Wait 3-5 minutes for build to complete
3. You'll get a URL like: `https://your-backend.up.railway.app`

### Step 4: Test Backend

```bash
# Test health
curl https://your-backend.up.railway.app/api/documents

# Should return JSON array of documents
```

---

## Part 2: Deploy Frontend to Vercel

### Step 1: Update Backend URL

1. Open `frontend/ai-knowledge-base/src/App.js`
2. Replace all `http://localhost:8080` with your Railway URL:

```javascript
// Find and replace (6 occurrences)
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';

// Then use:
fetch(`${BACKEND_URL}/api/documents/upload`, ...)
fetch(`${BACKEND_URL}/api/search`, ...)
fetch(`${BACKEND_URL}/api/qa`, ...)
fetch(`${BACKEND_URL}/api/documents/${id}/download`, ...)
```

3. Commit and push changes

### Step 2: Create Vercel Project

1. Go to https://vercel.com
2. Click "Add New Project"
3. Import from GitHub (select this repository)
4. Configure:
   - **Framework Preset:** Create React App
   - **Root Directory:** `frontend/ai-knowledge-base`
   - **Build Command:** `npm run build`
   - **Output Directory:** `build`

### Step 3: Add Environment Variable

In Vercel Dashboard → Settings → Environment Variables:

```bash
REACT_APP_BACKEND_URL=https://your-backend.up.railway.app
```

### Step 4: Deploy

1. Click "Deploy"
2. Wait 2-3 minutes
3. You'll get: `https://ai-knowledge-base.vercel.app`

---

## Part 3: Update Backend CORS

Your backend needs to allow requests from Vercel domain.

1. Open `backend/src/main/java/com/example/demo/controller/DocumentController.java`
2. Update `@CrossOrigin`:

```java
@CrossOrigin(origins = {
    "http://localhost:3000", 
    "http://localhost:3001",
    "https://ai-knowledge-base.vercel.app",  // Add your Vercel URL
    "https://*.vercel.app"  // Allow all Vercel preview deployments
})
```

3. Do the same for `SearchController.java` and `QAController.java`
4. Commit and push
5. Railway will auto-redeploy

---

## Part 4: Test Production

1. Visit your Vercel URL
2. Upload a test document
3. Wait for Lambda processing (check CloudWatch)
4. Search for content
5. Test Q&A
6. Test download

---

## Cost Optimization

### Keep Railway Under $5/month

**Option 1: Minimal Resources**
```
Railway Dashboard → Settings → Resources
- Memory: 256 MB (minimum)
- CPU: 0.5 vCPU (minimum)

Estimated cost: ~$5-7/month
```

**Option 2: Sleep Schedule (if Railway supports)**
```
Only run during business hours (8am-8pm)
Saves ~50% cost
```

**Option 3: On-Demand**
```
Deploy when actively interviewing
Pause when not needed
Railway Dashboard → Settings → Pause Service
```

---

## Monitoring

### Railway Logs
```
Railway Dashboard → Deployments → View Logs
Monitor backend errors and requests
```

### Vercel Analytics
```
Vercel Dashboard → Analytics
See visitor count and performance
```

### AWS CloudWatch
```
Monitor Lambda executions
Check DynamoDB usage
Track S3 storage
```

---

## Troubleshooting

### Backend Won't Start on Railway

**Check:**
1. Build logs (Maven compilation errors?)
2. Environment variables (all set correctly?)
3. Port configuration (Railway auto-assigns PORT)

### Frontend Can't Connect to Backend

**Check:**
1. CORS configuration (includes Vercel domain?)
2. Backend URL in frontend (correct Railway URL?)
3. Backend is running (check Railway dashboard)

### High Railway Costs

**Solutions:**
1. Reduce memory to 256 MB
2. Pause service when not interviewing
3. Switch to Render (free but sleeps)

---

## Resume Links

Once deployed, add to your resume:

```
AI Knowledge Base & Search Assistant
Live Demo: https://ai-kb.vercel.app
GitHub: https://github.com/yourusername/ai-knowledge-base
Backend API: https://ai-kb-backend.up.railway.app

Technologies: React, Spring Boot, AWS (S3, Lambda, DynamoDB), OpenAI
Features: Semantic search, RAG-based Q&A, drag-and-drop upload
```

---

## Continuous Deployment

Both platforms support auto-deployment:

**Vercel:**
- Push to GitHub → Auto-deploys frontend
- Preview deployments for PRs

**Railway:**
- Push to GitHub → Auto-deploys backend
- Automatic rollback on failure

---

## Security Notes

1. **Never commit secrets** - use environment variables
2. **Rotate keys** - after deployment, consider rotating AWS/OpenAI keys
3. **Monitor usage** - set AWS billing alerts
4. **Rate limiting** - consider adding to prevent abuse

---

End of Deployment Guide

