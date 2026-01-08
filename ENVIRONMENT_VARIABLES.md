# Environment Variables Configuration

## Frontend (Vercel)

Set in Vercel Dashboard → Settings → Environment Variables:

```bash
REACT_APP_BACKEND_URL=https://your-backend.up.railway.app
```

## Backend (Railway)

Set in Railway Dashboard → Variables:

```bash
# AWS Configuration
AWS_ACCESSKEYID=your_aws_access_key_here
AWS_SECRETKEY=your_aws_secret_key_here
AWS_REGION=us-east-1

# S3 Configuration
S3_BUCKETNAME=your-s3-bucket-name

# SNS Configuration
SNS_TOPICARN=arn:aws:sns:us-east-1:YOUR_ACCOUNT_ID:DocumentProcessingTopic

# OpenAI Configuration
OPENAI_API_KEY=sk-your_openai_api_key_here
OPENAI_MODEL=gpt-4o

# Server Port (Railway auto-assigns, but default is 8080)
PORT=8080
```

**IMPORTANT:** 
- Variable names must match `application.properties` format
- Use underscores instead of dots: `aws.accessKeyId` → `AWS_ACCESSKEYID`
- Never commit real keys to GitHub!

## Local Development

Create `backend/src/main/resources/application.properties` (already in .gitignore):

```properties
aws.accessKeyId=YOUR_KEY
aws.secretKey=YOUR_SECRET
aws.region=us-east-1
s3.bucketName=your-bucket
sns.topicArn=arn:aws:sns:us-east-1:xxx:DocumentProcessingTopic
openai.api.key=sk-xxx
openai.model=gpt-4o
```

