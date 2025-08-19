package com.auto.dealer.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.auto.dealer.model.Dealer;
import com.auto.dealer.model.Dealer.DealerStatus;

@Repository
public interface DealerRepository extends JpaRepository<Dealer, Long> {
	
	Optional<Dealer> findByEmail(String email);
	Optional<Dealer> findByDealerId(long dealerId);
	
	// Search and filter methods
	List<Dealer> findByStatus(DealerStatus status);
	List<Dealer> findByLocationContainingIgnoreCase(String location);
	List<Dealer> findByZipcode(String zipcode);
	List<Dealer> findByPhoneContaining(String phone);
	List<Dealer> findByStatusAndLocationContainingIgnoreCase(DealerStatus status, String location);
	
	// Date range queries
	List<Dealer> findByRegisteredAtBetween(LocalDateTime startDate, LocalDateTime endDate);
	List<Dealer> findByRegisteredAtAfter(LocalDateTime date);
	long countByRegisteredAtAfter(LocalDateTime date);
	long countByLastUpdatedAtAfter(LocalDateTime date);
	
	// Combined search queries
	@Query("SELECT d FROM Dealer d WHERE " +
		   "(:name IS NULL OR d.name LIKE %:name%) AND " +
		   "(:email IS NULL OR d.email LIKE %:email%) AND " +
		   "(:location IS NULL OR d.location LIKE %:location%) AND " +
		   "(:zipcode IS NULL OR d.zipcode = :zipcode) AND " +
		   "(:status IS NULL OR d.status = :status) AND " +
		   "(:phone IS NULL OR d.phone LIKE %:phone%)")
	Page<Dealer> findDealersByCriteria(
		@Param("name") String name,
		@Param("email") String email,
		@Param("location") String location,
		@Param("zipcode") String zipcode,
		@Param("status") DealerStatus status,
		@Param("phone") String phone,
		Pageable pageable
	);
	
	// Count by status
	long countByStatus(DealerStatus status);
	
	// Find by multiple IDs for bulk operations
	List<Dealer> findByDealerIdIn(List<Long> dealerIds);
}
