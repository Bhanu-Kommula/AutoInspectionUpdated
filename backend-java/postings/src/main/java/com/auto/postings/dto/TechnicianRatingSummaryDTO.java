package com.auto.postings.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Date;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TechnicianRatingSummaryDTO {
    
    private Long id;
    private String technicianEmail;
    private String technicianName;
    private Integer totalRatings;
    private BigDecimal averageRating;
    private Integer fiveStarCount;
    private Integer fourStarCount;
    private Integer threeStarCount;
    private Integer twoStarCount;
    private Integer oneStarCount;
    private Date lastRatedAt;
    private Date createdAt;
    private Date updatedAt;
    
    // Computed fields
    private String ratingQuality;
    private boolean eligibleForPremiumJobs;
    private boolean needsImprovement;
    private Double ratingPercentage; // Average rating as percentage (0-100)
    
    // Rating distribution percentages
    private Double fiveStarPercentage;
    private Double fourStarPercentage;
    private Double threeStarPercentage;
    private Double twoStarPercentage;
    private Double oneStarPercentage;
}
