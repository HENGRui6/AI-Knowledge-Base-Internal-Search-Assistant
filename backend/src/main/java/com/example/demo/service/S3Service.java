package com.example.demo.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;

import java.io.IOException;
import java.util.UUID;

@Service
public class S3Service {

    @Autowired
    private S3Client s3Client;

    @Value("${s3.bucketName}")
    private String bucketName;

    /**
     * Upload file to S3
     * @param file The file to upload
     * @param userId The user ID (for organizing files)
     * @return The S3 key (path) of the uploaded file
     */
    public String uploadFile(MultipartFile file, String userId) throws IOException {
        // Generate unique file key
        String fileExtension = getFileExtension(file.getOriginalFilename());
        String s3Key = String.format("documents/%s/%s%s", 
                                     userId, 
                                     UUID.randomUUID().toString(), 
                                     fileExtension);

        // Upload to S3
        PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(s3Key)
                .contentType(file.getContentType())
                .contentLength(file.getSize())
                .build();

        s3Client.putObject(putObjectRequest, 
                          RequestBody.fromBytes(file.getBytes()));

        return s3Key;
    }

    /**
     * Download file from S3
     * @param s3Key The S3 key of the file
     * @return Byte array of the file content
     */
    public byte[] downloadFile(String s3Key) {
        GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                .bucket(bucketName)
                .key(s3Key)
                .build();

        return s3Client.getObjectAsBytes(getObjectRequest).asByteArray();
    }

    /**
     * Delete file from S3
     * @param s3Key The S3 key of the file to delete
     */
    public void deleteFile(String s3Key) {
        DeleteObjectRequest deleteObjectRequest = DeleteObjectRequest.builder()
                .bucket(bucketName)
                .key(s3Key)
                .build();

        s3Client.deleteObject(deleteObjectRequest);
    }

    /**
     * Check if file exists in S3
     * @param s3Key The S3 key to check
     * @return true if file exists, false otherwise
     */
    public boolean fileExists(String s3Key) {
        try {
            HeadObjectRequest headObjectRequest = HeadObjectRequest.builder()
                    .bucket(bucketName)
                    .key(s3Key)
                    .build();

            s3Client.headObject(headObjectRequest);
            return true;
        } catch (NoSuchKeyException e) {
            return false;
        }
    }

    /**
     * Get S3 bucket name
     * @return The configured S3 bucket name
     */
    public String getBucketName() {
        return bucketName;
    }

    /**
     * Get file extension from filename
     */
    private String getFileExtension(String filename) {
        if (filename == null || filename.isEmpty()) {
            return "";
        }
        int lastDotIndex = filename.lastIndexOf('.');
        if (lastDotIndex == -1) {
            return "";
        }
        return filename.substring(lastDotIndex);
    }
}




