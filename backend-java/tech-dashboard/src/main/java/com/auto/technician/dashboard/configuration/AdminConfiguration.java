package com.auto.technician.dashboard.configuration;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Configuration properties for admin dashboard functionality
 */
@Component
@ConfigurationProperties(prefix = "app.admin")
@Data
public class AdminConfiguration {
    
    /**
     * Number of checklist items per inspection report
     */
    private int checklistItemsPerReport = 66;
    
    /**
     * Default page size for admin listings
     */
    private int defaultPageSize = 20;
    
    /**
     * Maximum page size for admin listings
     */
    private int maxPageSize = 100;
    
    /**
     * Default limit for top performers
     */
    private int defaultTopPerformersLimit = 10;
    
    /**
     * Maximum limit for top performers
     */
    private int maxTopPerformersLimit = 50;
    
    /**
     * Default days to keep for data cleanup
     */
    private int defaultDaysToKeep = 90;
    
    /**
     * Minimum days to keep for data cleanup
     */
    private int minDaysToKeep = 30;
}
