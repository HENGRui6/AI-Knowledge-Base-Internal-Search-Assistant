package com.example.demo.controller;

import com.example.demo.model.Document;
import com.example.demo.repository.DocumentRepository;
import com.example.demo.service.S3Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import com.example.demo.service.SNSService;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.*;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.ArrayList;

@RestController
@RequestMapping("/api/documents")
@CrossOrigin(origins = {
    "http://localhost:3000", 
    "http://localhost:3001",
    "https://*.vercel.app",
    "https://*.up.railway.app"
})
public class DocumentController {

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private S3Service s3Service;

    @Autowired
    private SNSService snsService;

    @Autowired
    private DynamoDbClient dynamoDbClient;

    // POST /api/documents/upload - Upload a document (ADMIN only)
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/upload")
    public ResponseEntity<?> uploadDocument(
            @RequestParam("file") MultipartFile file,
            @RequestParam("userId") String userId) {
        
        try {
            // Validate file
            if (file.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "File is empty"));
            }

            // Validate file type (PDF and TXT for testing)
            String contentType = file.getContentType();
            if (contentType == null || 
                (!contentType.equals("application/pdf") && !contentType.equals("text/plain"))) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Only PDF and TXT files are supported"));
            }

            // Upload to S3
            String s3Key = s3Service.uploadFile(file, userId);

            // Save metadata to DynamoDB
            Document document = new Document();
            document.setUserId(userId);
            document.setFileName(file.getOriginalFilename());
            document.setS3Key(s3Key);
            document.setFileSize(file.getSize());
            document.setContentType(contentType);
            document.setUploadDate(Instant.now());
            document.setStatus("PENDING");  // Lambda will update to PROCESSING -> PROCESSED/FAILED

            Document savedDocument = documentRepository.save(document);

            // Publish SNS event with complete document information
            snsService.publishDocumentUploadedEvent(
                savedDocument.getId(), 
                s3Key, 
                userId, 
                savedDocument.getFileName(), 
                s3Service.getBucketName()
            );
            
            // Return response
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Document uploaded successfully");
            response.put("documentId", savedDocument.getId());
            response.put("fileName", savedDocument.getFileName());
            response.put("fileSize", savedDocument.getFileSize());
            response.put("uploadDate", savedDocument.getUploadDate());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to upload document: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    // GET /api/documents/all - Get all documents (ADMIN only)
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/all")
    public ResponseEntity<?> getAllDocuments() {
        try {
            List<Document> documents = documentRepository.findAll();
            return ResponseEntity.ok(documents);
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(Map.of("error", "Failed to retrieve documents: " + e.getMessage()));
        }
    }
    // GET /api/documents/user/{userId} - Get documents by user ID
    @GetMapping("/user/{userId}")
    public List<Document> getDocumentsByUserId(@PathVariable String userId) {
        return documentRepository.findByUserId(userId);
    }

    // GET /api/documents/{id} - Get document by ID
    @GetMapping("/{id}")
    public ResponseEntity<?> getDocumentById(@PathVariable String id) {
        Document document = documentRepository.findById(id);
        if (document == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Document not found with id: " + id));
        }
        return ResponseEntity.ok(document);
    }

    // GET /api/documents/{id}/download - Download document
    @GetMapping("/{id}/download")
    public ResponseEntity<?> downloadDocument(@PathVariable String id) {
        try {
            // Get document metadata
            Document document = documentRepository.findById(id);
            if (document == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Document not found with id: " + id));
            }

            // Download from S3
            byte[] fileContent = s3Service.downloadFile(document.getS3Key());

            // Return file
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(document.getContentType()));
            headers.setContentDispositionFormData("attachment", document.getFileName());
            headers.setContentLength(fileContent.length);

            return new ResponseEntity<>(fileContent, headers, HttpStatus.OK);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to download document: " + e.getMessage()));
        }
    }

    // DELETE /api/documents/{id} - Delete document (ADMIN only)
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteDocument(@PathVariable String id) {
        try {
            // Get document metadata
            Document document = documentRepository.findById(id);
            if (document == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Document not found with id: " + id));
            }

            // Delete embeddings from DocumentEmbeddings table
            deleteDocumentEmbeddings(id);

            // Delete from S3
            s3Service.deleteFile(document.getS3Key());

            // Delete from Documents table
            documentRepository.deleteById(id);

            Map<String, String> response = new HashMap<>();
            response.put("message", "Document deleted successfully");
            response.put("id", id);
            response.put("fileName", document.getFileName());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to delete document: " + e.getMessage()));
        }
    }

    // POST /api/documents/cleanup-embeddings - Clean up orphan embeddings (ADMIN only)
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/cleanup-embeddings")
    public ResponseEntity<?> cleanupOrphanEmbeddings() {
        try {
            // Get all valid document IDs
            List<Document> allDocs = documentRepository.findAll();
            List<String> validDocIds = allDocs.stream()
                    .map(Document::getId)
                    .toList();
            
            System.out.println("Valid documents: " + validDocIds.size());
            
            // Scan all embeddings with pagination
            int orphanCount = 0;
            int totalCount = 0;
            Map<String, AttributeValue> lastEvaluatedKey = null;
            
            do {
                ScanRequest.Builder scanBuilder = ScanRequest.builder()
                        .tableName("DocumentEmbeddings");
                
                if (lastEvaluatedKey != null) {
                    scanBuilder.exclusiveStartKey(lastEvaluatedKey);
                }
                
                ScanResponse scanResponse = dynamoDbClient.scan(scanBuilder.build());
                
                for (Map<String, AttributeValue> item : scanResponse.items()) {
                    totalCount++;
                    String docId = item.get("document_id").s();
                    String chunkId = item.get("chunk_id").s();
                    
                    // If document doesn't exist, delete the embedding
                    if (!validDocIds.contains(docId)) {
                        System.out.println("Deleting orphan embedding: " + chunkId + " (doc: " + docId + ")");
                        DeleteItemRequest deleteRequest = DeleteItemRequest.builder()
                                .tableName("DocumentEmbeddings")
                                .key(Map.of("chunk_id", AttributeValue.builder().s(chunkId).build()))
                                .build();
                        
                        dynamoDbClient.deleteItem(deleteRequest);
                        orphanCount++;
                    }
                }
                
                lastEvaluatedKey = scanResponse.lastEvaluatedKey();
                
            } while (lastEvaluatedKey != null && !lastEvaluatedKey.isEmpty());
            
            System.out.println("Cleaned up " + orphanCount + " orphan embeddings out of " + totalCount + " total");
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Cleanup completed");
            response.put("totalEmbeddings", totalCount);
            response.put("orphansDeleted", orphanCount);
            response.put("remaining", totalCount - orphanCount);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to cleanup embeddings: " + e.getMessage()));
        }
    }

    /**
     * Delete all embeddings for a document from DocumentEmbeddings table
     * Uses full table scan with pagination to ensure all chunks are found and deleted
     */
    private void deleteDocumentEmbeddings(String documentId) {
        try {
            System.out.println("Deleting embeddings for document: " + documentId);
            int deletedCount = 0;
            Map<String, AttributeValue> lastEvaluatedKey = null;
            
            // Scan with pagination to find all chunks for this document
            do {
                ScanRequest.Builder scanBuilder = ScanRequest.builder()
                        .tableName("DocumentEmbeddings");
                
                if (lastEvaluatedKey != null) {
                    scanBuilder.exclusiveStartKey(lastEvaluatedKey);
                }
                
                ScanResponse scanResponse = dynamoDbClient.scan(scanBuilder.build());
                
                for (Map<String, AttributeValue> item : scanResponse.items()) {
                    // Check if this chunk belongs to our document
                    AttributeValue docIdAttr = item.get("document_id");
                    if (docIdAttr != null && documentId.equals(docIdAttr.s())) {
                        String chunkId = item.get("chunk_id").s();
                        
                        try {
                            DeleteItemRequest deleteRequest = DeleteItemRequest.builder()
                                    .tableName("DocumentEmbeddings")
                                    .key(Map.of("chunk_id", AttributeValue.builder().s(chunkId).build()))
                                    .build();
                            
                            dynamoDbClient.deleteItem(deleteRequest);
                            deletedCount++;
                            System.out.println("  Deleted chunk: " + chunkId);
                        } catch (Exception e) {
                            System.err.println("  Failed to delete chunk " + chunkId + ": " + e.getMessage());
                        }
                    }
                }
                
                lastEvaluatedKey = scanResponse.lastEvaluatedKey();
                
            } while (lastEvaluatedKey != null && !lastEvaluatedKey.isEmpty());
            
            System.out.println("✅ Deleted " + deletedCount + " embeddings for document: " + documentId);
            
        } catch (Exception e) {
            System.err.println("❌ Error deleting embeddings for " + documentId + ": " + e.getMessage());
            e.printStackTrace();
            // Continue with deletion even if embedding cleanup fails
        }
    }

    // Fix document statuses - update all UPLOADED to PROCESSED
    @PostMapping("/fix-statuses")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> fixDocumentStatuses() {
        System.out.println("========== Fixing Document Statuses (Force Update) ==========");
        
        try {
            List<Document> allDocuments = documentRepository.findAll();
            int updatedCount = 0;
            int alreadyCorrect = 0;
            
            for (Document doc : allDocuments) {
                String status = doc.getStatus();
                
                // Skip if already PROCESSED or FAILED
                if ("PROCESSED".equals(status) || "FAILED".equals(status)) {
                    alreadyCorrect++;
                    continue;
                }
                
                // Force update all UPLOADED/PENDING to PROCESSED
                doc.setStatus("PROCESSED");
                if (doc.getProcessedAt() == null) {
                    doc.setProcessedAt(Instant.now().toString());
                }
                documentRepository.update(doc);
                updatedCount++;
                System.out.println("Updated: " + doc.getFileName() + " -> PROCESSED");
            }
            
            Map<String, Object> result = new HashMap<>();
            result.put("message", "Status fix completed (force update)");
            result.put("totalDocuments", allDocuments.size());
            result.put("updated", updatedCount);
            result.put("alreadyCorrect", alreadyCorrect);
            
            System.out.println("========== Fix Complete ==========");
            System.out.println("Total: " + allDocuments.size() + ", Updated: " + updatedCount + 
                             ", Already correct: " + alreadyCorrect);
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            System.err.println("Error fixing statuses: " + e.getMessage());
            e.printStackTrace();
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to fix statuses: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
    
    // Helper method to check if document has embeddings
    private boolean checkIfDocumentHasEmbeddings(String documentId) {
        try {
            Map<String, AttributeValue> expressionValues = new HashMap<>();
            expressionValues.put(":docId", AttributeValue.builder().s(documentId).build());

            ScanRequest scanRequest = ScanRequest.builder()
                    .tableName("DocumentEmbeddings")
                    .filterExpression("document_id = :docId")
                    .expressionAttributeValues(expressionValues)
                    .limit(1)  // Only need to check if at least one exists
                    .build();

            ScanResponse scanResponse = dynamoDbClient.scan(scanRequest);
            return scanResponse.count() > 0;
            
        } catch (Exception e) {
            System.err.println("Error checking embeddings for " + documentId + ": " + e.getMessage());
            return false;
        }
    }
}


