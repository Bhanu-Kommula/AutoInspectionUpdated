package com.auto.technician.dashboard.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Enhanced Inspection Report Entity
 * Main entity for storing comprehensive vehicle inspection reports
 * Supports all 66 inspection items with complete data tracking
 */
@Entity
@Table(name = "inspection_reports", indexes = {
    @Index(name = "idx_post_id", columnList = "post_id"),
    @Index(name = "idx_technician_id", columnList = "technician_id"),
    @Index(name = "idx_status", columnList = "status"),
    @Index(name = "idx_inspection_date", columnList = "inspection_date"),
    @Index(name = "idx_created_at", columnList = "created_at"),
    @Index(name = "idx_tech_post_composite", columnList = "technician_id, post_id"),
    @Index(name = "idx_status_tech", columnList = "status, technician_id")
})
@Data
@NoArgsConstructor
public class InspectionReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Core identifiers (OPTIMIZED FOR FETCHING)
    @Column(name = "post_id", nullable = false)
    private Long postId;

    @Column(name = "technician_id", nullable = false)
    private Long technicianId;

    // Report metadata
    @Column(name = "report_title")
    private String reportTitle = "Vehicle Inspection Report";

    @Column(name = "report_number", unique = true, length = 50)
    private String reportNumber; // Auto-generated unique report number

    // Timing information
    @Column(name = "inspection_date", nullable = false)
    private LocalDate inspectionDate = LocalDate.now();

    @Column(name = "inspection_start_time")
    private LocalTime inspectionStartTime;

    @Column(name = "inspection_end_time")
    private LocalTime inspectionEndTime;

    // Status tracking with detailed workflow
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private InspectionStatus status = InspectionStatus.DRAFT;

    // Overall assessment (REQUIRED FOR COMPLETE REPORTS)
    @Enumerated(EnumType.STRING)
    @Column(name = "overall_condition")
    private OverallCondition overallCondition = OverallCondition.GOOD;

    @Enumerated(EnumType.STRING)
    @Column(name = "safety_rating")
    private SafetyRating safetyRating = SafetyRating.SAFE;

    // Priority repairs (keeping for technical notes, removing cost)
    @Column(name = "priority_repairs", columnDefinition = "TEXT")
    private String priorityRepairs;

    // Comprehensive notes and remarks
    @Column(name = "general_notes", columnDefinition = "TEXT")
    private String generalNotes;

    @Column(name = "technician_recommendations", columnDefinition = "TEXT")
    private String technicianRecommendations;

    @Column(name = "customer_concerns", columnDefinition = "TEXT")
    private String customerConcerns;

    // File tracking
    @Column(name = "total_files_count")
    private Integer totalFilesCount = 0;

    @Column(name = "total_files_size")
    private Long totalFilesSize = 0L;

    // Checklist completion tracking
    @Column(name = "total_checklist_items")
    private Integer totalChecklistItems = 66; // Total expected items

    @Column(name = "completed_checklist_items")
    private Integer completedChecklistItems = 0;

    // Timestamps (CRITICAL FOR AUDIT TRAIL)
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    @Column(name = "started_at")
    private LocalDateTime startedAt; // When inspection actually started

    @Column(name = "completed_at")
    private LocalDateTime completedAt; // When inspection was completed

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt; // When report was submitted

    @Column(name = "approved_at")
    private LocalDateTime approvedAt; // When report was approved

    // Audit fields
    @Column(name = "created_by", length = 100)
    private String createdBy;

    @Column(name = "updated_by", length = 100)
    private String updatedBy;

    @Column(name = "version")
    private Integer version = 1;

    // Legacy vehicle fields (for backward compatibility)
    @Column(name = "vehicle_make")
    private String vehicleMake;

    @Column(name = "vehicle_model")
    private String vehicleModel;

    @Column(name = "vehicle_year")
    private Integer vehicleYear;

    @Column(name = "vehicle_mileage")
    private Integer vehicleMileage;

    @Column(name = "vehicle_color")
    private String vehicleColor;

    @Column(name = "vin_number")
    private String vinNumber;

    // Relationships
    @OneToMany(mappedBy = "inspectionReport", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<InspectionChecklistItem> checklistItems = new ArrayList<>();

    @OneToMany(mappedBy = "inspectionReport", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<InspectionFile> files = new ArrayList<>();

    @OneToOne(mappedBy = "inspectionReport", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private InspectionVehicleDetails vehicleDetails;

    // ==================== CONSTRUCTORS ====================

    public InspectionReport(Long postId, Long technicianId) {
        this.postId = postId;
        this.technicianId = technicianId;
        this.status = InspectionStatus.DRAFT;
        this.reportTitle = "Inspection Report for Post " + postId;
        this.inspectionDate = LocalDate.now();
        this.overallCondition = OverallCondition.GOOD;
        this.safetyRating = SafetyRating.SAFE;
        this.createdBy = "SYSTEM";
    }

    // ==================== ENUMS ====================

    public enum InspectionStatus {
        DRAFT,           // Initial state when post is accepted
        IN_PROGRESS,     // Inspection started
        COMPLETED,       // Inspection completed with files
        SUBMITTED,       // Final submission with remarks
        APPROVED,        // Report approved by supervisor
        REJECTED         // Report rejected and needs revision
    }

    public enum OverallCondition {
        EXCELLENT,       // Like new condition
        GOOD,           // Good serviceable condition
        FAIR,           // Fair condition with minor issues
        POOR,           // Poor condition requiring repairs
        CRITICAL        // Critical condition, unsafe to operate
    }

    public enum SafetyRating {
        SAFE,           // Safe to operate
        NEEDS_ATTENTION, // Needs attention but operable
        UNSAFE,         // Unsafe to operate
        CRITICAL        // Critical safety issues
    }

    // ==================== BUSINESS METHODS ====================

    public void startInspection() {
        this.status = InspectionStatus.IN_PROGRESS;
        this.inspectionStartTime = LocalTime.now();
        this.startedAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public void completeInspection() {
        this.status = InspectionStatus.COMPLETED;
        this.inspectionEndTime = LocalTime.now();
        this.completedAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public void submitReport() {
        this.status = InspectionStatus.SUBMITTED;
        this.submittedAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public void approveReport() {
        this.status = InspectionStatus.APPROVED;
        this.approvedAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public void rejectReport() {
        this.status = InspectionStatus.REJECTED;
        this.updatedAt = LocalDateTime.now();
    }

    // ==================== CALCULATED PROPERTIES ====================

    /**
     * Calculate completion percentage based on checked items
     */
    public Double getCompletionPercentage() {
        if (totalChecklistItems == null || totalChecklistItems == 0) {
            return 0.0;
        }
        if (completedChecklistItems == null) {
            return 0.0;
        }
        return Math.round((completedChecklistItems.doubleValue() / totalChecklistItems.doubleValue()) * 100.0 * 100.0) / 100.0;
    }

    /**
     * Calculate inspection duration in minutes
     */
    public Integer getInspectionDurationMinutes() {
        if (inspectionStartTime != null && inspectionEndTime != null) {
            return (int) java.time.Duration.between(inspectionStartTime, inspectionEndTime).toMinutes();
        }
        return null;
    }

    /**
     * Check if inspection is complete (all 66 items checked)
     */
    public boolean isInspectionComplete() {
        return completedChecklistItems != null && completedChecklistItems >= 66;
    }

    /**
     * Check if report is ready for submission
     */
    public boolean isReadyForSubmission() {
        return isInspectionComplete() && 
               status == InspectionStatus.COMPLETED &&
               generalNotes != null && !generalNotes.trim().isEmpty();
    }

    /**
     * Update checklist completion count
     */
    public void updateCompletionCount(int checkedItems) {
        this.completedChecklistItems = checkedItems;
        this.updatedAt = LocalDateTime.now();
    }

    public void addChecklistItem(InspectionChecklistItem item) {
        if (checklistItems == null) {
            checklistItems = new ArrayList<>();
        }
        checklistItems.add(item);
        item.setInspectionReport(this);
    }

    public void addFile(InspectionFile file) {
        if (files == null) {
            files = new ArrayList<>();
        }
        files.add(file);
        file.setInspectionReport(this);
    }

    // ==================== ALIAS METHODS FOR COMPATIBILITY ====================

    public String getVehicleVin() {
        return vinNumber;
    }

    public void setVehicleVin(String vehicleVin) {
        this.vinNumber = vehicleVin;
    }

    public String getFinalRemarks() {
        return generalNotes;
    }

    public void setFinalRemarks(String finalRemarks) {
        this.generalNotes = finalRemarks;
    }

    public LocalDateTime getStartedAt() {
        return inspectionStartTime != null ? 
            LocalDateTime.of(inspectionDate != null ? inspectionDate : LocalDate.now(), inspectionStartTime) : null;
    }

    public void setStartedAt(LocalDateTime startedAt) {
        if (startedAt != null) {
            this.inspectionDate = startedAt.toLocalDate();
            this.inspectionStartTime = startedAt.toLocalTime();
        }
    }

    // Removed cost-related methods

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
