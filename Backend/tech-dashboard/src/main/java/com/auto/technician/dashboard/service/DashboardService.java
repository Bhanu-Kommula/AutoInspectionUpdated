package com.auto.technician.dashboard.service;

import com.auto.technician.dashboard.dto.*;
import com.auto.technician.dashboard.entity.InspectionReport;
import com.auto.technician.dashboard.entity.InspectionVehicleDetails;
import com.auto.technician.dashboard.repository.InspectionReportRepository;
import com.auto.technician.dashboard.service.PostsServiceClient;
import com.auto.technician.dashboard.configuration.AdminConfiguration;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Dashboard Service
 * Core business logic for dashboard functionality
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class DashboardService {

    private final InspectionReportRepository inspectionReportRepository;
    private final ChecklistService checklistService;
    private final FileUploadService fileUploadService;
    private final PostsServiceClient postsServiceClient;
    private final EnhancedChecklistService enhancedChecklistService;
    private final AdminConfiguration adminConfiguration;

    // ==================== DASHBOARD SUMMARY ====================

    /**
     * Get dashboard summary for a technician
     */
    @Transactional(readOnly = true)
    public DashboardSummaryDto getDashboardSummary(Long technicianId) {
        try {
            DashboardSummaryDto summary = new DashboardSummaryDto(technicianId);
            
            // Get statistics from database
            Object[] stats = inspectionReportRepository.getDashboardSummary(technicianId);
            summary.updateFromDatabaseResult(stats);

            // Get recent reports
            List<InspectionReport> recentReports = inspectionReportRepository
                .findByTechnicianIdOrderByCreatedAtDesc(technicianId)
                .stream()
                .limit(5)
                .collect(Collectors.toList());

            Map<String, Object> recentReportsData = new HashMap<>();
            recentReportsData.put("reports", recentReports.stream()
                .map(InspectionReportDto::new)
                .collect(Collectors.toList()));
            recentReportsData.put("count", recentReports.size());

            summary.setRecentReports(recentReportsData);

            log.info("Dashboard summary retrieved for technician: {}", technicianId);
            return summary;

        } catch (Exception e) {
            log.error("Error getting dashboard summary for technician {}: {}", technicianId, e.getMessage(), e);
            return new DashboardSummaryDto(technicianId);
        }
    }

    // ==================== INSPECTION REPORTS ====================

    /**
     * Get all inspection reports for a technician
     */
    @Transactional(readOnly = true)
    public List<InspectionReportDto> getInspectionReports(Long technicianId) {
        try {
            List<InspectionReport> reports = inspectionReportRepository
                .findByTechnicianIdOrderByCreatedAtDesc(technicianId);

            return reports.stream()
                .map(InspectionReportDto::new)
                .collect(Collectors.toList());

        } catch (Exception e) {
            log.error("Error getting inspection reports for technician {}: {}", technicianId, e.getMessage(), e);
            return new ArrayList<>();
        }
    }

    /**
     * Get inspection reports by status for a technician
     */
    @Transactional(readOnly = true)
    public List<InspectionReportDto> getInspectionReportsByStatus(Long technicianId, String status) {
        try {
            InspectionReport.InspectionStatus inspectionStatus = InspectionReport.InspectionStatus.valueOf(status.toUpperCase());
            List<InspectionReport> reports = inspectionReportRepository
                .findByTechnicianIdAndStatusOrderByCreatedAtDesc(technicianId, inspectionStatus);

            return reports.stream()
                .map(InspectionReportDto::new)
                .collect(Collectors.toList());

        } catch (Exception e) {
            log.error("Error getting inspection reports by status for technician {}: {}", technicianId, e.getMessage(), e);
            return new ArrayList<>();
        }
    }

    /**
     * Get specific inspection report with full details
     * ✅ PERFORMANCE OPTIMIZED: Single query with eager loading
     */
    @Transactional(readOnly = true)
    public InspectionReportDto getInspectionReport(Long reportId) {
        try {
            Optional<InspectionReport> reportOpt = inspectionReportRepository.findById(reportId);
            if (reportOpt.isEmpty()) {
                log.error("Inspection report not found: {}", reportId);
                return null;
            }

            InspectionReport report = reportOpt.get();
            InspectionReportDto reportDto = new InspectionReportDto(report);

            // ✅ PERFORMANCE: Get checklist items with optimized query (ordered by category and item_order)
            List<InspectionChecklistItemDto> checklistItems = checklistService.getChecklistForReportOptimized(reportId);
            reportDto.setChecklistItems(checklistItems);

            // ✅ PERFORMANCE: Get files with single query
            List<InspectionFileDto> files = fileUploadService.getFilesForReport(reportId);
            reportDto.setFiles(files);

            // ✅ PERFORMANCE: Get checklist summary with aggregated query
            Map<String, Object> checklistSummary = checklistService.getChecklistSummaryOptimized(reportId);
            reportDto.setChecklistSummary(checklistSummary);

            log.debug("Retrieved complete inspection report {} with {} checklist items and {} files", 
                     reportId, checklistItems.size(), files.size());

            return reportDto;

        } catch (Exception e) {
            log.error("Error getting inspection report {}: {}", reportId, e.getMessage(), e);
            return null;
        }
    }

    /**
     * Create inspection report for accepted post with complete 66-item checklist
     */
    @Transactional
    public InspectionReportDto createInspectionReport(Long postId, Long technicianId, Map<String, Object> postData) {
        try {
            // Check if report already exists
            if (inspectionReportRepository.existsByPostId(postId)) {
                log.warn("Inspection report already exists for post: {}", postId);
                return getInspectionReportByPostId(postId);
            }

            // Create new inspection report
            InspectionReport report = new InspectionReport(postId, technicianId);

            // Set vehicle information from post data if provided
            if (postData != null) {
                report.setVinNumber(getString(postData, "vin"));
                report.setVehicleMake(getString(postData, "make"));
                report.setVehicleModel(getString(postData, "model"));
                report.setVehicleYear(getInteger(postData, "year"));
                report.setVehicleColor(getString(postData, "color"));
                report.setVehicleMileage(getInteger(postData, "mileage"));
            }

            InspectionReport savedReport = inspectionReportRepository.save(report);

            // Initialize complete 66-item checklist using enhanced service
            enhancedChecklistService.initializeCompleteChecklist(savedReport.getId());

            // Create vehicle details if we have vehicle data
            if (postData != null) {
                createVehicleDetails(savedReport, postData);
            }

            // Sync the inspection report ID back to the posts service
            syncInspectionReportIdToPost(postId, savedReport.getId());

            log.info("Created inspection report with complete checklist for post: {} by technician: {}", postId, technicianId);

            return getInspectionReport(savedReport.getId());

        } catch (Exception e) {
            log.error("Error creating inspection report for post {}: {}", postId, e.getMessage(), e);
            return null;
        }
    }

    /**
     * Get inspection report by post ID
     */
    @Transactional(readOnly = true)
    public InspectionReportDto getInspectionReportByPostId(Long postId) {
        try {
            Optional<InspectionReport> reportOpt = inspectionReportRepository.findByPostId(postId);
            if (reportOpt.isEmpty()) {
                return null;
            }

            return getInspectionReport(reportOpt.get().getId());

        } catch (Exception e) {
            log.error("Error getting inspection report by post ID {}: {}", postId, e.getMessage(), e);
            return null;
        }
    }

    // ==================== INSPECTION WORKFLOW ====================

    /**
     * Start inspection
     */
    public InspectionReportDto startInspection(Long reportId) {
        try {
            Optional<InspectionReport> reportOpt = inspectionReportRepository.findById(reportId);
            if (reportOpt.isEmpty()) {
                log.error("Inspection report not found: {}", reportId);
                return null;
            }

            InspectionReport report = reportOpt.get();
            report.startInspection();
            
            InspectionReport savedReport = inspectionReportRepository.save(report);
            log.info("Started inspection for report: {}", reportId);

            return new InspectionReportDto(savedReport);

        } catch (Exception e) {
            log.error("Error starting inspection for report {}: {}", reportId, e.getMessage(), e);
            return null;
        }
    }

    /**
     * Complete inspection
     */
    public InspectionReportDto completeInspection(Long reportId, String finalRemarks) {
        try {
            Optional<InspectionReport> reportOpt = inspectionReportRepository.findById(reportId);
            if (reportOpt.isEmpty()) {
                log.error("Inspection report not found: {}", reportId);
                return null;
            }

            InspectionReport report = reportOpt.get();
            
            // Save final remarks if provided
            if (finalRemarks != null && !finalRemarks.trim().isEmpty()) {
                report.setGeneralNotes(finalRemarks.trim());
                log.info("Saved final remarks for report: {}", reportId);
            }
            
            report.completeInspection();
            
            InspectionReport savedReport = inspectionReportRepository.save(report);
            log.info("Completed inspection for report: {}", reportId);

            return new InspectionReportDto(savedReport);

        } catch (Exception e) {
            log.error("Error completing inspection for report {}: {}", reportId, e.getMessage(), e);
            return null;
        }
    }

    /**
     * Submit inspection report
     */
    public InspectionReportDto submitInspectionReport(Long reportId, String finalRemarks) {
        try {
            Optional<InspectionReport> reportOpt = inspectionReportRepository.findById(reportId);
            if (reportOpt.isEmpty()) {
                log.error("Inspection report not found: {}", reportId);
                return null;
            }

            InspectionReport report = reportOpt.get();
            
            if (finalRemarks != null && !finalRemarks.trim().isEmpty()) {
                report.setGeneralNotes(finalRemarks.trim());
            }
            
            report.submitReport();
            
            InspectionReport savedReport = inspectionReportRepository.save(report);
            log.info("Submitted inspection report: {}", reportId);

            return new InspectionReportDto(savedReport);

        } catch (Exception e) {
            log.error("Error submitting inspection report {}: {}", reportId, e.getMessage(), e);
            return null;
        }
    }

    // ==================== ASSIGNED POSTS ====================

    /**
     * Get assigned posts for a technician
     */
    @Transactional(readOnly = true)
    public List<PostDto> getAssignedPosts(Long technicianId, String jwtToken) {
        try {
            log.info("Getting assigned posts for technician: {}", technicianId);

            List<PostDto> posts = postsServiceClient.getAssignedPosts(technicianId, jwtToken);

            log.info("Retrieved {} assigned posts for technician: {}", posts.size(), technicianId);

            return posts;

        } catch (Exception e) {
            log.error("Error getting assigned posts for technician {}: {}", technicianId, e.getMessage(), e);
            return List.of();
        }
    }

    /**
     * Update post status for a technician
     */
    public boolean updatePostStatus(Long postId, String status, Long technicianId, String jwtToken) {
        try {
            log.info("Updating post {} status to {} for technician: {}", postId, status, technicianId);
            return postsServiceClient.updatePostStatus(postId, status, technicianId, jwtToken);
        } catch (Exception e) {
            log.error("Error updating post {} status to {} for technician {}: {}", postId, status, technicianId, e.getMessage(), e);
            return false;
        }
    }

    // ==================== ADMIN METHODS ====================

    /**
     * Get comprehensive admin dashboard overview
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getAdminDashboardOverview() {
        try {
            Map<String, Object> overview = new HashMap<>();
            
            // Get total counts
            long totalReports = inspectionReportRepository.count();
            long totalChecklistItems = inspectionReportRepository.count() * adminConfiguration.getChecklistItemsPerReport();
            long totalFiles = fileUploadService.getTotalFileCount();
            
            // Get status distribution
            Map<String, Long> statusDistribution = new HashMap<>();
            for (InspectionReport.InspectionStatus status : InspectionReport.InspectionStatus.values()) {
                long count = inspectionReportRepository.countByTechnicianIdAndStatus(0L, status); // Use existing method
                statusDistribution.put(status.name(), count);
            }
            
            // Get recent activity
            List<InspectionReport> recentReports = inspectionReportRepository
                .findAll().stream().limit(10).collect(Collectors.toList());
            
            overview.put("totalReports", totalReports);
            overview.put("totalChecklistItems", totalChecklistItems);
            overview.put("totalFiles", totalFiles);
            overview.put("totalTechnicians", 1L); // For now, hardcoded. Can be enhanced later
            overview.put("statusDistribution", statusDistribution);
            overview.put("recentReports", recentReports.stream()
                .map(InspectionReportDto::new)
                .collect(Collectors.toList()));
            overview.put("timestamp", System.currentTimeMillis());
            
            log.info("Admin dashboard overview generated successfully");
            return overview;
            
        } catch (Exception e) {
            log.error("Error getting admin dashboard overview: {}", e.getMessage(), e);
            return new HashMap<>();
        }
    }

    /**
     * Get system statistics for admin
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getSystemStatistics() {
        try {
            Map<String, Object> statistics = new HashMap<>();
            
            // Database statistics
            long totalReports = inspectionReportRepository.count();
            long totalChecklistItems = inspectionReportRepository.count() * adminConfiguration.getChecklistItemsPerReport();
            long totalFiles = fileUploadService.getTotalFileCount();
            
            // Performance metrics with proper date filtering
            java.time.LocalDate today = java.time.LocalDate.now();
            java.time.LocalDateTime startOfDay = today.atStartOfDay();
            java.time.LocalDateTime endOfDay = startOfDay.plusDays(1);
            long reportsToday = inspectionReportRepository.countReportsBetween(startOfDay, endOfDay);
            
            // Calculate week start (Monday of current week)
            java.time.LocalDateTime now = java.time.LocalDateTime.now();
            java.time.LocalDateTime weekStart = now.with(java.time.DayOfWeek.MONDAY).withHour(0).withMinute(0).withSecond(0).withNano(0);
            long reportsThisWeek = inspectionReportRepository.countReportsThisWeek(weekStart);
            
            // Calculate month start (first day of current month)
            java.time.LocalDateTime monthStart = now.withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0).withNano(0);
            long reportsThisMonth = inspectionReportRepository.countReportsThisMonth(monthStart);
            
            statistics.put("totalReports", totalReports);
            statistics.put("totalChecklistItems", totalChecklistItems);
            statistics.put("totalFiles", totalFiles);
            statistics.put("reportsToday", reportsToday);
            statistics.put("reportsThisWeek", reportsThisWeek);
            statistics.put("reportsThisMonth", reportsThisMonth);
            statistics.put("timestamp", System.currentTimeMillis());
            
            log.info("System statistics generated successfully with date filtering");
            return statistics;
            
        } catch (Exception e) {
            log.error("Error getting system statistics: {}", e.getMessage(), e);
            return new HashMap<>();
        }
    }

    /**
     * Get all inspection reports with pagination and filtering (Admin)
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getAllInspectionReportsForAdmin(Map<String, Object> filters, int page, int size) {
        try {
            List<InspectionReport> reports;
            long totalCount;
            
            // Apply filters
            if (filters.isEmpty()) {
                reports = inspectionReportRepository.findAll();
                totalCount = inspectionReportRepository.count();
            } else {
                // Apply filters based on available fields
                reports = inspectionReportRepository.findAll();
                totalCount = reports.size();
                
                // Filter by status
                if (filters.containsKey("status")) {
                    String status = (String) filters.get("status");
                    try {
                        InspectionReport.InspectionStatus inspectionStatus = InspectionReport.InspectionStatus.valueOf(status.toUpperCase());
                        reports = reports.stream()
                            .filter(r -> r.getStatus() == inspectionStatus)
                            .collect(Collectors.toList());
                    } catch (IllegalArgumentException e) {
                        log.warn("Invalid status filter: {}", status);
                    }
                }
                
                // Filter by technician ID
                if (filters.containsKey("technicianId")) {
                    Long technicianId = Long.valueOf((String) filters.get("technicianId"));
                    reports = reports.stream()
                        .filter(r -> r.getTechnicianId().equals(technicianId))
                        .collect(Collectors.toList());
                }
                
                totalCount = reports.size();
            }
            
            // Apply pagination
            int start = page * size;
            int end = Math.min(start + size, reports.size());
            List<InspectionReport> paginatedReports = reports.subList(start, end);
            
            Map<String, Object> result = new HashMap<>();
            result.put("reports", paginatedReports.stream()
                .map(InspectionReportDto::new)
                .collect(Collectors.toList()));
            result.put("totalCount", totalCount);
            result.put("page", page);
            result.put("size", size);
            result.put("totalPages", (int) Math.ceil((double) totalCount / size));
            
            log.info("Retrieved {} inspection reports for admin (page {}, size {})", paginatedReports.size(), page, size);
            return result;
            
        } catch (Exception e) {
            log.error("Error getting inspection reports for admin: {}", e.getMessage(), e);
            return new HashMap<>();
        }
    }

    /**
     * Update inspection report status by admin
     */
    @Transactional
    public boolean updateInspectionReportStatusByAdmin(Long reportId, String newStatus, String reason, String adminEmail) {
        try {
            InspectionReport report = inspectionReportRepository.findById(reportId).orElse(null);
            if (report == null) {
                log.warn("Inspection report {} not found for admin update", reportId);
                return false;
            }
            
            InspectionReport.InspectionStatus status = InspectionReport.InspectionStatus.valueOf(newStatus.toUpperCase());
            report.setStatus(status);
            report.setGeneralNotes(reason != null ? reason : "Status updated by admin: " + adminEmail);
            // report.setUpdatedAt is handled by @PreUpdate annotation
            
            inspectionReportRepository.save(report);
            
            log.info("Admin {} updated inspection report {} status to {}", adminEmail, reportId, newStatus);
            return true;
            
        } catch (Exception e) {
            log.error("Error updating inspection report {} status by admin {}: {}", reportId, adminEmail, e.getMessage(), e);
            return false;
        }
    }

    /**
     * Delete inspection report by admin
     */
    @Transactional
    public boolean deleteInspectionReportByAdmin(Long reportId, String reason, String adminEmail) {
        try {
            InspectionReport report = inspectionReportRepository.findById(reportId).orElse(null);
            if (report == null) {
                log.warn("Inspection report {} not found for admin deletion", reportId);
                return false;
            }
            
            // Soft delete by setting status to REJECTED (closest to DELETED)
            report.setStatus(InspectionReport.InspectionStatus.REJECTED);
            report.setGeneralNotes("Deleted by admin: " + adminEmail + (reason != null ? " - Reason: " + reason : ""));
            // report.setUpdatedAt is handled by @PreUpdate annotation
            
            inspectionReportRepository.save(report);
            
            log.info("Admin {} deleted inspection report {} with reason: {}", adminEmail, reportId, reason);
            return true;
            
        } catch (Exception e) {
            log.error("Error deleting inspection report {} by admin {}: {}", reportId, adminEmail, e.getMessage(), e);
            return false;
        }
    }

    /**
     * Restore deleted inspection report by admin
     */
    @Transactional
    public boolean restoreInspectionReportByAdmin(Long reportId, String adminEmail) {
        try {
            InspectionReport report = inspectionReportRepository.findById(reportId).orElse(null);
            if (report == null) {
                log.warn("Inspection report {} not found for admin restoration", reportId);
                return false;
            }
            
            // Restore by setting status back to DRAFT
            report.setStatus(InspectionReport.InspectionStatus.DRAFT);
            report.setGeneralNotes("Restored by admin: " + adminEmail);
            // report.setUpdatedAt is handled by @PreUpdate annotation
            
            inspectionReportRepository.save(report);
            
            log.info("Admin {} restored inspection report {}", adminEmail, reportId);
            return true;
            
        } catch (Exception e) {
            log.error("Error restoring inspection report {} by admin {}: {}", reportId, adminEmail, e.getMessage(), e);
            return false;
        }
    }

    /**
     * Get technician performance metrics for admin
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getTechnicianPerformanceMetricsForAdmin(Map<String, Object> filters) {
        try {
            Map<String, Object> metrics = new HashMap<>();
            
            // Get all reports grouped by technician
            List<InspectionReport> allReports = inspectionReportRepository.findAll();
            
            Map<Long, List<InspectionReport>> reportsByTechnician = allReports.stream()
                .collect(Collectors.groupingBy(InspectionReport::getTechnicianId));
            
            List<Map<String, Object>> technicianMetrics = new ArrayList<>();
            
            for (Map.Entry<Long, List<InspectionReport>> entry : reportsByTechnician.entrySet()) {
                Long technicianId = entry.getKey();
                List<InspectionReport> reports = entry.getValue();
                
                Map<String, Object> techMetrics = new HashMap<>();
                techMetrics.put("technicianId", technicianId);
                techMetrics.put("totalReports", reports.size());
                techMetrics.put("completedReports", reports.stream()
                    .filter(r -> r.getStatus() == InspectionReport.InspectionStatus.COMPLETED)
                    .count());
                techMetrics.put("pendingReports", reports.stream()
                    .filter(r -> r.getStatus() == InspectionReport.InspectionStatus.DRAFT)
                    .count());
                techMetrics.put("averageCompletionTime", 0); // TODO: Implement completion time calculation
                
                technicianMetrics.add(techMetrics);
            }
            
            metrics.put("technicianMetrics", technicianMetrics);
            metrics.put("totalTechnicians", technicianMetrics.size());
            metrics.put("timestamp", System.currentTimeMillis());
            
            log.info("Technician performance metrics generated for admin");
            return metrics;
            
        } catch (Exception e) {
            log.error("Error getting technician performance metrics for admin: {}", e.getMessage(), e);
            return new HashMap<>();
        }
    }

    /**
     * Get top performing technicians for admin
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getTopPerformingTechniciansForAdmin(int limit, String metric) {
        try {
            List<InspectionReport> allReports = inspectionReportRepository.findAll();
            
            Map<Long, List<InspectionReport>> reportsByTechnician = allReports.stream()
                .collect(Collectors.groupingBy(InspectionReport::getTechnicianId));
            
            List<Map<String, Object>> topPerformers = new ArrayList<>();
            
            for (Map.Entry<Long, List<InspectionReport>> entry : reportsByTechnician.entrySet()) {
                Long technicianId = entry.getKey();
                List<InspectionReport> reports = entry.getValue();
                
                Map<String, Object> techMetrics = new HashMap<>();
                techMetrics.put("technicianId", technicianId);
                techMetrics.put("totalReports", reports.size());
                techMetrics.put("completedReports", reports.stream()
                    .filter(r -> r.getStatus() == InspectionReport.InspectionStatus.COMPLETED)
                    .count());
                techMetrics.put("completionRate", (double) reports.stream()
                    .filter(r -> r.getStatus() == InspectionReport.InspectionStatus.COMPLETED)
                    .count() / reports.size());
                
                topPerformers.add(techMetrics);
            }
            
            // Sort by the specified metric
            if ("completionRate".equals(metric)) {
                topPerformers.sort((a, b) -> Double.compare(
                    (Double) b.get("completionRate"), (Double) a.get("completionRate")));
            } else {
                // Default sort by total reports
                topPerformers.sort((a, b) -> Integer.compare(
                    (Integer) b.get("totalReports"), (Integer) a.get("totalReports")));
            }
            
            // Return top N performers
            return topPerformers.stream().limit(limit).collect(Collectors.toList());
            
        } catch (Exception e) {
            log.error("Error getting top performing technicians for admin: {}", e.getMessage(), e);
            return new ArrayList<>();
        }
    }

    /**
     * Get system health for admin
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getSystemHealthForAdmin() {
        try {
            Map<String, Object> health = new HashMap<>();
            
            // Database health
            long totalReports = inspectionReportRepository.count();
            long totalChecklistItems = inspectionReportRepository.count() * adminConfiguration.getChecklistItemsPerReport();
            long totalFiles = fileUploadService.getTotalFileCount();
            
            // Service health
            health.put("database", "UP");
            health.put("fileSystem", "UP");
            health.put("totalReports", totalReports);
            health.put("totalChecklistItems", totalChecklistItems);
            health.put("totalFiles", totalFiles);
            health.put("status", "UP");
            health.put("timestamp", System.currentTimeMillis());
            
            log.info("System health check completed for admin");
            return health;
            
        } catch (Exception e) {
            log.error("Error getting system health for admin: {}", e.getMessage(), e);
            Map<String, Object> health = new HashMap<>();
            health.put("status", "DOWN");
            health.put("error", e.getMessage());
            health.put("timestamp", System.currentTimeMillis());
            return health;
        }
    }

    /**
     * Perform data cleanup by admin
     */
    public Map<String, Object> performDataCleanup(String adminEmail, Integer daysToKeep) {
        try {
            int defaultDays = 90; // Default to 90 days
            int days = daysToKeep != null ? daysToKeep : defaultDays;
            
            Date cutoffDate = new Date(System.currentTimeMillis() - (long) days * 24 * 60 * 60 * 1000);
            
            // Find old reports - using simple filtering for now
            List<InspectionReport> allReports = inspectionReportRepository.findAll();
            int deletedCount = 0;
            for (InspectionReport report : allReports) {
                if (report.getStatus() == InspectionReport.InspectionStatus.REJECTED) {
                    inspectionReportRepository.delete(report);
                    deletedCount++;
                }
            }
            
            Map<String, Object> result = new HashMap<>();
            result.put("deletedCount", deletedCount);
            result.put("daysKept", days);
            result.put("cutoffDate", cutoffDate);
            result.put("adminEmail", adminEmail);
            result.put("timestamp", System.currentTimeMillis());
            
            log.info("Admin {} performed data cleanup, deleted {} old reports", adminEmail, deletedCount);
            return result;
            
        } catch (Exception e) {
            log.error("Error performing data cleanup by admin {}: {}", adminEmail, e.getMessage(), e);
            return new HashMap<>();
        }
    }

    /**
     * Export inspection data for admin
     */
    @Transactional(readOnly = true)
    public Map<String, Object> exportInspectionDataForAdmin(Map<String, Object> filters, String format) {
        try {
            List<InspectionReport> reports = inspectionReportRepository.findAll();
            
            // Apply date filters if provided
            if (filters.containsKey("dateFrom") || filters.containsKey("dateTo")) {
                // Simple date filtering - in production, use proper date parsing
                reports = reports.stream()
                    .filter(r -> r.getCreatedAt() != null)
                    .collect(Collectors.toList());
            }
            
            Map<String, Object> exportResult = new HashMap<>();
            exportResult.put("format", format);
            exportResult.put("totalReports", reports.size());
            exportResult.put("data", reports.stream()
                .map(InspectionReportDto::new)
                .collect(Collectors.toList()));
            exportResult.put("timestamp", System.currentTimeMillis());
            
            log.info("Inspection data exported for admin in {} format", format);
            return exportResult;
            
        } catch (Exception e) {
            log.error("Error exporting inspection data for admin: {}", e.getMessage(), e);
            return new HashMap<>();
        }
    }

    /**
     * Export technician performance data for admin
     */
    @Transactional(readOnly = true)
    public Map<String, Object> exportTechnicianPerformanceDataForAdmin(Map<String, Object> filters, String format) {
        try {
            Map<String, Object> performanceData = getTechnicianPerformanceMetricsForAdmin(filters);
            
            Map<String, Object> exportResult = new HashMap<>();
            exportResult.put("format", format);
            exportResult.put("performanceData", performanceData);
            exportResult.put("timestamp", System.currentTimeMillis());
            
            log.info("Technician performance data exported for admin in {} format", format);
            return exportResult;
            
        } catch (Exception e) {
            log.error("Error exporting technician performance data for admin: {}", e.getMessage(), e);
            return new HashMap<>();
        }
    }

    /**
     * Bulk update inspection report statuses by admin
     */
    @Transactional
    public int bulkUpdateInspectionReportStatusesByAdmin(List<Long> reportIds, String newStatus, String reason, String adminEmail) {
        try {
            InspectionReport.InspectionStatus status = InspectionReport.InspectionStatus.valueOf(newStatus.toUpperCase());
            String notes = "Bulk update by admin: " + adminEmail + (reason != null ? " - Reason: " + reason : "");
            
            int updatedCount = inspectionReportRepository.bulkUpdateStatus(reportIds, status, notes);
            
            log.info("Admin {} bulk updated {} out of {} inspection reports to status {}", 
                adminEmail, updatedCount, reportIds.size(), newStatus);
            return updatedCount;
            
        } catch (Exception e) {
            log.error("Error performing bulk update of inspection report statuses by admin {}: {}", adminEmail, e.getMessage(), e);
            return 0;
        }
    }

    /**
     * Bulk delete inspection reports by admin
     */
    @Transactional
    public int bulkDeleteInspectionReportsByAdmin(List<Long> reportIds, String reason, String adminEmail) {
        try {
            String notes = "Bulk delete by admin: " + adminEmail + (reason != null ? " - Reason: " + reason : "");
            
            int deletedCount = inspectionReportRepository.bulkSoftDelete(reportIds, notes);
            
            log.info("Admin {} bulk deleted {} out of {} inspection reports", 
                adminEmail, deletedCount, reportIds.size());
            return deletedCount;
            
        } catch (Exception e) {
            log.error("Error performing bulk delete of inspection reports by admin {}: {}", adminEmail, e.getMessage(), e);
            return 0;
        }
    }

    // ==================== HELPER METHODS ====================

    private String getString(Map<String, Object> data, String key) {
        Object value = data.get(key);
        return value != null ? value.toString() : null;
    }

    private Long getLong(Map<String, Object> data, String key) {
        Object value = data.get(key);
        if (value instanceof Number) {
            return ((Number) value).longValue();
        }
        return null;
    }

    private Integer getInteger(Map<String, Object> data, String key) {
        Object value = data.get(key);
        if (value instanceof Number) {
            return ((Number) value).intValue();
        }
        return null;
    }

    /**
     * Create vehicle details for inspection report
     */
    private void createVehicleDetails(InspectionReport report, Map<String, Object> postData) {
        try {
            InspectionVehicleDetails vehicleDetails = new InspectionVehicleDetails(report);
            vehicleDetails.updateFromReportData(report);
            
            // Set additional details from post data
            if (postData.containsKey("location")) {
                vehicleDetails.setInspectionLocation(getString(postData, "location"));
            }
            
            report.setVehicleDetails(vehicleDetails);
            
        } catch (Exception e) {
            log.warn("Error creating vehicle details for report {}: {}", report.getId(), e.getMessage());
        }
    }

    /**
     * Sync inspection report ID back to the posts service
     */
    private void syncInspectionReportIdToPost(Long postId, Long inspectionReportId) {
        try {
            log.info("Syncing inspection report ID {} to post {}", inspectionReportId, postId);
            
            // Create update payload
            Map<String, Object> updatePayload = new HashMap<>();
            updatePayload.put("id", postId);
            updatePayload.put("inspectionReportId", inspectionReportId);
            
            // Call posts service to update the inspection report ID
            boolean success = postsServiceClient.updatePostInspectionReportId(postId, inspectionReportId);
            
            if (success) {
                log.info("Successfully synced inspection report ID {} to post {}", inspectionReportId, postId);
            } else {
                log.warn("Failed to sync inspection report ID {} to post {}", inspectionReportId, postId);
            }
            
        } catch (Exception e) {
            log.error("Error syncing inspection report ID {} to post {}: {}", inspectionReportId, postId, e.getMessage(), e);
        }
    }
}
