package com.example.demo.controller;

import com.example.demo.service.QAService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/qa")
@CrossOrigin(origins = {
    "http://localhost:3000", 
    "http://localhost:3001",
    "https://*.vercel.app",
    "https://*.up.railway.app"
})
public class QAController {
    @Autowired
    private QAService qaService;
    
    @PostMapping
    public ResponseEntity<?> askQuestion(@RequestBody Map<String, Object> request) {
        try {
            String question = (String) request.get("question");
            Integer maxSources = (Integer) request.getOrDefault("maxSources", 5);

            if (question == null || question.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Question cannot be empty"));
            }

            System.out.println("Received Q&A request: " + question);

            Map<String, Object> result = qaService.answerQuestion(question, maxSources);
            return ResponseEntity.ok(result);
        }  catch (Exception e) {
            System.err.println("Q&A error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to process question: " + e.getMessage()));
        }
    }

}
