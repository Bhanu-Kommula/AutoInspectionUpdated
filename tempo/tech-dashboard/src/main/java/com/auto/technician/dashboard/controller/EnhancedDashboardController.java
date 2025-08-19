package com.auto.technician.dashboard.controller;

import com.auto.technician.dashboard.dto.*;
import com.auto.technician.dashboard.service.DashboardService;
import com.auto.technician.dashboard.service.ChecklistService;
import com.auto.technician.dashboard.service.FileUploadService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.multipart.MultipartFile;

import jakarta.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Enhanced Dashboard Controller
 * REST endpoints for inspection dashboard functionality
 */
@RestController
@RequestMapping("/dashboard")
@RequiredArgsConstructor
@Slf4j

public class EnhancedDashboardController {

    private final DashboardService dashboardService;
    private final ChecklistService checklistService;
    private final FileUploadService fileUploadService;

    // ==================== DASHBOARD SUMMARY ====================

    /**
     * Get dashboard summary for technician
     */
    @GetMapping("/summary/{technicianId}")
    public ResponseEntity<?> getDashboardSummary(@PathVariable Long technicianId) {
        try {
            DashboardSummaryDto summary = dashboardService.getDashboardSummary(technicianId);
            return ResponseEntity.ok(createSuccessResponse("Dashboard summary retrieved successfully", "summary", summary));
        } catch (Exception e) {
            log.error("Error getting dashboard summary for technician {}: {}", technicianId, e.getMessage(), e);
            return ResponseEntity.internalServerError().body(createErrorResponse("Failed to retrieve dashboard summary", e.getMessage()));
        }
    }

    // ==================== ASSIGNED POSTS ====================

    /**
     * Get assigned posts for technician
     */
    @GetMapping("/my-assigned-posts/{technicianId}")
    public ResponseEntity<?> getMyAssignedPosts(@PathVariable Long technicianId) {
        try {
            // Call real service without authentication
            List<PostDto> assignedPosts = dashboardService.getAssignedPosts(technicianId, "no-auth-required");

            Map<String, Object> response = createSuccessResponse("Assigned posts retrieved successfully", "posts", assignedPosts);
            response.put("count", assignedPosts.size());
            response.put("technicianId", technicianId);

            log.info("Assigned posts retrieved for technician {}: {} posts", technicianId, assignedPosts.size());
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error getting assigned posts for technician {}: {}", technicianId, e.getMessage(), e);
            return ResponseEntity.internalServerError().body(createErrorResponse("Failed to retrieve assigned posts", e.getMessage()));
        }
    }

    /**
     * Update post status
     */
    @PutMapping("/update-post-status/{postId}")
    public ResponseEntity<?> updatePostStatus(@PathVariable Long postId, 
                                             @RequestBody Map<String, Object> request) {
        try {
            String newStatus = (String) request.get("status");
            Long technicianId = getLong(request, "technicianId");
            
            if (newStatus == null || technicianId == null) {
                return ResponseEntity.badRequest().body(createErrorResponse("Status and technicianId are required", null));
            }

            boolean success = dashboardService.updatePostStatus(postId, newStatus, technicianId, "no-auth-required");

            if (success) {
                Map<String, Object> response = createSuccessResponse("Post status updated successfully", null, null);
                response.put("postId", postId);
                response.put("newStatus", newStatus);
                response.put("technicianId", technicianId);
                
                log.info("Post {} status updated to {} by technician {}", postId, newStatus, technicianId);
                return ResponseEntity.ok(response);
            } else {
                log.warn("Failed to update post {} status to {} by technician {}", postId, newStatus, technicianId);
                return ResponseEntity.badRequest().body(createErrorResponse("Failed to update post status", null));
            }

        } catch (Exception e) {
            log.error("Error updating post {} status: {}", postId, e.getMessage(), e);
            return ResponseEntity.internalServerError().body(createErrorResponse("Failed to update post status", e.getMessage()));
        }
    }

    // ==================== INSPECTION REPORTS ====================

