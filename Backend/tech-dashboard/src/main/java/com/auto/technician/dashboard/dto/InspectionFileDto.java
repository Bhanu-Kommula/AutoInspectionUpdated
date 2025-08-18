package com.auto.technician.dashboard.dto;

import com.auto.technician.dashboard.entity.InspectionFile;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.*;
import java.time.LocalDateTime;

/**
 * Inspection File DTO
 * Data Transfer Object for inspection files
 */
@Data
@NoArgsConstructor
public class InspectionFileDto {

    private Long id;

    private Long inspectionReportId;

    @NotBlank(message = "Original filename is required")
    @Size(max = 255, message = "Original filename must not exceed 255 characters")
    private String originalFilename;

    @NotBlank(message = "Stored filename is required")
    @Size(max = 255, message = "Stored filename must not exceed 255 characters")
    private String storedFilename;

    @NotBlank(message = "File path is required")
    @Size(max = 500, message = "File path must not exceed 500 characters")
    private String filePath;

    @NotNull(message = "File size is required")
    @Positive(message = "File size must be positive")
    private Long fileSize;

    @NotBlank(message = "Content type is required")
    @Size(max = 100, message = "Content type must not exceed 100 characters")
    private String contentType;

    private InspectionFile.FileCategory category;

    @Size(max = 500, message = "Description must not exceed 500 characters")
    private String description;

    @Size(max = 128, message = "File hash must not exceed 128 characters")
    private String fileHash;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime uploadedAt;

    private Boolean isVirusScanned = false;

    private Boolean isValid = true;

    // ==================== CONSTRUCTOR FROM ENTITY ====================

    public InspectionFileDto(InspectionFile file) {
        this.id = file.getId();
        this.inspectionReportId = file.getInspectionReport() != null ? 
            file.getInspectionReport().getId() : null;
        this.originalFilename = file.getOriginalFilename();
        this.storedFilename = file.getStoredFilename();
        this.filePath = file.getFilePath();
        this.fileSize = file.getFileSize();
        this.contentType = file.getContentType();
        this.category = file.getCategory();
        this.description = file.getDescription();
        this.fileHash = file.getFileHash();
        this.uploadedAt = file.getUploadedAt();
        this.isVirusScanned = file.getIsVirusScanned();
        this.isValid = file.getIsValid();
    }

    // ==================== HELPER METHODS ====================

    public boolean isImage() {
        return InspectionFile.FileCategory.IMAGE.equals(this.category);
    }

    public boolean isVideo() {
        return InspectionFile.FileCategory.VIDEO.equals(this.category);
    }

    public boolean isAudio() {
        return InspectionFile.FileCategory.AUDIO.equals(this.category);
    }

    public boolean isDocument() {
        return InspectionFile.FileCategory.DOCUMENT.equals(this.category);
    }

    public String getFormattedFileSize() {
        if (fileSize == null) return "0 B";
        
        long size = fileSize;
        if (size < 1024) return size + " B";
        if (size < 1024 * 1024) return String.format("%.1f KB", size / 1024.0);
        if (size < 1024 * 1024 * 1024) return String.format("%.1f MB", size / (1024.0 * 1024.0));
        return String.format("%.1f GB", size / (1024.0 * 1024.0 * 1024.0));
    }

    public String getFileExtension() {
        if (originalFilename == null) return "";
        int lastDot = originalFilename.lastIndexOf('.');
        return lastDot > 0 ? originalFilename.substring(lastDot + 1).toLowerCase() : "";
    }

    public boolean isSafe() {
        return Boolean.TRUE.equals(isValid) && Boolean.TRUE.equals(isVirusScanned);
    }

    public String getCategoryDisplayName() {
        if (this.category == null) return "Unknown";
        return this.category.name().charAt(0) + this.category.name().substring(1).toLowerCase();
    }
}
