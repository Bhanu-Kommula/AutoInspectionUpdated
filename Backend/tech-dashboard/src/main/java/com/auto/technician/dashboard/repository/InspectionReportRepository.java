package com.auto.technician.dashboard.repository;

import com.auto.technician.dashboard.entity.InspectionReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * Repository for InspectionReport entity
 */
@Repository
public interface InspectionReportRepository extends JpaRepository<InspectionReport, Long> {

    /**
     * Find inspection reports by technician ID ordered by creation date
     */
    List<InspectionReport> findByTechnicianIdOrderByCreatedAtDesc(Long technicianId);

    /**
     * Find inspection reports by technician ID and status
     */
    List<InspectionReport> findByTechnicianIdAndStatusOrderByCreatedAtDesc(
        Long technicianId, InspectionReport.InspectionStatus status);

    /**
     * Find inspection report by post ID
     */
    Optional<InspectionReport> findByPostId(Long postId);

    /**
     * Check if inspection report exists for a post
     */
    boolean existsByPostId(Long postId);

    /**
     * Get dashboard summary statistics for a technician
     */
    @Query(value = """
        SELECT 
            COUNT(*) as totalReports,
            COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completedReports,
            COUNT(CASE WHEN status = 'IN_PROGRESS' THEN 1 END) as inProgressReports,
            COUNT(CASE WHEN status = 'DRAFT' THEN 1 END) as draftReports,
            COUNT(CASE WHEN status = 'SUBMITTED' THEN 1 END) as submittedReports,
            AVG(estimated_repair_cost) as avgRepairCost,
            SUM(estimated_repair_cost) as totalRepairCost
        FROM inspection_reports 
        WHERE technician_id = :technicianId
        """, nativeQuery = true)
    Object[] getDashboardSummary(@Param("technicianId") Long technicianId);

    /**
     * Find reports by technician ID with pagination
     */
    @Query("SELECT ir FROM InspectionReport ir WHERE ir.technicianId = :technicianId ORDER BY ir.createdAt DESC")
    List<InspectionReport> findByTechnicianIdWithPagination(@Param("technicianId") Long technicianId);

    /**
     * Count reports by technician and status
     */
    long countByTechnicianIdAndStatus(Long technicianId, InspectionReport.InspectionStatus status);

    /**
     * Find recent reports for technician (last N reports)
     */
    @Query("SELECT ir FROM InspectionReport ir WHERE ir.technicianId = :technicianId ORDER BY ir.createdAt DESC")
    List<InspectionReport> findRecentReportsByTechnician(@Param("technicianId") Long technicianId);

    // ==================== ADMIN DATE FILTERING METHODS ====================

    /**
     * Count reports created today
     */
    @Query("SELECT COUNT(ir) FROM InspectionReport ir WHERE DATE(ir.createdAt) = CURDATE()")
    long countReportsToday();

    /**
     * Count reports created this week
     */
    @Query("SELECT COUNT(ir) FROM InspectionReport ir WHERE ir.createdAt >= :weekStart")
    long countReportsThisWeek(@Param("weekStart") java.time.LocalDateTime weekStart);

    /**
     * Count reports created this month
     */
    @Query("SELECT COUNT(ir) FROM InspectionReport ir WHERE ir.createdAt >= :monthStart")
    long countReportsThisMonth(@Param("monthStart") java.time.LocalDateTime monthStart);

    /**
     * Count reports by status and date range
     */
    @Query("SELECT COUNT(ir) FROM InspectionReport ir WHERE ir.status = :status AND ir.createdAt >= :dateFrom AND ir.createdAt <= :dateTo")
    long countReportsByStatusAndDateRange(
        @Param("status") InspectionReport.InspectionStatus status,
        @Param("dateFrom") java.time.LocalDateTime dateFrom,
        @Param("dateTo") java.time.LocalDateTime dateTo);

    /**
     * Find reports by date range with pagination
     */
    @Query("SELECT ir FROM InspectionReport ir WHERE ir.createdAt >= :dateFrom AND ir.createdAt <= :dateTo ORDER BY ir.createdAt DESC")
    List<InspectionReport> findReportsByDateRange(
        @Param("dateFrom") java.time.LocalDateTime dateFrom,
        @Param("dateTo") java.time.LocalDateTime dateTo);

    // ==================== ADMIN BULK OPERATIONS ====================

    /**
     * Bulk update status for multiple reports
     */
    @Modifying
    @Transactional
    @Query("UPDATE InspectionReport ir SET ir.status = :status, ir.generalNotes = :notes, ir.updatedAt = CURRENT_TIMESTAMP WHERE ir.id IN :reportIds")
    int bulkUpdateStatus(
        @Param("reportIds") List<Long> reportIds,
        @Param("status") InspectionReport.InspectionStatus status,
        @Param("notes") String notes);

    /**
     * Bulk soft delete multiple reports
     */
    @Modifying
    @Transactional
    @Query("UPDATE InspectionReport ir SET ir.status = 'REJECTED', ir.generalNotes = :notes, ir.updatedAt = CURRENT_TIMESTAMP WHERE ir.id IN :reportIds")
    int bulkSoftDelete(
        @Param("reportIds") List<Long> reportIds,
        @Param("notes") String notes);

    /**
     * Bulk restore multiple reports
     */
    @Modifying
    @Transactional
    @Query("UPDATE InspectionReport ir SET ir.status = 'DRAFT', ir.generalNotes = :notes, ir.updatedAt = CURRENT_TIMESTAMP WHERE ir.id IN :reportIds")
    int bulkRestore(
        @Param("reportIds") List<Long> reportIds,
        @Param("notes") String notes);
}
