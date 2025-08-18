package com.auto.postings.repository;

import com.auto.postings.model.CounterOffer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import jakarta.persistence.LockModeType;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface CounterOfferRepository extends JpaRepository<CounterOffer, Long> {

    // Find all counter offers for a specific post
    List<CounterOffer> findByPostIdOrderByRequestedAtDesc(Long postId);

    // Find all counter offers by technician email
    List<CounterOffer> findByTechnicianEmailOrderByRequestedAtDesc(String technicianEmail);

    // Find pending counter offers for a post
    List<CounterOffer> findByPostIdAndStatusOrderByRequestedAtDesc(Long postId, CounterOffer.CounterOfferStatus status);

    // Find pending counter offers by technician email
    List<CounterOffer> findByTechnicianEmailAndStatusOrderByRequestedAtDesc(String technicianEmail, CounterOffer.CounterOfferStatus status);

    // Find counter offer by post ID and technician email
    Optional<CounterOffer> findByPostIdAndTechnicianEmail(Long postId, String technicianEmail);

    // Check if technician has pending counter offer for a post
    @Query("SELECT COUNT(c) > 0 FROM CounterOffer c WHERE c.postId = :postId AND c.technicianEmail = :technicianEmail AND c.status = 'PENDING' AND c.expiresAt > :now")
    boolean existsPendingCounterOfferByPostIdAndTechnicianEmail(@Param("postId") Long postId, 
                                                               @Param("technicianEmail") String technicianEmail, 
                                                               @Param("now") LocalDateTime now);

    // Find all pending counter offers
    List<CounterOffer> findByStatusOrderByRequestedAtDesc(CounterOffer.CounterOfferStatus status);

    // Find expired counter offers
    @Query("SELECT c FROM CounterOffer c WHERE c.status = 'PENDING' AND c.expiresAt < :now")
    List<CounterOffer> findExpiredCounterOffers(@Param("now") LocalDateTime now);

    // Count pending counter offers for a post
    @Query("SELECT COUNT(c) FROM CounterOffer c WHERE c.postId = :postId AND c.status = 'PENDING' AND c.expiresAt > :now")
    long countPendingCounterOffersByPostId(@Param("postId") Long postId, @Param("now") LocalDateTime now);

    // Find counter offers by status for a specific post
    @Query("SELECT c FROM CounterOffer c WHERE c.postId = :postId AND c.status = :status AND c.id != :excludeId")
    List<CounterOffer> findByPostIdAndStatusAndIdNot(@Param("postId") Long postId, 
                                                     @Param("status") CounterOffer.CounterOfferStatus status, 
                                                     @Param("excludeId") Long excludeId);

    // Find counter offers by post and technician ordered by requested date
    List<CounterOffer> findByPostIdAndTechnicianEmailOrderByRequestedAtDesc(Long postId, String technicianEmail);
    
    // Find counter offers by post, technician, and status
    List<CounterOffer> findByPostIdAndTechnicianEmailAndStatus(Long postId, String technicianEmail, CounterOffer.CounterOfferStatus status);

    // Find counter offer by ID with pessimistic lock to prevent race conditions
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT c FROM CounterOffer c WHERE c.id = :id")
    Optional<CounterOffer> findByIdWithLock(@Param("id") Long id);

    // Count counter offers by status
    long countByStatus(CounterOffer.CounterOfferStatus status);
}
