package com.auto.dealer.controller;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.auto.dealer.dto.ApiResponse;
import com.auto.dealer.dto.BulkDealerActionDto;
import com.auto.dealer.dto.DealerListDto;
import com.auto.dealer.dto.DealerSearchDto;
import com.auto.dealer.dto.SimpleDealerDto;
import com.auto.dealer.dto.LoginDealerDto;
import com.auto.dealer.dto.PostingDto;
import com.auto.dealer.dto.RegisterDealerDto;
import com.auto.dealer.dto.UpdateDealerDto;
import com.auto.dealer.model.Dealer;
import com.auto.dealer.model.DealerAuditLog;
import com.auto.dealer.model.Dealer.DealerStatus;
import com.auto.dealer.service.DealerService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/dealers")
@RequiredArgsConstructor
public class DealerController {
	
	private final DealerService service;
	
	// Core dealer operations
	@PostMapping("/register")
	public ResponseEntity<ApiResponse<Dealer>> register(@Valid @RequestBody RegisterDealerDto dealerDto) {
		return service.register(dealerDto);
    }
    
    @PostMapping("/login")
	public ResponseEntity<ApiResponse<PostingDto>> login(@Valid @RequestBody LoginDealerDto dealer){
		return service.login(dealer.getEmail(), dealer.getPassword());
	}
	
	@PutMapping("/update-profile")
    public ResponseEntity<ApiResponse<Dealer>> updateDealer(@Valid @RequestBody UpdateDealerDto dto) {
        return service.updateDealer(dto);
    }
    
    @PutMapping("/update-own-profile")
    public ResponseEntity<ApiResponse<Dealer>> updateOwnProfile(
            @RequestParam String email,
            @Valid @RequestBody UpdateDealerDto dto) {
        // Set the dealerId from the authenticated dealer's profile
        dto.setDealerId(0); // Will be set by service
        return service.updateOwnProfile(email, dto);
    }
   
    @GetMapping("/profile/{email}")
    public ResponseEntity<ApiResponse<Dealer>> getProfile(@PathVariable String email) {
        return service.getDealerProfileByEmail(email);
    }
   
    @GetMapping("/profile/dealer-id/{dealerId}")
    public ResponseEntity<ApiResponse<Dealer>> getProfileByDealerId(@PathVariable long dealerId) {
        return service.getDealerProfileByDealerId(dealerId);
    }
    
    // Lightweight profile variant used by other services
    @GetMapping("/profile-lite/{email}")
    public ResponseEntity<SimpleDealerDto> getProfileLite(@PathVariable String email) {
        ResponseEntity<ApiResponse<Dealer>> resp = service.getDealerProfileByEmail(email);
        if (resp.getStatusCode().is2xxSuccessful() && resp.getBody() != null && resp.getBody().getData() != null) {
            Dealer d = resp.getBody().getData();
            SimpleDealerDto dto = new SimpleDealerDto(d.getName(), d.getEmail());
            return ResponseEntity.ok(dto);
        }
        return ResponseEntity.status(resp.getStatusCode()).build();
    }
   
    @GetMapping("/audit-logs/{email}")
    public ResponseEntity<ApiResponse<List<DealerAuditLog>>> getAuditLogs(@PathVariable String email) {
        return service.getDealerAuditLogs(email);
    }

    // New business logic endpoints
    
    @GetMapping("/list")
    public ResponseEntity<ApiResponse<Page<DealerListDto>>> getAllDealers(DealerSearchDto searchDto) {
        return service.getAllDealers(searchDto);
    }
    
    @GetMapping("/status/{status}")
    public ResponseEntity<ApiResponse<List<Dealer>>> getDealersByStatus(@PathVariable String status) {
        try {
            DealerStatus dealerStatus = DealerStatus.valueOf(status.toUpperCase());
            return ResponseEntity.ok(ApiResponse.success("Dealers retrieved successfully", 
                service.getDealersByStatus(dealerStatus)));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Invalid status: " + status));
        }
    }
    
