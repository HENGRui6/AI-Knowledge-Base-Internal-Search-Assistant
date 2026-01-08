package com.example.demo.service;

// Spring annotations
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

// JSON processing
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

// HTTP client
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;

// Data structures
import java.util.*;

@Service
public class QAService {
    @Autowired
    private SearchService searchService;

    @Value("${openai.api.key}")
    private String openaiApiKey;

    @Value("${openai.model}")
    private String openaiModel;

    private final ObjectMapper objectMapper = new ObjectMapper();

    public Map<String, Object> answerQuestion(String question, int maxSources) throws Exception {
        // Step 1: Search for relevant documents
        System.out.println("Searching for relevant documents...");
        List<Map<String, Object>> searchResults = searchService.searchDocuments(question, maxSources);
        
        if (searchResults.isEmpty()) {
            throw new Exception("No relevant documents found");
        }
        
        System.out.println("Found " + searchResults.size() + " relevant documents");

        StringBuilder contextBuilder = new StringBuilder();
        contextBuilder.append("Based on the following documents:\n\n");
        
        for (int i = 0; i < searchResults.size(); i++) {
            Map<String, Object> result = searchResults.get(i);
            String fileName = (String) result.get("file_name");
            String text = (String) result.get("text");
            Double similarity = (Double) result.get("similarity");
            
            contextBuilder.append("Document ").append(i + 1)
                         .append(" (").append(fileName).append(", similarity: ")
                         .append(String.format("%.2f", similarity)).append("):\n")
                         .append(text).append("\n\n");
        }
        
        String context = contextBuilder.toString();
        System.out.println("Built context with " + context.length() + " characters");

        String systemPrompt = "You are a helpful AI assistant. Answer questions based on the provided documents. " +
                             "If the documents don't contain enough information to answer the question, " +
                             "say so honestly. Always be concise and accurate.";
        
        String userMessage = context + "\n\nQuestion: " + question + "\n\nPlease answer based on the documents above.";
        
        System.out.println("Calling OpenAI API...");
        String answer = callOpenAIChatAPI(systemPrompt, userMessage);
        System.out.println("Received answer from OpenAI");

        Map<String, Object> response = new HashMap<>();
        response.put("question", question);
        response.put("answer", answer);
        response.put("sources", searchResults);
        response.put("model", openaiModel);
        
        return response;
    }

    private String callOpenAIChatAPI(String systemPrompt, String userMessage) throws Exception {
        URL url = new URL("https://api.openai.com/v1/chat/completions");
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("POST");
        conn.setRequestProperty("Content-Type", "application/json");
        conn.setRequestProperty("Authorization", "Bearer " + openaiApiKey);
        conn.setDoOutput(true);
        conn.setConnectTimeout(30000);
        conn.setReadTimeout(30000);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", openaiModel);
        
        List<Map<String, String>> messages = new ArrayList<>();
        
        Map<String, String> systemMessage = new HashMap<>();
        systemMessage.put("role", "system");
        systemMessage.put("content", systemPrompt);
        messages.add(systemMessage);
        
        Map<String, String> userMsg = new HashMap<>();
        userMsg.put("role", "user");
        userMsg.put("content", userMessage);
        messages.add(userMsg);
        
        requestBody.put("messages", messages);
        requestBody.put("temperature", 0.7);
        requestBody.put("max_tokens", 1000);

        String jsonRequest = objectMapper.writeValueAsString(requestBody);
    
        try (OutputStream os = conn.getOutputStream()) {
            byte[] input = jsonRequest.getBytes("utf-8");
            os.write(input, 0, input.length);
        }

        int responseCode = conn.getResponseCode();

        if (responseCode != 200) {
            try (BufferedReader br = new BufferedReader(
                    new InputStreamReader(conn.getErrorStream(), "utf-8"))) {
                StringBuilder errorResponse = new StringBuilder();
                String responseLine;
                while ((responseLine = br.readLine()) != null) {
                    errorResponse.append(responseLine.trim());
                }
                throw new Exception("OpenAI API error: " + responseCode + " - " + errorResponse.toString());
            }
        }
        
        try (BufferedReader br = new BufferedReader(
                new InputStreamReader(conn.getInputStream(), "utf-8"))) {
            StringBuilder response = new StringBuilder();
            String responseLine;
            while ((responseLine = br.readLine()) != null) {
                response.append(responseLine.trim());
            }
            
            JsonNode jsonResponse = objectMapper.readTree(response.toString());
            String answer = jsonResponse.get("choices").get(0).get("message").get("content").asText();
            
            return answer;
        }
    }
}
