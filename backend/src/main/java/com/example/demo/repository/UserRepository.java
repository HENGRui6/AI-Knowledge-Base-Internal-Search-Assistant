package com.example.demo.repository;

import com.example.demo.model.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.Key;
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;
import software.amazon.awssdk.enhanced.dynamodb.model.ScanEnhancedRequest;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;

import java.util.HashMap;
import java.util.Map;

@Repository
public class UserRepository {
    
    private final DynamoDbTable<User> userTable;
    
    @Autowired
    public UserRepository(DynamoDbEnhancedClient enhancedClient) {
        this.userTable = enhancedClient.table("Users", TableSchema.fromBean(User.class));
    }
    
    // Save or update user
    public User save(User user) {
        userTable.putItem(user);
        return user;
    }
    
    // Find user by id
    public User findById(String id) {
        Key key = Key.builder()
                .partitionValue(id)
                .build();
        return userTable.getItem(key);
    }
    
    // Find user by username (using scan because username is not the partition key)
    public User findByUsername(String username) {
        Map<String, AttributeValue> expressionValues = new HashMap<>();
        expressionValues.put(":username", AttributeValue.builder().s(username).build());
        
        ScanEnhancedRequest scanRequest = ScanEnhancedRequest.builder()
                .filterExpression(software.amazon.awssdk.enhanced.dynamodb.Expression.builder()
                        .expression("username = :username")
                        .expressionValues(expressionValues)
                        .build())
                .build();
        
        return userTable.scan(scanRequest).items().stream().findFirst().orElse(null);
    }
    
    // Check if user exists
    public boolean existsByUsername(String username) {
        return findByUsername(username) != null;
    }
}
