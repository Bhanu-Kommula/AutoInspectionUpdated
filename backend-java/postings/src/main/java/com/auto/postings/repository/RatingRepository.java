package com.auto.postings.repository;

import com.auto.postings.model.Rating;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;
import java.util.Optional;

@Repository
public interface RatingRepository extends JpaRepository<Rating, Long> {
    
    // Find rating by post ID
    Optional<Rating> findByPostId(Long postId);
    
    // Find all ratings for a technician
    List<Rating> findByTechnicianEmailOrderByCreatedAtDesc(String technicianEmail);
    
    // Find all ratings by a dealer
    List<Rating> findByDealerEmailOrderByCreatedAtDesc(String dealerEmail);
    
    // Find ratings with pagination
    Page<Rating> findByTechnicianEmailOrderByCreatedAtDesc(String technicianEmail, Pageable pageable);
    
    // Find ratings by rating value
    List<Rating> findByRating(Integer rating);
    
    // Find ratings by technician and rating value
    List<Rating> findByTechnicianEmailAndRating(String technicianEmail, Integer rating);
    
    // Find ratings within date range
    @Query("SELECT r FROM Rating r WHERE r.createdAt BETWEEN :startDate AND :endDate ORDER BY r.createdAt DESC")
    List<Rating> findByDateRange(@Param("startDate") Date startDate, @Param("endDate") Date endDate);
    
    // Find ratings by technician within date range
    @Query("SELECT r FROM Rating r WHERE r.technicianEmail = :technicianEmail AND r.createdAt BETWEEN :startDate AND :endDate ORDER BY r.createdAt DESC")
    List<Rating> findByTechnicianEmailAndDateRange(@Param("technicianEmail") String technicianEmail, 
                                                   @Param("startDate") Date startDate, 
                                                   @Param("endDate") Date endDate);
    
    // Check if post has been rated
    boolean existsByPostId(Long postId);
    
    // Count ratings by technician
    long countByTechnicianEmail(String technicianEmail);
    
    // Count ratings by dealer
    long countByDealerEmail(String dealerEmail);
    
    // Get average rating for technician
    @Query("SELECT AVG(r.rating) FROM Rating r WHERE r.technicianEmail = :technicianEmail")
    Double getAverageRatingByTechnicianEmail(@Param("technicianEmail") String technicianEmail);
    
    // Get ratings statistics for technician
    @Query("SELECT " +
           "COUNT(r) as totalRatings, " +
           "AVG(r.rating) as averageRating, " +
           "SUM(CASE WHEN r.rating = 5 THEN 1 ELSE 0 END) as fiveStars, " +
           "SUM(CASE WHEN r.rating = 4 THEN 1 ELSE 0 END) as fourStars, " +
           "SUM(CASE WHEN r.rating = 3 THEN 1 ELSE 0 END) as threeStars, " +
           "SUM(CASE WHEN r.rating = 2 THEN 1 ELSE 0 END) as twoStars, " +
           "SUM(CASE WHEN r.rating = 1 THEN 1 ELSE 0 END) as oneStars " +
           "FROM Rating r WHERE r.technicianEmail = :technicianEmail")
    Object[] getRatingStatsByTechnicianEmail(@Param("technicianEmail") String technicianEmail);
    
    // Find top rated technicians
    @Query("SELECT r.technicianEmail, AVG(r.rating) as avgRating, COUNT(r) as totalRatings " +
           "FROM Rating r " +
           "GROUP BY r.technicianEmail " +
           "HAVING COUNT(r) >= :minRatings " +
           "ORDER BY AVG(r.rating) DESC, COUNT(r) DESC")
    List<Object[]> findTopRatedTechnicians(@Param("minRatings") int minRatings, Pageable pageable);
    
    // Find recent ratings
    @Query("SELECT r FROM Rating r ORDER BY r.createdAt DESC")
    List<Rating> findRecentRatings(Pageable pageable);
    
    // Find ratings that need attention (low ratings)
    @Query("SELECT r FROM Rating r WHERE r.rating <= :maxRating ORDER BY r.createdAt DESC")
    List<Rating> findLowRatings(@Param("maxRating") Integer maxRating, Pageable pageable);
}
