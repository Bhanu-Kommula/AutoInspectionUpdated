package com.auto.postings.controller;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;
import java.util.Date;

import org.springframework.http.ResponseEntity;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.auto.postings.dto.CounterOfferRequestDto;
import com.auto.postings.dto.CounterOfferResponseDto;
import com.auto.postings.dto.DealerAcceptedPostUpdateFromTechDashDto;
import com.auto.postings.dto.DealerResponseDto;
import com.auto.postings.dto.DeletePostRequestByIdDto;
import com.auto.postings.dto.EditPostRequestDto;
import com.auto.postings.dto.GetAllPostsByEmailRequestDto;
import com.auto.postings.dto.GetByFiltersDto;
import com.auto.postings.dto.PostRequestDto;
import com.auto.postings.model.Posting;
import com.auto.postings.model.PostStatus;
import com.auto.postings.service.CounterOfferService;
import com.auto.postings.service.PostingService;
import com.auto.postings.client.TechnicianClient;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/")
@RequiredArgsConstructor
@Slf4j
public class PostingController {

    private final PostingService service;
    private final CounterOfferService counterOfferService;
    private final TechnicianClient technicianClient;

    @PostMapping("/submit-post")
    public Posting submitPost(@RequestBody PostRequestDto request) {
        return service.savePosting(
                request.getEmail(),
                request.getContent(),
                request.getLocation(),
                request.getOfferAmount(),
                request.getStatus(),
                request.getVin(),
                request.getAuctionLot()
        );
    }
    
    @PostMapping("/update-multiple-acceptedpost-from-Techdash")
    public List<DealerAcceptedPostUpdateFromTechDashDto> submitMultiplePost(@RequestBody List<DealerAcceptedPostUpdateFromTechDashDto> request) {
        List<Posting> updated = service.saveMultiplePostings(request);

        return updated.stream().map(p -> {
            DealerAcceptedPostUpdateFromTechDashDto dto = new DealerAcceptedPostUpdateFromTechDashDto();
            dto.setPostId(p.getId());
            dto.setStatus(p.getStatus());
            dto.setAcceptedAt(p.getAcceptedAt()); // ✅ updated field
            dto.setTechnicianName(p.getTechnicianName());
            dto.setTechnicianEmail(p.getTechnicianEmail());
            dto.setTechnicianPhone(p.getTechnicianPhone());
            dto.setDealerPhone(p.getDealerPhone());
            dto.setExpectedCompletionBy(p.getExpectedCompletionBy());
            return dto;
        }).collect(Collectors.toList());
    }


    
    
