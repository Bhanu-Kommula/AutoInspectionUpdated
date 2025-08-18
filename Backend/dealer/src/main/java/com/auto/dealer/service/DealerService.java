package com.auto.dealer.service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import com.auto.dealer.dto.ApiResponse;
import com.auto.dealer.dto.BulkDealerActionDto;
import com.auto.dealer.dto.DealerListDto;
import com.auto.dealer.dto.DealerSearchDto;
import com.auto.dealer.dto.PostingDto;
import com.auto.dealer.dto.RegisterDealerDto;
import com.auto.dealer.dto.UpdateDealerDto;
import com.auto.dealer.model.Dealer;
import com.auto.dealer.model.DealerAuditLog;
import com.auto.dealer.model.Dealer.DealerStatus;
import com.auto.dealer.repository.DealerAuditLogRepository;
import com.auto.dealer.repository.DealerRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class DealerService {

    private final DealerRepository repo;
    private final DealerAuditLogRepository auditRepo;
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public ResponseEntity<ApiResponse<Dealer>> register(RegisterDealerDto dealerDto) {
        try {
            Dealer dealer = new Dealer();
            dealer.setName(dealerDto.getName());
            dealer.setEmail(dealerDto.getEmail());
            dealer.setPassword(dealerDto.getPassword());
            dealer.setLocation(dealerDto.getLocation());
            dealer.setZipcode(dealerDto.getZipcode());
            dealer.setPhone(dealerDto.getPhone());
            dealer.setStatus(DealerStatus.PENDING_VERIFICATION);
            
            if (repo.findByEmail(dealer.getEmail()).isPresent()) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("Dealer with this email already exists"));
            }
            
            Dealer savedDealer = repo.save(dealer);
            log.info("Dealer registered successfully: {} with dealerId: {}", savedDealer.getEmail(), savedDealer.getDealerId());
            return ResponseEntity.status(201)
                    .body(ApiResponse.success("Dealer registered successfully", savedDealer));
        } catch (DataIntegrityViolationException e) {
            log.error("Data integrity violation during dealer registration: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Email or Dealer ID already exists. Please try different values."));
        } catch (Exception e) {
            log.error("Unexpected error during dealer registration: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Failed to register dealer"));
        }
    }
    
    // TODO: Implement password hashing in future for security
    // private String hashPassword(String password) {
    //     return passwordEncoder.encode(password);
    // }
    
    public ResponseEntity<ApiResponse<PostingDto>> login(String email, String password) {
        try {
            Optional<Dealer> dealerOpt = repo.findByEmail(email);
            if (dealerOpt.isPresent()) {
                Dealer dealer = dealerOpt.get();
                
                if (dealer.getStatus() == DealerStatus.SUSPENDED) {
                    return ResponseEntity.status(403)
                            .body(ApiResponse.error("Account is suspended. Please contact support."));
                }
                
                if (dealer.getStatus() == DealerStatus.PENDING_VERIFICATION) {
                    return ResponseEntity.status(403)
                            .body(ApiResponse.error("Account is pending verification. Please contact support."));
                }
                
                if (password != null && password.equals(dealer.getPassword())) {
                    PostingDto postingInfo = PostingDto.builder()
                            .dealerId(dealer.getDealerId())
                            .email(dealer.getEmail())
                            .name(dealer.getName())
                            .phone(dealer.getPhone())
                            .build();
                    log.info("Successful login for dealer: {} (dealerId: {})", email, dealer.getDealerId());
                    return ResponseEntity.ok(ApiResponse.success("Login successful", postingInfo));
                } else {
                    log.warn("Invalid password attempt for dealer: {}", email);
                    return ResponseEntity.status(401)
                            .body(ApiResponse.error("Invalid credentials"));
                }
            } else {
                log.warn("Login attempt for non-existent dealer: {}", email);
                return ResponseEntity.status(404)
                        .body(ApiResponse.error("Dealer not found"));
            }
        } catch (Exception e) {
            log.error("Unexpected error during login for email {}: {}", email, e.getMessage());
            return ResponseEntity.status(500)
                    .body(ApiResponse.error("Login failed due to server error"));
        }
    }
    
    
    public ResponseEntity<ApiResponse<Dealer>> updateDealer(UpdateDealerDto dto) {
        try {
            if (!isValid(dto.getEmail())) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("Email is required for update"));
            }

            Optional<Dealer> dealerOpt = repo.findByEmail(dto.getEmail());
            if (dealerOpt.isEmpty()) {
                return ResponseEntity.status(404)
                        .body(ApiResponse.error("Dealer not found"));
            }

            Dealer dealer = dealerOpt.get();
            boolean hasChanges = false;

            // Don't allow changing dealerId as it's the primary key
            // The dealerId in DTO should match the existing dealer
            if (dto.getDealerId() != dealer.getDealerId()) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("Dealer ID cannot be changed"));
            }

            if (isValid(dto.getName()) && !dto.getName().equals(dealer.getName())) {
                logChange(dealer, "name", dealer.getName(), dto.getName(), dto.getUpdatedBy());
                dealer.setName(dto.getName());
                hasChanges = true;
            }

            if (isValid(dto.getPassword()) && !dto.getPassword().equals(dealer.getPassword())) {
                logChange(dealer, "password", "********", "********", dto.getUpdatedBy());
                dealer.setPassword(dto.getPassword());
                hasChanges = true;
            }

            if (isValid(dto.getLocation()) && !dto.getLocation().equals(dealer.getLocation())) {
                logChange(dealer, "location", dealer.getLocation(), dto.getLocation(), dto.getUpdatedBy());
                dealer.setLocation(dto.getLocation());
                hasChanges = true;
            }

            if (isValid(dto.getZipcode()) && !dto.getZipcode().equals(dealer.getZipcode())) {
                logChange(dealer, "zipcode", dealer.getZipcode(), dto.getZipcode(), dto.getUpdatedBy());
                dealer.setZipcode(dto.getZipcode());
                hasChanges = true;
            }

            if (isValid(dto.getPhone()) && !dto.getPhone().equals(dealer.getPhone())) {
                logChange(dealer, "phone", dealer.getPhone(), dto.getPhone(), dto.getUpdatedBy());
                dealer.setPhone(dto.getPhone());
                hasChanges = true;
            }

            if (!hasChanges) {
                return ResponseEntity.ok(ApiResponse.success("No changes detected", dealer));
            }

            dealer.setLastUpdatedAt(LocalDateTime.now());
            Dealer updated = repo.save(dealer);
            log.info("Dealer profile updated successfully: {} (dealerId: {})", dealer.getEmail(), dealer.getDealerId());
            return ResponseEntity.ok(ApiResponse.success("Profile updated successfully", updated));
        } catch (Exception e) {
            log.error("Error updating dealer profile for email {}: {}", dto.getEmail(), e.getMessage());
            return ResponseEntity.status(500)
                    .body(ApiResponse.error("Failed to update profile"));
        }
    }

    public ResponseEntity<ApiResponse<Dealer>> updateOwnProfile(String email, UpdateDealerDto dto) {
        try {
            Optional<Dealer> dealerOpt = repo.findByEmail(email);
            if (dealerOpt.isEmpty()) {
                return ResponseEntity.status(404)
                        .body(ApiResponse.error("Dealer not found"));
            }

            Dealer dealer = dealerOpt.get();
            // Set the dealerId from the existing dealer
            dto.setDealerId(dealer.getDealerId());
            
            return updateDealer(dto);
        } catch (Exception e) {
            log.error("Error updating own profile for email {}: {}", email, e.getMessage());
            return ResponseEntity.status(500)
                    .body(ApiResponse.error("Failed to update profile"));
        }
    }
    
    private void logChange(Dealer dealer, String field, String oldValue, String newValue, String updatedBy) {
        try {
            DealerAuditLog log = DealerAuditLog.builder()
                    .dealerId(dealer.getDealerId())
                    .email(dealer.getEmail())
                    .fieldName(field)
                    .oldValue(oldValue)
                    .newValue(newValue)
                    .updatedBy(updatedBy)
                    .updatedAt(LocalDateTime.now())
                    .build();
            auditRepo.save(log);
        } catch (Exception e) {
            log.error("Failed to log audit trail for dealer {}: {}", dealer.getEmail(), e.getMessage());
            // Don't fail the main operation if audit logging fails
        }
    }

    private boolean isValid(String value) {
        return value != null && !value.isBlank();
    }
    
    
    
    public ResponseEntity<ApiResponse<Dealer>> getDealerProfileByEmail(String email) {
        try {
            Optional<Dealer> dealerOpt = repo.findByEmail(email);
            if (dealerOpt.isPresent()) {
                return ResponseEntity.ok(ApiResponse.success(dealerOpt.get()));
            } else {
                return ResponseEntity.status(404)
                        .body(ApiResponse.error("Dealer not found"));
            }
        } catch (Exception e) {
            log.error("Error retrieving dealer profile for email {}: {}", email, e.getMessage());
            return ResponseEntity.status(500)
                    .body(ApiResponse.error("Failed to retrieve profile"));
        }
    }
    
    public ResponseEntity<ApiResponse<Dealer>> getDealerProfileByDealerId(long dealerId) {
        try {
            Optional<Dealer> dealerOpt = repo.findByDealerId(dealerId);
            if (dealerOpt.isPresent()) {
                return ResponseEntity.ok(ApiResponse.success(dealerOpt.get()));
            } else {
                return ResponseEntity.status(404)
                        .body(ApiResponse.error("Dealer not found"));
            }
        } catch (Exception e) {
            log.error("Error retrieving dealer profile for dealerId {}: {}", dealerId, e.getMessage());
            return ResponseEntity.status(500)
                    .body(ApiResponse.error("Failed to retrieve profile"));
        }
    }
    
    public ResponseEntity<ApiResponse<List<DealerAuditLog>>> getDealerAuditLogs(String email) {
        try {
            List<DealerAuditLog> auditLogs = auditRepo.findByEmailOrderByUpdatedAtDesc(email);
            return ResponseEntity.ok(ApiResponse.success("Audit logs retrieved successfully", auditLogs));
        } catch (Exception e) {
            log.error("Error retrieving audit logs for dealer {}: {}", email, e.getMessage());
            return ResponseEntity.status(500)
                    .body(ApiResponse.error("Failed to retrieve audit logs"));
        }
    }

    // New business logic methods

    public ResponseEntity<ApiResponse<Page<DealerListDto>>> getAllDealers(DealerSearchDto searchDto) {
        try {
            Sort sort = Sort.by(
                searchDto.getSortDirection().equalsIgnoreCase("ASC") ? Sort.Direction.ASC : Sort.Direction.DESC,
                searchDto.getSortBy()
            );
            
            Pageable pageable = PageRequest.of(searchDto.getPage(), searchDto.getSize(), sort);
            
            DealerStatus status = null;
            if (searchDto.getStatus() != null && !searchDto.getStatus().isEmpty()) {
                try {
                    status = DealerStatus.valueOf(searchDto.getStatus().toUpperCase());
                } catch (IllegalArgumentException e) {
                    log.warn("Invalid status provided: {}", searchDto.getStatus());
                }
            }
            
            Page<Dealer> dealersPage = repo.findDealersByCriteria(
                searchDto.getName(),
                searchDto.getEmail(),
                searchDto.getLocation(),
                searchDto.getZipcode(),
                status,
                searchDto.getPhone(),
                pageable
            );
            
            Page<DealerListDto> result = dealersPage.map(this::convertToDealerListDto);
            return ResponseEntity.ok(ApiResponse.success("Dealers retrieved successfully", result));
        } catch (Exception e) {
            log.error("Error retrieving dealers: {}", e.getMessage());
            return ResponseEntity.status(500)
                    .body(ApiResponse.error("Failed to retrieve dealers"));
        }
    }

    public ResponseEntity<ApiResponse<Dealer>> updateDealerStatus(Long dealerId, DealerStatus newStatus, String reason, String updatedBy) {
        try {
            Optional<Dealer> dealerOpt = repo.findByDealerId(dealerId);
            if (dealerOpt.isEmpty()) {
                return ResponseEntity.status(404)
                        .body(ApiResponse.error("Dealer not found"));
            }

            Dealer dealer = dealerOpt.get();
            DealerStatus oldStatus = dealer.getStatus();
            
            if (oldStatus == newStatus) {
                return ResponseEntity.ok(ApiResponse.success("Status already set to " + newStatus, dealer));
            }

            logChange(dealer, "status", oldStatus.toString(), newStatus.toString(), updatedBy);
            dealer.setStatus(newStatus);
            dealer.setLastUpdatedAt(LocalDateTime.now());
            
            Dealer updated = repo.save(dealer);
            log.info("Dealer status updated from {} to {} for dealerId: {}", oldStatus, newStatus, dealerId);
            return ResponseEntity.ok(ApiResponse.success("Status updated successfully", updated));
        } catch (Exception e) {
            log.error("Error updating dealer status for dealerId {}: {}", dealerId, e.getMessage());
            return ResponseEntity.status(500)
                    .body(ApiResponse.error("Failed to update status"));
        }
    }

    public ResponseEntity<ApiResponse<String>> deleteDealer(Long dealerId, String reason, String deletedBy) {
        try {
            Optional<Dealer> dealerOpt = repo.findByDealerId(dealerId);
            if (dealerOpt.isEmpty()) {
                return ResponseEntity.status(404)
                        .body(ApiResponse.error("Dealer not found"));
            }

            Dealer dealer = dealerOpt.get();
            
            // Log the deletion
            DealerAuditLog auditLog = DealerAuditLog.builder()
                    .dealerId(dealer.getDealerId())
                    .email(dealer.getEmail())
                    .fieldName("deletion")
                    .oldValue("active")
                    .newValue("deleted")
                    .updatedBy(deletedBy)
                    .updatedAt(LocalDateTime.now())
                    .build();
            auditRepo.save(auditLog);
            
            repo.delete(dealer);
            log.info("Dealer deleted successfully: {} (dealerId: {}) by {}", dealer.getEmail(), dealerId, deletedBy);
            return ResponseEntity.ok(ApiResponse.success("Dealer deleted successfully"));
        } catch (Exception e) {
            log.error("Error deleting dealer with dealerId {}: {}", dealerId, e.getMessage());
            return ResponseEntity.status(500)
                    .body(ApiResponse.error("Failed to delete dealer"));
        }
    }

    public ResponseEntity<ApiResponse<String>> bulkDealerAction(BulkDealerActionDto bulkActionDto) {
        try {
            if (bulkActionDto.getDealerIds() == null || bulkActionDto.getDealerIds().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("No dealer IDs provided"));
            }

            List<Dealer> dealers = repo.findByDealerIdIn(bulkActionDto.getDealerIds());
            if (dealers.isEmpty()) {
                return ResponseEntity.status(404)
                        .body(ApiResponse.error("No dealers found with provided IDs"));
            }

            int successCount = 0;
            switch (bulkActionDto.getAction().toUpperCase()) {
                case "UPDATE_STATUS":
                    if (bulkActionDto.getNewStatus() == null) {
                        return ResponseEntity.badRequest()
                                .body(ApiResponse.error("New status is required for status update"));
                    }
                    DealerStatus newStatus = DealerStatus.valueOf(bulkActionDto.getNewStatus().toUpperCase());
                    for (Dealer dealer : dealers) {
                        dealer.setStatus(newStatus);
                        dealer.setLastUpdatedAt(LocalDateTime.now());
                        logChange(dealer, "status", dealer.getStatus().toString(), newStatus.toString(), bulkActionDto.getPerformedBy());
                    }
                    repo.saveAll(dealers);
                    successCount = dealers.size();
                    break;
                    
                case "DELETE":
                    for (Dealer dealer : dealers) {
                        DealerAuditLog auditLog = DealerAuditLog.builder()
                                .dealerId(dealer.getDealerId())
                                .email(dealer.getEmail())
                                .fieldName("bulk_deletion")
                                .oldValue("active")
                                .newValue("deleted")
                                .updatedBy(bulkActionDto.getPerformedBy())
                                .updatedAt(LocalDateTime.now())
                                .build();
                        auditRepo.save(auditLog);
                    }
                    repo.deleteAll(dealers);
                    successCount = dealers.size();
                    break;
                    
                case "SUSPEND":
                    for (Dealer dealer : dealers) {
                        if (dealer.getStatus() != DealerStatus.SUSPENDED) {
                            logChange(dealer, "status", dealer.getStatus().toString(), DealerStatus.SUSPENDED.toString(), bulkActionDto.getPerformedBy());
                            dealer.setStatus(DealerStatus.SUSPENDED);
                            dealer.setLastUpdatedAt(LocalDateTime.now());
                        }
                    }
                    repo.saveAll(dealers);
                    successCount = dealers.size();
                    break;
                    
                case "ACTIVATE":
                    for (Dealer dealer : dealers) {
                        if (dealer.getStatus() != DealerStatus.ACTIVE) {
                            logChange(dealer, "status", dealer.getStatus().toString(), DealerStatus.ACTIVE.toString(), bulkActionDto.getPerformedBy());
                            dealer.setStatus(DealerStatus.ACTIVE);
                            dealer.setLastUpdatedAt(LocalDateTime.now());
                        }
                    }
                    repo.saveAll(dealers);
                    successCount = dealers.size();
                    break;
                    
                default:
                    return ResponseEntity.badRequest()
                            .body(ApiResponse.error("Invalid action: " + bulkActionDto.getAction()));
            }

            log.info("Bulk action {} completed successfully for {} dealers by {}", 
                    bulkActionDto.getAction(), successCount, bulkActionDto.getPerformedBy());
            return ResponseEntity.ok(ApiResponse.success(
                    String.format("Bulk action completed successfully for %d dealers", successCount)));
        } catch (Exception e) {
            log.error("Error performing bulk action {}: {}", bulkActionDto.getAction(), e.getMessage());
            return ResponseEntity.status(500)
                    .body(ApiResponse.error("Failed to perform bulk action"));
        }
    }

    public ResponseEntity<ApiResponse<Object>> getDealerStatistics() {
        try {
            long totalDealers = repo.count();
            long activeDealers = repo.countByStatus(DealerStatus.ACTIVE);
            long inactiveDealers = repo.countByStatus(DealerStatus.INACTIVE);
            long suspendedDealers = repo.countByStatus(DealerStatus.SUSPENDED);
            long pendingDealers = repo.countByStatus(DealerStatus.PENDING_VERIFICATION);

            var stats = new Object() {
                public final long total = totalDealers;
                public final long active = activeDealers;
                public final long inactive = inactiveDealers;
                public final long suspended = suspendedDealers;
                public final long pendingVerification = pendingDealers;
                public final double activePercentage = totalDealers > 0 ? (double) activeDealers / totalDealers * 100 : 0;
                public final double suspendedPercentage = totalDealers > 0 ? (double) suspendedDealers / totalDealers * 100 : 0;
            };

            return ResponseEntity.ok(ApiResponse.success("Statistics retrieved successfully", stats));
        } catch (Exception e) {
            log.error("Error retrieving dealer statistics: {}", e.getMessage());
            return ResponseEntity.status(500)
                    .body(ApiResponse.error("Failed to retrieve statistics"));
        }
    }

    public ResponseEntity<ApiResponse<Object>> getDealerActivitySummary(int days) {
        try {
            LocalDateTime cutoffDate = LocalDateTime.now().minusDays(days);
            
            long newRegistrations = repo.countByRegisteredAtAfter(cutoffDate);
            long recentUpdates = repo.countByLastUpdatedAtAfter(cutoffDate);
            
            var summary = new Object() {
                public final int periodDays = days;
                public final long newRegistrationsCount = newRegistrations;
                public final long recentUpdatesCount = recentUpdates;
                public final double avgRegistrationsPerDay = (double) newRegistrations / days;
                public final double avgUpdatesPerDay = (double) recentUpdates / days;
            };
            
            return ResponseEntity.ok(ApiResponse.success("Activity summary retrieved successfully", summary));
        } catch (Exception e) {
            log.error("Error retrieving dealer activity summary: {}", e.getMessage());
            return ResponseEntity.status(500)
                    .body(ApiResponse.error("Failed to retrieve activity summary"));
        }
    }

    public List<Dealer> getDealersByStatus(DealerStatus status) {
        return repo.findByStatus(status);
    }

    public List<Dealer> getDealersByLocation(String location) {
        return repo.findByLocationContainingIgnoreCase(location);
    }

    public List<Dealer> getDealersByZipcode(String zipcode) {
        return repo.findByZipcode(zipcode);
    }

    public ResponseEntity<ApiResponse<List<Dealer>>> getDealersByRegistrationDateRange(String startDate, String endDate) {
        try {
            LocalDateTime start = LocalDateTime.parse(startDate + " 00:00:00", 
                DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
            LocalDateTime end = LocalDateTime.parse(endDate + " 23:59:59", 
                DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
            
            List<Dealer> dealers = repo.findByRegisteredAtBetween(start, end);
            return ResponseEntity.ok(ApiResponse.success("Dealers retrieved successfully", dealers));
        } catch (Exception e) {
            log.error("Error retrieving dealers by registration date range: {}", e.getMessage());
            return ResponseEntity.status(500)
                    .body(ApiResponse.error("Failed to retrieve dealers by date range"));
        }
    }

    public ResponseEntity<ApiResponse<List<DealerListDto>>> exportDealers(String status, String location) {
        try {
            List<Dealer> dealers;
            
            if (status != null && location != null) {
                DealerStatus dealerStatus = DealerStatus.valueOf(status.toUpperCase());
                dealers = repo.findByStatusAndLocationContainingIgnoreCase(dealerStatus, location);
            } else if (status != null) {
                DealerStatus dealerStatus = DealerStatus.valueOf(status.toUpperCase());
                dealers = repo.findByStatus(dealerStatus);
            } else if (location != null) {
                dealers = repo.findByLocationContainingIgnoreCase(location);
            } else {
                dealers = repo.findAll();
            }
            
            List<DealerListDto> exportData = dealers.stream()
                .map(this::convertToDealerListDto)
                .toList();
                
            return ResponseEntity.ok(ApiResponse.success("Export data retrieved successfully", exportData));
        } catch (Exception e) {
            log.error("Error exporting dealers: {}", e.getMessage());
            return ResponseEntity.status(500)
                    .body(ApiResponse.error("Failed to export dealers"));
        }
    }

    // Helper methods

    private DealerListDto convertToDealerListDto(Dealer dealer) {
        return DealerListDto.builder()
                .dealerId(dealer.getDealerId())
                .name(dealer.getName())
                .email(dealer.getEmail())
                .location(dealer.getLocation())
                .zipcode(dealer.getZipcode())
                .phone(dealer.getPhone())
                .status(dealer.getStatus().toString())
                .registeredAt(dealer.getRegisteredAt() != null ? dealer.getRegisteredAt().format(DATE_FORMATTER) : null)
                .lastUpdatedAt(dealer.getLastUpdatedAt() != null ? dealer.getLastUpdatedAt().format(DATE_FORMATTER) : null)
                .build();
    }
}