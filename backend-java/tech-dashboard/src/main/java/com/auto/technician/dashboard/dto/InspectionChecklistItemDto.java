package com.auto.technician.dashboard.dto;

import com.auto.technician.dashboard.entity.InspectionChecklistItem;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.*;
import java.time.LocalDateTime;

/**
 * Inspection Checklist Item DTO
 * Data Transfer Object for checklist items
 */
@Data
@NoArgsConstructor
public class InspectionChecklistItemDto {

    private Long id;

    private Long inspectionReportId;

    @NotNull(message = "Category is required")
    private InspectionChecklistItem.InspectionCategory category;

    @NotBlank(message = "Item name is required")
    @Size(max = 200, message = "Item name must not exceed 200 characters")
    private String itemName;

    @NotNull(message = "Checked status is required")
    private Boolean isChecked = false;

    @Size(max = 1000, message = "Remarks must not exceed 1000 characters")
    private String remarks;

    private InspectionChecklistItem.ConditionRating conditionRating;

    private InspectionChecklistItem.WorkingStatus workingStatus;

    private InspectionChecklistItem.PriorityLevel priorityLevel;

    // Removed repair cost field

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;

    // ==================== CONSTRUCTOR FROM ENTITY ====================

    public InspectionChecklistItemDto(InspectionChecklistItem item) {
        this.id = item.getId();
        this.inspectionReportId = item.getInspectionReport() != null ? 
            item.getInspectionReport().getId() : null;
        this.category = item.getCategory();
        this.itemName = item.getItemName();
        this.isChecked = item.getIsChecked();
        this.remarks = item.getRemarks();
        this.conditionRating = item.getConditionRating();
        this.workingStatus = item.getWorkingStatus();
        this.priorityLevel = item.getPriorityLevel();
        // Removed repair cost mapping
        this.createdAt = item.getCreatedAt();
        this.updatedAt = item.getUpdatedAt();
    }

    // ==================== HELPER METHODS ====================

    public boolean isCompleted() {
        return Boolean.TRUE.equals(this.isChecked);
    }

    public boolean hasIssues() {
        return InspectionChecklistItem.WorkingStatus.NEEDS_REPAIR.equals(this.workingStatus) ||
               InspectionChecklistItem.WorkingStatus.NOT_WORKING.equals(this.workingStatus);
    }

    public boolean isCritical() {
        return InspectionChecklistItem.PriorityLevel.CRITICAL.equals(this.priorityLevel);
    }

    // Removed repair cost helper method

    public String getCategoryDisplayName() {
        if (this.category == null) return "";
        return this.category.name().replace("_", " ");
    }

    public String getConditionDisplayName() {
        if (this.conditionRating == null) return "Not Rated";
        return this.conditionRating.name().replace("_", " ");
    }

    public String getWorkingStatusDisplayName() {
        if (this.workingStatus == null) return "Not Specified";
        return this.workingStatus.name().replace("_", " ");
    }

    public String getPriorityDisplayName() {
        if (this.priorityLevel == null) return "Not Set";
        return this.priorityLevel.name().replace("_", " ");
    }
}
