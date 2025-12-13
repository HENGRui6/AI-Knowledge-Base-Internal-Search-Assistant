package com.example.demo.controller;

import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/users")
public class UserController {
    
    @Autowired
    private UserRepository userRepository;
    
    // GET /api/users - Get all users
    @GetMapping
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }
    
    // GET /api/users/{id} - Get user by ID
    @GetMapping("/{id}")
    public User getUserById(@PathVariable String id) {
        User user = userRepository.findById(id);
        if (user == null) {
            throw new RuntimeException("User not found with id: " + id);
        }
        return user;
    }
    
    // POST /api/users - Create new user
    @PostMapping
    public User createUser(@RequestBody User user) {
        return userRepository.save(user);
    }
    
    // PUT /api/users/{id} - Update user
    @PutMapping("/{id}")
    public User updateUser(@PathVariable String id, @RequestBody User updatedUser) {
        User user = userRepository.findById(id);
        if (user == null) {
            throw new RuntimeException("User not found with id: " + id);
        }
        
        user.setUsername(updatedUser.getUsername());
        user.setEmail(updatedUser.getEmail());
        user.setPassword(updatedUser.getPassword());
        
        return userRepository.update(user);
    }
    
    // DELETE /api/users/{id} - Delete user
    @DeleteMapping("/{id}")
    public Map<String, String> deleteUser(@PathVariable String id) {
        User user = userRepository.findById(id);
        if (user == null) {
            throw new RuntimeException("User not found with id: " + id);
        }
        
        userRepository.deleteById(id);
        
        Map<String, String> response = new HashMap<>();
        response.put("message", "User deleted successfully");
        response.put("id", id);
        return response;
    }
    
    // POST /api/users/register - Register new user
    @PostMapping("/register")
    public Map<String, String> register(@RequestBody User user) {
        // Check if username already exists
        if (userRepository.existsByUsername(user.getUsername())) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Username already exists");
            return error;
        }
        
        // Create new user
        User savedUser = userRepository.save(user);
        
        Map<String, String> response = new HashMap<>();
        response.put("message", "User registered successfully");
        response.put("id", savedUser.getId());
        response.put("username", savedUser.getUsername());
        return response;
    }
    
    // POST /api/users/login - Login
    @PostMapping("/login")
    public Map<String, String> login(@RequestBody Map<String, String> credentials) {
        String username = credentials.get("username");
        String password = credentials.get("password");
        
        // Find user by username
        User user = userRepository.findByUsername(username);
        
        if (user != null && user.getPassword().equals(password)) {
            Map<String, String> response = new HashMap<>();
            response.put("message", "Login successful");
            response.put("id", user.getId());
            response.put("username", user.getUsername());
            return response;
        }
        
        Map<String, String> error = new HashMap<>();
        error.put("error", "Invalid username or password");
        return error;
    }
}

