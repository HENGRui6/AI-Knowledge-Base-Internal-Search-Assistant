package com.example.demo.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;
import software.amazon.awssdk.services.dynamodb.model.ScanRequest;
import software.amazon.awssdk.services.dynamodb.model.ScanResponse;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class SearchService {
    
    @Autowired
    private DynamoDbClient dynamoDbClient;

    @Value("${openai.api.key}")
    private String openaiApiKey;

    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Search for documents similar to the query
     * 
     * @param query User's search question
     * @param topK Number of top results to return (e.g., 5)
     * @return List of most relevant documents with similarity scores
     */
    public List<Map<String, Object>> searchDocuments(String query, int topK) throws Exception {
        // Generate embedding for the query
        List<Double> queryEmbedding = generateQueryEmbedding(query);
        
        // Get all document embeddings from DynamoDB
        List<Map<String, Object>> allEmbeddings = getAllEmbeddings();
        
        // Calculate similarity for each document
        List<Map<String, Object>> results = new ArrayList<>();

        for (Map<String, Object> doc : allEmbeddings) {
            // Get embedding from DynamoDB (stored as JSON string)
            String embeddingJson = (String) doc.get("embedding");
            List<Double> docEmbedding = parseEmbedding(embeddingJson);

            double similarity = cosineSimilarity(queryEmbedding, docEmbedding);

            Map<String, Object> result = new HashMap<>();
            result.put("chunk_id", doc.get("chunk_id"));
            result.put("document_id", doc.get("document_id"));
            result.put("text", doc.get("text"));
            result.put("file_name", doc.get("file_name"));
            result.put("similarity", similarity);
            
            results.add(result);
        }
        
        // Sort by similarity (highest first) and return top K
        return results.stream()
                .sorted((a, b) -> Double.compare((Double) b.get("similarity"), (Double) a.get("similarity")))
                .limit(topK)
                .collect(Collectors.toList());
    }

    /**
     * Generate embedding for user query using OpenAI API
     * 
     * @param query User's search question
     * @return List of 1536 doubles representing the embedding vector
     */
    private List<Double> generateQueryEmbedding(String query) throws Exception {
        // Create connection to OpenAI API
        URL url = new URL("https://api.openai.com/v1/embeddings");
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();

        // Set request headers
        conn.setRequestMethod("POST");
        conn.setRequestProperty("Content-Type", "application/json");
        conn.setRequestProperty("Authorization", "Bearer " + openaiApiKey);
        conn.setDoOutput(true);

        // Prepare JSON request body
        String jsonInputString = String.format(
            "{\"input\": \"%s\", \"model\": \"text-embedding-3-small\"}",
            query.replace("\"", "\\\"")  // Escape quotes in user input
        );
        
        // Send request
        try (OutputStream os = conn.getOutputStream()) {
            byte[] input = jsonInputString.getBytes("utf-8");
            os.write(input, 0, input.length);
        }

        // Read response
        try (BufferedReader br = new BufferedReader(
                new InputStreamReader(conn.getInputStream(), "utf-8"))) {
            StringBuilder response = new StringBuilder();
            String responseLine;
            while ((responseLine = br.readLine()) != null) {
                response.append(responseLine.trim());
            }

            // Parse JSON response
            JsonNode jsonResponse = objectMapper.readTree(response.toString());
            JsonNode embeddingArray = jsonResponse.get("data").get(0).get("embedding");
            
            // Convert to List<Double>
            List<Double> embedding = new ArrayList<>();
            for (JsonNode value : embeddingArray) {
                embedding.add(value.asDouble());
            }
            
            return embedding;
        }
    }
    /**
     * Get all document embeddings from DynamoDB
     * 
     * @return List of all embedding records from DocumentEmbeddings table
     */
    private List<Map<String, Object>> getAllEmbeddings() {
        List<Map<String, Object>> embeddings = new ArrayList<>();
        Map<String, AttributeValue> lastEvaluatedKey = null;
        
        // Loop through all pages of DynamoDB scan results
        do {
            ScanRequest.Builder scanBuilder = ScanRequest.builder()
                    .tableName("DocumentEmbeddings");
            
            // If we have a pagination key, add it to continue from last page
            if (lastEvaluatedKey != null) {
                scanBuilder.exclusiveStartKey(lastEvaluatedKey);
            }
            
            ScanResponse response = dynamoDbClient.scan(scanBuilder.build());
            
            // Process items from this page
            for (Map<String, AttributeValue> item : response.items()) {
                Map<String, Object> embedding = new HashMap<>();
                embedding.put("chunk_id", item.get("chunk_id").s());
                embedding.put("document_id", item.get("document_id").s());
                embedding.put("text", item.get("text").s());
                embedding.put("file_name", item.get("file_name").s());
                embedding.put("embedding", item.get("embedding").s());
                embeddings.add(embedding);
            }
            
            // Get pagination key for next page
            lastEvaluatedKey = response.lastEvaluatedKey();
            
        } while (lastEvaluatedKey != null && !lastEvaluatedKey.isEmpty());
        
        System.out.println("Total embeddings loaded from DynamoDB: " + embeddings.size());
        
        // Debug: Print unique file names
        Set<String> uniqueFileNames = new HashSet<>();
        for (Map<String, Object> emb : embeddings) {
            uniqueFileNames.add((String) emb.get("file_name"));
        }
        System.out.println("Unique files in embeddings: " + uniqueFileNames);
        
        return embeddings;
    }

    /**
     * Parse embedding JSON string to List<Double>
     * 
     * @param embeddingJson JSON string like "[0.23, -0.15, 0.87, ...]"
     * @return List of doubles
     */
    private List<Double> parseEmbedding(String embeddingJson) throws Exception {
        JsonNode arrayNode = objectMapper.readTree(embeddingJson);
        List<Double> embedding = new ArrayList<>();
        
        for (JsonNode value : arrayNode) {
            embedding.add(value.asDouble());
        }
        
        return embedding;
    } 
    /**
     * Calculate cosine similarity between two vectors
     * 
     * @param vec1 First embedding vector
     * @param vec2 Second embedding vector
     * @return Similarity score between 0 and 1 (1 = identical, 0 = unrelated)
     */
    private double cosineSimilarity(List<Double> vec1, List<Double> vec2) {
        // Calculate dot product (A · B)
        double dotProduct = 0.0;
        for (int i = 0; i < vec1.size(); i++) {
            dotProduct += vec1.get(i) * vec2.get(i);
        }
        
        // Calculate magnitude of vec1 (|A|)
        double magnitude1 = 0.0;
        for (double val : vec1) {
            magnitude1 += val * val;
        }
        magnitude1 = Math.sqrt(magnitude1);
        
        // Calculate magnitude of vec2 (|B|)
        double magnitude2 = 0.0;
        for (double val : vec2) {
            magnitude2 += val * val;
        }
        magnitude2 = Math.sqrt(magnitude2);
        
        // Return cosine similarity
        return dotProduct / (magnitude1 * magnitude2);
    }
}
