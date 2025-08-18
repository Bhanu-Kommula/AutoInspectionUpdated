package com.auto.tech.repository;

import com.auto.tech.model.TechnicianPerformanceMetrics;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository for Technician Performance Metrics
 * Following the current main service pattern
 */
@Repository
public interface TechnicianPerformanceMetricsRepository extends JpaRepository<TechnicianPerformanceMetrics, Long> {

    /**
     * Find metrics by technician email
     */
    Optional<TechnicianPerformanceMetrics> findByTechnicianEmailIgnoreCase(String technicianEmail);

    /**
     * Check if metrics exist for technician
     */
    boolean existsByTechnicianEmailIgnoreCase(String technicianEmail);

    /**
     * Find top performers by success rate (minimum actions required)
     */
    @Query("SELECT t FROM TechnicianPerformanceMetrics t " +
           "WHERE (t.totalPostsAccepted + t.totalPostsDeclined) >= :minActions " +
           "ORDER BY t.successRate DESC")
    List<TechnicianPerformanceMetrics> findTopPerformers(@Param("minActions") int minActions);

    /**
     * Find top earners by total earnings
     */
    @Query("SELECT t FROM TechnicianPerformanceMetrics t " +
           "WHERE t.totalEarnings > 0 " +
           "ORDER BY t.totalEarnings DESC")
    List<TechnicianPerformanceMetrics> findTopEarners();

    /**
     * Find inactive technicians (no activity in specified days)
     */
    @Query("SELECT t FROM TechnicianPerformanceMetrics t " +
           "WHERE t.lastActivityAt < :cutoffDate " +
           "ORDER BY t.lastActivityAt ASC")
    List<TechnicianPerformanceMetrics> findInactiveTechnicians(@Param("cutoffDate") LocalDateTime cutoffDate);

    /**
     * Find technicians with activity in last N days
     */
    @Query("SELECT t FROM TechnicianPerformanceMetrics t " +
           "WHERE t.lastActivityAt >= :sinceDate")
    List<TechnicianPerformanceMetrics> findActiveTechniciansSince(@Param("sinceDate") LocalDateTime sinceDate);

    /**
     * Get total earnings across all technicians
     */
    @Query("SELECT COALESCE(SUM(t.totalEarnings), 0) FROM TechnicianPerformanceMetrics t")
    BigDecimal getTotalEarnings();

    /**
     * Get average success rate across all technicians
     */
    @Query("SELECT COALESCE(AVG(t.successRate), 0) FROM TechnicianPerformanceMetrics t " +
           "WHERE (t.totalPostsAccepted + t.totalPostsDeclined) > 0")
    BigDecimal getAverageSuccessRate();

    /**
     * Count active technicians (with activity in last 30 days)
     */
    @Query("SELECT COUNT(t) FROM TechnicianPerformanceMetrics t " +
           "WHERE t.lastActivityAt >= :activeSince")
    Long countActiveTechnicians(@Param("activeSince") LocalDateTime activeSince);

    // Admin controller methods
    @Query("SELECT t FROM TechnicianPerformanceMetrics t ORDER BY t.totalEarnings DESC")
    List<TechnicianPerformanceMetrics> findTop10ByOrderByTotalEarningsDesc();
    
    @Query("SELECT t FROM TechnicianPerformanceMetrics t ORDER BY t.successRate DESC")
    List<TechnicianPerformanceMetrics> findTop10ByOrderBySuccessRateDesc();
    
    @Query("SELECT t FROM TechnicianPerformanceMetrics t ORDER BY t.totalPostsAccepted DESC")
    List<TechnicianPerformanceMetrics> findTop10ByOrderByTotalPostsAcceptedDesc();
    
    @Query("SELECT t FROM TechnicianPerformanceMetrics t ORDER BY t.avgResponseTimeMs ASC")
    List<TechnicianPerformanceMetrics> findTop10ByOrderByAvgResponseTimeMsAsc();
    
    @Query("SELECT COALESCE(SUM(t.totalEarnings), 0) FROM TechnicianPerformanceMetrics t")
    BigDecimal calculateTotalEarnings();
    
    @Query("SELECT COALESCE(AVG(t.successRate), 0.0) FROM TechnicianPerformanceMetrics t WHERE (t.totalPostsAccepted + t.totalPostsDeclined) > 0")
    Double calculateAverageSuccessRate();
    
    @Query("SELECT COALESCE(AVG(t.avgResponseTimeMs), 0) FROM TechnicianPerformanceMetrics t WHERE t.avgResponseTimeMs > 0")
    Long calculateAverageResponseTime();
    
    @Query("SELECT COALESCE(SUM(t.totalPostsAccepted), 0) FROM TechnicianPerformanceMetrics t")
    Integer calculateTotalPostsAccepted();
    
    @Query("SELECT COALESCE(SUM(t.totalPostsDeclined), 0) FROM TechnicianPerformanceMetrics t")
    Integer calculateTotalPostsDeclined();
}
