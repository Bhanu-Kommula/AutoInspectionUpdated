package com.autoinspect.gateway;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsWebFilter;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
public class CorsConfig {

    @Bean
    public CorsWebFilter corsWebFilter() {
        System.out.println("🔧 [CorsConfig] Initializing CORS configuration...");
        
        CorsConfiguration corsConfig = new CorsConfiguration();
        
        // For older Spring Cloud versions, use allowedOrigins instead of allowedOriginPatterns
        corsConfig.setAllowedOrigins(Arrays.asList("*"));
        System.out.println("🔧 [CorsConfig] Allowed origins: " + corsConfig.getAllowedOrigins());
        
        // Allow all methods
        corsConfig.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        System.out.println("🔧 [CorsConfig] Allowed methods: " + corsConfig.getAllowedMethods());
        
        // Allow all headers
        corsConfig.setAllowedHeaders(Arrays.asList("*"));
        System.out.println("🔧 [CorsConfig] Allowed headers: " + corsConfig.getAllowedHeaders());
        
        // Allow credentials
        corsConfig.setAllowCredentials(true);
        System.out.println("🔧 [CorsConfig] Allow credentials: " + corsConfig.getAllowCredentials());
        
        // Set max age
        corsConfig.setMaxAge(3600L);
        System.out.println("🔧 [CorsConfig] Max age: " + corsConfig.getMaxAge());
        
        // Add exposed headers
        corsConfig.setExposedHeaders(Arrays.asList("Access-Control-Allow-Origin", "Access-Control-Allow-Credentials"));
        
        // For older Spring Cloud versions, also try setting these explicitly
        corsConfig.addAllowedOrigin("*");
        corsConfig.addAllowedMethod("*");
        corsConfig.addAllowedHeader("*");
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", corsConfig);
        
        System.out.println("🔧 [CorsConfig] CORS configuration registered for /** pattern");
        System.out.println("🔧 [CorsConfig] CORS filter created successfully");
        
        return new CorsWebFilter(source);
    }
}
