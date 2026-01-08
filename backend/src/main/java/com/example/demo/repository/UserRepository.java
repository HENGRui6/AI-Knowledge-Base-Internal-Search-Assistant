package com.example.demo.repository;

import com.example.demo.model.User;
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
public class UserRepository {

    private final DynamoDbTable<User> userTable;

    @Autowired
    public UserRepository(DynamoDbEnhancedClient enhancedClient,
                         @Value("${dynamodb.tableName}") String tableName) {
        this.userTable = enhancedClient.table(tableName, TableSchema.fromBean(User.class));
    }

    // Create or update user
    public User save(User user) {
        if (user.getId() == null || user.getId().isEmpty()) {
            user.setId(UUID.randomUUID().toString());
        }
        userTable.putItem(user);
        return user;
    }

    // Get user by ID
    public User findById(String id) {
        Key key = Key.builder().partitionValue(id).build();
        return userTable.getItem(key);
    }

    // Get user by username (scan operation - not efficient for large tables)
    public User findByUsername(String username) {
        List<User> allUsers = findAll();
        return allUsers.stream()
                .filter(user -> user.getUsername().equals(username))
                .findFirst()
                .orElse(null);
    }

    // Get all users (scan operation - use carefully in production)
    public List<User> findAll() {
        List<User> users = new ArrayList<>();
        userTable.scan().items().forEach(users::add);
        return users;
    }

    // Update user
    public User update(User user) {
        userTable.updateItem(user);
        return user;
    }

    // Delete user by ID
    public void deleteById(String id) {
        Key key = Key.builder().partitionValue(id).build();
        userTable.deleteItem(key);
    }

    // Check if username exists
    public boolean existsByUsername(String username) {
        return findByUsername(username) != null;
    }
}




