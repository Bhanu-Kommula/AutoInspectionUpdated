package com.auto.postings.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Date;

@Entity
@Table(name = "technician_rating_summary")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class TechnicianRatingSummary {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "technician_email", nullable = false, unique = true)
    private String technicianEmail;
    
    @Column(name = "total_ratings", nullable = false)
    private Integer totalRatings = 0;
    
    @Column(name = "average_rating", nullable = false, precision = 3, scale = 2)
    private BigDecimal averageRating = BigDecimal.ZERO;
    
    @Column(name = "five_star_count", nullable = false)
    private Integer fiveStarCount = 0;
    
    @Column(name = "four_star_count", nullable = false)
    private Integer fourStarCount = 0;
    
    @Column(name = "three_star_count", nullable = false)
    private Integer threeStarCount = 0;
    
    @Column(name = "two_star_count", nullable = false)
    private Integer twoStarCount = 0;
    
    @Column(name = "one_star_count", nullable = false)
    private Integer oneStarCount = 0;
    
    @Column(name = "last_rated_at")
    @Temporal(TemporalType.TIMESTAMP)
    private Date lastRatedAt;
    
    @Column(name = "created_at", nullable = false)
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdAt;
    
    @Column(name = "updated_at", nullable = false)
    @Temporal(TemporalType.TIMESTAMP)
    private Date updatedAt;
    
    @PrePersist
    protected void onCreate() {
        Date now = new Date();
        createdAt = now;
        updatedAt = now;
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = new Date();
    }
    
    // Helper method to get rating quality description
    public String getRatingQuality() {
        if (averageRating.compareTo(BigDecimal.valueOf(4.5)) >= 0) {
            return "Excellent";
        } else if (averageRating.compareTo(BigDecimal.valueOf(4.0)) >= 0) {
            return "Very Good";
        } else if (averageRating.compareTo(BigDecimal.valueOf(3.5)) >= 0) {
            return "Good";
        } else if (averageRating.compareTo(BigDecimal.valueOf(3.0)) >= 0) {
            return "Average";
        } else if (averageRating.compareTo(BigDecimal.valueOf(2.0)) >= 0) {
            return "Below Average";
        } else {
            return "Poor";
        }
    }
    
    // Helper method to check if technician is eligible for premium jobs
    public boolean isEligibleForPremiumJobs() {
        return totalRatings >= 5 && averageRating.compareTo(BigDecimal.valueOf(4.0)) >= 0;
    }
    
    // Helper method to check if technician needs improvement
    public boolean needsImprovement() {
        return totalRatings >= 3 && averageRating.compareTo(BigDecimal.valueOf(3.0)) < 0;
    }
}
