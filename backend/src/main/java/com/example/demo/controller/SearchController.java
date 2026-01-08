package com.example.demo.controller;

import com.example.demo.service.SearchService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/search")
@CrossOrigin(origins = {
    "http://localhost:3000", 
    "http://localhost:3001",
    "https://*.vercel.app",
    "https://*.up.railway.app"
})
public class SearchController {

    @Autowired
    private SearchService searchService;

    /**
     * Search for documents similar to the query
     * 
     * POST /api/search
     * Body: { "query": "What is AI?", "topK": 5 }
     */
    @PostMapping
    public ResponseEntity<?> search(@RequestBody Map<String, Object> request) {
        try {
            // Extract parameters from request body
            String query = (String) request.get("query");
            Integer topK = (Integer) request.getOrDefault("topK", 5);
            
            // Validate query
            if (query == null || query.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Query cannot be empty"));
            }
            
            // Perform search
            System.out.println("Search request: query='" + query + "', topK=" + topK);
            List<Map<String, Object>> results = searchService.searchDocuments(query, topK);
            
            // Return results
            return ResponseEntity.ok(Map.of(
                "query", query,
                "topK", topK,
                "results", results,
                "count", results.size()
            ));
            
        } catch (Exception e) {
            System.err.println("Search error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Search failed: " + e.getMessage()));
        }
    }    
}

