package com.auto.tech.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Technician Performance Metrics Entity
 * Tracks performance metrics for technicians for analytics and reporting
 * Following the current main service pattern
 */
@Entity
@Table(name = "technician_performance_metrics")
@EntityListeners(AuditingEntityListener.class)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TechnicianPerformanceMetrics {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "Technician email is required")
    @Column(name = "technician_email", nullable = false, unique = true)
    private String technicianEmail;

    @Column(name = "total_posts_viewed", nullable = false)
    @Builder.Default
    private Integer totalPostsViewed = 0;

    @Column(name = "total_posts_accepted", nullable = false)
    @Builder.Default
    private Integer totalPostsAccepted = 0;

    @Column(name = "total_posts_declined", nullable = false)
    @Builder.Default
    private Integer totalPostsDeclined = 0;

    @Column(name = "total_counter_offers", nullable = false)
    @Builder.Default
    private Integer totalCounterOffers = 0;

    @Column(name = "accepted_counter_offers", nullable = false)
    @Builder.Default
    private Integer acceptedCounterOffers = 0;

    @Column(name = "rejected_counter_offers", nullable = false)
    @Builder.Default
    private Integer rejectedCounterOffers = 0;

    @Column(name = "total_earnings", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal totalEarnings = BigDecimal.ZERO;

    @Column(name = "avg_response_time_ms")
    @Builder.Default
    private Long avgResponseTimeMs = 0L;

    @Column(name = "success_rate", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal successRate = BigDecimal.ZERO;

    @Column(name = "last_activity_at")
    private LocalDateTime lastActivityAt;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Constructor for creating metrics
    public TechnicianPerformanceMetrics(String technicianEmail) {
        this.technicianEmail = technicianEmail;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    // Helper methods for updating metrics
    public void incrementPostsViewed() {
        this.totalPostsViewed++;
        this.lastActivityAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public void incrementPostsAccepted() {
        this.totalPostsAccepted++;
        this.lastActivityAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        updateSuccessRate();
    }

    public void incrementPostsDeclined() {
        this.totalPostsDeclined++;
        this.lastActivityAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        updateSuccessRate();
    }

    public void incrementCounterOffers() {
        this.totalCounterOffers++;
        this.lastActivityAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public void incrementAcceptedCounterOffers() {
        this.acceptedCounterOffers++;
        this.lastActivityAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public void incrementRejectedCounterOffers() {
        this.rejectedCounterOffers++;
        this.lastActivityAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public void addEarnings(BigDecimal amount) {
        this.totalEarnings = this.totalEarnings.add(amount);
        this.lastActivityAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public void updateAvgResponseTime(Long responseTimeMs) {
        if (this.avgResponseTimeMs == 0) {
            this.avgResponseTimeMs = responseTimeMs;
        } else {
            this.avgResponseTimeMs = (this.avgResponseTimeMs + responseTimeMs) / 2;
        }
        this.updatedAt = LocalDateTime.now();
    }

    private void updateSuccessRate() {
        int totalActions = this.totalPostsAccepted + this.totalPostsDeclined;
        if (totalActions > 0) {
            this.successRate = BigDecimal.valueOf(this.totalPostsAccepted)
                    .divide(BigDecimal.valueOf(totalActions), 4, BigDecimal.ROUND_HALF_UP)
                    .multiply(BigDecimal.valueOf(100));
        }
    }

    public void updateLastActivity() {
        this.lastActivityAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
}
