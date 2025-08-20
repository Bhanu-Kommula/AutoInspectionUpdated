package com.auto.tech.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.annotation.PostConstruct;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/startup")
public class StartupController {

    private static final Logger logger = LoggerFactory.getLogger(StartupController.class);

    @Autowired
    private Environment environment;

    @PostConstruct
    public void logStartup() {
        logger.info("=== TECHNICIAN SERVICE STARTING ===");
        logger.info("Server Port: {}", environment.getProperty("server.port"));
        logger.info("Database URL: {}", environment.getProperty("spring.datasource.url"));
        logger.info("Eureka URL: {}", environment.getProperty("eureka.client.service-url.defaultZone"));
        logger.info("Profile: {}", environment.getActiveProfiles());
        logger.info("=== STARTUP COMPLETE ===");
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> startupStatus() {
        Map<String, Object> status = new HashMap<>();
        status.put("status", "STARTED");
        status.put("service", "technician-service");
        status.put("port", environment.getProperty("server.port"));
        status.put("timestamp", System.currentTimeMillis());
        return ResponseEntity.ok(status);
    }
}