    /**
     * Get inspection reports for technician
     */
    @GetMapping("/my-inspection-reports/{technicianId}")
    public ResponseEntity<?> getMyInspectionReports(@PathVariable Long technicianId) {
        try {
            List<InspectionReportDto> reports = dashboardService.getInspectionReports(technicianId);

            Map<String, Object> response = createSuccessResponse("Inspection reports retrieved successfully", "reports", reports);
            response.put("count", reports.size());
            response.put("technicianId", technicianId);

            log.info("Inspection reports retrieved for technician {}: {} reports", technicianId, reports.size());
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error getting inspection reports for technician {}: {}", technicianId, e.getMessage(), e);
            return ResponseEntity.internalServerError().body(createErrorResponse("Failed to retrieve inspection reports", e.getMessage()));
        }
    }

    /**
     * Get specific inspection report
     */
    @GetMapping("/reports/{reportId}")
    public ResponseEntity<?> getInspectionReport(@PathVariable Long reportId) {
        try {
            InspectionReportDto report = dashboardService.getInspectionReport(reportId);
            
            if (report == null) {
                return ResponseEntity.notFound().build();
            }

            return ResponseEntity.ok(createSuccessResponse("Inspection report retrieved successfully", "report", report));

        } catch (Exception e) {
            log.error("Error getting inspection report {}: {}", reportId, e.getMessage(), e);
            return ResponseEntity.internalServerError().body(createErrorResponse("Failed to retrieve inspection report", e.getMessage()));
        }
    }

    /**
     * Get inspection report by post ID
     */
    @GetMapping("/reports/by-post/{postId}")
    public ResponseEntity<?> getInspectionReportByPostId(@PathVariable Long postId) {
        try {
            InspectionReportDto report = dashboardService.getInspectionReportByPostId(postId);
            
            if (report == null) {
                return ResponseEntity.notFound().build();
            }

            return ResponseEntity.ok(createSuccessResponse("Inspection report retrieved successfully", "report", report));

        } catch (Exception e) {
            log.error("Error getting inspection report by post ID {}: {}", postId, e.getMessage(), e);
            return ResponseEntity.internalServerError().body(createErrorResponse("Failed to retrieve inspection report", e.getMessage()));
        }
    }

    // ==================== INSPECTION WORKFLOW ====================

    /**
     * Start inspection for a post
     */
    @PostMapping("/start-inspection/{postId}")
    public ResponseEntity<?> startInspectionForPost(@PathVariable Long postId, 
                                                   @RequestBody(required = false) Map<String, Object> request) {
        try {
            Long technicianId = request != null ? getLong(request, "technicianId") : null;
            
            if (technicianId == null) {
                return ResponseEntity.badRequest().body(createErrorResponse("Technician ID is required", null));
            }

            // Create inspection report automatically
            InspectionReportDto report = dashboardService.createInspectionReport(postId, technicianId, request);

            if (report == null) {
                return ResponseEntity.badRequest().body(createErrorResponse("Failed to create inspection report", null));
            }

            // Get checklist template
            Map<String, List<String>> checklistTemplate = checklistService.getStandardChecklistTemplate();

            Map<String, Object> response = createSuccessResponse("Inspection started successfully", "report", report);
            response.put("checklistTemplate", checklistTemplate);

            log.info("Inspection started for post {} by technician {}", postId, technicianId);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error starting inspection for post {}: {}", postId, e.getMessage(), e);
            return ResponseEntity.internalServerError().body(createErrorResponse("Failed to start inspection", e.getMessage()));
        }
    }

    /**
     * Submit inspection report
     */
    @PostMapping("/reports/{reportId}/submit")
    public ResponseEntity<?> submitInspectionReport(@PathVariable Long reportId, 
                                                   @RequestBody Map<String, Object> request) {
        try {
            String finalRemarks = (String) request.get("finalRemarks");

            InspectionReportDto report = dashboardService.submitInspectionReport(reportId, finalRemarks);

            if (report == null) {
                return ResponseEntity.notFound().build();
            }

            log.info("Inspection report {} submitted", reportId);
            return ResponseEntity.ok(createSuccessResponse("Inspection report submitted successfully", "report", report));

        } catch (Exception e) {
            log.error("Error submitting inspection report {}: {}", reportId, e.getMessage(), e);
            return ResponseEntity.internalServerError().body(createErrorResponse("Failed to submit inspection report", e.getMessage()));
        }
    }

