package com.auto.technician.dashboard.dto;

import com.auto.technician.dashboard.entity.InspectionReport;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Inspection Report DTO
 * Data Transfer Object for inspection reports with validation
 */
@Data
@NoArgsConstructor
public class InspectionReportDto {

    private Long id;

    @NotNull(message = "Post ID is required")
    @Positive(message = "Post ID must be positive")
    private Long postId;

    @NotNull(message = "Technician ID is required")
    @Positive(message = "Technician ID must be positive")
    private Long technicianId;

    @Size(max = 200, message = "Report title must not exceed 200 characters")
    private String reportTitle;

    @Size(max = 50, message = "Vehicle make must not exceed 50 characters")
    private String vehicleMake;

    @Size(max = 50, message = "Vehicle model must not exceed 50 characters")
    private String vehicleModel;

    @Min(value = 1900, message = "Vehicle year must be at least 1900")
    @Max(value = 2030, message = "Vehicle year must not exceed 2030")
    private Integer vehicleYear;

    @Min(value = 0, message = "Vehicle mileage must be non-negative")
    private Integer vehicleMileage;

    @Size(max = 30, message = "Vehicle color must not exceed 30 characters")
    private String vehicleColor;

    @Size(min = 17, max = 17, message = "VIN must be exactly 17 characters")
    private String vinNumber;

    @NotNull(message = "Inspection status is required")
    private InspectionReport.InspectionStatus status;

    private InspectionReport.OverallCondition overallCondition;

    private InspectionReport.SafetyRating safetyRating;

    // Removed cost estimation field

    @Size(max = 1000, message = "Priority repairs must not exceed 1000 characters")
    private String priorityRepairs;

    @Size(max = 2000, message = "General notes must not exceed 2000 characters")
    private String generalNotes;

    private Integer totalFilesCount = 0;

    private Long totalFilesSize = 0L;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime submittedAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime completedAt;

    // Related data
    private List<InspectionChecklistItemDto> checklistItems;
    private List<InspectionFileDto> files;
    private Map<String, Object> checklistSummary;

    // ==================== CONSTRUCTOR FROM ENTITY ====================

    public InspectionReportDto(InspectionReport report) {
        this.id = report.getId();
        this.postId = report.getPostId();
        this.technicianId = report.getTechnicianId();
        this.reportTitle = report.getReportTitle();
        this.vehicleMake = report.getVehicleMake();
        this.vehicleModel = report.getVehicleModel();
        this.vehicleYear = report.getVehicleYear();
        this.vehicleMileage = report.getVehicleMileage();
        this.vehicleColor = report.getVehicleColor();
        this.vinNumber = report.getVinNumber();
        this.status = report.getStatus();
        this.overallCondition = report.getOverallCondition();
        this.safetyRating = report.getSafetyRating();
        // Removed cost field mapping
        this.priorityRepairs = report.getPriorityRepairs();
        this.generalNotes = report.getGeneralNotes();
        this.totalFilesCount = report.getTotalFilesCount();
        this.totalFilesSize = report.getTotalFilesSize();
        this.createdAt = report.getCreatedAt();
        this.updatedAt = report.getUpdatedAt();
        this.submittedAt = report.getSubmittedAt();
        this.completedAt = report.getCompletedAt();
    }

    // ==================== HELPER METHODS ====================

    public boolean isDraft() {
        return InspectionReport.InspectionStatus.DRAFT.equals(this.status);
    }

    public boolean isInProgress() {
        return InspectionReport.InspectionStatus.IN_PROGRESS.equals(this.status);
    }

    public boolean isCompleted() {
        return InspectionReport.InspectionStatus.COMPLETED.equals(this.status);
    }

    public boolean isSubmitted() {
        return InspectionReport.InspectionStatus.SUBMITTED.equals(this.status);
    }

    // Compatibility methods for service layer
    public String getFinalRemarks() {
        return generalNotes;
    }

    public void setFinalRemarks(String finalRemarks) {
        this.generalNotes = finalRemarks;
    }

    public String getVehicleVin() {
        return vinNumber;
    }

    public void setVehicleVin(String vehicleVin) {
        this.vinNumber = vehicleVin;
    }

    // Removed cost-related methods
}
