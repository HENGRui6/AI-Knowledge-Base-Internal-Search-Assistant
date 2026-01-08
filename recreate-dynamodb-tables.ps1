# Recreate DynamoDB Tables Script

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Recreating DynamoDB Tables" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check if AWS CLI is available
try {
    $null = aws --version
} catch {
    Write-Host "ERROR: AWS CLI not found in PATH" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please create tables manually in AWS Console:" -ForegroundColor Yellow
    Write-Host "https://console.aws.amazon.com/dynamodb/home" -ForegroundColor Cyan
    Write-Host ""
    exit
}

# Table 1: Documents
Write-Host "Creating Documents table..." -ForegroundColor Yellow

aws dynamodb create-table `
    --table-name Documents `
    --attribute-definitions `
        AttributeName=document_id,AttributeType=S `
        AttributeName=user_id,AttributeType=S `
    --key-schema `
        AttributeName=document_id,KeyType=HASH `
    --global-secondary-indexes `
        "[{`"IndexName`":`"UserIdIndex`",`"KeySchema`":[{`"AttributeName`":`"user_id`",`"KeyType`":`"HASH`"}],`"Projection`":{`"ProjectionType`":`"ALL`"},`"ProvisionedThroughput`":{`"ReadCapacityUnits`":5,`"WriteCapacityUnits`":5}}]" `
    --provisioned-throughput `
        ReadCapacityUnits=5,WriteCapacityUnits=5

Write-Host "Documents table created!" -ForegroundColor Green
Write-Host ""

# Table 2: DocumentEmbeddings
Write-Host "Creating DocumentEmbeddings table..." -ForegroundColor Yellow

aws dynamodb create-table `
    --table-name DocumentEmbeddings `
    --attribute-definitions `
        AttributeName=chunk_id,AttributeType=S `
    --key-schema `
        AttributeName=chunk_id,KeyType=HASH `
    --provisioned-throughput `
        ReadCapacityUnits=5,WriteCapacityUnits=5

Write-Host "DocumentEmbeddings table created!" -ForegroundColor Green
Write-Host ""

Write-Host "================================================" -ForegroundColor Green
Write-Host "Tables Created Successfully!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Wait 30 seconds for tables to become ACTIVE" -ForegroundColor Yellow
Write-Host ""