    /**
     * Complete inspection report
     */
    @PostMapping("/reports/{reportId}/complete")
    public ResponseEntity<?> completeInspectionReport(@PathVariable Long reportId, 
                                                     @RequestBody Map<String, Object> request) {
        try {
            String finalRemarks = (String) request.get("finalRemarks");

            InspectionReportDto report = dashboardService.completeInspection(reportId, finalRemarks);

            if (report == null) {
                return ResponseEntity.notFound().build();
            }

            log.info("Inspection report {} completed", reportId);
            return ResponseEntity.ok(createSuccessResponse("Inspection report completed successfully", "report", report));

        } catch (Exception e) {
            log.error("Error completing inspection report {}: {}", reportId, e.getMessage(), e);
            return ResponseEntity.internalServerError().body(createErrorResponse("Failed to complete inspection report", e.getMessage()));
        }
    }

    // ==================== CHECKLIST MANAGEMENT ====================

    /**
     * Get checklist template
     */
    @GetMapping("/checklist-template")
    public ResponseEntity<?> getChecklistTemplate() {
        try {
            Map<String, List<String>> template = checklistService.getStandardChecklistTemplate();
            return ResponseEntity.ok(createSuccessResponse("Checklist template retrieved successfully", "template", template));
        } catch (Exception e) {
            log.error("Error getting checklist template: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(createErrorResponse("Failed to retrieve checklist template", e.getMessage()));
        }
    }

    /**
     * Get checklist for inspection report
     */
    @GetMapping("/reports/{reportId}/checklist")
    public ResponseEntity<?> getChecklist(@PathVariable Long reportId) {
        try {
            List<InspectionChecklistItemDto> checklist = checklistService.getChecklistForReport(reportId);

            Map<String, Object> response = createSuccessResponse("Checklist retrieved successfully", "checklist", checklist);
            response.put("count", checklist.size());
            response.put("reportId", reportId);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error getting checklist for report {}: {}", reportId, e.getMessage(), e);
            return ResponseEntity.internalServerError().body(createErrorResponse("Failed to retrieve checklist", e.getMessage()));
        }
    }

    /**
     * Update checklist item
     */
    @PutMapping("/reports/{reportId}/checklist/{itemId}")
    public ResponseEntity<?> updateChecklistItem(@PathVariable Long reportId, 
                                                @PathVariable Long itemId, 
                                                @RequestBody Map<String, Object> updates) {
        try {
            InspectionChecklistItemDto updatedItem = checklistService.updateChecklistItem(itemId, updates);

            if (updatedItem == null) {
                return ResponseEntity.notFound().build();
            }

            return ResponseEntity.ok(createSuccessResponse("Checklist item updated successfully", "item", updatedItem));

        } catch (Exception e) {
            log.error("Error updating checklist item {} for report {}: {}", itemId, reportId, e.getMessage(), e);
            return ResponseEntity.internalServerError().body(createErrorResponse("Failed to update checklist item", e.getMessage()));
        }
    }

    /**
     * ✅ Initialize checklist for existing report (for fixing broken relationships)
     * POST /reports/{reportId}/checklist/initialize
     */
    @PostMapping("/reports/{reportId}/checklist/initialize")
    public ResponseEntity<?> initializeChecklist(@PathVariable Long reportId) {
        try {
            checklistService.initializeChecklistForReport(reportId);
            return ResponseEntity.ok(createSuccessResponse("Checklist initialized successfully", null, null));
        } catch (Exception e) {
            log.error("Error initializing checklist for report {}: {}", reportId, e.getMessage(), e);
            return ResponseEntity.internalServerError().body(createErrorResponse("Failed to initialize checklist", e.getMessage()));
        }
    }

    /**
     * ✅ PERFORMANCE OPTIMIZED: Bulk update multiple checklist items
     * PUT /reports/{reportId}/checklist/bulk
     */
    @PutMapping("/reports/{reportId}/checklist/bulk")
    public ResponseEntity<?> bulkUpdateChecklistItems(@PathVariable Long reportId, 
                                                     @RequestBody Map<String, Object> request) {
        try {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> bulkUpdates = (List<Map<String, Object>>) request.get("updates");
            
            if (bulkUpdates == null || bulkUpdates.isEmpty()) {
                return ResponseEntity.badRequest().body(createErrorResponse("No updates provided", null));
            }

            List<InspectionChecklistItemDto> updatedItems = checklistService.bulkUpdateChecklistItems(reportId, bulkUpdates);

            Map<String, Object> response = createSuccessResponse("Bulk update completed successfully", "updatedItems", updatedItems);
            response.put("count", updatedItems.size());
            response.put("reportId", reportId);

            log.info("Bulk updated {} checklist items for report {}", updatedItems.size(), reportId);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error performing bulk update for report {}: {}", reportId, e.getMessage(), e);
            return ResponseEntity.internalServerError().body(createErrorResponse("Failed to perform bulk update", e.getMessage()));
        }
    }

    // ==================== FILE UPLOAD ====================

    /**
     * Upload files for inspection report
     */
    @PostMapping("/reports/{reportId}/upload")
    public ResponseEntity<?> uploadFiles(@PathVariable Long reportId, 
                                        @RequestParam("files") List<MultipartFile> files, 
                                        @RequestParam(value = "category", required = false) String category) {
        try {
            List<InspectionFileDto> uploadedFiles = fileUploadService.uploadMultipleFiles(reportId, files, category);

            Map<String, Object> response = createSuccessResponse("Files uploaded successfully", "uploadedFiles", uploadedFiles);
            response.put("count", uploadedFiles.size());
            response.put("reportId", reportId);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error uploading files for report {}: {}", reportId, e.getMessage(), e);
            return ResponseEntity.internalServerError().body(createErrorResponse("Failed to upload files", e.getMessage()));
        }
    }

    /**
     * Get files for inspection report
     */
    @GetMapping("/reports/{reportId}/files")
    public ResponseEntity<?> getFilesForReport(@PathVariable Long reportId) {
        try {
            List<InspectionFileDto> files = fileUploadService.getFilesForReport(reportId);

            Map<String, Object> response = createSuccessResponse("Files retrieved successfully", "files", files);
            response.put("count", files.size());
            response.put("reportId", reportId);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error getting files for report {}: {}", reportId, e.getMessage(), e);
            return ResponseEntity.internalServerError().body(createErrorResponse("Failed to retrieve files", e.getMessage()));
        }
    }

    /**
     * Delete file from inspection report
     */
    @DeleteMapping("/reports/{reportId}/files/{fileId}")
    public ResponseEntity<?> deleteFile(@PathVariable Long reportId, @PathVariable Long fileId) {
        try {
            boolean deleted = fileUploadService.deleteFile(fileId);

            if (!deleted) {
                return ResponseEntity.notFound().build();
            }

            Map<String, Object> response = createSuccessResponse("File deleted successfully", null, null);
            response.put("fileId", fileId);
            response.put("reportId", reportId);

            log.info("File {} deleted from report {}", fileId, reportId);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error deleting file {} from report {}: {}", fileId, reportId, e.getMessage(), e);
            return ResponseEntity.internalServerError().body(createErrorResponse("Failed to delete file", e.getMessage()));
        }
    }

    // ==================== HEALTH CHECK ====================

    /**
     * Health check endpoint
     */
    @GetMapping("/health")
    public Map<String, Object> healthCheck() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        response.put("service", "Tech Dashboard Service");
        response.put("timestamp", System.currentTimeMillis());
        return response;
    }

    // ==================== HELPER METHODS ====================

    private String extractJwtToken(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            // Allow mock token for development
            if ("mock-jwt-token-for-development".equals(token)) {
                return token;
            }
            return token;
        }
        return null;
    }

    private Long getLong(Map<String, Object> data, String key) {
        Object value = data.get(key);
        if (value instanceof Number) {
            return ((Number) value).longValue();
        } else if (value instanceof String) {
            try {
                return Long.parseLong((String) value);
            } catch (NumberFormatException e) {
                return null;
            }
        }
        return null;
    }

    private ResponseEntity<?> createUnauthorizedResponse() {
        return ResponseEntity.status(401).body(createErrorResponse("Authentication required", null));
    }

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
