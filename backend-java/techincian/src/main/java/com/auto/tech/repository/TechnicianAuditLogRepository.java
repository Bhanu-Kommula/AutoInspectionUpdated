package com.auto.tech.repository;

import java.time.LocalDateTime;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.auto.tech.model.Technician;
import com.auto.tech.model.TechnicianAuditLog;

public interface TechnicianAuditLogRepository extends JpaRepository<TechnicianAuditLog, Long> {
	
    Optional<Technician> findByEmailIgnoreCase(String email);
    
    // Admin controller methods
    Page<TechnicianAuditLog> findByEmail(String email, Pageable pageable);
    
    Page<TechnicianAuditLog> findByFieldName(String fieldName, Pageable pageable);
    
    // Admin controller method for getting all audit logs with pagination
    Page<TechnicianAuditLog> findAll(Pageable pageable);
    
    @Modifying
    @Query("DELETE FROM TechnicianAuditLog t WHERE t.updatedAt < :date")
    long deleteByUpdatedAtBefore(@Param("date") LocalDateTime date);
    
    @Query("SELECT COUNT(t) FROM TechnicianAuditLog t WHERE t.updatedAt > :date")
    long countByUpdatedAtAfter(@Param("date") LocalDateTime date);
}