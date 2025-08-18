package com.auto.tech.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO for Technician Performance Metrics
 * Following the current main service pattern
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TechnicianPerformanceMetricsDto {

    private Long id;
    private String technicianEmail;
    private String technicianName;
    private Integer totalPostsViewed;
    private Integer totalPostsAccepted;
    private Integer totalPostsDeclined;
    private Integer totalCounterOffers;
    private Integer acceptedCounterOffers;
    private Integer rejectedCounterOffers;
    private BigDecimal totalEarnings;
    private Long avgResponseTimeMs;
    private BigDecimal successRate;
    private LocalDateTime lastActivityAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
