package com.auto.tech.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO for Technician Analytics Summary
 * Following the current main service pattern
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TechnicianAnalyticsSummaryDto {

    private Double averageSuccessRate;
    private BigDecimal totalEarnings;
    private Long activeTechnicians;
    private Long totalTechnicians;
    private Long totalPostsViewed;
    private Long totalPostsAccepted;
    private Long totalPostsDeclined;
    private Long totalCounterOffers;
    private Long acceptedCounterOffers;
    private Long rejectedCounterOffers;
    private Double averageResponseTimeMs;
}
