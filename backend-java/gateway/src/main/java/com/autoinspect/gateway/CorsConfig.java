package com.autoinspect.gateway;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsWebFilter;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

@Configuration
public class CorsConfig {

    @Value("${FRONTEND_ORIGIN:https://dealer-frontend-iwor.onrender.com}")
    private String frontendOrigin;

    @Bean
    public CorsWebFilter corsWebFilter() {
        CorsConfiguration corsConfig = new CorsConfiguration();
        
        // Allow specific frontend origin
        corsConfig.addAllowedOrigin(frontendOrigin);
        corsConfig.addAllowedOrigin("http://localhost:3000"); // For local development
        
        // Allow all standard HTTP methods
        corsConfig.addAllowedMethod("GET");
        corsConfig.addAllowedMethod("POST");
        corsConfig.addAllowedMethod("PUT");
        corsConfig.addAllowedMethod("DELETE");
        corsConfig.addAllowedMethod("OPTIONS");
        corsConfig.addAllowedMethod("PATCH");
        
        // Allow standard headers
        corsConfig.addAllowedHeader("Origin");
        corsConfig.addAllowedHeader("Content-Type");
        corsConfig.addAllowedHeader("Accept");
        corsConfig.addAllowedHeader("Authorization");
        corsConfig.addAllowedHeader("X-Requested-With");
        corsConfig.addAllowedHeader("Cache-Control");
        
        // Allow credentials for authentication
        corsConfig.setAllowCredentials(true);
        
        // Cache preflight for 1 hour
        corsConfig.setMaxAge(3600L);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", corsConfig);
        
        System.out.println("🔧 [CorsConfig] Configured CORS for frontend origin: " + frontendOrigin);
        
        return new CorsWebFilter(source);
    }
}
