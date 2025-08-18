package com.auto.tech.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.auto.tech.dto.TechInfoToGetPostsByLocationDto;
import com.auto.tech.model.Technician;

@Repository
public interface TechnicianRepository extends JpaRepository<Technician, Long> {
	
	Optional<Technician> findByEmailIgnoreCase(String email);
	
	// Admin controller methods
	Page<Technician> findByLocationContainingIgnoreCase(String location, Pageable pageable);
	
	Page<Technician> findByYearsOfExperienceContainingIgnoreCase(String experience, Pageable pageable);
	
	@Query("SELECT t FROM Technician t WHERE " +
	       "LOWER(t.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
	       "LOWER(t.email) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
	       "LOWER(t.location) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
	       "LOWER(t.delearshipName) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
	Page<Technician> findBySearchTerm(@Param("searchTerm") String searchTerm, Pageable pageable);
	
	@Query("SELECT COUNT(t) FROM Technician t WHERE t.lastActivityAt > :date")
	long countByLastActivityAfter(@Param("date") LocalDateTime date);
	
	@Query("SELECT COUNT(t) FROM Technician t WHERE t.createdAt > :date")
	long countByCreatedAtAfter(@Param("date") LocalDateTime date);
	
	@Query("SELECT COUNT(t) FROM Technician t WHERE t.status = :status")
	long countByStatus(@Param("status") String status);
	
	Page<Technician> findByStatus(String status, Pageable pageable);
	
	@Query("SELECT t FROM Technician t WHERE t.status != :status")
	Page<Technician> findByStatusNot(@Param("status") String status, Pageable pageable);

	// Export method - returns List instead of Page
	List<Technician> findByLocationContainingIgnoreCase(String location);

}
