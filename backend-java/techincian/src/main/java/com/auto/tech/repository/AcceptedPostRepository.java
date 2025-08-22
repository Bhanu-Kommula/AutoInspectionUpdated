package com.auto.tech.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import jakarta.persistence.LockModeType;
import java.util.Optional;

import com.auto.tech.model.TechAcceptedPost;

@Repository
public interface AcceptedPostRepository extends JpaRepository<TechAcceptedPost, Long> {

    // ✅ All posts accepted by this technician
    @Query("SELECT t.postId FROM TechAcceptedPost t WHERE TRIM(LOWER(t.email)) = TRIM(LOWER(:email))")
    List<Long> findAllAcceptedPostIdsByEmail(@Param("email") String email);

    // ✅ All accepted posts (used to filter out accepted ones globally)
    @Query("SELECT t.postId FROM TechAcceptedPost t")
    List<Long> findAllAcceptedPostIds();

    // ✅ Check if a post is accepted by this technician (for display purposes)
    boolean existsByPostIdAndEmailIgnoreCase(Long postId, String email);

    // ✅ NEW: Check if a post is accepted by anyone (used in atomic check)
    boolean existsByPostId(Long postId);
    
    // ✅ Find accepted post by post ID (without locking)
    Optional<TechAcceptedPost> findByPostId(Long postId);
    
    // ✅ RACE CONDITION PROTECTION: Find accepted post with pessimistic lock
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT t FROM TechAcceptedPost t WHERE t.postId = :postId")
    Optional<TechAcceptedPost> findByPostIdWithLock(@Param("postId") Long postId);
    
    // Admin controller methods
    Page<TechAcceptedPost> findByEmail(String email, Pageable pageable);
    
    // Admin controller method for delete check - returns List instead of Page
    List<TechAcceptedPost> findByEmail(String email);
    
    // Admin controller method for getting all accepted posts with pagination
    Page<TechAcceptedPost> findAll(Pageable pageable);
    
    @Query("SELECT COUNT(t) FROM TechAcceptedPost t WHERE t.acceptedAt > :date")
    long countByAcceptedAtAfter(@Param("date") LocalDateTime date);
    
    @Query("SELECT COUNT(t) FROM TechAcceptedPost t WHERE t.email = :email")
    long countByEmail(@Param("email") String email);
}