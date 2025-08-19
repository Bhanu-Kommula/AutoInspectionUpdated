package com.auto.postings.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

/**
 * Dealer Counter Offer Action Entity
 * Tracks dealer actions (accept/reject) on counter offers
 */
@Entity
@Table(name = "dealer_counter_offer_actions", 
       indexes = {
           @Index(name = "idx_counter_offer_id", columnList = "counter_offer_id"),
           @Index(name = "idx_dealer_email", columnList = "dealer_email"),
           @Index(name = "idx_action_type", columnList = "action_type"),
           @Index(name = "idx_action_at", columnList = "action_at")
       })
@EntityListeners(AuditingEntityListener.class)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DealerCounterOfferAction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "Counter offer ID is required")
    @Column(name = "counter_offer_id", nullable = false)
    private Long counterOfferId;

    @NotNull(message = "Dealer email is required")
    @Column(name = "dealer_email", nullable = false)
    private String dealerEmail;

    @NotNull(message = "Action type is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "action_type", nullable = false)
    private ActionType actionType;

    @Column(name = "action_notes", length = 1000)
    private String actionNotes;

    @Column(name = "action_at", nullable = false)
    private LocalDateTime actionAt;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // Constructor for creating dealer actions
    public DealerCounterOfferAction(Long counterOfferId, String dealerEmail, ActionType actionType, String actionNotes) {
        this.counterOfferId = counterOfferId;
        this.dealerEmail = dealerEmail;
        this.actionType = actionType;
        this.actionNotes = actionNotes;
        this.actionAt = LocalDateTime.now();
    }

    @Override
    public String toString() {
        return "DealerCounterOfferAction{" +
                "id=" + id +
                ", counterOfferId=" + counterOfferId +
                ", dealerEmail='" + dealerEmail + '\'' +
                ", actionType=" + actionType +
                ", actionAt=" + actionAt +
                '}';
    }

    /**
     * Action Type Enum
     */
    public enum ActionType {
        ACCEPT("Accept Counter Offer"),
        REJECT("Reject Counter Offer");

        private final String displayName;

        ActionType(String displayName) {
            this.displayName = displayName;
        }

        public String getDisplayName() {
            return displayName;
        }
    }
}
