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
            health.put("port", System.getProperty("server.port", "unknown"));
            health.put("profiles", System.getProperty("spring.profiles.active", "default"));
            
            if (!dbHealthy) {
                health.put("error", "Database connection failed");
                health.put("details", "Unable to establish database connection");
            }
            
            return ResponseEntity.ok(health);
        } catch (Exception e) {
            health.put("status", "DOWN");
            health.put("service", "tech-dashboard-service");
            health.put("timestamp", System.currentTimeMillis());
            health.put("endpoint", "root");
            health.put("error", e.getMessage());
            health.put("database", "DOWN");
            health.put("port", System.getProperty("server.port", "unknown"));
            health.put("profiles", System.getProperty("spring.profiles.active", "default"));
            
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
            health.put("port", System.getProperty("server.port", "unknown"));
            health.put("profiles", System.getProperty("spring.profiles.active", "default"));
            
            if (!dbHealthy) {
                health.put("error", "Database connection failed");
                health.put("details", "Unable to establish database connection");
            }
            
            return ResponseEntity.ok(health);
        } catch (Exception e) {
            health.put("status", "DOWN");
            health.put("service", "tech-dashboard-service");
            health.put("timestamp", System.currentTimeMillis());
            health.put("endpoint", "api");
            health.put("error", e.getMessage());
            health.put("database", "DOWN");
            health.put("port", System.getProperty("server.port", "unknown"));
            health.put("profiles", System.getProperty("spring.profiles.active", "default"));
            
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
        response.put("port", System.getProperty("server.port", "unknown"));
        response.put("profiles", System.getProperty("spring.profiles.active", "default"));
        return ResponseEntity.ok(response);
    }

    // Basic health check without database dependency
    @GetMapping("/ready")
    public ResponseEntity<Map<String, Object>> ready() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "READY");
        response.put("service", "tech-dashboard-service");
        response.put("timestamp", System.currentTimeMillis());
        response.put("port", System.getProperty("server.port", "unknown"));
        response.put("profiles", System.getProperty("spring.profiles.active", "default"));
        return ResponseEntity.ok(response);
    }

    private boolean checkDatabaseHealth() {
        try (Connection connection = dataSource.getConnection()) {
            // Test with a simple query
            boolean isValid = connection.isValid(5);
            if (isValid) {
                // Try a simple query to ensure database is responsive
                try (var stmt = connection.createStatement()) {
                    stmt.execute("SELECT 1");
                }
            }
            return isValid;
        } catch (Exception e) {
            // Log the error for debugging
            System.err.println("Database health check failed: " + e.getMessage());
            return false;
        }
    }
}
