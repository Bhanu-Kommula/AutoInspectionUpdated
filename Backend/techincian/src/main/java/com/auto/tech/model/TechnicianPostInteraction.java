package com.auto.tech.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * Technician Post Interaction Entity
 * Tracks all technician interactions with posts for audit and performance analytics
 * Following the current main service pattern
 */
@Entity
@Table(name = "technician_post_interactions")
@EntityListeners(AuditingEntityListener.class)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TechnicianPostInteraction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "Technician email is required")
    @Column(name = "technician_email", nullable = false)
    private String technicianEmail;

    @NotNull(message = "Post ID is required")
    @Column(name = "post_id", nullable = false)
    private Long postId;

    @NotNull(message = "Action type is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "action_type", nullable = false)
    private ActionType actionType;

    @Column(name = "action_status", nullable = false)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ActionStatus actionStatus = ActionStatus.PENDING;

    @Column(name = "original_offer_amount", length = 50)
    private String originalOfferAmount;

    @Column(name = "counter_offer_amount", length = 50)
    private String counterOfferAmount;

    @Column(name = "request_reason", length = 500)
    private String requestReason;

    @Column(name = "notes", length = 1000)
    private String notes;

    @Column(name = "response_time_ms")
    private Long responseTimeMs;

    @Column(name = "external_service_success")
    private Boolean externalServiceSuccess;

    @Column(name = "error_message", length = 1000)
    private String errorMessage;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Enums
    public enum ActionType {
        ACCEPT, DECLINE, COUNTER_OFFER, VIEW
    }

    public enum ActionStatus {
        PENDING, SUCCESS, FAILED, CANCELLED
    }

    // Constructor for creating interactions
    public TechnicianPostInteraction(String technicianEmail, Long postId, ActionType actionType) {
        this.technicianEmail = technicianEmail;
        this.postId = postId;
        this.actionType = actionType;
        this.actionStatus = ActionStatus.PENDING;
        this.createdAt = LocalDateTime.now();
    }

    // Helper methods
    public void markSuccess() {
        this.actionStatus = ActionStatus.SUCCESS;
        this.updatedAt = LocalDateTime.now();
    }

    public void markFailed(String errorMessage) {
        this.actionStatus = ActionStatus.FAILED;
        this.errorMessage = errorMessage;
        this.updatedAt = LocalDateTime.now();
    }

    public void markCancelled() {
        this.actionStatus = ActionStatus.CANCELLED;
        this.updatedAt = LocalDateTime.now();
    }

    public void setExternalServiceResult(boolean success) {
        this.externalServiceSuccess = success;
        this.updatedAt = LocalDateTime.now();
    }

    public void setResponseTime(Long responseTimeMs) {
        this.responseTimeMs = responseTimeMs;
        this.updatedAt = LocalDateTime.now();
    }
}
