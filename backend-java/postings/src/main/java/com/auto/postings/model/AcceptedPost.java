package com.auto.postings.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

/**
 * Accepted Post Entity - Tracks posts accepted by technicians with database-level uniqueness
 * Uses UNIQUE constraint on post_id to prevent multiple acceptances (race condition protection)
 */
@Entity
@Table(name = "accepted_posts", 
       uniqueConstraints = {
           @UniqueConstraint(name = "uk_post_id", columnNames = "post_id")
       },
       indexes = {
           @Index(name = "idx_post_id", columnList = "post_id"),
           @Index(name = "idx_technician_email", columnList = "technician_email"),
           @Index(name = "idx_accepted_at", columnList = "accepted_at")
       })
public class AcceptedPost {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "Post ID is required")
    @Column(name = "post_id", nullable = false, unique = true)
    private Long postId;

    @NotBlank(message = "Technician email is required")
    @Column(name = "technician_email", nullable = false)
    private String technicianEmail;

    @Column(name = "offer_amount")
    private String offerAmount;

    @Column(name = "acceptance_notes")
    private String acceptanceNotes;

    @Column(name = "accepted_at", nullable = false)
    private LocalDateTime acceptedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Constructors
    public AcceptedPost() {
        this.acceptedAt = LocalDateTime.now();
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public AcceptedPost(Long postId, String technicianEmail, String offerAmount, String acceptanceNotes) {
        this();
        this.postId = postId;
        this.technicianEmail = technicianEmail;
        this.offerAmount = offerAmount;
        this.acceptanceNotes = acceptanceNotes;
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getPostId() { return postId; }
    public void setPostId(Long postId) { this.postId = postId; }

    public String getTechnicianEmail() { return technicianEmail; }
    public void setTechnicianEmail(String technicianEmail) { this.technicianEmail = technicianEmail; }

    public String getOfferAmount() { return offerAmount; }
    public void setOfferAmount(String offerAmount) { this.offerAmount = offerAmount; }

    public String getAcceptanceNotes() { return acceptanceNotes; }
    public void setAcceptanceNotes(String acceptanceNotes) { this.acceptanceNotes = acceptanceNotes; }

    public LocalDateTime getAcceptedAt() { return acceptedAt; }
    public void setAcceptedAt(LocalDateTime acceptedAt) { this.acceptedAt = acceptedAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    @Override
    public String toString() {
        return "AcceptedPost{" +
                "id=" + id +
                ", postId=" + postId +
                ", technicianEmail='" + technicianEmail + '\'' +
                ", offerAmount='" + offerAmount + '\'' +
                ", acceptedAt=" + acceptedAt +
                '}';
    }
}
