package com.autoinspect.gateway;

import org.springframework.context.annotation.Configuration;

@Configuration
public class CorsConfig {
    // CORS is now handled by CorsHeaderFilter.java
    // This class is kept for compatibility but CORS is handled at the filter level
}
