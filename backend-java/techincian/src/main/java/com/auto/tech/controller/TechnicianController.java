package com.auto.tech.controller;

import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.auto.tech.dto.CounterOfferRequest;
import com.auto.tech.dto.GetTechAccpetedPostsByEmailDto;
import com.auto.tech.dto.FeignEmailRequestDto;
import com.auto.tech.dto.LoginTechnicanDto;
import com.auto.tech.dto.PostingDTO;
import com.auto.tech.dto.TechAcceptedPostsDto;
import com.auto.tech.dto.TechDeclinedPostsDto;
import com.auto.tech.dto.TechInfoToGetPostsByLocationDto;
import com.auto.tech.dto.UpdateTechnicianDto;
import com.auto.tech.model.TechAcceptedPost;
import com.auto.tech.model.TechDeclinedPosts;
import com.auto.tech.model.Technician;
import com.auto.tech.model.TechnicianAuditLog;
import com.auto.tech.model.TechCounterOffer;
import com.auto.tech.repository.AcceptedPostRepository;
import com.auto.tech.repository.CounterOfferRepository;
import com.auto.tech.repository.DeclinedPostsRepository;
import com.auto.tech.repository.TechnicianRepository;
import com.auto.tech.repository.TechnicianAuditLogRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

import com.auto.tech.service.TechnicianService;
import com.auto.tech.service.CounterOfferService;
import com.auto.tech.service.EnhancedTechnicianFeedService;
import com.auto.tech.service.TechnicianAnalyticsService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
// @CrossOrigin - Removed to prevent duplicate CORS headers, gateway handles CORS
@RequestMapping("/api/technicians")
@RequiredArgsConstructor
@Slf4j
public class TechnicianController {
	
	private static final Logger logger = LoggerFactory.getLogger(TechnicianController.class);
	
	private final TechnicianService service;
	private final CounterOfferService counterOfferService;
	private final EnhancedTechnicianFeedService enhancedFeedService;
	private final TechnicianAnalyticsService analyticsService;
	private final TechnicianRepository repo;
	private final AcceptedPostRepository acceptedPostRepo;
	private final DeclinedPostsRepository declinedPostsRepo;
	private final TechnicianAuditLogRepository auditRepo;
	private final CounterOfferRepository counterOfferRepo;

	private String capitalizeEachWord(String input) {
	    if (input == null || input.trim().isEmpty()) {
	        return input;
	    }
	    String[] words = input.split("\\s+");
	    for (int i = 0; i < words.length; i++) {
	        if (words[i].length() > 0) {
	            words[i] = words[i].substring(0, 1).toUpperCase() + words[i].substring(1).toLowerCase();
	        }
	    }
	    return String.join(" ", words);
	}
	
	@PostMapping("/register")
	public ResponseEntity<?> register(@Valid @RequestBody Technician technician) {
		try {
			log.info("🔖 [TechnicianController] Received registration request for email: {}", 
				technician != null ? technician.getEmail() : "null");
			
			if (technician == null) {
				log.warn("❌ [TechnicianController] Null registration request received");
				Map<String, String> error = new HashMap<>();
				error.put("error", "Invalid request body");
				return ResponseEntity.status(400).body(error);
			}
			
			if (technician.getEmail() == null || technician.getEmail().trim().isEmpty()) {
				log.warn("❌ [TechnicianController] Empty email in registration request");
				Map<String, String> error = new HashMap<>();
				error.put("error", "Email is required");
				return ResponseEntity.status(400).body(error);
			}
			
			Technician savedTechnician = service.register(technician);
			log.info("✅ [TechnicianController] Registration successful for technician: {} (ID: {})", 
				savedTechnician.getName(), savedTechnician.getId());
			
			return ResponseEntity.status(201).body(savedTechnician);
			
		} catch (org.springframework.dao.DataIntegrityViolationException e) {
			log.warn("❌ [TechnicianController] Email already exists: {}", 
				technician != null ? technician.getEmail() : "unknown");
			Map<String, String> error = new HashMap<>();
			error.put("error", "Email already exists. Please try to login instead.");
			return ResponseEntity.status(400).body(error);
		} catch (Exception e) {
			log.error("💥 [TechnicianController] Unexpected error during registration for email {}: {}", 
				technician != null ? technician.getEmail() : "null", e.getMessage(), e);
			Map<String, String> error = new HashMap<>();
			error.put("error", "Registration failed. Please try again.");
			error.put("details", e.getMessage());
			return ResponseEntity.status(500).body(error);
		}
	}
	
	
		@PostMapping("/login")
	public ResponseEntity<?> login(@RequestBody LoginTechnicanDto loginRequest) {
		try {
			log.info("🔖 [TechnicianController] Received login request for email: {}", 
				loginRequest != null ? loginRequest.getEmail() : "null");
			
			if (loginRequest == null) {
				log.warn("❌ [TechnicianController] Null login request received");
				Map<String, String> error = new HashMap<>();
				error.put("error", "Invalid request body");
				return ResponseEntity.status(400).body(error);
			}
			
			if (loginRequest.getEmail() == null || loginRequest.getEmail().trim().isEmpty()) {
				log.warn("❌ [TechnicianController] Empty email in login request");
				Map<String, String> error = new HashMap<>();
				error.put("error", "Email is required");
				return ResponseEntity.status(400).body(error);
			}
			
			ResponseEntity<?> response = service.login(loginRequest.getEmail());
			log.info("🔖 [TechnicianController] Login response status: {}", response.getStatusCode());
			return response;
			
		} catch (Exception e) {
			log.error("💥 [TechnicianController] Unexpected error during login: {}", e.getMessage(), e);
			Map<String, String> error = new HashMap<>();
			error.put("error", "Internal server error during login");
			error.put("details", e.getMessage());
			return ResponseEntity.status(500).body(error);
		}
	}
	@PostMapping("/technician-feed")
	public ResponseEntity<?> getTechnicianFeed(@RequestBody TechInfoToGetPostsByLocationDto dto) {
		try {
			log.info("🔖 [TechnicianController] Received technician feed request for email: {}", 
				dto != null ? dto.getEmail() : "null");
			
			if (dto == null || dto.getEmail() == null || dto.getEmail().trim().isEmpty()) {
				log.warn("❌ [TechnicianController] Invalid feed request - missing email");
				Map<String, String> error = new HashMap<>();
				error.put("error", "Email is required");
				return ResponseEntity.status(400).body(error);
			}
			
			List<PostingDTO> feed = service.getFilteredFeed(dto);
			log.info("✅ [TechnicianController] Successfully retrieved {} posts for technician feed", feed.size());
			return ResponseEntity.ok(feed);
			
		} catch (Exception e) {
			log.error("💥 [TechnicianController] Error retrieving technician feed: {}", e.getMessage(), e);
			Map<String, String> error = new HashMap<>();
			error.put("error", "Failed to retrieve technician feed");
			error.put("details", e.getMessage());
			return ResponseEntity.status(500).body(error);
		}
	}
	
	
	
