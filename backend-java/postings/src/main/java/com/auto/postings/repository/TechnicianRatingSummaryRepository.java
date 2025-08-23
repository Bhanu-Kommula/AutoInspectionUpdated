package com.auto.postings.repository;

import com.auto.postings.model.TechnicianRatingSummary;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface TechnicianRatingSummaryRepository extends JpaRepository<TechnicianRatingSummary, Long> {
    
    // Find summary by technician email
    Optional<TechnicianRatingSummary> findByTechnicianEmail(String technicianEmail);
    
    // Find technicians with minimum rating
    @Query("SELECT t FROM TechnicianRatingSummary t WHERE t.averageRating >= :minRating AND t.totalRatings >= :minRatings ORDER BY t.averageRating DESC, t.totalRatings DESC")
    List<TechnicianRatingSummary> findByMinimumRating(@Param("minRating") BigDecimal minRating, @Param("minRatings") Integer minRatings);
    
    // Find technicians with minimum rating (paginated)
    @Query("SELECT t FROM TechnicianRatingSummary t WHERE t.averageRating >= :minRating AND t.totalRatings >= :minRatings ORDER BY t.averageRating DESC, t.totalRatings DESC")
    Page<TechnicianRatingSummary> findByMinimumRating(@Param("minRating") BigDecimal minRating, @Param("minRatings") Integer minRatings, Pageable pageable);
    
    // Find top rated technicians
    @Query("SELECT t FROM TechnicianRatingSummary t WHERE t.totalRatings >= :minRatings ORDER BY t.averageRating DESC, t.totalRatings DESC")
    List<TechnicianRatingSummary> findTopRated(@Param("minRatings") Integer minRatings, Pageable pageable);
    
    // Find technicians needing improvement
    @Query("SELECT t FROM TechnicianRatingSummary t WHERE t.averageRating < :maxRating AND t.totalRatings >= :minRatings ORDER BY t.averageRating ASC")
    List<TechnicianRatingSummary> findNeedingImprovement(@Param("maxRating") BigDecimal maxRating, @Param("minRatings") Integer minRatings);
    
    // Find technicians eligible for premium jobs
    @Query("SELECT t FROM TechnicianRatingSummary t WHERE t.averageRating >= :minRating AND t.totalRatings >= :minRatings ORDER BY t.averageRating DESC, t.totalRatings DESC")
    List<TechnicianRatingSummary> findEligibleForPremiumJobs(@Param("minRating") BigDecimal minRating, @Param("minRatings") Integer minRatings);
    
    // Find all with pagination and sorting
    Page<TechnicianRatingSummary> findAllByOrderByAverageRatingDescTotalRatingsDesc(Pageable pageable);
    
    // Find technicians with ratings between range
    @Query("SELECT t FROM TechnicianRatingSummary t WHERE t.averageRating BETWEEN :minRating AND :maxRating AND t.totalRatings >= :minRatings ORDER BY t.averageRating DESC")
    List<TechnicianRatingSummary> findByRatingRange(@Param("minRating") BigDecimal minRating, 
                                                    @Param("maxRating") BigDecimal maxRating, 
                                                    @Param("minRatings") Integer minRatings);
    
    // Count technicians by rating range
    @Query("SELECT COUNT(t) FROM TechnicianRatingSummary t WHERE t.averageRating BETWEEN :minRating AND :maxRating AND t.totalRatings >= :minRatings")
    long countByRatingRange(@Param("minRating") BigDecimal minRating, 
                           @Param("maxRating") BigDecimal maxRating, 
                           @Param("minRatings") Integer minRatings);
    
    // Get rating statistics
    @Query("SELECT " +
           "COUNT(t) as totalTechnicians, " +
           "AVG(t.averageRating) as overallAverage, " +
           "SUM(t.totalRatings) as totalRatings, " +
           "MAX(t.averageRating) as highestRating, " +
           "MIN(t.averageRating) as lowestRating " +
           "FROM TechnicianRatingSummary t WHERE t.totalRatings > 0")
    Object[] getOverallStatistics();
    
    // Find technicians with no ratings
    @Query("SELECT t FROM TechnicianRatingSummary t WHERE t.totalRatings = 0")
    List<TechnicianRatingSummary> findWithNoRatings();
    
    // Check if technician exists in summary
    boolean existsByTechnicianEmail(String technicianEmail);
}
