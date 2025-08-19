package com.auto.technician.dashboard.configuration;

import org.springframework.context.annotation.Configuration;


@Configuration
public class WebConfig {

    // CORS configuration commented out to prevent duplicate headers
    // Gateway handles CORS centrally for all services
    /*
    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/**") // Allow all endpoints
                        .allowedOrigins("http://localhost:3000") // Allow React port
                        .allowedMethods("*"); // Allow GET, POST, etc.
            }
        };
    }
    */
}