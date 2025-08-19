package com.auto.technician.dashboard.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Inspection Checklist Item Entity
 * Individual checklist items for each inspection category
 */
@Entity
@Table(name = "inspection_checklist_items")
@Data
@NoArgsConstructor
public class InspectionChecklistItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inspection_report_id", nullable = false)
    private InspectionReport inspectionReport;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false)
    private InspectionCategory category;

    @Column(name = "item_name", nullable = false, length = 255)
    private String itemName;

    @Column(name = "item_order", nullable = false)
    private Integer itemOrder = 1; // Order within category (1-8 for most categories)

    // Inspection results
    @Column(name = "is_checked", nullable = false)
    private Boolean isChecked = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "condition_rating")
    private ConditionRating conditionRating;

    // Detailed assessment
    @Enumerated(EnumType.STRING)
    @Column(name = "working_status")
    private WorkingStatus workingStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority_level")
    private PriorityLevel priorityLevel;

    // Repair information (removing cost fields)
    @Column(name = "repair_description", columnDefinition = "TEXT")
    private String repairDescription;

    // Detailed notes
    @Column(name = "remarks", columnDefinition = "TEXT")
    private String remarks;

    @Column(name = "technician_notes", columnDefinition = "TEXT")
    private String technicianNotes;

    // Photo/file references
    @Column(name = "has_photos")
    private Boolean hasPhotos = false;

    @Column(name = "photo_count")
    private Integer photoCount = 0;

    // Timestamps
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    @Column(name = "inspected_at")
    private LocalDateTime inspectedAt; // When this specific item was inspected

    // ==================== CONSTRUCTORS ====================

    public InspectionChecklistItem(InspectionCategory category, String itemName) {
        this.category = category;
        this.itemName = itemName;
        this.isChecked = false;
        this.itemOrder = 1;
    }

    public InspectionChecklistItem(InspectionCategory category, String itemName, Integer order) {
        this.category = category;
        this.itemName = itemName;
        this.isChecked = false;
        this.itemOrder = order;
    }

    // ==================== ENUMS ====================

    public enum InspectionCategory {
        EXTERIOR,
        INTERIOR,
        ENGINE,
        TRANSMISSION,
        BRAKES,
        SUSPENSION,
        ELECTRICAL,
        SAFETY,
        UNDERCARRIAGE,
        TEST_DRIVE
    }

    public enum ConditionRating {
        EXCELLENT,        // Like New condition
        GOOD,            // Serviceable condition  
        FAIR,            // Marginal condition
        POOR,            // Requires Repair
        FAILED,          // Not Accessible
        NOT_INSPECTED    // Skipped/Not Inspected
    }

    public enum WorkingStatus {
        WORKING,
        NEEDS_REPAIR,
        NOT_WORKING
    }

    public enum PriorityLevel {
        LOW,
        MEDIUM,
        HIGH,
        CRITICAL
    }

    // ==================== BUSINESS METHODS ====================

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public void updateItem(Boolean checked, String remarks, ConditionRating rating, 
                          WorkingStatus status, PriorityLevel priority) {
        if (checked != null) {
            this.isChecked = checked;
            if (checked) {
                this.inspectedAt = LocalDateTime.now();
            }
        }
        if (remarks != null) this.remarks = remarks;
        if (rating != null) this.conditionRating = rating;
        if (status != null) this.workingStatus = status;
        if (priority != null) this.priorityLevel = priority;
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * Complete inspection of this item with full details (cost fields removed)
     */
    public void completeInspection(ConditionRating rating, WorkingStatus status, 
                                 String remarks, String techNotes, String repairDesc) {
        this.isChecked = true;
        this.conditionRating = rating;
        this.workingStatus = status;
        this.remarks = remarks;
        this.technicianNotes = techNotes;
        this.repairDescription = repairDesc;
        this.inspectedAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        
        // Set priority based on condition and working status
        if (rating == ConditionRating.FAILED || status == WorkingStatus.NOT_WORKING) {
            this.priorityLevel = PriorityLevel.CRITICAL;
        } else if (rating == ConditionRating.POOR || status == WorkingStatus.NEEDS_REPAIR) {
            this.priorityLevel = PriorityLevel.HIGH;
        } else if (rating == ConditionRating.FAIR) {
            this.priorityLevel = PriorityLevel.MEDIUM;
        } else {
            this.priorityLevel = PriorityLevel.LOW;
        }
    }

    /**
     * Mark item as having photos
     */
    public void addPhotos(int count) {
        this.hasPhotos = true;
        this.photoCount = count;
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * Check if item needs repair
     */
    public boolean needsRepair() {
        return conditionRating == ConditionRating.POOR || 
               conditionRating == ConditionRating.FAILED ||
               workingStatus == WorkingStatus.NOT_WORKING ||
               workingStatus == WorkingStatus.NEEDS_REPAIR;
    }

    /**
     * Check if item is critical
     */
    public boolean isCritical() {
        return priorityLevel == PriorityLevel.CRITICAL ||
               conditionRating == ConditionRating.FAILED ||
               workingStatus == WorkingStatus.NOT_WORKING;
    }
}
