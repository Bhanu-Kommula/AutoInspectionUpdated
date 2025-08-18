package com.auto.postings.repository;

import com.auto.postings.model.AcceptedPost;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Accepted Post Repository
 * Simple and efficient - one table, unique constraint on post_id ensures only one acceptance per post
 */
@Repository
public interface AcceptedPostRepository extends JpaRepository<AcceptedPost, Long> {

    /**
     * Find accepted post by post ID
     * The unique constraint ensures only one record can exist per post
     */
    Optional<AcceptedPost> findByPostId(Long postId);

    /**
     * Check if a post has been accepted by anyone
     * Used for validation before acceptance attempts
     */
    boolean existsByPostId(Long postId);

    /**
     * Find all accepted posts by technician email
     * Same technician can have multiple posts, but each post can only be accepted once
     */
    List<AcceptedPost> findByTechnicianEmailOrderByAcceptedAtDesc(String technicianEmail);

    /**
     * Count how many posts a technician has accepted
     */
    long countByTechnicianEmail(String technicianEmail);

    /**
     * Get all accepted post IDs for filtering purposes
     */
    @Query("SELECT a.postId FROM AcceptedPost a")
    List<Long> findAllAcceptedPostIds();

    /**
     * Get accepted post IDs by technician email
     */
    @Query("SELECT a.postId FROM AcceptedPost a WHERE TRIM(LOWER(a.technicianEmail)) = TRIM(LOWER(:email))")
    List<Long> findAcceptedPostIdsByTechnicianEmail(@Param("email") String technicianEmail);
}