package com.example.demo.model;

import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbBean;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbPartitionKey;

import java.time.Instant;

@DynamoDbBean
public class Document {
    // Properties
    private String id;              // Document UUID
    private String userId;          // Owner of the document
    private String fileName;        // Original file name
    private String s3Key;           // S3 object key (path)
    private Long fileSize;          // File size in bytes
    private String contentType;     // MIME type (e.g., application/pdf)
    private Instant uploadDate;     // Upload timestamp
    private String status;          // Processing status: UPLOADED, PROCESSING, COMPLETED, FAILED
    
    // Default constructor (required by DynamoDB)
    public Document() {
    }
    
    // Constructor with all parameters
    public Document(String id, String userId, String fileName, String s3Key, 
                   Long fileSize, String contentType, Instant uploadDate, String status) {
        this.id = id;
        this.userId = userId;
        this.fileName = fileName;
        this.s3Key = s3Key;
        this.fileSize = fileSize;
        this.contentType = contentType;
        this.uploadDate = uploadDate;
        this.status = status;
    }
    
    // Getters
    @DynamoDbPartitionKey
    public String getId() {
        return id;
    }
    
    public String getUserId() {
        return userId;
    }
    
    public String getFileName() {
        return fileName;
    }
    
    public String getS3Key() {
        return s3Key;
    }
    
    public Long getFileSize() {
        return fileSize;
    }
    
    public String getContentType() {
        return contentType;
    }
    
    public Instant getUploadDate() {
        return uploadDate;
    }
    
    public String getStatus() {
        return status;
    }
    
    // Setters
    public void setId(String id) {
        this.id = id;
    }
    
    public void setUserId(String userId) {
        this.userId = userId;
    }
    
    public void setFileName(String fileName) {
        this.fileName = fileName;
    }
    
    public void setS3Key(String s3Key) {
        this.s3Key = s3Key;
    }
    
    public void setFileSize(Long fileSize) {
        this.fileSize = fileSize;
    }
    
    public void setContentType(String contentType) {
        this.contentType = contentType;
    }
    
    public void setUploadDate(Instant uploadDate) {
        this.uploadDate = uploadDate;
    }
    
    public void setStatus(String status) {
        this.status = status;
    }
    
    // toString method for debugging
    @Override
    public String toString() {
        return "Document{" +
                "id='" + id + '\'' +
                ", userId='" + userId + '\'' +
                ", fileName='" + fileName + '\'' +
                ", s3Key='" + s3Key + '\'' +
                ", fileSize=" + fileSize +
                ", contentType='" + contentType + '\'' +
                ", uploadDate=" + uploadDate +
                ", status='" + status + '\'' +
                '}';
    }
}




