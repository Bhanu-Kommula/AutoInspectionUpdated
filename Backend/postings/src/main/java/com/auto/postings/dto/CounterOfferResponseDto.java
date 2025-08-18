package com.auto.postings.dto;

import lombok.Data;
import java.time.LocalDateTime;

/**
 * DTO for counter offer responses
 */
@Data
public class CounterOfferResponseDto {

    private Long id;
    private Long postId;
    private String technicianEmail;
    private String technicianName;
    private String originalOfferAmount;
    private String requestedOfferAmount;
    private String technicianLocation;
    private LocalDateTime requestedAt;
    private String requestReason;
    private String technicianNotes;
    private String status;
    private String statusDisplayName;
    private LocalDateTime dealerResponseAt;
    private String dealerResponseNotes;
    private LocalDateTime expiresAt;
    private long hoursUntilExpiry;
    private boolean isPending;
    private boolean isExpired;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Helper methods
    public boolean isPending() {
        return "PENDING".equals(status);
    }

    public boolean isExpired() {
        return "EXPIRED".equals(status);
    }

    public long getHoursUntilExpiry() {
        if (expiresAt == null) return 0;
        return java.time.Duration.between(LocalDateTime.now(), expiresAt).toHours();
    }
}
