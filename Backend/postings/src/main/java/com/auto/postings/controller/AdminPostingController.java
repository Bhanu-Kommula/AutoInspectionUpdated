package com.auto.postings.controller;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.Date;
import java.util.Arrays;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import lombok.extern.slf4j.Slf4j;
import lombok.RequiredArgsConstructor;

import com.auto.postings.dto.*;
import com.auto.postings.model.Posting;
import com.auto.postings.model.PostStatus;
import com.auto.postings.service.PostingService;
import com.auto.postings.service.CounterOfferService;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
@Slf4j
public class AdminPostingController {

    private final PostingService postingService;
    private final CounterOfferService counterOfferService;

    // ==================== POST MANAGEMENT ENDPOINTS ====================

    /**
     * Get all posts with pagination and filtering (Admin)
     * GET /admin/posts
     */
    @GetMapping("/posts")
    public ResponseEntity<Map<String, Object>> getAllPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String dealerEmail,
            @RequestParam(required = false) String search) {
        
        try {
            // Validate pagination parameters
            if (page < 0) page = 0;
            if (size < 1 || size > 100) size = 20; // Limit max page size
            
            Map<String, Object> filters = new HashMap<>();
            if (status != null && !status.trim().isEmpty()) filters.put("status", status.trim());
            if (location != null && !location.trim().isEmpty()) filters.put("location", location.trim());
            if (dealerEmail != null && !dealerEmail.trim().isEmpty()) filters.put("dealerEmail", dealerEmail.trim());
            if (search != null && !search.trim().isEmpty()) filters.put("search", search.trim());

            List<Posting> posts = postingService.getAllPostsForAdmin(filters, page, size);
            long totalPosts = postingService.getTotalPostsCount(filters);
            int totalPages = (int) Math.ceil((double) totalPosts / size);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", posts);
            response.put("pagination", Map.of(
                "currentPage", page,
                "pageSize", size,
                "totalElements", totalPosts,
                "totalPages", totalPages
            ));
            response.put("filters", filters);

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.warn("Invalid request parameters: {}", e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Invalid request parameters: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        } catch (Exception e) {
            log.error("Error getting all posts for admin: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to get posts: " + e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }

    /**
     * Get post by ID (Admin)
     * GET /admin/posts/{id}
     */
    @GetMapping("/posts/{id}")
    public ResponseEntity<Map<String, Object>> getPostById(@PathVariable Long id) {
        try {
            Posting post = postingService.getPostById(id);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", post);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error getting post by ID {}: {}", id, e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to get post: " + e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }

    /**
     * Update post status (Admin)
     * PUT /admin/posts/{id}/status
     */
    @PutMapping("/posts/{id}/status")
    public ResponseEntity<Map<String, Object>> updatePostStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> request) {
        
        try {
            // Validate path variable
            if (id == null || id <= 0) {
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("message", "Invalid post ID");
                return ResponseEntity.badRequest().body(error);
            }

            String newStatus = request.get("status");
            String reason = request.get("reason");
            String adminEmail = request.get("adminEmail");

            if (newStatus == null || newStatus.trim().isEmpty()) {
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("message", "Status is required");
                return ResponseEntity.badRequest().body(error);
            }

            // Validate status value
            PostStatus status;
            try {
                status = PostStatus.valueOf(newStatus.trim().toUpperCase());
            } catch (IllegalArgumentException e) {
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("message", "Invalid status value. Valid values are: " + 
                    Arrays.stream(PostStatus.values()).map(Enum::name).collect(Collectors.joining(", ")));
                return ResponseEntity.badRequest().body(error);
            }

            // Validate admin email
            if (adminEmail == null || adminEmail.trim().isEmpty()) {
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("message", "Admin email is required");
                return ResponseEntity.badRequest().body(error);
            }

            postingService.updatePostStatusByAdmin(id, status, reason, adminEmail);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Post status updated successfully");
            response.put("postId", id);
            response.put("newStatus", status.name());
            response.put("updatedAt", new Date());

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.warn("Invalid request for post status update ID {}: {}", id, e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Invalid request: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        } catch (Exception e) {
            log.error("Error updating post status for ID {}: {}", id, e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to update post status: " + e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }

    /**
     * Delete post (Admin - Hard delete)
     * DELETE /admin/posts/{id}
     */
    @DeleteMapping("/posts/{id}")
    public ResponseEntity<Map<String, Object>> deletePost(
            @PathVariable Long id,
            @RequestParam(required = false) String reason,
            @RequestParam(required = false) String adminEmail) {
        
        try {
            // Validate path variable
            if (id == null || id <= 0) {
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("message", "Invalid post ID");
                return ResponseEntity.badRequest().body(error);
            }

            // Validate admin email
            if (adminEmail == null || adminEmail.trim().isEmpty()) {
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("message", "Admin email is required");
                return ResponseEntity.badRequest().body(error);
            }

            postingService.deletePostByAdmin(id, reason, adminEmail);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Post deleted successfully");
            response.put("postId", id);
            response.put("deletedAt", new Date());

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.warn("Invalid request for post deletion ID {}: {}", id, e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Invalid request: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        } catch (Exception e) {
            log.error("Error deleting post ID {}: {}", id, e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to delete post: " + e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }

    /**
     * Restore deleted post (Admin)
     * POST /admin/posts/{id}/restore
     */
    @PostMapping("/posts/{id}/restore")
    public ResponseEntity<Map<String, Object>> restorePost(
            @PathVariable Long id,
            @RequestParam(required = false) String adminEmail) {
        
        try {
            // Validate path variable
            if (id == null || id <= 0) {
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("message", "Invalid post ID");
                return ResponseEntity.badRequest().body(error);
            }

            // Validate admin email
            if (adminEmail == null || adminEmail.trim().isEmpty()) {
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("message", "Admin email is required");
                return ResponseEntity.badRequest().body(error);
            }

            postingService.restorePostByAdmin(id, adminEmail);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Post restored successfully");
            response.put("postId", id);
            response.put("restoredAt", new Date());

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.warn("Invalid request for post restoration ID {}: {}", id, e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Invalid request: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        } catch (Exception e) {
            log.error("Error restoring post ID {}: {}", id, e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to restore post: " + e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }

    // ==================== BULK OPERATIONS ENDPOINTS ====================

    /**
     * Bulk update post statuses (Admin)
     * POST /admin/posts/bulk-status-update
     */
    @PostMapping("/posts/bulk-status-update")
    public ResponseEntity<Map<String, Object>> bulkUpdatePostStatuses(
            @RequestBody Map<String, Object> request) {
        
        try {
            @SuppressWarnings("unchecked")
            List<Long> postIds = (List<Long>) request.get("postIds");
            String newStatus = (String) request.get("status");
            String reason = (String) request.get("reason");
            String adminEmail = (String) request.get("adminEmail");

            // Validate post IDs
            if (postIds == null || postIds.isEmpty()) {
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("message", "Post IDs are required");
                return ResponseEntity.badRequest().body(error);
            }

            // Validate post IDs are positive
            if (postIds.stream().anyMatch(id -> id == null || id <= 0)) {
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("message", "All post IDs must be positive numbers");
                return ResponseEntity.badRequest().body(error);
            }

            // Limit bulk operations to prevent abuse
            if (postIds.size() > 100) {
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("message", "Cannot update more than 100 posts at once");
                return ResponseEntity.badRequest().body(error);
            }

            if (newStatus == null || newStatus.trim().isEmpty()) {
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("message", "Status is required");
                return ResponseEntity.badRequest().body(error);
            }

            // Validate status value
            PostStatus status;
            try {
                status = PostStatus.valueOf(newStatus.trim().toUpperCase());
            } catch (IllegalArgumentException e) {
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("message", "Invalid status value. Valid values are: " + 
                    Arrays.stream(PostStatus.values()).map(Enum::name).collect(Collectors.joining(", ")));
                return ResponseEntity.badRequest().body(error);
            }

            // Validate admin email
            if (adminEmail == null || adminEmail.trim().isEmpty()) {
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("message", "Admin email is required");
                return ResponseEntity.badRequest().body(error);
            }

            int updatedCount = postingService.bulkUpdatePostStatuses(postIds, status, reason, adminEmail);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Bulk status update completed successfully");
            response.put("updatedCount", updatedCount);
            response.put("totalRequested", postIds.size());
            response.put("updatedAt", new Date());

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.warn("Invalid request for bulk status update: {}", e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Invalid request: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        } catch (Exception e) {
            log.error("Error in bulk status update: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to perform bulk status update: " + e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }

    /**
     * Bulk delete posts (Admin)
     * POST /admin/posts/bulk-delete
     */
    @PostMapping("/posts/bulk-delete")
    public ResponseEntity<Map<String, Object>> bulkDeletePosts(
            @RequestBody Map<String, Object> request) {
        
        try {
            @SuppressWarnings("unchecked")
            List<Long> postIds = (List<Long>) request.get("postIds");
            String reason = (String) request.get("reason");
            String adminEmail = (String) request.get("adminEmail");

            // Validate post IDs
            if (postIds == null || postIds.isEmpty()) {
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("message", "Post IDs are required");
                return ResponseEntity.badRequest().body(error);
            }

            // Validate post IDs are positive
            if (postIds.stream().anyMatch(id -> id == null || id <= 0)) {
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("message", "All post IDs must be positive numbers");
                return ResponseEntity.badRequest().body(error);
            }

            // Limit bulk operations to prevent abuse
            if (postIds.size() > 100) {
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("message", "Cannot delete more than 100 posts at once");
                return ResponseEntity.badRequest().body(error);
            }

            // Validate admin email
            if (adminEmail == null || adminEmail.trim().isEmpty()) {
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("message", "Admin email is required");
                return ResponseEntity.badRequest().body(error);
            }

            int deletedCount = postingService.bulkDeletePosts(postIds, reason, adminEmail);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Bulk delete completed successfully");
            response.put("deletedCount", deletedCount);
            response.put("totalRequested", postIds.size());
            response.put("deletedAt", new Date());

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.warn("Invalid request for bulk delete: {}", e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Invalid request: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        } catch (Exception e) {
            log.error("Error in bulk delete: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to perform bulk delete: " + e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }

    // ==================== ANALYTICS & REPORTING ENDPOINTS ====================

    /**
     * Get posting statistics (Admin)
     * GET /admin/posts/statistics
     */
    @GetMapping("/posts/statistics")
    public ResponseEntity<Map<String, Object>> getPostingStatistics(
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo) {
        
        try {
            Map<String, Object> stats = postingService.getPostingStatistics(dateFrom, dateTo);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", stats);
            response.put("generatedAt", new Date());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error getting posting statistics: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to get statistics: " + e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }

    /**
     * Get posts by date range (Admin)
     * GET /admin/posts/by-date-range
     */
    @GetMapping("/posts/by-date-range")
    public ResponseEntity<Map<String, Object>> getPostsByDateRange(
            @RequestParam String dateFrom,
            @RequestParam String dateTo,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        try {
            List<Posting> posts = postingService.getPostsByDateRange(dateFrom, dateTo, page, size);
            long totalPosts = postingService.getTotalPostsByDateRange(dateFrom, dateTo);
            int totalPages = (int) Math.ceil((double) totalPosts / size);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", posts);
            response.put("pagination", Map.of(
                "currentPage", page,
                "pageSize", size,
                "totalElements", totalPosts,
                "totalPages", totalPages
            ));
            response.put("dateRange", Map.of("from", dateFrom, "to", dateTo));

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error getting posts by date range: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to get posts by date range: " + e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }

    /**
     * Export posts data (Admin)
     * GET /admin/posts/export
     */
    @GetMapping("/posts/export")
    public ResponseEntity<Map<String, Object>> exportPosts(
            @RequestParam(required = false) String format,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo) {
        
        try {
            String exportData = postingService.exportPostsData(format, status, dateFrom, dateTo);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", exportData);
            response.put("format", format != null ? format : "csv");
            response.put("exportedAt", new Date());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error exporting posts: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to export posts: " + e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }

    // ==================== COUNTER OFFER ADMIN ENDPOINTS ====================

    /**
     * Get all counter offers (Admin)
     * GET /admin/counter-offers
     */
    @GetMapping("/counter-offers")
    public ResponseEntity<Map<String, Object>> getAllCounterOffers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String status) {
        
        try {
            // Validate pagination parameters
            if (page < 0) page = 0;
            if (size < 1 || size > 100) size = 20; // Limit max page size

            List<Map<String, Object>> counterOffers = counterOfferService.getAllCounterOffersForAdmin(status, page, size);
            long totalCount = counterOfferService.getTotalCounterOffersCount(status);
            int totalPages = (int) Math.ceil((double) totalCount / size);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", counterOffers);
            response.put("pagination", Map.of(
                "currentPage", page,
                "pageSize", size,
                "totalElements", totalCount,
                "totalPages", totalPages
            ));
            if (status != null) {
                response.put("statusFilter", status);
            }

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.warn("Invalid request parameters for counter offers: {}", e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Invalid request parameters: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        } catch (Exception e) {
            log.error("Error getting counter offers for admin: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to get counter offers: " + e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }

    /**
     * Get counter offer by ID (Admin)
     * GET /admin/counter-offers/{id}
     */
    @GetMapping("/counter-offers/{id}")
    public ResponseEntity<Map<String, Object>> getCounterOfferById(@PathVariable Long id) {
        try {
            Map<String, Object> counterOffer = counterOfferService.getCounterOfferByIdForAdmin(id);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", counterOffer);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error getting counter offer by ID {}: {}", id, e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to get counter offer: " + e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }

    /**
     * Cancel counter offer (Admin)
     * PUT /admin/counter-offers/{id}/cancel
     */
    @PutMapping("/counter-offers/{id}/cancel")
    public ResponseEntity<Map<String, Object>> cancelCounterOffer(
            @PathVariable Long id,
            @RequestParam(required = false) String reason,
            @RequestParam(required = false) String adminEmail) {
        
        try {
            // Validate path variable
            if (id == null || id <= 0) {
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("message", "Invalid counter offer ID");
                return ResponseEntity.badRequest().body(error);
            }

            // Validate admin email
            if (adminEmail == null || adminEmail.trim().isEmpty()) {
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("message", "Admin email is required");
                return ResponseEntity.badRequest().body(error);
            }

            counterOfferService.cancelCounterOfferByAdmin(id, reason, adminEmail);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Counter offer cancelled successfully");
            response.put("counterOfferId", id);
            response.put("cancelledAt", new Date());

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.warn("Invalid request for counter offer cancellation ID {}: {}", id, e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Invalid request: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        } catch (Exception e) {
            log.error("Error cancelling counter offer ID {}: {}", id, e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to cancel counter offer: " + e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }

    // ==================== SYSTEM HEALTH ENDPOINTS ====================

    /**
     * Health check for admin endpoints
     * GET /admin/health
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Admin posting service is healthy");
        response.put("timestamp", new Date());
        response.put("service", "AdminPostingController");
        
        return ResponseEntity.ok(response);
    }
}
