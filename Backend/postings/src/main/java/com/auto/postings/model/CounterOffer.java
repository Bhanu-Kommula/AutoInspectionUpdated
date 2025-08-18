package com.auto.postings.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * Counter Offer Entity - Technician counter-offers and negotiations
 */
@Entity
@Table(name = "counter_offers",
       indexes = {
           @Index(name = "idx_post_id", columnList = "post_id"),
           @Index(name = "idx_technician_email", columnList = "technician_email"),
           @Index(name = "idx_status", columnList = "status"),
           @Index(name = "idx_requested_at", columnList = "requested_at"),
           @Index(name = "idx_expires_at", columnList = "expires_at")
       },
       uniqueConstraints = {
           @UniqueConstraint(name = "unique_active_request", 
                           columnNames = {"post_id", "technician_email", "status"})
       })
@EntityListeners(AuditingEntityListener.class)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CounterOffer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "Post ID is required")
    @Column(name = "post_id", nullable = false)
    private Long postId;

    @NotBlank(message = "Technician email is required")
    @Column(name = "technician_email", nullable = false)
    private String technicianEmail;

    @Size(max = 255, message = "Technician name must not exceed 255 characters")
    @Column(name = "technician_name")
    private String technicianName;

    @NotBlank(message = "Original offer amount is required")
    @Size(max = 100, message = "Original offer amount must not exceed 100 characters")
    @Column(name = "original_offer_amount", nullable = false)
    private String originalOfferAmount;

    @NotBlank(message = "Requested offer amount is required")
    @Size(max = 100, message = "Requested offer amount must not exceed 100 characters")
    @Column(name = "requested_offer_amount", nullable = false)
    private String requestedOfferAmount;

    @NotBlank(message = "Technician location is required")
    @Size(max = 255, message = "Location must not exceed 255 characters")
    @Column(name = "technician_location", nullable = false)
    private String technicianLocation;

    @Column(name = "requested_at", nullable = false)
    private LocalDateTime requestedAt;

    @Size(max = 1000, message = "Request reason must not exceed 1000 characters")
    @Column(name = "request_reason", columnDefinition = "TEXT")
    private String requestReason;

    @Size(max = 1000, message = "Technician notes must not exceed 1000 characters")
    @Column(name = "technician_notes", columnDefinition = "TEXT")
    private String technicianNotes;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CounterOfferStatus status = CounterOfferStatus.PENDING;

    @Column(name = "dealer_response_at")
    private LocalDateTime dealerResponseAt;

    @Size(max = 1000, message = "Dealer response notes must not exceed 1000 characters")
    @Column(name = "dealer_response_notes", columnDefinition = "TEXT")
    private String dealerResponseNotes;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Business Methods
    public void acceptByDealer(String dealerNotes) {
        this.status = CounterOfferStatus.ACCEPTED;
        this.dealerResponseAt = LocalDateTime.now();
        this.dealerResponseNotes = dealerNotes;
        this.updatedAt = LocalDateTime.now();
    }

    public void rejectByDealer(String dealerNotes) {
        this.status = CounterOfferStatus.REJECTED;
        this.dealerResponseAt = LocalDateTime.now();
        this.dealerResponseNotes = dealerNotes;
        this.updatedAt = LocalDateTime.now();
    }

    public void withdrawByTechnician() {
        this.status = CounterOfferStatus.WITHDRAWN;
        this.updatedAt = LocalDateTime.now();
    }

    public void markAsExpired() {
        this.status = CounterOfferStatus.EXPIRED;
        this.updatedAt = LocalDateTime.now();
    }

    public boolean isExpired() {
        return status == CounterOfferStatus.PENDING && expiresAt != null && LocalDateTime.now().isAfter(expiresAt);
    }

    public boolean isPending() {
        return status == CounterOfferStatus.PENDING && !isExpired();
    }

    public boolean canBeModified() {
        return status == CounterOfferStatus.PENDING && !isExpired();
    }

    public long getHoursUntilExpiry() {
        if (expiresAt == null) return 0;
        return java.time.Duration.between(LocalDateTime.now(), expiresAt).toHours();
    }

    // Status Enum
    public enum CounterOfferStatus {
        PENDING("Pending Dealer Response"),
        ACCEPTED("Accepted by Dealer"),
        REJECTED("Rejected by Dealer"),
        WITHDRAWN("Withdrawn by Technician"),
        EXPIRED("Expired - No Response");

        private final String displayName;

        CounterOfferStatus(String displayName) {
            this.displayName = displayName;
        }

        public String getDisplayName() {
            return displayName;
        }

        public boolean isActive() {
            return this == PENDING;
        }

        public boolean isFinal() {
            return this == ACCEPTED || this == REJECTED || this == WITHDRAWN || this == EXPIRED;
        }
    }
}
