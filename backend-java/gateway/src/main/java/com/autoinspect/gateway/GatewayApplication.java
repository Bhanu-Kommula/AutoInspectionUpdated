package com.autoinspect.gateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication
@EnableDiscoveryClient
public class GatewayApplication {

	public static void main(String[] args) {
		System.out.println("🚀 [GatewayApplication] Starting API Gateway...");
		System.out.println("🔧 [GatewayApplication] CORS configuration will be handled by CorsConfig.java");
		SpringApplication.run(GatewayApplication.class, args);
		System.out.println("✅ [GatewayApplication] API Gateway started successfully");
	}

	// CORS is now handled by application.properties configuration
	// Removing Java CORS configuration to prevent conflicts
}
