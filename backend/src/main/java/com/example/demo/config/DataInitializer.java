package com.example.demo.config;

import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.*;

@Configuration
public class DataInitializer {
    
    @Autowired
    private DynamoDbClient dynamoDbClient;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Bean
    public CommandLineRunner initializeDatabase() {
        return args -> {
            try {
                System.out.println("Checking Users table...");
                
                // Check if Users table exists (it should already exist in AWS)
                if (tableExists("Users")) {
                    System.out.println("Users table found in AWS");
                    
                    // Check if default users exist, if not create them
                    if (!userRepository.existsByUsername("admin")) {
                        System.out.println("Creating default users...");
                        createDefaultUsers();
                    } else {
                        System.out.println("Default users already exist");
                    }
                } else {
                    System.err.println("WARNING: Users table does not exist in AWS!");
                    System.err.println("Please create Users table in AWS DynamoDB with partition key 'id' (String)");
                }
            } catch (Exception e) {
                System.err.println("Error initializing database: " + e.getMessage());
                e.printStackTrace();
            }
        };
    }
    
    private boolean tableExists(String tableName) {
        try {
            DescribeTableRequest request = DescribeTableRequest.builder()
                    .tableName(tableName)
                    .build();
            dynamoDbClient.describeTable(request);
            return true;
        } catch (ResourceNotFoundException e) {
            return false;
        }
    }
    
    private void createDefaultUsers() {
        // Create admin user
        User admin = new User("admin", passwordEncoder.encode("admin123"), "ADMIN");
        userRepository.save(admin);
        System.out.println("Created default admin user:");
        System.out.println("  Username: admin");
        System.out.println("  Password: admin123");
        System.out.println("  Role: ADMIN");
        
        // Create regular user
        User user = new User("user", passwordEncoder.encode("user123"), "USER");
        userRepository.save(user);
        System.out.println("Created default user:");
        System.out.println("  Username: user");
        System.out.println("  Password: user123");
        System.out.println("  Role: USER");
    }
}