    @GetMapping("/location/{location}")
    public ResponseEntity<ApiResponse<List<Dealer>>> getDealersByLocation(@PathVariable String location) {
        return ResponseEntity.ok(ApiResponse.success("Dealers retrieved successfully", 
            service.getDealersByLocation(location)));
    }
    
    @GetMapping("/zipcode/{zipcode}")
    public ResponseEntity<ApiResponse<List<Dealer>>> getDealersByZipcode(@PathVariable String zipcode) {
        return ResponseEntity.ok(ApiResponse.success("Dealers retrieved successfully", 
            service.getDealersByZipcode(zipcode)));
    }
    
    @PutMapping("/{dealerId}/status")
    public ResponseEntity<ApiResponse<Dealer>> updateDealerStatus(
            @PathVariable Long dealerId,
            @RequestParam String newStatus,
            @RequestParam(required = false) String reason,
            @RequestParam String updatedBy) {
        try {
            DealerStatus status = DealerStatus.valueOf(newStatus.toUpperCase());
            return service.updateDealerStatus(dealerId, status, reason, updatedBy);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Invalid status: " + newStatus));
        }
    }
    
    @PostMapping("/bulk-action")
    public ResponseEntity<ApiResponse<String>> bulkDealerAction(@Valid @RequestBody BulkDealerActionDto bulkActionDto) {
        return service.bulkDealerAction(bulkActionDto);
    }
    
    @PostMapping("/{dealerId}/delete")
    public ResponseEntity<ApiResponse<String>> deleteDealer(
            @PathVariable Long dealerId,
            @RequestParam(required = false) String reason,
            @RequestParam String deletedBy) {
        return service.deleteDealer(dealerId, reason, deletedBy);
    }
    
    @GetMapping("/statistics")
    public ResponseEntity<ApiResponse<Object>> getDealerStatistics() {
        return service.getDealerStatistics();
    }
    
    @GetMapping("/by-registration-date")
    public ResponseEntity<ApiResponse<List<Dealer>>> getDealersByRegistrationDate(
            @RequestParam String startDate,
            @RequestParam String endDate) {
        return service.getDealersByRegistrationDateRange(startDate, endDate);
    }
    
    @GetMapping("/export")
    public ResponseEntity<ApiResponse<List<DealerListDto>>> exportDealers(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String location) {
        return service.exportDealers(status, location);
    }
    
    @GetMapping("/activity-summary")
    public ResponseEntity<ApiResponse<Object>> getDealerActivitySummary(
            @RequestParam(defaultValue = "30") int days) {
        return service.getDealerActivitySummary(days);
    }
    
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<Dealer>>> searchDealers(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String zipcode,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String phone) {
        
        DealerSearchDto searchDto = new DealerSearchDto();
        searchDto.setName(name);
        searchDto.setEmail(email);
        searchDto.setLocation(location);
        searchDto.setZipcode(zipcode);
        searchDto.setStatus(status);
        searchDto.setPhone(phone);
        searchDto.setPage(0);
        searchDto.setSize(100); // Limit search results
        
        try {
            ResponseEntity<ApiResponse<Page<DealerListDto>>> response = service.getAllDealers(searchDto);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Page<DealerListDto> page = response.getBody().getData();
                List<Dealer> dealers = page.getContent().stream()
                    .map(dto -> {
                        Dealer dealer = new Dealer();
                        dealer.setDealerId(dto.getDealerId());
                        dealer.setName(dto.getName());
                        dealer.setEmail(dto.getEmail());
                        dealer.setLocation(dto.getLocation());
                        dealer.setZipcode(dto.getZipcode());
                        dealer.setPhone(dto.getPhone());
                        dealer.setStatus(DealerStatus.valueOf(dto.getStatus()));
                        return dealer;
                    })
                    .toList();
                return ResponseEntity.ok(ApiResponse.success("Search completed successfully", dealers));
            }
            return ResponseEntity.status(response.getStatusCode()).build();
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(ApiResponse.error("Search failed: " + e.getMessage()));
        }
    }
}
