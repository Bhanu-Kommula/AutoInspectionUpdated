package com.auto.dealer.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.auto.dealer.model.DealerAuditLog;

public interface DealerAuditLogRepository extends JpaRepository<DealerAuditLog, Long> {
    
    // Find audit logs by dealer ID
    List<DealerAuditLog> findByDealerIdOrderByUpdatedAtDesc(Long dealerId);
    
    // Find audit logs by dealer email
    List<DealerAuditLog> findByEmailOrderByUpdatedAtDesc(String email);
    
    // Find recent changes for a specific field
    @Query("SELECT dal FROM DealerAuditLog dal WHERE dal.dealerId = :dealerId AND dal.fieldName = :fieldName ORDER BY dal.updatedAt DESC")
    List<DealerAuditLog> findByDealerIdAndFieldName(@Param("dealerId") Long dealerId, @Param("fieldName") String fieldName);

}