package com.autoinspect.gateway.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class HealthController {

    @Value("${FRONTEND_ORIGIN:https://dealer-frontend-iwor.onrender.com}")
    private String frontendOrigin;

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        response.put("service", "API Gateway");
        response.put("timestamp", System.currentTimeMillis());
        return ResponseEntity.ok(response);
    }



    @GetMapping("/cors-test")
    public ResponseEntity<Map<String, Object>> corsTest() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "success");
        response.put("message", "CORS test successful");
        response.put("timestamp", System.currentTimeMillis());
        response.put("cors_enabled", true);
        response.put("gateway_cors", "This endpoint tests CORS at gateway level");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/test-cors")
    public ResponseEntity<Map<String, Object>> testCors() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "success");
        response.put("message", "CORS test - direct endpoint");
        response.put("timestamp", System.currentTimeMillis());
        response.put("cors_should_work", true);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/gateway-info")
    public ResponseEntity<Map<String, Object>> gatewayInfo() {
        Map<String, Object> response = new HashMap<>();
        response.put("service", "API Gateway");
        response.put("version", "1.0.0");
        response.put("cors_handling", "CorsConfig.java (CorsWebFilter)");
        response.put("timestamp", System.currentTimeMillis());
        response.put("cors_headers", "Should include Access-Control-Allow-Origin");
        response.put("cors_enabled", true);
        response.put("configured_frontend_origin", frontendOrigin);
        
        // Add routing information for debugging
        Map<String, Object> routing = new HashMap<>();
        routing.put("postings_service_pattern", "/api/v1/**");
        routing.put("postings_service_target", "https://postings-service.onrender.com");
        routing.put("postings_service_strip_prefix", "2 (removes /api/v1)");
        routing.put("example_transformation", "/api/v1/posts-by-email -> /posts-by-email");
        response.put("routing_debug", routing);
        
        return ResponseEntity.ok(response);
    }
}
