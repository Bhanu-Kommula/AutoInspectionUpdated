package com.auto.technician.dashboard.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
public class HealthController {

    // Root-level health endpoint for Render health checks
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> rootHealth() {
        Map<String, Object> health = new HashMap<>();
        health.put("status", "UP");
        health.put("service", "tech-dashboard-service");
        health.put("timestamp", System.currentTimeMillis());
        health.put("endpoint", "root");
        return ResponseEntity.ok(health);
    }

    // Context-path health endpoint for API calls
    @GetMapping("/api/v1/health")
    public ResponseEntity<Map<String, Object>> apiHealth() {
        Map<String, Object> health = new HashMap<>();
        health.put("status", "UP");
        health.put("service", "tech-dashboard-service");
        health.put("timestamp", System.currentTimeMillis());
        health.put("endpoint", "api");
        return ResponseEntity.ok(health);
    }
}
