package com.example.demo.repository;

import com.example.demo.model.Document;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.Key;
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Repository
public class DocumentRepository {

    private final DynamoDbTable<Document> documentTable;

    @Autowired
    public DocumentRepository(DynamoDbEnhancedClient enhancedClient,
                             @Value("${dynamodb.documentsTableName:Documents}") String tableName) {
        this.documentTable = enhancedClient.table(tableName, TableSchema.fromBean(Document.class));
    }

    // Create or update document
    public Document save(Document document) {
        if (document.getId() == null || document.getId().isEmpty()) {
            document.setId(UUID.randomUUID().toString());
        }
        documentTable.putItem(document);
        return document;
    }

    // Get document by ID
    public Document findById(String id) {
        Key key = Key.builder().partitionValue(id).build();
        return documentTable.getItem(key);
    }

    // Get all documents
    public List<Document> findAll() {
        List<Document> documents = new ArrayList<>();
        documentTable.scan().items().forEach(documents::add);
        return documents;
    }

    // Get documents by user ID
    public List<Document> findByUserId(String userId) {
        List<Document> allDocuments = findAll();
        return allDocuments.stream()
                .filter(doc -> doc.getUserId().equals(userId))
                .toList();
    }

    // Update document
    public Document update(Document document) {
        documentTable.updateItem(document);
        return document;
    }

    // Delete document by ID
    public void deleteById(String id) {
        Key key = Key.builder().partitionValue(id).build();
        documentTable.deleteItem(key);
    }
}




