package com.auto.technician.dashboard.controller;

import com.auto.technician.dashboard.dto.*;
import com.auto.technician.dashboard.service.DashboardService;
import com.auto.technician.dashboard.service.ChecklistService;
import com.auto.technician.dashboard.service.FileUploadService;
import com.auto.technician.dashboard.configuration.AdminConfiguration;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.CrossOrigin;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Admin Dashboard Controller
 * REST endpoints for admin functionality in tech-dashboard service
 */
@RestController
@RequestMapping("/admin/dashboard")
@RequiredArgsConstructor
@Slf4j

public class AdminDashboardController {

    private final DashboardService dashboardService;
    private final ChecklistService checklistService;
    private final FileUploadService fileUploadService;
    private final AdminConfiguration adminConfiguration;

    // ==================== ADMIN DASHBOARD OVERVIEW ====================

    /**
     * Get comprehensive admin dashboard overview
     */
    @GetMapping("/overview")
    public ResponseEntity<?> getAdminDashboardOverview() {
        try {
            Map<String, Object> overview = dashboardService.getAdminDashboardOverview();
            return ResponseEntity.ok(createSuccessResponse("Admin dashboard overview retrieved successfully", "overview", overview));
        } catch (Exception e) {
            log.error("Error getting admin dashboard overview: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(createErrorResponse("Failed to retrieve admin dashboard overview", e.getMessage()));
        }
    }

    /**
     * Get system statistics for admin
     */
    @GetMapping("/statistics")
    public ResponseEntity<?> getSystemStatistics() {
        try {
            Map<String, Object> statistics = dashboardService.getSystemStatistics();
            return ResponseEntity.ok(createSuccessResponse("System statistics retrieved successfully", "statistics", statistics));
        } catch (Exception e) {
            log.error("Error getting system statistics: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(createErrorResponse("Failed to retrieve system statistics", e.getMessage()));
        }
    }

    // ==================== INSPECTION REPORTS ADMIN ====================

    /**
     * Get all inspection reports with pagination and filtering (Admin)
     */
    @GetMapping("/reports")
    public ResponseEntity<?> getAllInspectionReports(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String technicianId,
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo) {
        try {
            // Validate pagination parameters
            if (page < 0) {
                return ResponseEntity.badRequest().body(createErrorResponse("Page number must be non-negative", null));
            }
            if (size < 1 || size > adminConfiguration.getMaxPageSize()) {
                return ResponseEntity.badRequest().body(createErrorResponse(
                    "Page size must be between 1 and " + adminConfiguration.getMaxPageSize(), null));
            }
            
            Map<String, Object> filters = new HashMap<>();
            if (status != null) filters.put("status", status);
            if (technicianId != null) filters.put("technicianId", technicianId);
            if (dateFrom != null) filters.put("dateFrom", dateFrom);
            if (dateTo != null) filters.put("dateTo", dateTo);

            Map<String, Object> result = dashboardService.getAllInspectionReportsForAdmin(filters, page, size);
            return ResponseEntity.ok(createSuccessResponse("Inspection reports retrieved successfully", "reports", result));
        } catch (Exception e) {
            log.error("Error getting inspection reports for admin: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(createErrorResponse("Failed to retrieve inspection reports", e.getMessage()));
        }
    }

    /**
     * Get inspection report by ID (Admin)
     */
    @GetMapping("/reports/{reportId}")
    public ResponseEntity<?> getInspectionReportById(@PathVariable Long reportId) {
        try {
            InspectionReportDto report = dashboardService.getInspectionReport(reportId);
            if (report == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(createSuccessResponse("Inspection report retrieved successfully", "report", report));
        } catch (Exception e) {
            log.error("Error getting inspection report {} for admin: {}", reportId, e.getMessage(), e);
            return ResponseEntity.internalServerError().body(createErrorResponse("Failed to retrieve inspection report", e.getMessage()));
        }
    }

    /**
     * Update inspection report status (Admin)
     */
    @PutMapping("/reports/{reportId}/status")
    public ResponseEntity<?> updateInspectionReportStatus(
            @PathVariable Long reportId,
            @RequestBody Map<String, Object> request) {
        try {
            String newStatus = (String) request.get("status");
            String reason = (String) request.get("reason");
            String adminEmail = (String) request.get("adminEmail");

            if (newStatus == null || adminEmail == null) {
                return ResponseEntity.badRequest().body(createErrorResponse("Status and adminEmail are required", null));
            }

            boolean success = dashboardService.updateInspectionReportStatusByAdmin(reportId, newStatus, reason, adminEmail);
            if (success) {
                Map<String, Object> response = createSuccessResponse("Inspection report status updated successfully", null, null);
                response.put("reportId", reportId);
                response.put("newStatus", newStatus);
                response.put("adminEmail", adminEmail);
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.badRequest().body(createErrorResponse("Failed to update inspection report status", null));
            }
        } catch (Exception e) {
            log.error("Error updating inspection report {} status by admin: {}", reportId, e.getMessage(), e);
            return ResponseEntity.internalServerError().body(createErrorResponse("Failed to update inspection report status", e.getMessage()));
        }
    }

    /**
     * Delete inspection report (Admin)
     */
    @DeleteMapping("/reports/{reportId}")
    public ResponseEntity<?> deleteInspectionReport(
            @PathVariable Long reportId,
            @RequestBody Map<String, Object> request) {
        try {
            String reason = (String) request.get("reason");
            String adminEmail = (String) request.get("adminEmail");

            if (adminEmail == null) {
                return ResponseEntity.badRequest().body(createErrorResponse("AdminEmail is required", null));
            }

            boolean success = dashboardService.deleteInspectionReportByAdmin(reportId, reason, adminEmail);
            if (success) {
                Map<String, Object> response = createSuccessResponse("Inspection report deleted successfully", null, null);
                response.put("reportId", reportId);
                response.put("adminEmail", adminEmail);
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.badRequest().body(createErrorResponse("Failed to delete inspection report", null));
            }
        } catch (Exception e) {
            log.error("Error deleting inspection report {} by admin: {}", reportId, e.getMessage(), e);
            return ResponseEntity.internalServerError().body(createErrorResponse("Failed to delete inspection report", e.getMessage()));
        }
    }

    /**
     * Restore deleted inspection report (Admin)
     */
    @PutMapping("/reports/{reportId}/restore")
    public ResponseEntity<?> restoreInspectionReport(
            @PathVariable Long reportId,
            @RequestBody Map<String, Object> request) {
        try {
            String adminEmail = (String) request.get("adminEmail");
            if (adminEmail == null) {
                return ResponseEntity.badRequest().body(createErrorResponse("AdminEmail is required", null));
            }

            boolean success = dashboardService.restoreInspectionReportByAdmin(reportId, adminEmail);
            if (success) {
                Map<String, Object> response = createSuccessResponse("Inspection report restored successfully", null, null);
                response.put("reportId", reportId);
                response.put("adminEmail", adminEmail);
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.badRequest().body(createErrorResponse("Failed to restore inspection report", null));
            }
        } catch (Exception e) {
            log.error("Error restoring inspection report {} by admin: {}", reportId, e.getMessage(), e);
            return ResponseEntity.internalServerError().body(createErrorResponse("Failed to restore inspection report", e.getMessage()));
        }
    }

    // ==================== CHECKLIST ADMIN ====================

    /**
     * Get all checklist items with pagination (Admin)
     */
    @GetMapping("/checklist")
    public ResponseEntity<?> getAllChecklistItems(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(required = false) String reportId,
            @RequestParam(required = false) String conditionRating) {
        try {
            // Validate pagination parameters
            if (page < 0) {
                return ResponseEntity.badRequest().body(createErrorResponse("Page number must be non-negative", null));
            }
            if (size < 1 || size > adminConfiguration.getMaxPageSize()) {
                return ResponseEntity.badRequest().body(createErrorResponse(
                    "Page size must be between 1 and " + adminConfiguration.getMaxPageSize(), null));
            }
            
            Map<String, Object> filters = new HashMap<>();
            if (reportId != null) filters.put("reportId", reportId);
            if (conditionRating != null) filters.put("conditionRating", conditionRating);

            Map<String, Object> result = checklistService.getAllChecklistItemsForAdmin(filters, page, size);
            return ResponseEntity.ok(createSuccessResponse("Checklist items retrieved successfully", "checklist", result));
        } catch (Exception e) {
            log.error("Error getting checklist items for admin: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(createErrorResponse("Failed to retrieve checklist items", e.getMessage()));
        }
    }

    /**
     * Update checklist item by admin
     */
    @PutMapping("/checklist/{itemId}")
    public ResponseEntity<?> updateChecklistItemByAdmin(
            @PathVariable Long itemId,
            @RequestBody Map<String, Object> updates) {
        try {
            updates.put("updatedBy", "admin");
            InspectionChecklistItemDto updatedItem = checklistService.updateChecklistItemByAdmin(itemId, updates);
            
            if (updatedItem == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(createSuccessResponse("Checklist item updated successfully by admin", "item", updatedItem));
        } catch (Exception e) {
            log.error("Error updating checklist item {} by admin: {}", itemId, e.getMessage(), e);
            return ResponseEntity.internalServerError().body(createErrorResponse("Failed to update checklist item", e.getMessage()));
        }
    }

    // ==================== FILE MANAGEMENT ADMIN ====================

    /**
     * Get all files with pagination (Admin)
     */
    @GetMapping("/files")
    public ResponseEntity<?> getAllFiles(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(required = false) String reportId,
            @RequestParam(required = false) String category) {
        try {
            // Validate pagination parameters
            if (page < 0) {
                return ResponseEntity.badRequest().body(createErrorResponse("Page number must be non-negative", null));
            }
            if (size < 1 || size > adminConfiguration.getMaxPageSize()) {
                return ResponseEntity.badRequest().body(createErrorResponse(
                    "Page size must be between 1 and " + adminConfiguration.getMaxPageSize(), null));
            }
            
            Map<String, Object> filters = new HashMap<>();
            if (reportId != null) filters.put("reportId", reportId);
            if (category != null) filters.put("category", category);

            Map<String, Object> result = fileUploadService.getAllFilesForAdmin(filters, page, size);
            return ResponseEntity.ok(createSuccessResponse("Files retrieved successfully", "files", result));
        } catch (Exception e) {
            log.error("Error getting files for admin: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(createErrorResponse("Failed to retrieve files", e.getMessage()));
        }
    }

    /**
     * Delete file by admin
     */
    @DeleteMapping("/files/{fileId}")
    public ResponseEntity<?> deleteFileByAdmin(
            @PathVariable Long fileId,
            @RequestBody Map<String, Object> request) {
        try {
            String reason = (String) request.get("reason");
            String adminEmail = (String) request.get("adminEmail");

            if (adminEmail == null) {
                return ResponseEntity.badRequest().body(createErrorResponse("AdminEmail is required", null));
            }

            boolean deleted = fileUploadService.deleteFileByAdmin(fileId, reason, adminEmail);
            if (deleted) {
                Map<String, Object> response = createSuccessResponse("File deleted successfully by admin", null, null);
                response.put("fileId", fileId);
                response.put("adminEmail", adminEmail);
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            log.error("Error deleting file {} by admin: {}", fileId, e.getMessage(), e);
            return ResponseEntity.internalServerError().body(createErrorResponse("Failed to delete file", e.getMessage()));
        }
    }

    // ==================== TECHNICIAN PERFORMANCE ADMIN ====================

    /**
     * Get technician performance metrics (Admin)
     */
    @GetMapping("/technicians/performance")
    public ResponseEntity<?> getTechnicianPerformanceMetrics(
            @RequestParam(required = false) String technicianId,
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo) {
        try {
            Map<String, Object> filters = new HashMap<>();
            if (technicianId != null) filters.put("technicianId", technicianId);
            if (dateFrom != null) filters.put("dateFrom", dateFrom);
            if (dateTo != null) filters.put("dateTo", dateTo);

            Map<String, Object> metrics = dashboardService.getTechnicianPerformanceMetricsForAdmin(filters);
            return ResponseEntity.ok(createSuccessResponse("Technician performance metrics retrieved successfully", "metrics", metrics));
        } catch (Exception e) {
            log.error("Error getting technician performance metrics for admin: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(createErrorResponse("Failed to retrieve technician performance metrics", e.getMessage()));
        }
    }

    /**
     * Get top performing technicians (Admin)
     */
    @GetMapping("/technicians/top-performers")
    public ResponseEntity<?> getTopPerformingTechnicians(
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(required = false) String metric) {
        try {
            // Validate limit parameter
            if (limit < 1 || limit > adminConfiguration.getMaxTopPerformersLimit()) {
                return ResponseEntity.badRequest().body(createErrorResponse(
                    "Limit must be between 1 and " + adminConfiguration.getMaxTopPerformersLimit(), null));
            }
            
            List<Map<String, Object>> topPerformers = dashboardService.getTopPerformingTechniciansForAdmin(limit, metric);
            return ResponseEntity.ok(createSuccessResponse("Top performing technicians retrieved successfully", "topPerformers", topPerformers));
        } catch (Exception e) {
            log.error("Error getting top performing technicians for admin: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(createErrorResponse("Failed to retrieve top performing technicians", e.getMessage()));
        }
    }

    // ==================== SYSTEM MAINTENANCE ADMIN ====================

    /**
     * Get system health status (Admin)
     */
    @GetMapping("/health")
    public ResponseEntity<?> getSystemHealth() {
        try {
            Map<String, Object> health = dashboardService.getSystemHealthForAdmin();
            return ResponseEntity.ok(createSuccessResponse("System health status retrieved successfully", "health", health));
        } catch (Exception e) {
            log.error("Error getting system health for admin: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(createErrorResponse("Failed to retrieve system health", e.getMessage()));
        }
    }

    /**
     * Cleanup old data (Admin)
     */
    @PostMapping("/maintenance/cleanup")
    public ResponseEntity<?> performDataCleanup(@RequestBody Map<String, Object> request) {
        try {
            String adminEmail = (String) request.get("adminEmail");
            Integer daysToKeep = (Integer) request.get("daysToKeep");
            
            if (adminEmail == null) {
                return ResponseEntity.badRequest().body(createErrorResponse("AdminEmail is required", null));
            }

            // Validate daysToKeep parameter
            if (daysToKeep != null && (daysToKeep < adminConfiguration.getMinDaysToKeep())) {
                return ResponseEntity.badRequest().body(createErrorResponse(
                    "Days to keep must be at least " + adminConfiguration.getMinDaysToKeep(), null));
            }

            Map<String, Object> cleanupResult = dashboardService.performDataCleanup(adminEmail, daysToKeep);
            return ResponseEntity.ok(createSuccessResponse("Data cleanup completed successfully", "cleanupResult", cleanupResult));
        } catch (Exception e) {
            log.error("Error performing data cleanup by admin: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(createErrorResponse("Failed to perform data cleanup", e.getMessage()));
        }
    }

    // ==================== DATA EXPORT ADMIN ====================

    /**
     * Export inspection data (Admin)
     */
    @GetMapping("/export/inspections")
    public ResponseEntity<?> exportInspectionData(
            @RequestParam(required = false) String format,
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo) {
        try {
            Map<String, Object> filters = new HashMap<>();
            if (dateFrom != null) filters.put("dateFrom", dateFrom);
            if (dateTo != null) filters.put("dateTo", dateTo);

            String exportFormat = format != null ? format : "json";
            Map<String, Object> exportResult = dashboardService.exportInspectionDataForAdmin(filters, exportFormat);
            return ResponseEntity.ok(createSuccessResponse("Inspection data exported successfully", "export", exportResult));
        } catch (Exception e) {
            log.error("Error exporting inspection data for admin: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(createErrorResponse("Failed to export inspection data", e.getMessage()));
        }
    }

    /**
     * Export technician performance data (Admin)
     */
    @GetMapping("/export/technician-performance")
    public ResponseEntity<?> exportTechnicianPerformanceData(
            @RequestParam(required = false) String format,
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo) {
        try {
            Map<String, Object> filters = new HashMap<>();
            if (dateFrom != null) filters.put("dateFrom", dateFrom);
            if (dateTo != null) filters.put("dateTo", dateTo);

            String exportFormat = format != null ? format : "json";
            Map<String, Object> exportResult = dashboardService.exportTechnicianPerformanceDataForAdmin(filters, exportFormat);
            return ResponseEntity.ok(createSuccessResponse("Technician performance data exported successfully", "export", exportResult));
        } catch (Exception e) {
            log.error("Error exporting technician performance data for admin: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(createErrorResponse("Failed to export technician performance data", e.getMessage()));
        }
    }

    // ==================== BULK OPERATIONS ADMIN ====================

    /**
     * Bulk update inspection report statuses (Admin)
     */
    @PutMapping("/reports/bulk/status")
    public ResponseEntity<?> bulkUpdateInspectionReportStatuses(
            @RequestBody Map<String, Object> request) {
        try {
            @SuppressWarnings("unchecked")
            List<Long> reportIds = (List<Long>) request.get("reportIds");
            String newStatus = (String) request.get("status");
            String reason = (String) request.get("reason");
            String adminEmail = (String) request.get("adminEmail");

            if (reportIds == null || newStatus == null || adminEmail == null) {
                return ResponseEntity.badRequest().body(createErrorResponse("ReportIds, status, and adminEmail are required", null));
            }

            int updatedCount = dashboardService.bulkUpdateInspectionReportStatusesByAdmin(reportIds, newStatus, reason, adminEmail);
            
            Map<String, Object> response = createSuccessResponse("Bulk update completed successfully", null, null);
            response.put("updatedCount", updatedCount);
            response.put("totalCount", reportIds.size());
            response.put("status", newStatus);
            response.put("adminEmail", adminEmail);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error performing bulk update of inspection report statuses by admin: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(createErrorResponse("Failed to perform bulk update", e.getMessage()));
        }
    }

    /**
     * Bulk delete inspection reports (Admin)
     */
    @DeleteMapping("/reports/bulk")
    public ResponseEntity<?> bulkDeleteInspectionReports(
            @RequestBody Map<String, Object> request) {
        try {
            @SuppressWarnings("unchecked")
            List<Long> reportIds = (List<Long>) request.get("reportIds");
            String reason = (String) request.get("reason");
            String adminEmail = (String) request.get("adminEmail");

            if (reportIds == null || adminEmail == null) {
                return ResponseEntity.badRequest().body(createErrorResponse("ReportIds and adminEmail are required", null));
            }

            int deletedCount = dashboardService.bulkDeleteInspectionReportsByAdmin(reportIds, reason, adminEmail);
            
            Map<String, Object> response = createSuccessResponse("Bulk delete completed successfully", null, null);
            response.put("deletedCount", deletedCount);
            response.put("totalCount", reportIds.size());
            response.put("adminEmail", adminEmail);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error performing bulk delete of inspection reports by admin: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(createErrorResponse("Failed to perform bulk delete", e.getMessage()));
        }
    }

    // ==================== HELPER METHODS ====================

    private Map<String, Object> createSuccessResponse(String message, String dataKey, Object data) {
        Map<String, Object> response = new HashMap<>();
        response.put("message", message);
        response.put("success", true);
        if (dataKey != null && data != null) {
            response.put(dataKey, data);
        }
        return response;
    }

    private Map<String, Object> createErrorResponse(String message, String error) {
        Map<String, Object> response = new HashMap<>();
        response.put("message", message);
        response.put("success", false);
        if (error != null) {
            response.put("error", error);
        }
        return response;
    }
}
