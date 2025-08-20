package com.auto.technician.dashboard.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.util.HashMap;
import java.util.Map;

@RestController
public class HealthController {

    @Autowired
    private DataSource dataSource;

    // Root-level health endpoint for Render health checks
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> rootHealth() {
        Map<String, Object> health = new HashMap<>();
        
        try {
            // Check database connectivity
            boolean dbHealthy = checkDatabaseHealth();
            
            health.put("status", dbHealthy ? "UP" : "DOWN");
            health.put("service", "tech-dashboard-service");
            health.put("timestamp", System.currentTimeMillis());
            health.put("endpoint", "root");
            health.put("database", dbHealthy ? "UP" : "DOWN");
            health.put("version", "1.0.0");
            
            if (!dbHealthy) {
                health.put("error", "Database connection failed");
            }
            
            return ResponseEntity.ok(health);
        } catch (Exception e) {
            health.put("status", "DOWN");
            health.put("service", "tech-dashboard-service");
            health.put("timestamp", System.currentTimeMillis());
            health.put("endpoint", "root");
            health.put("error", e.getMessage());
            health.put("database", "DOWN");
            
            return ResponseEntity.status(503).body(health);
        }
    }

    // Context-path health endpoint for API calls
    @GetMapping("/api/v1/health")
    public ResponseEntity<Map<String, Object>> apiHealth() {
        Map<String, Object> health = new HashMap<>();
        
        try {
            // Check database connectivity
            boolean dbHealthy = checkDatabaseHealth();
            
            health.put("status", dbHealthy ? "UP" : "DOWN");
            health.put("service", "tech-dashboard-service");
            health.put("timestamp", System.currentTimeMillis());
            health.put("endpoint", "api");
            health.put("database", dbHealthy ? "UP" : "DOWN");
            health.put("version", "1.0.0");
            
            if (!dbHealthy) {
                health.put("error", "Database connection failed");
            }
            
            return ResponseEntity.ok(health);
        } catch (Exception e) {
            health.put("status", "DOWN");
            health.put("service", "tech-dashboard-service");
            health.put("timestamp", System.currentTimeMillis());
            health.put("endpoint", "api");
            health.put("error", e.getMessage());
            health.put("database", "DOWN");
            
            return ResponseEntity.status(503).body(health);
        }
    }

    // Simple health check for basic monitoring
    @GetMapping("/ping")
    public ResponseEntity<Map<String, Object>> ping() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "OK");
        response.put("service", "tech-dashboard-service");
        response.put("timestamp", System.currentTimeMillis());
        return ResponseEntity.ok(response);
    }

    private boolean checkDatabaseHealth() {
        try (Connection connection = dataSource.getConnection()) {
            return connection.isValid(5); // 5 second timeout
        } catch (Exception e) {
            return false;
        }
    }
}
