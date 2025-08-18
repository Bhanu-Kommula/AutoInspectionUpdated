package com.auto.tech.repository;

import com.auto.tech.model.TechnicianPostInteraction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository for Technician Post Interactions
 * Following the current main service pattern
 */
@Repository
public interface TechnicianPostInteractionRepository extends JpaRepository<TechnicianPostInteraction, Long> {

    /**
     * Find interactions by technician email
     */
    List<TechnicianPostInteraction> findByTechnicianEmailIgnoreCaseOrderByCreatedAtDesc(String technicianEmail);

    /**
     * Find interactions by post ID
     */
    List<TechnicianPostInteraction> findByPostIdOrderByCreatedAtDesc(Long postId);

    /**
     * Find interactions by technician email and post ID
     */
    List<TechnicianPostInteraction> findByTechnicianEmailIgnoreCaseAndPostIdOrderByCreatedAtDesc(
            String technicianEmail, Long postId);

    /**
     * Find interactions by action type
     */
    List<TechnicianPostInteraction> findByActionTypeOrderByCreatedAtDesc(
            TechnicianPostInteraction.ActionType actionType);

    /**
     * Find interactions by technician email and action type
     */
    List<TechnicianPostInteraction> findByTechnicianEmailIgnoreCaseAndActionTypeOrderByCreatedAtDesc(
            String technicianEmail, TechnicianPostInteraction.ActionType actionType);

    /**
     * Find interactions by action status
     */
    List<TechnicianPostInteraction> findByActionStatusOrderByCreatedAtDesc(
            TechnicianPostInteraction.ActionStatus actionStatus);

    /**
     * Find successful interactions by technician email
     */
    @Query("SELECT t FROM TechnicianPostInteraction t " +
           "WHERE t.technicianEmail = :technicianEmail " +
           "AND t.actionStatus = 'SUCCESS' " +
           "ORDER BY t.createdAt DESC")
    List<TechnicianPostInteraction> findSuccessfulInteractionsByTechnician(
            @Param("technicianEmail") String technicianEmail);

    /**
     * Find failed interactions by technician email
     */
    @Query("SELECT t FROM TechnicianPostInteraction t " +
           "WHERE t.technicianEmail = :technicianEmail " +
           "AND t.actionStatus = 'FAILED' " +
           "ORDER BY t.createdAt DESC")
    List<TechnicianPostInteraction> findFailedInteractionsByTechnician(
            @Param("technicianEmail") String technicianEmail);

    /**
     * Check if technician has interacted with a specific post
     */
    boolean existsByTechnicianEmailIgnoreCaseAndPostId(String technicianEmail, Long postId);

    /**
     * Find interactions within a date range
     */
    @Query("SELECT t FROM TechnicianPostInteraction t " +
           "WHERE t.createdAt BETWEEN :startDate AND :endDate " +
           "ORDER BY t.createdAt DESC")
    List<TechnicianPostInteraction> findInteractionsInDateRange(
            @Param("startDate") LocalDateTime startDate, 
            @Param("endDate") LocalDateTime endDate);

    /**
     * Find interactions by technician email within a date range
     */
    @Query("SELECT t FROM TechnicianPostInteraction t " +
           "WHERE t.technicianEmail = :technicianEmail " +
           "AND t.createdAt BETWEEN :startDate AND :endDate " +
           "ORDER BY t.createdAt DESC")
    List<TechnicianPostInteraction> findInteractionsByTechnicianInDateRange(
            @Param("technicianEmail") String technicianEmail,
            @Param("startDate") LocalDateTime startDate, 
            @Param("endDate") LocalDateTime endDate);

    /**
     * Count interactions by technician email
     */
    long countByTechnicianEmailIgnoreCase(String technicianEmail);

    /**
     * Count interactions by technician email and action type
     */
    long countByTechnicianEmailIgnoreCaseAndActionType(String technicianEmail, 
                                                      TechnicianPostInteraction.ActionType actionType);

    /**
     * Count successful interactions by technician email
     */
    long countByTechnicianEmailIgnoreCaseAndActionStatus(String technicianEmail, 
                                                        TechnicianPostInteraction.ActionStatus actionStatus);

    /**
     * Find recent interactions (last N days)
     */
    @Query("SELECT t FROM TechnicianPostInteraction t " +
           "WHERE t.createdAt >= :sinceDate " +
           "ORDER BY t.createdAt DESC")
    List<TechnicianPostInteraction> findRecentInteractions(@Param("sinceDate") LocalDateTime sinceDate);
}
