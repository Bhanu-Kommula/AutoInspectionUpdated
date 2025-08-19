package com.auto.technician.dashboard.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Dashboard Summary DTO
 * Aggregated data for technician dashboard
 */
@Data
@NoArgsConstructor
public class DashboardSummaryDto {

    private Long technicianId;
    private String technicianName;
    private String technicianEmail;

    // Report statistics
    private Long totalReports = 0L;
    private Long completedReports = 0L;
    private Long inProgressReports = 0L;
    private Long draftReports = 0L;
    private Long submittedReports = 0L;

    // Financial statistics
    private Double averageRepairCost = 0.0;
    private Double totalRepairCost = 0.0;

    // Performance metrics
    private Double completionRate = 0.0;
    private String productivityRating = "Good";

    // Recent activity
    private Map<String, Object> recentReports = new HashMap<>();
    private Map<String, Object> recentActivity = new HashMap<>();

    // Summary metadata
    private LocalDateTime lastUpdated = LocalDateTime.now();
    private LocalDateTime generatedAt = LocalDateTime.now();

    // ==================== CONSTRUCTOR ====================

    public DashboardSummaryDto(Long technicianId) {
        this.technicianId = technicianId;
        this.technicianName = "Technician " + technicianId;
        this.technicianEmail = "tech" + technicianId + "@example.com";
    }

    public DashboardSummaryDto(Long technicianId, String technicianName, String technicianEmail) {
        this.technicianId = technicianId;
        this.technicianName = technicianName;
        this.technicianEmail = technicianEmail;
    }

    // ==================== BUSINESS METHODS ====================

    /**
     * Update summary from database query result
     */
    public void updateFromDatabaseResult(Object[] stats) {
        if (stats != null && stats.length >= 7) {
            this.totalReports = stats[0] != null ? ((Number) stats[0]).longValue() : 0L;
            this.completedReports = stats[1] != null ? ((Number) stats[1]).longValue() : 0L;
            this.inProgressReports = stats[2] != null ? ((Number) stats[2]).longValue() : 0L;
            this.draftReports = stats[3] != null ? ((Number) stats[3]).longValue() : 0L;
            this.submittedReports = stats[4] != null ? ((Number) stats[4]).longValue() : 0L;
            this.averageRepairCost = stats[5] != null ? ((Number) stats[5]).doubleValue() : 0.0;
            this.totalRepairCost = stats[6] != null ? ((Number) stats[6]).doubleValue() : 0.0;

            // Calculate completion rate
            if (totalReports > 0) {
                this.completionRate = (double) (completedReports + submittedReports) / totalReports * 100;
            }

            // Determine productivity rating
            updateProductivityRating();
        }
    }

    /**
     * Calculate and update productivity rating
     */
    private void updateProductivityRating() {
        if (completionRate >= 90) {
            productivityRating = "Excellent";
        } else if (completionRate >= 75) {
            productivityRating = "Good";
        } else if (completionRate >= 60) {
            productivityRating = "Average";
        } else {
            productivityRating = "Needs Improvement";
        }
    }

    /**
     * Add recent activity item
     */
    public void addRecentActivity(String type, Object data) {
        if (recentActivity == null) {
            recentActivity = new HashMap<>();
        }
        recentActivity.put(type, data);
    }

    /**
     * Get completion rate as formatted percentage
     */
    public String getFormattedCompletionRate() {
        return String.format("%.1f%%", completionRate);
    }

    /**
     * Get formatted average repair cost
     */
    public String getFormattedAverageRepairCost() {
        return String.format("$%.2f", averageRepairCost);
    }

    /**
     * Get formatted total repair cost
     */
    public String getFormattedTotalRepairCost() {
        return String.format("$%.2f", totalRepairCost);
    }

    /**
     * Check if technician is active (has reports)
     */
    public boolean isActive() {
        return totalReports > 0;
    }

    /**
     * Check if technician has high performance
     */
    public boolean isHighPerformer() {
        return completionRate >= 80 && totalReports >= 5;
    }

    /**
     * Get work status based on current reports
     */
    public String getWorkStatus() {
        if (inProgressReports > 0) {
            return "Currently Working";
        } else if (draftReports > 0) {
            return "Reports Pending";
        } else if (totalReports > 0) {
            return "Available";
        } else {
            return "No Activity";
        }
    }

    /**
     * Create summary map for API responses
     */
    public Map<String, Object> toSummaryMap() {
        Map<String, Object> summary = new HashMap<>();
        summary.put("technicianId", technicianId);
        summary.put("technicianName", technicianName);
        summary.put("totalReports", totalReports);
        summary.put("completedReports", completedReports);
        summary.put("inProgressReports", inProgressReports);
        summary.put("completionRate", completionRate);
        summary.put("productivityRating", productivityRating);
        summary.put("workStatus", getWorkStatus());
        summary.put("averageRepairCost", averageRepairCost);
        summary.put("totalRepairCost", totalRepairCost);
        summary.put("lastUpdated", lastUpdated);
        return summary;
    }
}
