package com.example.demo.controller;

import com.example.demo.model.Document;
import com.example.demo.repository.DocumentRepository;
import com.example.demo.service.S3Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/documents")
public class DocumentController {

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private S3Service s3Service;

    // POST /api/documents/upload - Upload a document
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

            // Validate file type (only PDF for now)
            String contentType = file.getContentType();
            if (contentType == null || !contentType.equals("application/pdf")) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Only PDF files are supported"));
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
            document.setStatus("UPLOADED");

            Document savedDocument = documentRepository.save(document);

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

    // GET /api/documents - Get all documents
    @GetMapping
    public List<Document> getAllDocuments() {
        return documentRepository.findAll();
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

    // DELETE /api/documents/{id} - Delete document
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteDocument(@PathVariable String id) {
        try {
            // Get document metadata
            Document document = documentRepository.findById(id);
            if (document == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Document not found with id: " + id));
            }

            // Delete from S3
            s3Service.deleteFile(document.getS3Key());

            // Delete from DynamoDB
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
}

