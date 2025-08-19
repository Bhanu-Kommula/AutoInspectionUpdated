package com.auto.technician.dashboard.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Inspection File Entity
 * Stores file metadata for inspection reports
 */
@Entity
@Table(name = "inspection_files")
@Data
@NoArgsConstructor
public class InspectionFile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inspection_report_id", nullable = false)
    private InspectionReport inspectionReport;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "checklist_item_id")
    private InspectionChecklistItem checklistItem; // Link to specific checklist item

    // File information
    @Column(name = "original_filename", nullable = false, length = 255)
    private String originalFilename;

    @Column(name = "stored_filename", nullable = false, length = 255)
    private String storedFilename;

    @Column(name = "file_path", nullable = false, length = 500)
    private String filePath;

    @Column(name = "file_size", nullable = false)
    private Long fileSize;

    @Column(name = "content_type", nullable = false, length = 100)
    private String contentType;

    // File categorization
    @Enumerated(EnumType.STRING)
    @Column(name = "file_category", nullable = false)
    private FileCategory category;

    @Enumerated(EnumType.STRING)
    @Column(name = "inspection_category")
    private InspectionCategory inspectionCategory;

    // File metadata
    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "tags")
    private String tags; // Comma-separated tags

    @Column(name = "file_hash", length = 128)
    private String fileHash; // For duplicate detection

    // Processing status
    @Column(name = "is_processed")
    private Boolean isProcessed = false;

    @Column(name = "is_virus_scanned")
    private Boolean isVirusScanned = false;

    @Column(name = "is_valid")
    private Boolean isValid = true;

    @Column(name = "thumbnail_path", length = 500)
    private String thumbnailPath; // For images/videos

    // Timestamps
    @Column(name = "uploaded_at", nullable = false)
    private LocalDateTime uploadedAt = LocalDateTime.now();

    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    // ==================== CONSTRUCTORS ====================

    public InspectionFile(String originalFilename, String storedFilename, String filePath, 
                         Long fileSize, String contentType) {
        this.originalFilename = originalFilename;
        this.storedFilename = storedFilename;
        this.filePath = filePath;
        this.fileSize = fileSize;
        this.contentType = contentType;
        this.category = determineCategory(contentType);
    }

    // ==================== ENUMS ====================

    public enum FileCategory {
        IMAGE,
        VIDEO,
        AUDIO,
        DOCUMENT,
        OTHER
    }

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
        TEST_DRIVE,
        GENERAL
    }

    // ==================== BUSINESS METHODS ====================

    private FileCategory determineCategory(String contentType) {
        if (contentType == null) return FileCategory.OTHER;
        
        if (contentType.startsWith("image/")) return FileCategory.IMAGE;
        if (contentType.startsWith("video/")) return FileCategory.VIDEO;
        if (contentType.startsWith("audio/")) return FileCategory.AUDIO;
        if (contentType.contains("pdf") || contentType.contains("document") || 
            contentType.contains("word") || contentType.contains("text")) {
            return FileCategory.DOCUMENT;
        }
        return FileCategory.OTHER;
    }

    public void markAsScanned(boolean isClean) {
        this.isVirusScanned = true;
        this.isValid = isClean;
    }

    public boolean isImage() {
        return FileCategory.IMAGE.equals(this.category);
    }

    public boolean isVideo() {
        return FileCategory.VIDEO.equals(this.category);
    }

    public boolean isDocument() {
        return FileCategory.DOCUMENT.equals(this.category);
    }
}
