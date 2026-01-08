# List all documents in the system

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Document List" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8080/api/documents" -Method GET
    
    if ($response.Count -eq 0) {
        Write-Host "No documents found!" -ForegroundColor Yellow
        Write-Host ""
        exit
    }
    
    Write-Host "Found $($response.Count) documents:" -ForegroundColor Green
    Write-Host ""
    
    $counter = 0
    foreach ($doc in $response) {
        $counter++
        Write-Host "[$counter] $($doc.fileName)" -ForegroundColor Cyan
        Write-Host "    ID: $($doc.id)" -ForegroundColor Gray
        Write-Host "    User: $($doc.userId)" -ForegroundColor Gray
        Write-Host "    Size: $([math]::Round($doc.fileSize / 1024, 2)) KB" -ForegroundColor Gray
        Write-Host "    Uploaded: $($doc.uploadDate)" -ForegroundColor Gray
        Write-Host ""
    }
    
    Write-Host "================================================" -ForegroundColor Cyan
    Write-Host "Total: $counter documents" -ForegroundColor Green
    Write-Host "================================================" -ForegroundColor Cyan
    Write-Host ""
    
} catch {
    Write-Host "ERROR: Cannot connect to backend" -ForegroundColor Red
    Write-Host "Make sure backend is running on http://localhost:8080" -ForegroundColor Yellow
    Write-Host ""
}


