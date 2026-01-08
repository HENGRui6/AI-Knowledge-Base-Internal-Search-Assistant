package com.example.demo.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.sns.SnsClient;
import software.amazon.awssdk.services.sns.model.PublishRequest;

@Service
public class SNSService {
    @Autowired
    private SnsClient snsClient;

    @Value("${sns.topicArn}")
    private String topicArn;

    public void publishDocumentUploadedEvent(String documentId, String s3Key, String userId, String fileName, String s3Bucket) {
        try {
            // Create JSON message with all required fields for Lambda
            String message = String.format(
                "{\"eventType\":\"DOCUMENT_UPLOADED\",\"documentId\":\"%s\",\"s3Key\":\"%s\",\"s3Bucket\":\"%s\",\"fileName\":\"%s\",\"uploadedBy\":\"%s\",\"timestamp\":\"%d\"}",
                documentId, s3Key, s3Bucket, fileName, userId, System.currentTimeMillis()
            );
            // Create publish request
            PublishRequest request = PublishRequest.builder()        
                .topicArn(topicArn)
                .message(message)
                .subject("Document Uploaded")
                .build();
            // Publish to SNS
            snsClient.publish(request);
            
            System.out.println("SNS event published successfully for document: " + documentId);
        } catch (Exception e) {
            System.err.println("Failed to publish SNS event: " + e.getMessage());
            e.printStackTrace();
        }
    }


}