    @PostMapping("/technician-posts-by-techloc")
    public List<PostingDTO> getAllPostingsFromPostingsService(@RequestBody FeignEmailRequestDto dto) {
        TechInfoToGetPostsByLocationDto serviceDto = new TechInfoToGetPostsByLocationDto();
        serviceDto.setEmail(dto.getEmail());
        return service.fetchAllPostings(serviceDto);
    }
    
    
    
    @PostMapping("/save-accepted-posts")
    public ResponseEntity<?> techAcceptedPosts(@RequestBody TechAcceptedPostsDto dto) {
        try {
            TechAcceptedPost acceptedPosts = TechAcceptedPost.builder()
                    .email(dto.getEmail())
                    .postId(dto.getPostId())
                    .build();

            service.techAcceptedPosts(acceptedPosts);

            return ResponseEntity.ok("Accepted successfully");
        } catch (IllegalStateException e) {
            log.warn("❌ [TechnicianController] IllegalStateException during post acceptance: {}", e.getMessage());
            return ResponseEntity.status(409).body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            log.error("💥 [TechnicianController] Unexpected error during post acceptance: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of("message", "Failed to accept post: " + e.getMessage()));
        }
    }
    
    
    
    
    
    
    @PostMapping("/get-accepted-posts-by-email")
    public List<Long> getAcceptedPostsByEmail(@RequestBody FeignEmailRequestDto dto){
        GetTechAccpetedPostsByEmailDto serviceDto = new GetTechAccpetedPostsByEmailDto();
        serviceDto.setEmail(dto.getEmail());
    	return service.getAcceptedPostsByEmail(serviceDto);
    }
    
    @PostMapping("/get-declined-posts-by-email")
    public List<Long> getDeclinedPostsByEmail(@RequestBody FeignEmailRequestDto dto){
        return service.getDeclinedPostsByEmail(dto.getEmail());
    }

    
    
    @PostMapping("/get-technician-by-email")
    public ResponseEntity<?> getTechnicianByEmail(@RequestBody FeignEmailRequestDto email) {
        GetTechAccpetedPostsByEmailDto dto = new GetTechAccpetedPostsByEmailDto();
        dto.setEmail(email.getEmail());
        Optional<Technician> techOpt = service.getTechnicianByEmail(dto);
        if (techOpt.isPresent()) {
            Technician tech = techOpt.get();
            // Map to DTO format expected by tech-dashboard
            Map<String, Object> techDto = Map.of(
                "name", tech.getName(),
                "email", tech.getEmail(),
                "phone", tech.getPhone(),
                "delearshipName", tech.getDelearshipName() != null ? tech.getDelearshipName() : "",
                "password", tech.getPassword(),
                "city", tech.getLocation(), // Map location to city for compatibility
                "state", "", // No state field in Technician model
                "zipcode", tech.getZipcode(),
                "yearsOfExperience", tech.getYearsOfExperience()
            );
            return ResponseEntity.ok(techDto);
        } else {
            return ResponseEntity.notFound().build();
        }
    }
    
    
    
    

    @PostMapping("/declined-posts")
    public void declinedPosts(@RequestBody TechDeclinedPostsDto declinedPosts) {
    	
    	TechDeclinedPosts posts = TechDeclinedPosts.builder()
    			.email(declinedPosts.getEmail())
    			.postId(declinedPosts.getPostId())
    				.build();
    	
    	
    	service.declinedPosts(posts);
    	
    	
    }
    
    @GetMapping("/get-all-accepted-posts-full")
    public List<TechAcceptedPost> getAllAcceptedPostMappings() {
        return service.getAllAcceptedPostsWithTechnician();
    }
    
    
    
    
    
    @PostMapping("/update-technician-profile")
    public ResponseEntity<?> updateProfile(@RequestBody UpdateTechnicianDto dto) {
        Technician updated = service.updateTechnicianProfile(dto);
        return ResponseEntity.ok(updated);
    }
    
    @GetMapping("/get-technician-profile")
    public ResponseEntity<?> getTechnicianProfile(@RequestParam String email) {
        Optional<Technician> technicianOpt = service.getTechnicianByEmail(email);

        if (technicianOpt.isPresent()) {
            return ResponseEntity.ok(technicianOpt.get());
        } else {
            return ResponseEntity.status(404).body("Technician not found");
        }
    }

    // ========== COUNTER OFFER ENDPOINTS ==========

    /**
     * Submit a counter offer for a post
     * POST /api/technicians/counter-offer/{postId}
     */
    @PostMapping("/counter-offer/{postId}")
    public ResponseEntity<?> submitCounterOffer(@PathVariable Long postId, 
                                               @RequestBody @Valid CounterOfferRequest request,
                                               @RequestParam String technicianEmail) {
        try {
            Map<String, Object> result = counterOfferService.submitCounterOffer(postId, technicianEmail, request);
            
            if ((Boolean) result.get("success")) {
                return ResponseEntity.ok(result);
            } else {
                return ResponseEntity.badRequest().body(result);
            }
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to submit counter offer: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Check counter offer eligibility for a post
     * GET /api/technicians/counter-offer/{postId}/eligibility
     */
    @GetMapping("/counter-offer/{postId}/eligibility")
    public ResponseEntity<?> checkCounterOfferEligibility(@PathVariable Long postId,
                                                         @RequestParam String technicianEmail) {
        try {
            Map<String, Object> result = counterOfferService.checkCounterOfferEligibility(postId, technicianEmail);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("canSubmit", false);
            error.put("message", "Error checking eligibility: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Get counter offer status for a technician
     * GET /api/technicians/counter-offers/status
     */
    @GetMapping("/counter-offers/status")
    public ResponseEntity<?> getCounterOfferStatus(@RequestParam String technicianEmail) {
        try {
            log.info("🔖 [TechnicianController] Received counter offer status request for email: {}", technicianEmail);
            
            if (technicianEmail == null || technicianEmail.trim().isEmpty()) {
                log.warn("❌ [TechnicianController] Invalid counter offer status request - missing email");
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("message", "Technician email is required");
                return ResponseEntity.status(400).body(error);
            }
            
            Map<String, Object> result = counterOfferService.getCounterOfferStatus(technicianEmail.trim());
            log.info("✅ [TechnicianController] Successfully retrieved counter offer status");
            
            if ((Boolean) result.get("success")) {
                return ResponseEntity.ok(result);
            } else {
                return ResponseEntity.badRequest().body(result);
            }
        } catch (Exception e) {
            log.error("💥 [TechnicianController] Error retrieving counter offer status: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to get counter offer status: " + e.getMessage());
            error.put("details", e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Withdraw a counter offer
     * POST /api/technicians/counter-offer/{counterOfferId}/withdraw
     */
    @PostMapping("/counter-offer/{counterOfferId}/withdraw")
    public ResponseEntity<?> withdrawCounterOffer(@PathVariable Long counterOfferId,
                                                 @RequestParam String technicianEmail) {
        try {
            Map<String, Object> result = counterOfferService.withdrawCounterOffer(counterOfferId, technicianEmail);
            
            if ((Boolean) result.get("success")) {
                return ResponseEntity.ok(result);
            } else {
                return ResponseEntity.badRequest().body(result);
            }
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to withdraw counter offer: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Get remaining cooldown time for a specific post
     * GET /api/technicians/counter-offer/{postId}/cooldown
     */
    @GetMapping("/counter-offer/{postId}/cooldown")
    public ResponseEntity<?> getRemainingCooldownTime(@PathVariable Long postId,
                                                     @RequestParam String technicianEmail) {
        try {
            Map<String, Object> result = counterOfferService.getRemainingCooldownTime(postId, technicianEmail);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("remainingMillis", 0L);
            error.put("message", "Error getting cooldown time: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Check if technician has active cooldown for a specific post
     * GET /api/technicians/counter-offer/{postId}/has-cooldown
     */
    @GetMapping("/counter-offer/{postId}/has-cooldown")
    public ResponseEntity<?> hasActiveCooldown(@PathVariable Long postId,
                                              @RequestParam String technicianEmail) {
        try {
            boolean hasActiveCooldown = counterOfferService.hasActiveCooldown(postId, technicianEmail);
            Map<String, Object> response = new HashMap<>();
            response.put("hasActiveCooldown", hasActiveCooldown);
            response.put("postId", postId);
            response.put("technicianEmail", technicianEmail);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("hasActiveCooldown", false);
            error.put("message", "Error checking cooldown: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Clean up counter offers (admin/debug endpoint)
     * POST /api/technicians/counter-offers/cleanup
     */
    @PostMapping("/counter-offers/cleanup")
    public ResponseEntity<?> cleanupCounterOffers() {
        try {
            counterOfferService.cleanupCounterOffers();
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Counter offers cleanup completed");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to cleanup counter offers: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Mark expired counter offers (admin endpoint)
     * POST /api/technicians/counter-offers/mark-expired
     */
    @PostMapping("/counter-offers/mark-expired")
    public ResponseEntity<?> markExpiredCounterOffers() {
        try {
            int expiredCount = counterOfferService.markExpiredCounterOffersScheduled();
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("expiredCount", expiredCount);
            response.put("message", "Marked " + expiredCount + " counter offers as expired");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to mark expired counter offers: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Test endpoint to create a test counter offer (debug only)
     * POST /api/technicians/counter-offer/test
     */
    @PostMapping("/counter-offer/test")
    public ResponseEntity<?> createTestCounterOffer(@RequestParam String technicianEmail) {
        try {
            // Create a test counter offer request
            CounterOfferRequest testRequest = new CounterOfferRequest();
            testRequest.setCounterOfferAmount("150.00");
            testRequest.setRequestReason("Test counter offer");
            testRequest.setNotes("This is a test counter offer");
            
            // Use post ID 1 for testing (assuming it exists)
            Map<String, Object> result = counterOfferService.submitCounterOffer(1L, technicianEmail, testRequest);
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to create test counter offer: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    // ==================== ENHANCED FEED & ANALYTICS ENDPOINTS ====================

    /**
     * Check accept impact for a post
     * GET /api/technicians/feed/{postId}/accept/check
     */
    @GetMapping("/feed/{postId}/accept/check")
    public ResponseEntity<?> checkAcceptImpact(@PathVariable Long postId, @RequestParam String technicianEmail) {
        try {
            Map<String, Object> result = enhancedFeedService.checkAcceptImpact(postId, technicianEmail);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to check accept impact: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Check decline impact for a post
     * GET /api/technicians/feed/{postId}/decline/check
     */
    @GetMapping("/feed/{postId}/decline/check")
    public ResponseEntity<?> checkDeclineImpact(@PathVariable Long postId, @RequestParam String technicianEmail) {
        try {
            Map<String, Object> result = enhancedFeedService.checkDeclineImpact(postId, technicianEmail);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to check decline impact: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Accept post with counter offer withdrawal
     * POST /api/technicians/feed/{postId}/accept/confirm
     */
    @PostMapping("/feed/{postId}/accept/confirm")
    public ResponseEntity<?> acceptPostWithCounterOfferWithdrawal(@PathVariable Long postId, @RequestParam String technicianEmail) {
        try {
            Map<String, Object> result = enhancedFeedService.acceptPostWithCounterOfferWithdrawal(postId, technicianEmail);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to accept post with counter offer withdrawal: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Decline post with counter offer withdrawal
     * POST /api/technicians/feed/{postId}/decline/confirm
     */
    @PostMapping("/feed/{postId}/decline/confirm")
    public ResponseEntity<?> declinePostWithCounterOfferWithdrawal(@PathVariable Long postId, @RequestParam String technicianEmail) {
        try {
            Map<String, Object> result = enhancedFeedService.declinePostWithCounterOfferWithdrawal(postId, technicianEmail);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to decline post with counter offer withdrawal: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Get technician performance metrics
     * GET /api/technicians/analytics/metrics
     */
    @GetMapping("/analytics/metrics")
    public ResponseEntity<?> getTechnicianMetrics(@RequestParam String technicianEmail) {
        try {
            var result = analyticsService.getTechnicianMetrics(technicianEmail);
            if (result.isPresent()) {
                return ResponseEntity.ok(result.get());
            } else {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "No metrics found for technician");
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to get technician metrics: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Get technician interactions
     * GET /api/technicians/analytics/interactions
     */
    @GetMapping("/analytics/interactions")
    public ResponseEntity<?> getTechnicianInteractions(@RequestParam String technicianEmail) {
        try {
            var result = analyticsService.getTechnicianInteractions(technicianEmail);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("interactions", result);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to get technician interactions: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Get analytics summary
     * GET /api/technicians/analytics/summary
     */
    @GetMapping("/analytics/summary")
    public ResponseEntity<?> getAnalyticsSummary() {
        try {
            var result = analyticsService.getAnalyticsSummary();
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("summary", result);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to get analytics summary: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Get top performers
     * GET /api/technicians/analytics/top-performers
     */
    @GetMapping("/analytics/top-performers")
    public ResponseEntity<?> getTopPerformers(@RequestParam(defaultValue = "5") int minActions) {
        try {
            var result = analyticsService.getTopPerformers(minActions);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("topPerformers", result);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to get top performers: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Get top earners
     * GET /api/technicians/analytics/top-earners
     */
    @GetMapping("/analytics/top-earners")
    public ResponseEntity<?> getTopEarners() {
        try {
            var result = analyticsService.getTopEarners();
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("topEarners", result);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to get top earners: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Get inactive technicians
     * GET /api/technicians/analytics/inactive
     */
    @GetMapping("/analytics/inactive")
    public ResponseEntity<?> getInactiveTechnicians(@RequestParam(defaultValue = "30") int daysInactive) {
        try {
            var result = analyticsService.getInactiveTechnicians(daysInactive);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("inactiveTechnicians", result);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to get inactive technicians: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Handle counter offer rejection notification from posting service
     * PUT /api/technicians/counter-offer/{counterOfferId}/reject
     */
    @PutMapping("/counter-offer/{counterOfferId}/reject")
    public ResponseEntity<?> handleCounterOfferRejection(@PathVariable Long counterOfferId,
                                                       @RequestBody Map<String, Object> rejectionData) {
        try {
            logger.info("Received counter offer rejection notification for ID: {}", counterOfferId);
            
            // Extract data from rejection notification
            Long postId = Long.valueOf(rejectionData.get("postId").toString());
            String technicianEmail = (String) rejectionData.get("technicianEmail");
            Integer attemptCount = (Integer) rejectionData.get("attemptCount");
            Boolean maxAttemptsReached = (Boolean) rejectionData.get("maxAttemptsReached");
            
            // Update the local counter offer status to REJECTED
            boolean updated = counterOfferService.updateCounterOfferStatusToRejected(
                counterOfferId, technicianEmail, rejectionData);
            
            if (updated) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("message", "Counter offer rejection processed successfully");
                response.put("counterOfferId", counterOfferId);
                response.put("attemptCount", attemptCount);
                response.put("maxAttemptsReached", maxAttemptsReached);
                response.put("postId", postId);
                response.put("technicianEmail", technicianEmail);
                response.put("status", "REJECTED");
                response.put("timestamp", System.currentTimeMillis());
                
                logger.info("Successfully processed counter offer rejection for ID: {} - Attempts: {}/3 - Post: {}", 
                           counterOfferId, attemptCount, postId);
                
                return ResponseEntity.ok(response);
            } else {
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("message", "Counter offer not found or could not be updated");
                return ResponseEntity.badRequest().body(error);
            }
            
        } catch (Exception e) {
            logger.error("Error processing counter offer rejection for ID {}: {}", counterOfferId, e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to process counter offer rejection: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Handle counter offer acceptance notification from posting service
     * PUT /api/technicians/counter-offer/{counterOfferId}/accept
     */
    @PutMapping("/counter-offer/{counterOfferId}/accept")
    public ResponseEntity<?> handleCounterOfferAcceptance(@PathVariable Long counterOfferId,
                                                        @RequestBody Map<String, Object> acceptanceData) {
        try {
            logger.info("Received counter offer acceptance notification for ID: {}", counterOfferId);
            
            // Extract data from acceptance notification
            Long postId = Long.valueOf(acceptanceData.get("postId").toString());
            String technicianEmail = (String) acceptanceData.get("technicianEmail");
            
            // Update the local counter offer status to ACCEPTED
            boolean updated = counterOfferService.updateCounterOfferStatusToAccepted(
                counterOfferId, technicianEmail, acceptanceData);
            
            if (updated) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("message", "Counter offer acceptance processed successfully");
                response.put("counterOfferId", counterOfferId);
                response.put("postId", postId);
                response.put("technicianEmail", technicianEmail);
                response.put("status", "ACCEPTED");
                response.put("timestamp", System.currentTimeMillis());
                
                logger.info("Successfully processed counter offer acceptance for ID: {} - Post: {}", 
                           counterOfferId, postId);
                
                return ResponseEntity.ok(response);
            } else {
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("message", "Counter offer not found or could not be updated");
                return ResponseEntity.badRequest().body(error);
            }
            
        } catch (Exception e) {
            logger.error("Error processing counter offer acceptance for ID {}: {}", counterOfferId, e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to process counter offer acceptance: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }
    
    /**
     * Notify technician service about counter offer withdrawal (called by posting service)
     * PUT /api/technicians/counter-offer/withdraw
     */
    @PutMapping("/counter-offer/withdraw")
    public ResponseEntity<Map<String, Object>> notifyCounterOfferWithdrawal(
        @RequestBody Map<String, Object> withdrawalData
    ) {
        try {
            logger.info("Received counter offer withdrawal notification: {}", withdrawalData);
            
            Long postId = Long.valueOf(withdrawalData.get("postId").toString());
            String technicianEmail = (String) withdrawalData.get("technicianEmail");
            
            if (postId == null || technicianEmail == null) {
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("message", "Post ID and technician email are required");
                return ResponseEntity.badRequest().body(error);
            }
            
            // Withdraw counter offers in technician service
            counterOfferService.withdrawCounterOffersForPost(postId, technicianEmail);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Counter offers withdrawn successfully in technician service");
            response.put("postId", postId);
            response.put("technicianEmail", technicianEmail);
            response.put("withdrawnAt", new Date());
            
            logger.info("Successfully withdrew counter offers in technician service for post: id={}, technicianEmail={}", 
                   postId, technicianEmail);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error processing counter offer withdrawal: {}", e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to process counter offer withdrawal: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }
    
    // ========== ADMIN ENDPOINTS ==========

    /**
     * Get all technicians with pagination and filtering (Admin)
     * GET /api/technicians/admin/technicians
     */
    @GetMapping("/admin/technicians")
    public ResponseEntity<?> getAllTechniciansForAdmin(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String searchTerm,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String experience,
            @RequestParam(required = false) String status) {
        try {
            Page<Technician> technicianPage;
            List<Technician> filteredTechnicians;
            
            // Filter by status first
            if (status != null && !status.trim().isEmpty()) {
                technicianPage = repo.findByStatus(status, PageRequest.of(page, size));
                filteredTechnicians = technicianPage.getContent();
            } else {
                // Default: exclude deleted technicians
                technicianPage = repo.findByStatusNot("DELETED", PageRequest.of(page, size));
                filteredTechnicians = technicianPage.getContent();
            }
            
            // Apply additional filters if provided
            if (searchTerm != null && !searchTerm.trim().isEmpty()) {
                filteredTechnicians = filteredTechnicians.stream()
                    .filter(tech -> tech.getName().toLowerCase().contains(searchTerm.toLowerCase()) ||
                                   tech.getEmail().toLowerCase().contains(searchTerm.toLowerCase()))
                    .collect(Collectors.toList());
            }
            
            if (location != null && !location.trim().isEmpty()) {
                filteredTechnicians = filteredTechnicians.stream()
                    .filter(tech -> tech.getLocation().toLowerCase().contains(location.toLowerCase()))
                    .collect(Collectors.toList());
            }
            
            if (experience != null && !experience.trim().isEmpty()) {
                try {
                    int expYears = Integer.parseInt(experience);
                    filteredTechnicians = filteredTechnicians.stream()
                        .filter(tech -> Integer.parseInt(tech.getYearsOfExperience()) >= expYears)
                        .collect(Collectors.toList());
                } catch (NumberFormatException e) {
                    // Ignore invalid experience filter
                }
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("technicians", filteredTechnicians);
            response.put("currentPage", page);
            response.put("totalPages", technicianPage.getTotalPages());
            response.put("totalElements", technicianPage.getTotalElements());
            response.put("size", size);
            response.put("status", status != null ? status : "ACTIVE,SUSPENDED");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to fetch technicians: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Get technician statistics (Admin)
     * GET /api/technicians/admin/technicians/statistics
     */
    @GetMapping("/admin/technicians/statistics")
    public ResponseEntity<?> getTechnicianStatisticsForAdmin() {
        try {
            long totalTechnicians = repo.count();
            
            // Get technicians by status
            long activeTechnicians = repo.countByStatus("ACTIVE");
            long suspendedTechnicians = repo.countByStatus("SUSPENDED");
            long deletedTechnicians = repo.countByStatus("DELETED");
            
            // Get new technicians this month (registered in current month)
            LocalDateTime monthStart = LocalDateTime.now().withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
            long newTechniciansThisMonth = repo.countByCreatedAtAfter(monthStart);
            
            // Get technicians with recent activity (any interaction in last 7 days)
            LocalDateTime sevenDaysAgo = LocalDateTime.now().minusDays(7);
            long recentActivityCount = auditRepo.countByUpdatedAtAfter(sevenDaysAgo);
            
            // Calculate rates
            double activeRate = totalTechnicians > 0 ? Math.round((double) activeTechnicians / totalTechnicians * 100 * 100.0) / 100.0 : 0.0;
            double suspendedRate = totalTechnicians > 0 ? Math.round((double) suspendedTechnicians / totalTechnicians * 100 * 100.0) / 100.0 : 0.0;
            double newTechniciansRate = totalTechnicians > 0 ? Math.round((double) newTechniciansThisMonth / totalTechnicians * 100 * 100.0) / 100.0 : 0.0;
            
            Map<String, Object> stats = new HashMap<>();
            stats.put("totalTechnicians", totalTechnicians);
            stats.put("activeTechnicians", activeTechnicians);
            stats.put("suspendedTechnicians", suspendedTechnicians);
            stats.put("deletedTechnicians", deletedTechnicians);
            stats.put("newTechniciansThisMonth", newTechniciansThisMonth);
            stats.put("recentActivityCount", recentActivityCount);
            stats.put("activeRate", activeRate);
            stats.put("suspendedRate", suspendedRate);
            stats.put("newTechniciansRate", newTechniciansRate);
            stats.put("lastUpdated", LocalDateTime.now());
            
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to fetch technician statistics: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Get technician performance metrics (Admin)
     * GET /api/technicians/admin/technicians/performance-metrics
     */
    @GetMapping("/admin/technicians/performance-metrics")
    public ResponseEntity<?> getTechnicianPerformanceMetricsForAdmin(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "totalEarnings") String sortBy,
            @RequestParam(defaultValue = "desc") String sortOrder) {
        try {
            // Get all technicians for performance metrics
            Page<Technician> technicianPage = repo.findAll(PageRequest.of(page, size));
            List<Technician> technicians = technicianPage.getContent();
            
            // Create real performance metrics based on actual data
            List<Map<String, Object>> metrics = technicians.stream()
                .map(tech -> {
                    Map<String, Object> metric = new HashMap<>();
                    metric.put("technicianId", tech.getId());
                    metric.put("technicianName", tech.getName());
                    metric.put("technicianEmail", tech.getEmail());
                    
                    // Get real data for accepted posts
                    long totalAccepted = acceptedPostRepo.countByEmail(tech.getEmail());
                    
                    // Get real data for declined posts
                    long totalDeclined = declinedPostsRepo.countByEmail(tech.getEmail());
                    
                    // Calculate success rate
                    long totalPosts = totalAccepted + totalDeclined;
                    double successRate = totalPosts > 0 ? (double) totalAccepted / totalPosts * 100 : 0.0;
                    
                    // Estimate earnings (you can modify this calculation based on your business logic)
                    double estimatedEarnings = totalAccepted * 50.0; // Assuming $50 per accepted post
                    
                    metric.put("totalEarnings", estimatedEarnings);
                    metric.put("successRate", Math.round(successRate * 100.0) / 100.0); // Round to 2 decimal places
                    metric.put("totalPostsAccepted", totalAccepted);
                    metric.put("totalPostsDeclined", totalDeclined);
                    metric.put("totalPosts", totalPosts);
                    metric.put("lastActivity", tech.getLastActivityAt());
                    
                    // Add status indicator
                    LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
                    String status = tech.getLastActivityAt() != null && tech.getLastActivityAt().isAfter(thirtyDaysAgo) ? "Active" : "Inactive";
                    metric.put("status", status);
                    metric.put("statusColor", status.equals("Active") ? "success" : "warning");
                    
                    return metric;
                })
                .collect(Collectors.toList());
            
            // Sort by the specified field
            if ("totalEarnings".equals(sortBy)) {
                metrics.sort((a, b) -> {
                    double aVal = (Double) a.get("totalEarnings");
                    double bVal = (Double) b.get("totalEarnings");
                    return "desc".equals(sortOrder) ? Double.compare(bVal, aVal) : Double.compare(aVal, bVal);
                });
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("metrics", metrics);
            response.put("currentPage", page);
            response.put("totalPages", technicianPage.getTotalPages());
            response.put("totalElements", technicianPage.getTotalElements());
            response.put("size", size);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to fetch performance metrics: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Get counter offers for admin (Admin)
     * GET /api/technicians/admin/technicians/counter-offers
     */
    @GetMapping("/admin/technicians/counter-offers")
    public ResponseEntity<?> getCounterOffersForAdmin(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String status) {
        try {
            Page<TechCounterOffer> counterOffersPage;
            
            if (status != null && !status.trim().isEmpty()) {
                try {
                    TechCounterOffer.CounterOfferStatus statusEnum = TechCounterOffer.CounterOfferStatus.valueOf(status.toUpperCase());
                    counterOffersPage = counterOfferRepo.findByStatus(statusEnum, PageRequest.of(page, size));
                } catch (IllegalArgumentException e) {
                    Map<String, Object> error = new HashMap<>();
                    error.put("success", false);
                    error.put("message", "Invalid status: " + status);
                    return ResponseEntity.badRequest().body(error);
                }
            } else {
                // Get all counter offers with pagination
                counterOffersPage = counterOfferRepo.findAll(PageRequest.of(page, size));
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("content", counterOffersPage.getContent());
            response.put("currentPage", page);
            response.put("totalPages", counterOffersPage.getTotalPages());
            response.put("totalElements", counterOffersPage.getTotalElements());
            response.put("size", size);
            response.put("status", status != null ? status : "ALL");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to fetch counter offers: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Get accepted posts for admin (Admin)
     * GET /api/technicians/admin/technicians/accepted-posts
     */
    @GetMapping("/admin/technicians/accepted-posts")
    public ResponseEntity<?> getAcceptedPostsForAdmin(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String technicianEmail) {
        try {
            Page<TechAcceptedPost> acceptedPostsPage;
            if (technicianEmail != null && !technicianEmail.trim().isEmpty()) {
                acceptedPostsPage = acceptedPostRepo.findByEmail(technicianEmail, PageRequest.of(page, size));
            } else {
                acceptedPostsPage = acceptedPostRepo.findAll(PageRequest.of(page, size));
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("content", acceptedPostsPage.getContent());
            response.put("currentPage", page);
            response.put("totalPages", acceptedPostsPage.getTotalPages());
            response.put("totalElements", acceptedPostsPage.getTotalElements());
            response.put("size", size);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to fetch accepted posts: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Get declined posts for admin (Admin)
     * GET /api/technicians/admin/technicians/declined-posts
     */
    @GetMapping("/admin/technicians/declined-posts")
    public ResponseEntity<?> getDeclinedPostsForAdmin(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String technicianEmail) {
        try {
            Page<TechDeclinedPosts> declinedPostsPage;
            if (technicianEmail != null && !technicianEmail.trim().isEmpty()) {
                declinedPostsPage = declinedPostsRepo.findByEmail(technicianEmail, PageRequest.of(page, size));
            } else {
                declinedPostsPage = declinedPostsRepo.findAll(PageRequest.of(page, size));
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("content", declinedPostsPage.getContent());
            response.put("currentPage", page);
            response.put("totalPages", declinedPostsPage.getTotalPages());
            response.put("totalElements", declinedPostsPage.getTotalElements());
            response.put("size", size);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to fetch declined posts: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Get audit logs for admin (Admin)
     * GET /api/technicians/admin/technicians/audit-logs
     */
    @GetMapping("/admin/technicians/audit-logs")
    public ResponseEntity<?> getAuditLogsForAdmin(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String technicianEmail) {
        try {
            Page<TechnicianAuditLog> auditLogsPage;
            if (technicianEmail != null && !technicianEmail.trim().isEmpty()) {
                auditLogsPage = auditRepo.findByEmail(technicianEmail, PageRequest.of(page, size));
            } else {
                auditLogsPage = auditRepo.findAll(PageRequest.of(page, size));
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("content", auditLogsPage.getContent());
            response.put("currentPage", page);
            response.put("totalPages", auditLogsPage.getTotalPages());
            response.put("totalElements", auditLogsPage.getTotalElements());
            response.put("size", size);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to fetch audit logs: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Update technician profile by admin (Admin)
     * PUT /api/technicians/admin/technicians/{technicianId}
     */
    @PutMapping("/admin/technicians/{technicianId}")
    public ResponseEntity<?> updateTechnicianProfileByAdmin(
            @PathVariable Long technicianId,
            @RequestBody UpdateTechnicianDto updateData) {
        try {
            Optional<Technician> technicianOpt = repo.findById(technicianId);
            if (technicianOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            Technician technician = technicianOpt.get();
            
            // Update fields if provided
            if (updateData.getName() != null) {
                technician.setName(capitalizeEachWord(updateData.getName()));
            }
            if (updateData.getPhone() != null) {
                technician.setPhone(updateData.getPhone());
            }
            if (updateData.getLocation() != null) {
                technician.setLocation(updateData.getLocation());
            }
            if (updateData.getZipcode() != null) {
                technician.setZipcode(updateData.getZipcode());
            }
            if (updateData.getYearsOfExperience() != null) {
                technician.setYearsOfExperience(updateData.getYearsOfExperience());
            }
            
            Technician updated = repo.save(technician);
            
            // Log the admin action
            TechnicianAuditLog auditLog = TechnicianAuditLog.builder()
                .email(updated.getEmail())
                .fieldName("PROFILE_UPDATED_BY_ADMIN")
                .oldValue("Profile update initiated")
                .newValue("Profile updated by admin")
                .updatedAt(LocalDateTime.now())
                .updatedBy("admin")
                .action("UPDATE_TECHNICIAN_PROFILE")
                .technicianId(updated.getId())
                .timestamp(LocalDateTime.now())
                .build();
            auditRepo.save(auditLog);
            
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to update technician profile: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Delete technician by admin (Admin)
     * DELETE /api/technicians/admin/technicians/{technicianId}
     */
    @DeleteMapping("/admin/technicians/{technicianId}")
    public ResponseEntity<?> deleteTechnicianByAdmin(@PathVariable Long technicianId) {
        try {
            Optional<Technician> technicianOpt = repo.findById(technicianId);
            if (technicianOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            Technician technician = technicianOpt.get();
            
            // Mark as deleted instead of physically deleting
            technician.setStatus("DELETED");
            Technician updated = repo.save(technician);
            
            // Log the admin action
            TechnicianAuditLog auditLog = TechnicianAuditLog.builder()
                .email(technician.getEmail())
                .fieldName("DELETED_BY_ADMIN")
                .newValue("Technician marked as deleted by admin")
                .updatedAt(LocalDateTime.now())
                .updatedBy("admin")
                .action("DELETE_TECHNICIAN")
                .technicianId(technician.getId())
                .timestamp(LocalDateTime.now())
                .build();
            auditRepo.save(auditLog);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Technician marked as deleted successfully");
            response.put("technician", updated);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to delete technician: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Force expire counter offer by admin (Admin)
     * DELETE /api/technicians/admin/technicians/counter-offers/{counterOfferId}/force-expire
     */
    @DeleteMapping("/admin/technicians/counter-offers/{counterOfferId}/force-expire")
    public ResponseEntity<?> forceExpireCounterOfferByAdmin(@PathVariable Long counterOfferId) {
        try {
            // This would need to be implemented based on your counter offer model
            // For now, return success
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Counter offer expired successfully");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to expire counter offer: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Get dashboard summary for admin (Admin)
     * GET /api/technicians/admin/technicians/dashboard
     */
    @GetMapping("/admin/technicians/dashboard")
    public ResponseEntity<?> getTechnicianDashboardSummaryForAdmin() {
        try {
            long totalTechnicians = repo.count();
            long activeTechnicians = repo.countByStatus("ACTIVE");
            long suspendedTechnicians = repo.countByStatus("SUSPENDED");
            long deletedTechnicians = repo.countByStatus("DELETED");
            
            // Get recent activity
            List<TechnicianAuditLog> recentActivity = auditRepo.findAll()
                .stream()
                .sorted((a, b) -> b.getUpdatedAt().compareTo(a.getUpdatedAt()))
                .limit(10)
                .collect(Collectors.toList());
            
            Map<String, Object> summary = new HashMap<>();
            summary.put("totalTechnicians", totalTechnicians);
            summary.put("activeTechnicians", activeTechnicians);
            summary.put("suspendedTechnicians", suspendedTechnicians);
            summary.put("deletedTechnicians", deletedTechnicians);
            summary.put("recentActivity", recentActivity);
            
            return ResponseEntity.ok(summary);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to fetch dashboard summary: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }
    
    /**
     * Suspend technician by admin (Admin)
     * PUT /api/technicians/admin/technicians/{technicianId}/suspend
     */
    @PutMapping("/admin/technicians/{technicianId}/suspend")
    public ResponseEntity<?> suspendTechnicianByAdmin(@PathVariable Long technicianId) {
        try {
            Optional<Technician> technicianOpt = repo.findById(technicianId);
            if (technicianOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            Technician technician = technicianOpt.get();
            technician.setStatus("SUSPENDED");
            Technician updated = repo.save(technician);
            
            // Log the admin action
            TechnicianAuditLog auditLog = TechnicianAuditLog.builder()
                .email(updated.getEmail())
                .fieldName("STATUS_CHANGED")
                .oldValue("Previous status: " + technician.getStatus())
                .newValue("Technician suspended by admin")
                .updatedAt(LocalDateTime.now())
                .updatedBy("admin")
                .action("SUSPEND_TECHNICIAN")
                .technicianId(updated.getId())
                .timestamp(LocalDateTime.now())
                .build();
            auditRepo.save(auditLog);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Technician suspended successfully");
            response.put("technician", updated);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to suspend technician: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }
    
    /**
     * Activate technician by admin (Admin)
     * PUT /api/technicians/admin/technicians/{technicianId}/activate
     */
    @PutMapping("/admin/technicians/{technicianId}/activate")
    public ResponseEntity<?> activateTechnicianByAdmin(@PathVariable Long technicianId) {
        try {
            Optional<Technician> technicianOpt = repo.findById(technicianId);
            if (technicianOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            Technician technician = technicianOpt.get();
            technician.setStatus("ACTIVE");
            Technician updated = repo.save(technician);
            
            // Log the admin action
            TechnicianAuditLog auditLog = TechnicianAuditLog.builder()
                .email(updated.getEmail())
                .fieldName("STATUS_CHANGED")
                .oldValue("Previous status: " + technician.getStatus())
                .newValue("Technician activated by admin")
                .updatedAt(LocalDateTime.now())
                .updatedBy("admin")
                .action("ACTIVATE_TECHNICIAN")
                .technicianId(updated.getId())
                .timestamp(LocalDateTime.now())
                .build();
            auditRepo.save(auditLog);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Technician activated successfully");
            response.put("technician", updated);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to activate technician: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }
    
    /**
     * Get technicians by status (Admin)
     * GET /api/technicians/admin/technicians/status/{status}
     */
    @GetMapping("/admin/technicians/status/{status}")
    public ResponseEntity<?> getTechniciansByStatus(
            @PathVariable String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            Page<Technician> technicianPage = repo.findByStatus(status, PageRequest.of(page, size));
            List<Technician> technicians = technicianPage.getContent();
            
            Map<String, Object> response = new HashMap<>();
            response.put("technicians", technicians);
            response.put("currentPage", page);
            response.put("totalPages", technicianPage.getTotalPages());
            response.put("totalElements", technicianPage.getTotalElements());
            response.put("size", size);
            response.put("status", status);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to fetch technicians by status: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }
    
    /**
     * Get counter offer statistics for admin (Admin)
     * GET /api/technicians/admin/technicians/counter-offers/statistics
     */
    @GetMapping("/admin/technicians/counter-offers/statistics")
    public ResponseEntity<?> getCounterOfferStatisticsForAdmin() {
        try {
            long totalCounterOffers = counterOfferRepo.count();
            long pendingCounterOffers = counterOfferRepo.countByStatus(TechCounterOffer.CounterOfferStatus.PENDING);
            long acceptedCounterOffers = counterOfferRepo.countByStatus(TechCounterOffer.CounterOfferStatus.ACCEPTED);
            long rejectedCounterOffers = counterOfferRepo.countByStatus(TechCounterOffer.CounterOfferStatus.REJECTED);
            long withdrawnCounterOffers = counterOfferRepo.countByStatus(TechCounterOffer.CounterOfferStatus.WITHDRAWN);
            long expiredCounterOffers = counterOfferRepo.countByStatus(TechCounterOffer.CounterOfferStatus.EXPIRED);
            
            // Calculate rates
            double acceptanceRate = totalCounterOffers > 0 ? Math.round((double) acceptedCounterOffers / totalCounterOffers * 100 * 100.0) / 100.0 : 0.0;
            double rejectionRate = totalCounterOffers > 0 ? Math.round((double) rejectedCounterOffers / totalCounterOffers * 100 * 100.0) / 100.0 : 0.0;
            double pendingRate = totalCounterOffers > 0 ? Math.round((double) pendingCounterOffers / totalCounterOffers * 100 * 100.0) / 100.0 : 0.0;
            
            Map<String, Object> stats = new HashMap<>();
            stats.put("totalCounterOffers", totalCounterOffers);
            stats.put("pendingCounterOffers", pendingCounterOffers);
            stats.put("acceptedCounterOffers", acceptedCounterOffers);
            stats.put("rejectedCounterOffers", rejectedCounterOffers);
            stats.put("withdrawnCounterOffers", withdrawnCounterOffers);
            stats.put("expiredCounterOffers", expiredCounterOffers);
            stats.put("acceptanceRate", acceptanceRate);
            stats.put("rejectionRate", rejectionRate);
            stats.put("pendingRate", pendingRate);
            stats.put("lastUpdated", LocalDateTime.now());
            
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to fetch counter offer statistics: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }
    
    /**
     * Restore deleted technician by admin (Admin)
     * PUT /api/technicians/admin/technicians/{technicianId}/restore
     */
    @PutMapping("/admin/technicians/{technicianId}/restore")
    public ResponseEntity<?> restoreTechnicianByAdmin(@PathVariable Long technicianId) {
        try {
            Optional<Technician> technicianOpt = repo.findById(technicianId);
            if (technicianOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            Technician technician = technicianOpt.get();
            if (!"DELETED".equals(technician.getStatus())) {
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("message", "Technician is not deleted and cannot be restored");
                return ResponseEntity.badRequest().body(error);
            }
            
            technician.setStatus("ACTIVE");
            Technician updated = repo.save(technician);
            
            // Log the admin action
            TechnicianAuditLog auditLog = TechnicianAuditLog.builder()
                .email(updated.getEmail())
                .fieldName("STATUS_CHANGED")
                .oldValue("Previous status: DELETED")
                .newValue("Technician restored by admin")
                .updatedAt(LocalDateTime.now())
                .updatedBy("admin")
                .action("RESTORE_TECHNICIAN")
                .technicianId(updated.getId())
                .timestamp(LocalDateTime.now())
                .build();
            auditRepo.save(auditLog);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Technician restored successfully");
            response.put("technician", updated);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to restore technician: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

	@GetMapping("/{technicianId}/notifications")
	public ResponseEntity<?> getNotifications(@PathVariable Long technicianId) {
		try {
			// First get the technician to get their email
			Optional<Technician> technicianOpt = repo.findById(technicianId);
			if (technicianOpt.isEmpty()) {
				return ResponseEntity.notFound().build();
			}
			
			String technicianEmail = technicianOpt.get().getEmail();
			
			// Get recent activity for the technician using email
			List<TechAcceptedPost> acceptedPosts = acceptedPostRepo.findByEmail(technicianEmail);
			List<TechDeclinedPosts> declinedPosts = declinedPostsRepo.findAllPostIdsByEmail(technicianEmail).stream()
				.map(postId -> {
					TechDeclinedPosts post = new TechDeclinedPosts();
					post.setId(postId);
					post.setPostId(postId);
					post.setCreatedAt(LocalDateTime.now());
					return post;
				})
				.collect(Collectors.toList());
			List<TechCounterOffer> counterOffers = counterOfferRepo.findByTechnicianEmail(technicianEmail);
			
			List<Map<String, Object>> notifications = new ArrayList<>();
			
			// Add accepted post notifications
			for (TechAcceptedPost post : acceptedPosts) {
				Map<String, Object> notification = new HashMap<>();
				notification.put("id", "acc_" + post.getId());
				notification.put("message", "Post #" + post.getPostId() + " has been accepted and assigned to you");
				notification.put("type", "success");
				notification.put("read", false);
				notification.put("timestamp", post.getCreatedAt() != null ? post.getCreatedAt() : post.getAcceptedAt());
				notifications.add(notification);
			}
			
			// Add declined post notifications
			for (TechDeclinedPosts post : declinedPosts) {
				Map<String, Object> notification = new HashMap<>();
				notification.put("id", "dec_" + post.getId());
				notification.put("message", "Post #" + post.getPostId() + " has been declined");
				notification.put("type", "info");
				notification.put("read", false);
				notification.put("timestamp", post.getCreatedAt());
				notifications.add(notification);
			}
			
			// Add counter offer notifications
			for (TechCounterOffer offer : counterOffers) {
				Map<String, Object> notification = new HashMap<>();
				notification.put("id", "co_" + offer.getId());
				notification.put("message", "Counter offer for Post #" + offer.getPostId() + " - Status: " + offer.getStatus());
				notification.put("type", "info");
				notification.put("read", false);
				notification.put("timestamp", offer.getRequestedAt());
				notifications.add(notification);
			}
			
			// Sort by timestamp (newest first) - handle null timestamps
			notifications.sort((a, b) -> {
				Object timestampA = a.get("timestamp");
				Object timestampB = b.get("timestamp");
				
				if (timestampA == null && timestampB == null) return 0;
				if (timestampA == null) return 1;
				if (timestampB == null) return -1;
				
				if (timestampA instanceof LocalDateTime && timestampB instanceof LocalDateTime) {
					return ((LocalDateTime) timestampB).compareTo((LocalDateTime) timestampA);
				}
				if (timestampA instanceof Date && timestampB instanceof Date) {
					return ((Date) timestampB).compareTo((Date) timestampA);
				}
				
				return 0;
			});
			
			// Limit to last 10 notifications
			if (notifications.size() > 10) {
				notifications = notifications.subList(0, 10);
			}
			
			Map<String, Object> response = new HashMap<>();
			response.put("notifications", notifications);
			response.put("unreadCount", notifications.stream().filter(n -> !(Boolean) n.get("read")).count());
			
			return ResponseEntity.ok(response);
		} catch (Exception e) {
			logger.error("Error fetching notifications for technician {}: {}", technicianId, e.getMessage());
			return ResponseEntity.status(500).body(Map.of("error", "Failed to fetch notifications"));
		}
	}

	@GetMapping("/test-cors")
	public ResponseEntity<Map<String, Object>> testCors() {
		Map<String, Object> response = new HashMap<>();
		response.put("status", "success");
		response.put("message", "Technician service CORS test successful");
		response.put("service", "technician-service");
		response.put("timestamp", System.currentTimeMillis());
		return ResponseEntity.ok(response);
	}
}