package com.auto.postings.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import jakarta.persistence.LockModeType;

import com.auto.postings.model.Posting;
import com.auto.postings.model.PostStatus;

@Repository
public interface PostingRepository extends JpaRepository<Posting, Long>{
    
    // ✅ SOFT DELETE: Find active posts (excluding DELETED status) - OLDEST FIRST
    @Query("SELECT p FROM Posting p WHERE p.email = :email AND p.status != 'DELETED' ORDER BY p.id ASC")
    List<Posting> findByEmailOrderByIdDesc(@Param("email") String email);
    
    // ✅ SOFT DELETE: Find all active posts (excluding DELETED and ACCEPTED status) - OLDEST FIRST
    // ACCEPTED posts should not appear in technician feed
    @Query("SELECT p FROM Posting p WHERE p.status != 'DELETED' AND p.status != 'ACCEPTED' ORDER BY p.id ASC")
    List<Posting> findAllActive();
    
    // ✅ SOFT DELETE: Find only deleted posts - OLDEST FIRST
    @Query("SELECT p FROM Posting p WHERE p.status = 'DELETED' ORDER BY p.id ASC")
    List<Posting> findAllDeleted();
    
    // ✅ SOFT DELETE: Find posts by email including deleted ones - OLDEST FIRST
    @Query("SELECT p FROM Posting p WHERE p.email = :email ORDER BY p.id ASC")
    List<Posting> findByEmailOrderByIdDescIncludingDeleted(@Param("email") String email);
    
    	// Legacy methods (keeping for compatibility)
	List<Posting> findAll();
	void deleteById(Long id);
	Optional<Posting> findById(Long id);
	
	// ✅ PESSIMISTIC LOCKING: Find post by ID with lock to prevent race conditions
	@Query("SELECT p FROM Posting p WHERE p.id = :id")
	@Lock(LockModeType.PESSIMISTIC_WRITE)
	Optional<Posting> findByIdWithLock(@Param("id") Long id);

	// ==================== ADMIN REPOSITORY METHODS ====================

	/**
	 * Find all posts with filters for admin
	 */
	@Query("SELECT p FROM Posting p WHERE " +
		   "(:status IS NULL OR p.status = :status) AND " +
		   "(:location IS NULL OR p.location LIKE %:location%) AND " +
		   "(:dealerEmail IS NULL OR p.email = :dealerEmail) AND " +
		   "(:search IS NULL OR p.content LIKE %:search% OR p.location LIKE %:search%) " +
		   "ORDER BY p.createdAt DESC")
	List<Posting> findAllWithFilters(
		@Param("status") String status,
		@Param("location") String location,
		@Param("dealerEmail") String dealerEmail,
		@Param("search") String search);

	/**
	 * Count posts with filters for admin
	 */
	@Query("SELECT COUNT(p) FROM Posting p WHERE " +
		   "(:status IS NULL OR p.status = :status) AND " +
		   "(:location IS NULL OR p.location LIKE %:location%) AND " +
		   "(:dealerEmail IS NULL OR p.email = :dealerEmail) AND " +
		   "(:search IS NULL OR p.content LIKE %:search% OR p.location LIKE %:search%)")
	long countWithFilters(
		@Param("status") String status,
		@Param("location") String location,
		@Param("dealerEmail") String dealerEmail,
		@Param("search") String search);

	/**
	 * Count posts by status
	 */
	@Query("SELECT COUNT(p) FROM Posting p WHERE p.status = :status")
	long countByStatus(@Param("status") PostStatus status);

	/**
	 * Find all posts with pagination for admin
	 */
	@Query("SELECT p FROM Posting p ORDER BY p.createdAt DESC")
	List<Posting> findAllWithPagination(
		@Param("page") int page,
		@Param("size") int size);

	/**
	 * Find posts by date range for admin
	 */
	@Query("SELECT p FROM Posting p WHERE p.createdAt BETWEEN :dateFrom AND :dateTo ORDER BY p.createdAt DESC")
	List<Posting> findByDateRange(
		@Param("dateFrom") java.util.Date dateFrom,
		@Param("dateTo") java.util.Date dateTo);

	/**
	 * Count posts by date range for admin
	 */
	@Query("SELECT COUNT(p) FROM Posting p WHERE p.createdAt BETWEEN :dateFrom AND :dateTo")
	long countByDateRange(
		@Param("dateFrom") java.util.Date dateFrom,
		@Param("dateTo") java.util.Date dateTo);
}