    @PostMapping("/posts-by-email")
    public ResponseEntity<?> getAllPostsbyEmail(@RequestBody GetAllPostsByEmailRequestDto email) {
        try {
            log.info("📧 [PostingController] Received request for posts by email: {}", email.getEmail());
            List<Posting> posts = service.getAllPosts(email);
            log.info("📧 [PostingController] Successfully retrieved {} posts", posts.size());
            return ResponseEntity.ok(posts);
        } catch (Exception e) {
            log.error("❌ [PostingController] Error fetching posts by email: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error fetching posts: " + e.getMessage());
            errorResponse.put("timestamp", System.currentTimeMillis());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }
    

    @GetMapping("/post")
    public List<Posting> getAllPost() {
        return service.getAllPost();
    }
    
    
   
    @PostMapping("/delete-by-id")
    public String deletePostByID(@RequestBody DeletePostRequestByIdDto id) {
    	return service.deletePostById(id);
    }
    
    // ✅ SOFT DELETE: Restore a deleted post
    @PostMapping("/restore-by-id")
    public String restorePostByID(@RequestBody DeletePostRequestByIdDto id) {
        return service.restoreDeletedPost(id.getId());
    }
    
    // ✅ SOFT DELETE: Get all deleted posts
    @GetMapping("/deleted")
    public ResponseEntity<Object> getDeletedPosts() {
        List<Posting> deletedPosts = service.getAllDeletedPosts();
        return ResponseEntity.ok(Map.of("posts", deletedPosts));
    }
    
    @GetMapping("/post/{id}")
    public Posting getPostById(@PathVariable Long id) {
        return service.getPostById(id);
    }
    
    
    @PostMapping("/posts-update-id")
    public ResponseEntity<String> updatePost(@RequestBody EditPostRequestDto dto) {
        String result = service.updatePostById(dto);
        return ResponseEntity.ok(result);
    }

    
    @PostMapping("/filters")
    public List<Posting> getByFilter(@RequestBody GetByFiltersDto dto){
    	
    	return service.getByFilter(dto);
    	
    	
    }
    
    // ==================== COUNTER OFFER ENDPOINTS ====================
    
    /**
     * Submit counter offer for a post
     * POST /counter-offers
     */
    @PostMapping("/counter-offers")
    public ResponseEntity<Map<String, Object>> submitCounterOffer(@RequestBody CounterOfferRequestDto request) {
        try {
            Map<String, Object> result = counterOfferService.submitCounterOffer(request);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to submit counter offer: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    /**
     * Get counter offers for a post
     * GET /counter-offers/post/{postId}
     */
    @GetMapping("/counter-offers/post/{postId}")
    public ResponseEntity<List<CounterOfferResponseDto>> getCounterOffersByPost(@PathVariable Long postId) {
        try {
            List<CounterOfferResponseDto> counterOffers = counterOfferService.getCounterOffersByPost(postId);
            return ResponseEntity.ok(counterOffers);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(List.of());
        }
    }
    
    /**
     * Get counter offers by technician email
     * GET /counter-offers/technician/{technicianEmail}
     */
    @GetMapping("/counter-offers/technician/{technicianEmail}")
    public ResponseEntity<List<CounterOfferResponseDto>> getCounterOffersByTechnician(@PathVariable String technicianEmail) {
        try {
            List<CounterOfferResponseDto> counterOffers = counterOfferService.getCounterOffersByTechnician(technicianEmail);
            return ResponseEntity.ok(counterOffers);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(List.of());
        }
    }
    
    /**
     * Get pending counter offers for dealer
     * GET /counter-offers/pending/{dealerEmail}
     */
    @GetMapping("/counter-offers/pending/{dealerEmail}")
    public ResponseEntity<Map<String, Object>> getPendingCounterOffersForDealer(@PathVariable String dealerEmail) {
        try {
            // Service now returns the complete response format expected by frontend
            Map<String, Object> response = counterOfferService.getPendingCounterOffersForDealer(dealerEmail);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to get pending counter offers: " + e.getMessage());
            error.put("pendingOffers", new HashMap<>());
            error.put("totalPendingCount", 0);
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    /**
     * Dealer respond to counter offer
     * PUT /counter-offers/respond
     */
    @PutMapping("/counter-offers/respond")
    public ResponseEntity<Map<String, Object>> dealerRespondToCounterOffer(@RequestBody DealerResponseDto responseDto) {
        try {
            log.info("Received dealer response to counter offer: counterOfferId={}, action={}", 
                   responseDto.getCounterOfferId(), responseDto.getAction());
            
            CounterOfferResponseDto response = counterOfferService.respondToCounterOffer(responseDto);
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "Counter offer " + responseDto.getAction().toLowerCase() + "ed successfully");
            result.put("data", response);
            
            log.info("Successfully processed dealer response: counterOfferId={}, newStatus={}", 
                   response.getId(), response.getStatus());
            
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            log.warn("Invalid request for counter offer response: {}", e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Invalid request: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        } catch (IllegalStateException e) {
            log.error("Business logic error during counter offer response: {}", e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Business rule violation: " + e.getMessage());
            return ResponseEntity.status(409).body(error);
        } catch (Exception e) {
            log.error("Unexpected error during counter offer response: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Internal server error: " + e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }
    
    /**
     * Check counter offer eligibility for technician
     * GET /counter-offers/eligibility/{postId}/{technicianEmail}
     */
    @GetMapping("/counter-offers/eligibility/{postId}/{technicianEmail}")
    public ResponseEntity<Map<String, Object>> checkCounterOfferEligibility(@PathVariable Long postId, @PathVariable String technicianEmail) {
        try {
            Map<String, Object> result = counterOfferService.checkCounterOfferEligibility(postId, technicianEmail);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("canSubmit", false);
            error.put("message", "Error checking eligibility: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    // ==================== POST ACCEPTANCE ENDPOINTS ====================
    
    /**
     * Accept post directly by technician (original post amount)
     * POST /accept
     */
    @PostMapping("/accept")
    public ResponseEntity<Map<String, Object>> acceptPost(@RequestBody Map<String, Object> request) {
        try {
            Long postId = Long.valueOf(request.get("postId").toString());
            String technicianEmail = request.get("technicianEmail").toString();
            String technicianName = request.get("technicianName") != null ? request.get("technicianName").toString() : null;
            
            log.info("Direct post acceptance request: postId={}, technicianEmail={}", postId, technicianEmail);
            
            // Check if post exists and is available
            Posting post = service.getPostById(postId);
            if (post.getStatus() != PostStatus.PENDING) {
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("message", "Post is not available for acceptance. Current status: " + post.getStatus());
                error.put("currentStatus", post.getStatus().name());
                return ResponseEntity.badRequest().body(error);
            }
            
            // Withdraw any pending counter offers by this technician for this post
            try {
                counterOfferService.withdrawCounterOffersForPost(postId, technicianEmail);
                
                // 🔄 CROSS-SERVICE SYNC: Notify technician service about withdrawal
                try {
                    Map<String, Object> withdrawalRequest = new HashMap<>();
                    withdrawalRequest.put("postId", postId);
                    withdrawalRequest.put("technicianEmail", technicianEmail);
                    
                    log.info("Notifying technician service about counter offer withdrawal for post: {}", postId);
                    Map<String, Object> syncResult = technicianClient.notifyCounterOfferWithdrawal(withdrawalRequest);
                    
                    if (syncResult != null && Boolean.TRUE.equals(syncResult.get("success"))) {
                        log.info("Successfully synced withdrawal to technician service for post: {}", postId);
                    } else {
                        log.warn("Failed to sync withdrawal to technician service for post: {} - Response: {}", postId, syncResult);
                    }
                } catch (Exception syncException) {
                    log.error("Error syncing withdrawal to technician service for post {}: {}", postId, syncException.getMessage());
                    // Don't fail the main operation if sync fails
                }
            } catch (Exception e) {
                log.warn("Failed to withdraw counter offers during direct accept: {}", e.getMessage());
                // Don't fail the entire operation if counter offer withdrawal fails
            }
            
            // Accept the post with original amount
            boolean accepted = service.acceptPostDirectly(postId, technicianEmail, null);
            
            if (accepted) {
                // Update technician name if provided
                if (technicianName != null && !technicianName.trim().isEmpty()) {
                    post.setTechnicianName(technicianName);
                    // Save is already done in acceptPostDirectly, but we could add name update here if needed
                }
                
                Map<String, Object> result = new HashMap<>();
                result.put("success", true);
                result.put("message", "Post accepted successfully");
                result.put("postId", postId);
                result.put("technicianEmail", technicianEmail);
                result.put("acceptedAt", new Date());
                result.put("offerAmount", post.getOfferAmount());
                
                log.info("Successfully accepted post: id={}, technicianEmail={}", postId, technicianEmail);
                return ResponseEntity.ok(result);
            } else {
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("message", "Failed to accept post. It may have been accepted by another technician.");
                return ResponseEntity.badRequest().body(error);
            }
            
        } catch (IllegalArgumentException e) {
            log.warn("Invalid request for post acceptance: {}", e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Invalid request: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        } catch (Exception e) {
            log.error("Error accepting post: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to accept post: " + e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }
    
    /**
     * Accept post with counter offer amount (when technician accepts during counter offer)
     * POST /accept-with-counter-offer
     */
    @PostMapping("/accept-with-counter-offer")
    public ResponseEntity<Map<String, Object>> acceptPostWithCounterOffer(@RequestBody Map<String, Object> request) {
        try {
            Long postId = Long.valueOf(request.get("postId").toString());
            String technicianEmail = request.get("technicianEmail").toString();
            String offerAmount = request.get("offerAmount") != null ? request.get("offerAmount").toString() : null;
            
            log.info("Accept post with counter offer: postId={}, technicianEmail={}, offerAmount={}", 
                   postId, technicianEmail, offerAmount);
            
            // Accept the post with the specified offer amount
            boolean accepted = service.acceptPostDirectly(postId, technicianEmail, offerAmount);
            
            if (accepted) {
                // Withdraw any pending counter offers by this technician for this post
                try {
                    counterOfferService.withdrawCounterOffersForPost(postId, technicianEmail);
                } catch (Exception e) {
                    log.warn("Failed to withdraw counter offers after accept: {}", e.getMessage());
                    // Don't fail the entire operation if counter offer withdrawal fails
                }
                
                Map<String, Object> result = new HashMap<>();
                result.put("success", true);
                result.put("message", "Post accepted successfully with counter offer amount");
                result.put("postId", postId);
                result.put("technicianEmail", technicianEmail);
                result.put("acceptedAt", new Date());
                result.put("offerAmount", offerAmount);
                
                log.info("Successfully accepted post with counter offer: id={}, technicianEmail={}, amount={}", 
                       postId, technicianEmail, offerAmount);
                return ResponseEntity.ok(result);
            } else {
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("message", "Failed to accept post. It may have been accepted by another technician.");
                return ResponseEntity.badRequest().body(error);
            }
            
        } catch (Exception e) {
            log.error("Error accepting post with counter offer: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to accept post with counter offer: " + e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }
    
    /**
     * Withdraw counter offers for a post by technician
     * Called when technician accepts/declines the original post
     */
    @PostMapping("/counter-offers/withdraw")
    public ResponseEntity<Map<String, Object>> withdrawCounterOffersForPost(@RequestBody Map<String, Object> request) {
        try {
            log.info("Withdrawing counter offers for post: {}", request);
            
            Long postId = Long.valueOf(request.get("postId").toString());
            String technicianEmail = (String) request.get("technicianEmail");
            
            if (postId == null || technicianEmail == null) {
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("message", "Missing required fields: postId, technicianEmail");
                return ResponseEntity.badRequest().body(error);
            }
            
            // Withdraw counter offers in posting service
            counterOfferService.withdrawCounterOffersForPost(postId, technicianEmail);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "Counter offers withdrawn successfully");
            result.put("postId", postId);
            result.put("technicianEmail", technicianEmail);
            result.put("withdrawnAt", new Date());
            
            log.info("Successfully withdrew counter offers for post: id={}, technicianEmail={}", 
                   postId, technicianEmail);
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("Error withdrawing counter offers: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to withdraw counter offers: " + e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }

    @GetMapping("/test-cors")
    public ResponseEntity<Map<String, Object>> testCors() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "success");
        response.put("message", "Postings service CORS test successful");
        response.put("service", "postings-service");
        response.put("timestamp", System.currentTimeMillis());
        return ResponseEntity.ok(response);
    }
    
}
