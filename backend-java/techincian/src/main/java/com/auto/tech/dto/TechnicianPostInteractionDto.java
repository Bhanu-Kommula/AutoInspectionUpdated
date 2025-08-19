package com.auto.tech.dto;

import com.auto.tech.model.TechnicianPostInteraction;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for Technician Post Interaction
 * Following the current main service pattern
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TechnicianPostInteractionDto {

    private Long id;
    private String technicianEmail;
    private Long postId;
    private TechnicianPostInteraction.ActionType actionType;
    private TechnicianPostInteraction.ActionStatus actionStatus;
    private String originalOfferAmount;
    private String counterOfferAmount;
    private String requestReason;
    private String notes;
    private Long responseTimeMs;
    private Boolean externalServiceSuccess;
    private String errorMessage;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
