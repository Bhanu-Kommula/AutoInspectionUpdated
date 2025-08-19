package com.auto.dealer.configuration;

import org.springframework.context.annotation.Configuration;

// Commented out unused imports since CORS configuration is disabled
// import org.springframework.beans.factory.annotation.Value;
// import org.springframework.context.annotation.Bean;
// import org.springframework.web.servlet.config.annotation.CorsRegistry;
// import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;


@Configuration
public class WebConfig {

    // CORS configuration commented out to prevent duplicate headers
    // Gateway handles CORS centrally for all services
    /*
    @Value("${cors.allowed-origins:http://localhost:3000,http://localhost:3001}")
    private String allowedOrigins;
    
    @Value("${common.cors.allowed-methods:GET,POST,PUT,DELETE,OPTIONS}")
    private String allowedMethods;
    
    @Value("${common.cors.max-age:3600}")
    private int maxAge;

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/**") // Allow all endpoints
                        .allowedOrigins(allowedOrigins.split(",")) // Configurable origins from centralized config
                        .allowedMethods(allowedMethods.split(",")) // Methods from centralized config
                        .allowedHeaders("*") // Allow all headers
                        .allowCredentials(true) // Allow credentials
                        .maxAge(maxAge); // Cache duration from centralized config
            }
        };
    }
    */
}