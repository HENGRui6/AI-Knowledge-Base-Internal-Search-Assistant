# Clean S3 files only (safest method)
# This keeps DynamoDB tables intact but removes all files and records

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  S3 Document Cleanup (Safe Method)" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "This will:" -ForegroundColor Yellow
Write-Host "  1. List all documents in the system" -ForegroundColor White
Write-Host "  2. Delete each document using the backend API" -ForegroundColor White
Write-Host "  3. Backend will handle S3 and DynamoDB cleanup" -ForegroundColor White
Write-Host ""

$confirmation = Read-Host "Continue? (yes/no)"

if ($confirmation -ne "yes") {
    Write-Host "Cancelled." -ForegroundColor Yellow
    exit
}

Write-Host ""
Write-Host "Fetching all documents..." -ForegroundColor Yellow

# Get all documents from backend
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8080/api/documents" -Method GET
    
    if ($response.Count -eq 0) {
        Write-Host ""
        Write-Host "No documents found!" -ForegroundColor Green
        Write-Host ""
        exit
    }
    
    Write-Host "Found $($response.Count) documents" -ForegroundColor Cyan
    Write-Host ""
    
    $counter = 0
    foreach ($doc in $response) {
        $counter++
        $docId = $doc.id
        $fileName = $doc.fileName
        
        Write-Host "[$counter/$($response.Count)] Deleting: $fileName" -ForegroundColor Yellow
        Write-Host "  Document ID: $docId" -ForegroundColor Gray
        
        try {
            $deleteResponse = Invoke-RestMethod `
                -Uri "http://localhost:8080/api/documents/$docId" `
                -Method DELETE
            
            Write-Host "  Deleted successfully!" -ForegroundColor Green
        } catch {
            Write-Host "  ERROR: Failed to delete - $($_.Exception.Message)" -ForegroundColor Red
        }
        
        Write-Host ""
    }
    
    Write-Host "================================================" -ForegroundColor Green
    Write-Host "Cleanup Complete!" -ForegroundColor Green
    Write-Host "================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Deleted $counter documents" -ForegroundColor Cyan
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Host "ERROR: Cannot connect to backend" -ForegroundColor Red
    Write-Host "Make sure backend is running on http://localhost:8080" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Error details: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}


