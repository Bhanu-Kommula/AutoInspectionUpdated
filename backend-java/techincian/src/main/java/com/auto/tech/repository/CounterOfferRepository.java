package com.auto.tech.repository;

import com.auto.tech.model.TechCounterOffer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface CounterOfferRepository extends JpaRepository<TechCounterOffer, Long> {

    // Find active counter offers by post ID
    @Query("SELECT co FROM TechCounterOffer co WHERE co.postId = :postId AND co.status = :pendingStatus AND (co.expiresAt IS NULL OR co.expiresAt > :now)")
    List<TechCounterOffer> findActiveCounterOffersByPostId(@Param("postId") Long postId, @Param("now") LocalDateTime now, @Param("pendingStatus") TechCounterOffer.CounterOfferStatus pendingStatus);

    // Find counter offers by technician email
    @Query("SELECT co FROM TechCounterOffer co WHERE co.technicianEmail = :email ORDER BY co.requestedAt DESC")
    List<TechCounterOffer> findByTechnicianEmail(@Param("email") String email);

    // Find pending counter offers by technician email
    @Query("SELECT co FROM TechCounterOffer co WHERE co.technicianEmail = :email AND co.status = :pendingStatus AND (co.expiresAt IS NULL OR co.expiresAt > :now)")
    List<TechCounterOffer> findPendingCounterOffersByTechnicianEmail(@Param("email") String email, @Param("now") LocalDateTime now, @Param("pendingStatus") TechCounterOffer.CounterOfferStatus pendingStatus);

    // Find counter offer by post ID and technician email
    @Query("SELECT co FROM TechCounterOffer co WHERE co.postId = :postId AND co.technicianEmail = :email AND co.status = :pendingStatus")
    Optional<TechCounterOffer> findByPostIdAndTechnicianEmail(@Param("postId") Long postId, @Param("email") String email, @Param("pendingStatus") TechCounterOffer.CounterOfferStatus pendingStatus);

    // Check if technician has pending counter offer for a post
    @Query("SELECT COUNT(co) > 0 FROM TechCounterOffer co WHERE co.postId = :postId AND co.technicianEmail = :email AND co.status = :pendingStatus AND (co.expiresAt IS NULL OR co.expiresAt > :now)")
    boolean existsPendingCounterOfferByPostIdAndTechnicianEmail(@Param("postId") Long postId, @Param("email") String email, @Param("now") LocalDateTime now, @Param("pendingStatus") TechCounterOffer.CounterOfferStatus pendingStatus);

    // Find expired counter offers
    @Query("SELECT co FROM TechCounterOffer co WHERE co.status = :pendingStatus AND co.expiresAt IS NOT NULL AND co.expiresAt <= :now")
    List<TechCounterOffer> findExpiredCounterOffers(@Param("now") LocalDateTime now, @Param("pendingStatus") TechCounterOffer.CounterOfferStatus pendingStatus);

    // Count pending counter offers by technician email
    @Query("SELECT COUNT(co) FROM TechCounterOffer co WHERE co.technicianEmail = :email AND co.status = :pendingStatus AND (co.expiresAt IS NULL OR co.expiresAt > :now)")
    long countPendingCounterOffersByTechnicianEmail(@Param("email") String email, @Param("now") LocalDateTime now, @Param("pendingStatus") TechCounterOffer.CounterOfferStatus pendingStatus);

    // Find counter offers by status
    @Query("SELECT co FROM TechCounterOffer co WHERE co.status = :status ORDER BY co.requestedAt DESC")
    List<TechCounterOffer> findByStatus(@Param("status") TechCounterOffer.CounterOfferStatus status);

    // Find counter offers by post and technician ordered by requested date
    @Query("SELECT co FROM TechCounterOffer co WHERE co.postId = :postId AND co.technicianEmail = :email ORDER BY co.requestedAt DESC")
    List<TechCounterOffer> findCounterOffersByPostAndTechnicianOrderByRequestedAtDesc(@Param("postId") Long postId, @Param("email") String email);

    // Find the most recent counter offer for a specific post by a specific technician
    default Optional<TechCounterOffer> findMostRecentCounterOfferByPostAndTechnician(Long postId, String email) {
        List<TechCounterOffer> offers = findCounterOffersByPostAndTechnicianOrderByRequestedAtDesc(postId, email);
        return offers.isEmpty() ? Optional.empty() : Optional.of(offers.get(0));
    }

    // Check if technician has submitted any counter offer for a specific post within the given time period
    @Query("SELECT COUNT(co) > 0 FROM TechCounterOffer co WHERE co.postId = :postId AND co.technicianEmail = :email AND co.requestedAt > :cutoffTime")
    boolean hasRecentCounterOffer(@Param("postId") Long postId, @Param("email") String email, @Param("cutoffTime") LocalDateTime cutoffTime);

    // Mark expired requests as expired
    @Modifying
    @Query("UPDATE TechCounterOffer co SET co.status = :expiredStatus, co.updatedAt = :now WHERE co.status = :pendingStatus AND co.expiresAt IS NOT NULL AND co.expiresAt <= :now")
    int markExpiredCounterOffers(@Param("now") LocalDateTime now, @Param("pendingStatus") TechCounterOffer.CounterOfferStatus pendingStatus, @Param("expiredStatus") TechCounterOffer.CounterOfferStatus expiredStatus);

    // Delete old expired requests (cleanup)
    @Query("DELETE FROM TechCounterOffer co WHERE co.status = :expiredStatus AND co.expiresAt < :cutoffDate")
    int deleteOldExpiredCounterOffers(@Param("cutoffDate") LocalDateTime cutoffDate, @Param("expiredStatus") TechCounterOffer.CounterOfferStatus expiredStatus);

    // Find counter offer by posting service counter offer ID
    @Query("SELECT co FROM TechCounterOffer co WHERE co.postingServiceCounterOfferId = :postingServiceId")
    Optional<TechCounterOffer> findByPostingServiceCounterOfferId(@Param("postingServiceId") Long postingServiceId);

    // Find counter offers by post, technician, and status
    @Query("SELECT co FROM TechCounterOffer co WHERE co.postId = :postId AND co.technicianEmail = :email AND co.status = :status ORDER BY co.requestedAt DESC")
    List<TechCounterOffer> findCounterOffersByPostAndTechnicianAndStatus(@Param("postId") Long postId, @Param("email") String email, @Param("status") TechCounterOffer.CounterOfferStatus status);

    // Admin controller methods
    Page<TechCounterOffer> findByStatus(TechCounterOffer.CounterOfferStatus status, Pageable pageable);
    
    Page<TechCounterOffer> findByTechnicianEmail(String technicianEmail, Pageable pageable);
    
    Page<TechCounterOffer> findByPostId(Long postId, Pageable pageable);
    
    // Admin controller method for getting all counter offers with pagination
    Page<TechCounterOffer> findAll(Pageable pageable);
    
    long countByStatus(TechCounterOffer.CounterOfferStatus status);
}
