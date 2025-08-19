package com.auto.technician.dashboard.service;

import com.auto.technician.dashboard.dto.InspectionFileDto;
import com.auto.technician.dashboard.entity.InspectionFile;
import com.auto.technician.dashboard.entity.InspectionReport;
import com.auto.technician.dashboard.repository.InspectionFileRepository;
import com.auto.technician.dashboard.repository.InspectionReportRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * File Upload Service
 * Handles file uploads for inspection reports
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class FileUploadService {

    private final InspectionFileRepository fileRepository;
    private final InspectionReportRepository reportRepository;

    @Value("${app.file.upload.path:./uploads/inspections/}")
    private String uploadPath;

    @Value("${app.file.max-individual-size:31457280}") // 30MB
    private long maxFileSize;

    @Value("${app.file.max-files-per-report:50}")
    private int maxFilesPerReport;

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
        "image/jpeg", "image/png", "image/gif", "image/webp",
        "video/mp4", "video/avi", "video/mov", "video/wmv",
        "audio/mp3", "audio/wav", "audio/m4a",
        "application/pdf", "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain"
    );

    // ==================== ADMIN METHODS ====================

    /**
     * Get total file count for admin
     */
    public long getTotalFileCount() {
        try {
            return fileRepository.count();
        } catch (Exception e) {
            log.error("Error getting total file count: {}", e.getMessage(), e);
            return 0;
        }
    }

    /**
     * Get all files with pagination and filtering for admin
     */
    public Map<String, Object> getAllFilesForAdmin(Map<String, Object> filters, int page, int size) {
        try {
            List<InspectionFile> files = fileRepository.findAll();
            long totalCount = files.size();
            
            // Apply filters
            if (filters.containsKey("reportId")) {
                Long reportId = Long.valueOf((String) filters.get("reportId"));
                files = files.stream()
                    .filter(f -> f.getInspectionReport().getId().equals(reportId))
                    .collect(Collectors.toList());
            }
            
            if (filters.containsKey("category")) {
                String category = (String) filters.get("category");
                files = files.stream()
                    .filter(f -> category.equals(f.getCategory()))
                    .collect(Collectors.toList());
            }
            
            totalCount = files.size();
            
            // Apply pagination
            int start = page * size;
            int end = Math.min(start + size, files.size());
            List<InspectionFile> paginatedFiles = files.subList(start, end);
            
            Map<String, Object> result = new HashMap<>();
            result.put("files", paginatedFiles.stream()
                .map(InspectionFileDto::new)
                .collect(Collectors.toList()));
            result.put("totalCount", totalCount);
            result.put("page", page);
            result.put("size", size);
            result.put("totalPages", (int) Math.ceil((double) totalCount / size));
            
            return result;
            
        } catch (Exception e) {
            log.error("Error getting files for admin: {}", e.getMessage(), e);
            return new HashMap<>();
        }
    }

    /**
     * Delete file by admin
     */
    public boolean deleteFileByAdmin(Long fileId, String reason, String adminEmail) {
        try {
            InspectionFile file = fileRepository.findById(fileId).orElse(null);
            if (file == null) {
                log.warn("File {} not found for admin deletion", fileId);
                return false;
            }
            
            // Delete the physical file
            Path filePath = Paths.get(uploadPath, file.getStoredFilename());
            if (Files.exists(filePath)) {
                Files.delete(filePath);
            }
            
            // Delete from database
            fileRepository.delete(file);
            
            log.info("Admin {} deleted file {} with reason: {}", adminEmail, fileId, reason);
            return true;
            
        } catch (Exception e) {
            log.error("Error deleting file {} by admin {}: {}", fileId, adminEmail, e.getMessage(), e);
            return false;
        }
    }

    // ==================== FILE UPLOAD ====================

    /**
     * Upload multiple files for an inspection report
     */
    public List<InspectionFileDto> uploadMultipleFiles(Long reportId, List<MultipartFile> files, String category) {
        List<InspectionFileDto> uploadedFiles = new ArrayList<>();
        
        try {
            // Validate report exists
            Optional<InspectionReport> reportOpt = reportRepository.findById(reportId);
            if (reportOpt.isEmpty()) {
                log.error("Inspection report not found: {}", reportId);
                return uploadedFiles;
            }

            InspectionReport report = reportOpt.get();

            // Check current file count
            long currentFileCount = fileRepository.countByInspectionReportId(reportId);
            if (currentFileCount + files.size() > maxFilesPerReport) {
                log.warn("File upload would exceed max files per report limit: {}", maxFilesPerReport);
                return uploadedFiles;
            }

            // Process each file
            for (MultipartFile file : files) {
                try {
                    InspectionFileDto uploadedFile = uploadSingleFile(report, file, category);
                    if (uploadedFile != null) {
                        uploadedFiles.add(uploadedFile);
                    }
                } catch (Exception e) {
                    log.error("Error uploading file {}: {}", file.getOriginalFilename(), e.getMessage(), e);
                }
            }

            // Update report file counts
            updateReportFileCounts(report);

            log.info("Uploaded {} files for inspection report: {}", uploadedFiles.size(), reportId);

        } catch (Exception e) {
            log.error("Error uploading files for report {}: {}", reportId, e.getMessage(), e);
        }

        return uploadedFiles;
    }

    /**
     * Upload a single file
     */
    private InspectionFileDto uploadSingleFile(InspectionReport report, MultipartFile file, String category) 
            throws IOException, NoSuchAlgorithmException {
        
        // Validate file
        if (file.isEmpty()) {
            log.warn("File is empty: {}", file.getOriginalFilename());
            return null;
        }

        if (file.getSize() > maxFileSize) {
            log.warn("File size exceeds limit: {} > {}", file.getSize(), maxFileSize);
            return null;
        }

        if (!ALLOWED_CONTENT_TYPES.contains(file.getContentType())) {
            log.warn("File type not allowed: {}", file.getContentType());
            return null;
        }

        // Generate unique filename
        String originalFilename = file.getOriginalFilename();
        String fileExtension = getFileExtension(originalFilename);
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String uniqueId = UUID.randomUUID().toString().substring(0, 8);
        String storedFilename = String.format("report_%d_%s_%s.%s", 
            report.getId(), timestamp, uniqueId, fileExtension);

        // Create upload directory if it doesn't exist
        Path uploadDir = Paths.get(uploadPath);
        if (!Files.exists(uploadDir)) {
            Files.createDirectories(uploadDir);
        }

        // Save file to disk
        Path filePath = uploadDir.resolve(storedFilename);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        // Calculate file hash
        String fileHash = calculateFileHash(file.getBytes());

        // Create file entity
        InspectionFile fileEntity = new InspectionFile(
            originalFilename,
            storedFilename,
            filePath.toString(),
            file.getSize(),
            file.getContentType()
        );
        
        fileEntity.setInspectionReport(report);
        fileEntity.setFileHash(fileHash);
        fileEntity.setIsVirusScanned(false); // Would be scanned by external service
        fileEntity.setIsValid(true);

        if (category != null) {
            try {
                fileEntity.setCategory(InspectionFile.FileCategory.valueOf(category.toUpperCase()));
            } catch (IllegalArgumentException e) {
                log.warn("Invalid file category: {}, using default", category);
            }
        }

        // Save to database
        InspectionFile savedFile = fileRepository.save(fileEntity);
        
        log.info("File uploaded successfully: {} -> {}", originalFilename, storedFilename);
        
        return new InspectionFileDto(savedFile);
    }

    // ==================== FILE RETRIEVAL ====================

    /**
     * Get all files for an inspection report
     */
    @Transactional(readOnly = true)
    public List<InspectionFileDto> getFilesForReport(Long reportId) {
        try {
            List<InspectionFile> files = fileRepository
                .findByInspectionReportIdOrderByUploadedAtDesc(reportId);
            
            return files.stream()
                .map(InspectionFileDto::new)
                .collect(Collectors.toList());

        } catch (Exception e) {
            log.error("Error getting files for report {}: {}", reportId, e.getMessage(), e);
            return new ArrayList<>();
        }
    }

    /**
     * Get files by category for a report
     */
    @Transactional(readOnly = true)
    public List<InspectionFileDto> getFilesByCategory(Long reportId, String category) {
        try {
            InspectionFile.FileCategory fileCategory = InspectionFile.FileCategory.valueOf(category.toUpperCase());
            List<InspectionFile> files = fileRepository
                .findByInspectionReportIdAndCategoryOrderByUploadedAtDesc(reportId, fileCategory);
            
            return files.stream()
                .map(InspectionFileDto::new)
                .collect(Collectors.toList());

        } catch (Exception e) {
            log.error("Error getting files by category for report {}: {}", reportId, e.getMessage(), e);
            return new ArrayList<>();
        }
    }

    /**
     * Get file by ID
     */
    @Transactional(readOnly = true)
    public InspectionFileDto getFile(Long fileId) {
        try {
            Optional<InspectionFile> fileOpt = fileRepository.findById(fileId);
            if (fileOpt.isPresent()) {
                return new InspectionFileDto(fileOpt.get());
            }
        } catch (Exception e) {
            log.error("Error getting file {}: {}", fileId, e.getMessage(), e);
        }
        return null;
    }

    // ==================== FILE MANAGEMENT ====================

    /**
     * Delete file
     */
    public boolean deleteFile(Long fileId) {
        try {
            Optional<InspectionFile> fileOpt = fileRepository.findById(fileId);
            if (fileOpt.isPresent()) {
                InspectionFile file = fileOpt.get();
                
                // Delete physical file
                try {
                    Files.deleteIfExists(Paths.get(file.getFilePath()));
                } catch (IOException e) {
                    log.warn("Could not delete physical file: {}", file.getFilePath());
                }
                
                // Delete from database
                fileRepository.delete(file);
                
                // Update report file counts
                updateReportFileCounts(file.getInspectionReport());
                
                log.info("File deleted: {}", file.getStoredFilename());
                return true;
            }
        } catch (Exception e) {
            log.error("Error deleting file {}: {}", fileId, e.getMessage(), e);
        }
        return false;
    }

    // ==================== HELPER METHODS ====================

    private void updateReportFileCounts(InspectionReport report) {
        try {
            long fileCount = fileRepository.countByInspectionReportId(report.getId());
            Long totalSize = fileRepository.getTotalFileSizeByInspectionReportId(report.getId());
            
            report.setTotalFilesCount((int) fileCount);
            report.setTotalFilesSize(totalSize != null ? totalSize : 0L);
            
            reportRepository.save(report);
        } catch (Exception e) {
            log.error("Error updating file counts for report {}: {}", report.getId(), e.getMessage(), e);
        }
    }

    private String getFileExtension(String filename) {
        if (filename == null || filename.isEmpty()) {
            return "";
        }
        int lastDot = filename.lastIndexOf('.');
        return lastDot > 0 ? filename.substring(lastDot + 1).toLowerCase() : "";
    }

    private String calculateFileHash(byte[] fileBytes) throws NoSuchAlgorithmException {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] hashBytes = digest.digest(fileBytes);
        
        StringBuilder hexString = new StringBuilder();
        for (byte b : hashBytes) {
            String hex = Integer.toHexString(0xff & b);
            if (hex.length() == 1) {
                hexString.append('0');
            }
            hexString.append(hex);
        }
        return hexString.toString();
    }

    /**
     * Check if file type is allowed
     */
    public boolean isFileTypeAllowed(String contentType) {
        return ALLOWED_CONTENT_TYPES.contains(contentType);
    }

    /**
     * Check if file size is within limits
     */
    public boolean isFileSizeValid(long fileSize) {
        return fileSize > 0 && fileSize <= maxFileSize;
    }
}
