package com.autoinspect.gateway.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/health")
public class HealthController {

    @GetMapping
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> health = new HashMap<>();
        health.put("status", "UP");
        health.put("service", "api-gateway");
        health.put("timestamp", System.currentTimeMillis());
        return ResponseEntity.ok(health);
    }
    
    @GetMapping("/cors-test")
    public ResponseEntity<Map<String, Object>> corsTest() {
        Map<String, Object> response = new HashMap<>();
        response.put("message", "CORS test successful");
        response.put("timestamp", System.currentTimeMillis());
        response.put("cors_enabled", true);
        response.put("gateway_cors", "This endpoint tests CORS at gateway level");
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/preflight-test")
    public ResponseEntity<Map<String, Object>> preflightTest() {
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Preflight test successful");
        response.put("timestamp", System.currentTimeMillis());
        response.put("method", "GET");
        response.put("cors_headers", "Should include Access-Control-Allow-Origin");
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/gateway-test")
    public ResponseEntity<Map<String, Object>> gatewayTest() {
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Gateway is working");
        response.put("timestamp", System.currentTimeMillis());
        response.put("service", "api-gateway");
        response.put("cors_enabled", true);
        response.put("test_endpoint", "This tests the gateway directly");
        return ResponseEntity.ok(response);
    }
    
    @RequestMapping(value = "/api/dealers/**", method = RequestMethod.OPTIONS)
    public ResponseEntity<Void> handleOptions() {
        System.out.println("🔧 [HealthController] Handling OPTIONS request for /api/dealers/**");
        return ResponseEntity.ok()
            .header("Access-Control-Allow-Origin", "*")
            .header("Access-Control-Allow-Methods", "*")
            .header("Access-Control-Allow-Headers", "*")
            .header("Access-Control-Allow-Credentials", "true")
            .header("Access-Control-Max-Age", "3600")
            .build();
    }
}
