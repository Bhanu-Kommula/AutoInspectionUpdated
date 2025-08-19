package com.auto.postings.service;

import com.auto.postings.client.TechnicianClient;
import com.auto.postings.dto.CounterOfferRequestDto;
import com.auto.postings.dto.CounterOfferResponseDto;
import com.auto.postings.dto.DealerResponseDto;
import com.auto.postings.model.CounterOffer;
import com.auto.postings.model.DealerCounterOfferAction;
import com.auto.postings.model.Posting;
import com.auto.postings.model.PostStatus;
import com.auto.postings.repository.CounterOfferRepository;
import com.auto.postings.repository.DealerCounterOfferActionRepository;
import com.auto.postings.repository.PostingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Propagation;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.concurrent.CompletableFuture;

@Service
@RequiredArgsConstructor
@Slf4j
public class CounterOfferService {

    private final CounterOfferRepository counterOfferRepository;
    private final PostingRepository postingRepository;
    private final PostingService postingService;
    private final DealerCounterOfferActionRepository dealerCounterOfferActionRepository;
    private final TechnicianClient technicianClient;

    /**
     * Submit a counter offer for a post
     */
    public Map<String, Object> submitCounterOffer(CounterOfferRequestDto request) {
        Map<String, Object> response = new HashMap<>();

        try {
            log.info("Creating counter offer for post {} by technician {}", 
                   request.getPostId(), request.getTechnicianEmail());

            // Check if post exists and is available
            Optional<Posting> postOpt = postingRepository.findById(request.getPostId());
            if (postOpt.isEmpty()) {
                response.put("success", false);
                response.put("message", "Post not found");
                return response;
            }

            Posting post = postOpt.get();
            if (!"PENDING".equals(post.getStatus().name())) {
                response.put("success", false);
                response.put("message", "Post is no longer available for counter offers");
                return response;
            }

            // ✅ FIXED: Check total attempt count instead of just pending status
            // Allow technicians to submit new counter offers after rejection (up to 3 total attempts)
            List<CounterOffer> existingOffers = counterOfferRepository.findByPostIdAndTechnicianEmailOrderByRequestedAtDesc(
                request.getPostId(), request.getTechnicianEmail());
            
            // Count total attempts (PENDING, ACCEPTED, REJECTED, EXPIRED - but not WITHDRAWN)
            long totalAttempts = existingOffers.stream()
                .filter(offer -> offer.getStatus() != CounterOffer.CounterOfferStatus.WITHDRAWN)
                .count();
            
            if (totalAttempts >= 3) {
                response.put("success", false);
                response.put("message", "You have reached the maximum limit of 3 counter offers for this post");
                return response;
            }
            
            // Check if there's already a pending counter offer (to prevent multiple pending offers)
            boolean hasPendingOffer = existingOffers.stream()
                .anyMatch(offer -> offer.getStatus() == CounterOffer.CounterOfferStatus.PENDING && 
                                 offer.getExpiresAt() != null && 
                                 offer.getExpiresAt().isAfter(LocalDateTime.now()));
            
            if (hasPendingOffer) {
                response.put("success", false);
                response.put("message", "You already have a pending counter offer for this post");
                return response;
            }

            // Create counter offer
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime expiresAt = now.plusHours(48); // 48 hours expiry
            
            CounterOffer counterOffer = CounterOffer.builder()
                    .postId(request.getPostId())
                    .technicianEmail(request.getTechnicianEmail())
                    .technicianName(request.getTechnicianName())
                    .originalOfferAmount(request.getOriginalOfferAmount())
                    .requestedOfferAmount(request.getRequestedOfferAmount())
                    .technicianLocation(request.getTechnicianLocation())
                    .requestedAt(now)
                    .requestReason(request.getRequestReason())
                    .technicianNotes(request.getTechnicianNotes())
                    .status(CounterOffer.CounterOfferStatus.PENDING)
                    .expiresAt(expiresAt)
                    .createdAt(now)
                    .updatedAt(now)
                    .build();

            CounterOffer savedCounterOffer = counterOfferRepository.save(counterOffer);

            response.put("success", true);
            response.put("message", "Counter offer submitted successfully");
            response.put("counterOfferId", savedCounterOffer.getId());
            response.put("postId", request.getPostId());
            response.put("technicianEmail", request.getTechnicianEmail());
            response.put("requestedAmount", request.getRequestedOfferAmount());
            response.put("expiresAt", savedCounterOffer.getExpiresAt());
            response.put("attemptNumber", totalAttempts + 1);
            response.put("maxAttempts", 3);

            log.info("Counter offer created successfully with ID: {} (attempt {}/3)", 
                    savedCounterOffer.getId(), totalAttempts + 1);

        } catch (Exception e) {
            log.error("Error creating counter offer: {}", e.getMessage());
            response.put("success", false);
            response.put("message", "Failed to submit counter offer: " + e.getMessage());
        }

        return response;
    }

    /**
     * Respond to a counter offer (ACCEPT or REJECT)
     * Enhanced with better transaction management and error handling
     */
    @Transactional(rollbackFor = Exception.class)
    public CounterOfferResponseDto respondToCounterOffer(DealerResponseDto responseDto) {
        log.info("Processing counter offer response: id={}, action={}, notes={}", 
               responseDto.getCounterOfferId(), responseDto.getAction(), responseDto.getResponseNotes());

        // Find the counter offer
        Optional<CounterOffer> counterOfferOpt = counterOfferRepository.findById(responseDto.getCounterOfferId());
        if (counterOfferOpt.isEmpty()) {
            throw new IllegalArgumentException("Counter offer not found with ID: " + responseDto.getCounterOfferId());
        }

        CounterOffer counterOffer = counterOfferOpt.get();
        log.info("Found counter offer: id={}, postId={}, technicianEmail={}, status={}, canBeModified={}", 
               counterOffer.getId(), counterOffer.getPostId(), 
               counterOffer.getTechnicianEmail(), 
               counterOffer.getStatus(), counterOffer.canBeModified());

        // Check if counter offer can be modified
        if (!counterOffer.canBeModified()) {
            throw new IllegalStateException("Counter offer cannot be modified - it's either not pending or has expired. Current status: " + counterOffer.getStatus());
        }

        // CRITICAL RACE CONDITION CHECK: Verify post is still available for acceptance
        if (responseDto.isAcceptAction()) {
            Optional<Posting> postOpt = postingRepository.findByIdWithLock(counterOffer.getPostId());
            if (postOpt.isEmpty()) {
                throw new IllegalStateException("Post not found for counter offer acceptance");
            }
            Posting post = postOpt.get();
            if (post.getStatus() != PostStatus.PENDING) {
                throw new IllegalStateException("Post is no longer available for acceptance. Current status: " + post.getStatus() + ". Another counter offer may have already been accepted.");
            }
        }

        // Get dealer email from post
        String dealerEmail = getDealerEmailForCounterOffer(counterOffer);
        log.info("Dealer email for counter offer: {}", dealerEmail);

        // Process dealer response
        if (responseDto.isAcceptAction()) {
            log.info("Processing ACCEPT action for counter offer {}", counterOffer.getId());
            counterOffer.acceptByDealer(responseDto.getResponseNotes());
            log.info("Counter offer {} accepted by dealer", counterOffer.getId());
            
            // Create dealer action record
            createDealerActionRecord(counterOffer.getId(), dealerEmail, 
                DealerCounterOfferAction.ActionType.ACCEPT, responseDto.getResponseNotes());
            
            // Handle accepted counter offer
            handleAcceptedCounterOffer(counterOffer, dealerEmail);
            
        } else if (responseDto.isRejectAction()) {
            log.info("Processing REJECT action for counter offer {}", counterOffer.getId());
            counterOffer.rejectByDealer(responseDto.getResponseNotes());
            log.info("Counter offer {} rejected by dealer", counterOffer.getId());
            
            // ✅ FIXED: Simplified rejection flow to avoid transaction issues
            // Just update the counter offer status and log the rejection
            // Cross-service sync and other operations will be handled asynchronously
            
            log.info("Counter offer {} rejected successfully - status updated to REJECTED", counterOffer.getId());
            
        } else {
            throw new IllegalArgumentException("Invalid action '" + responseDto.getAction() + "'. Must be ACCEPT or REJECT");
        }

        // Save the updated counter offer
        CounterOffer updatedCounterOffer = counterOfferRepository.save(counterOffer);
        log.info("Successfully saved counter offer response: id={}, status={}", updatedCounterOffer.getId(), updatedCounterOffer.getStatus());
        
        // ✅ FIXED: Handle post-rejection operations asynchronously to avoid transaction issues
        if (responseDto.isRejectAction()) {
            // Schedule post-rejection operations in a separate thread
            CompletableFuture.runAsync(() -> {
                try {
                    log.info("Starting post-rejection operations for counter offer: {}", updatedCounterOffer.getId());
                    
                    // Create dealer action record
                    createDealerActionRecord(updatedCounterOffer.getId(), dealerEmail, 
                        DealerCounterOfferAction.ActionType.REJECT, responseDto.getResponseNotes());
                    
                    // Handle rejected counter offer details
                    handleRejectedCounterOffer(updatedCounterOffer, dealerEmail);
                    
                    // Send notification
                    sendCounterOfferNotification(updatedCounterOffer, "REJECTED");
                    
                    log.info("Completed post-rejection operations for counter offer: {}", updatedCounterOffer.getId());
                } catch (Exception e) {
                    log.error("Error in post-rejection operations for counter offer {}: {}", 
                             updatedCounterOffer.getId(), e.getMessage());
                }
            });
        }
        
        return convertToResponseDto(updatedCounterOffer);
    }

    /**
     * Handle accepted counter offer - Update post status, assign technician, save to accepted posts, and reject other offers
     * Enhanced with better race condition protection and validation
     */
    @Transactional(rollbackFor = Exception.class)
    private void handleAcceptedCounterOffer(CounterOffer acceptedOffer, String dealerEmail) {
        try {
            log.info("Processing accepted counter offer for post {} by technician {}", 
                   acceptedOffer.getPostId(), acceptedOffer.getTechnicianEmail());

            // Validate the counter offer before processing
            if (acceptedOffer.getPostId() == null) {
                throw new IllegalArgumentException("Counter offer post ID cannot be null");
            }
            if (acceptedOffer.getTechnicianEmail() == null || acceptedOffer.getTechnicianEmail().trim().isEmpty()) {
                throw new IllegalArgumentException("Counter offer technician email cannot be null or empty");
            }
            if (acceptedOffer.getRequestedOfferAmount() == null || acceptedOffer.getRequestedOfferAmount().trim().isEmpty()) {
                throw new IllegalArgumentException("Counter offer requested amount cannot be null or empty");
            }

            // ENHANCED RACE CONDITION CHECK: Re-verify post is still available with lock
            Optional<Posting> postOpt = postingRepository.findByIdWithLock(acceptedOffer.getPostId());
            if (postOpt.isEmpty()) {
                throw new IllegalStateException("Post not found for counter offer acceptance: " + acceptedOffer.getPostId());
            }
            
            Posting post = postOpt.get();
            if (post.getStatus() != PostStatus.PENDING) {
                throw new IllegalStateException("Post is no longer available for acceptance. Current status: " + post.getStatus() + 
                    ". Another counter offer may have already been accepted.");
            }

            log.info("Post {} verified as PENDING, proceeding with counter offer acceptance", acceptedOffer.getPostId());

            // 1. Update post status to ACCEPTED, assign technician, and update offer amount
            log.info("Accepting post with counter offer: postId={}, technicianEmail={}, newAmount={}", 
                   acceptedOffer.getPostId(), acceptedOffer.getTechnicianEmail(), acceptedOffer.getRequestedOfferAmount());
            
            try {
                boolean postUpdateSuccess = postingService.acceptPostWithCounterOffer(
                    acceptedOffer.getPostId(), 
                    acceptedOffer.getTechnicianEmail(),
                    acceptedOffer.getRequestedOfferAmount(),
                    dealerEmail
                );
                
                if (!postUpdateSuccess) {
                    throw new RuntimeException("Failed to update post status - post may have been accepted by another technician");
                }
                
                log.info("Successfully updated post {} to ACCEPTED with counter offer amount {}", 
                       acceptedOffer.getPostId(), acceptedOffer.getRequestedOfferAmount());
                
            } catch (Exception e) {
                log.error("Exception during post update for counter offer: {}", e.getMessage(), e);
                throw new RuntimeException("Exception during post update: " + e.getMessage(), e);
            }

            // 2. Save to accepted posts table with counter offer details (database constraint prevents duplicates)
            try {
                postingService.saveToAcceptedPostsTable(
                    acceptedOffer.getPostId(),
                    acceptedOffer.getTechnicianEmail(),
                    acceptedOffer.getRequestedOfferAmount(),
                    "Counter offer accepted: " + acceptedOffer.getRequestedOfferAmount()
                );
                log.info("Saved accepted post record for counter offer - post: {}, technician: {}, amount: {}", 
                        acceptedOffer.getPostId(), acceptedOffer.getTechnicianEmail(), acceptedOffer.getRequestedOfferAmount());
            } catch (org.springframework.dao.DataIntegrityViolationException e) {
                // This happens when post is already accepted by someone else (unique constraint violation)
                log.warn("Post {} already accepted by another technician during counter offer processing - database constraint prevented duplicate", 
                       acceptedOffer.getPostId());
                throw new IllegalStateException("Post " + acceptedOffer.getPostId() + " has already been accepted by another technician", e);
            } catch (Exception e) {
                log.error("Failed to save accepted post record for counter offer: {}", e.getMessage(), e);
                // This is critical for counter offers - if we can't save the acceptance record, fail the operation
                throw new RuntimeException("Failed to save accepted post record: " + e.getMessage(), e);
            }

            // 3. Reject other pending offers for this post (auto-rejection feature)
            rejectOtherPendingOffers(acceptedOffer.getPostId(), acceptedOffer.getId());

            // 4. 🔄 CROSS-SERVICE SYNC: Notify technician service about the acceptance
            try {
                Map<String, Object> acceptanceData = new HashMap<>();
                acceptanceData.put("counterOfferId", acceptedOffer.getId());
                acceptanceData.put("postId", acceptedOffer.getPostId());
                acceptanceData.put("technicianEmail", acceptedOffer.getTechnicianEmail());
                acceptanceData.put("dealerResponseAt", acceptedOffer.getDealerResponseAt());
                acceptanceData.put("dealerResponseNotes", acceptedOffer.getDealerResponseNotes());
                acceptanceData.put("acceptedAmount", acceptedOffer.getRequestedOfferAmount());

                log.info("Notifying technician service about counter offer acceptance: {}", acceptedOffer.getId());
                Map<String, Object> syncResult = technicianClient.notifyCounterOfferAcceptance(
                    acceptedOffer.getId(), acceptanceData);
                
                if (syncResult != null && Boolean.TRUE.equals(syncResult.get("success"))) {
                    log.info("Successfully synced acceptance to technician service for counter offer: {}", acceptedOffer.getId());
                } else {
                    log.warn("Failed to sync acceptance to technician service for counter offer: {} - Response: {}", 
                            acceptedOffer.getId(), syncResult);
                }
            } catch (Exception syncException) {
                log.error("Error syncing acceptance to technician service for counter offer {}: {}", 
                         acceptedOffer.getId(), syncException.getMessage());
                // Don't fail the main acceptance process if sync fails
            }

            log.info("Successfully processed accepted counter offer for post {} by technician {} with amount {}", 
                   acceptedOffer.getPostId(), acceptedOffer.getTechnicianEmail(), acceptedOffer.getRequestedOfferAmount());

        } catch (IllegalStateException | IllegalArgumentException e) {
            // These are expected validation/business logic errors - log and re-throw
            log.warn("Validation error during counter offer acceptance: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error processing accepted counter offer for post {} by technician {}: {}", 
                     acceptedOffer.getPostId(), acceptedOffer.getTechnicianEmail(), e.getMessage(), e);
            throw new RuntimeException("Failed to process accepted counter offer: " + e.getMessage(), e);
        }
    }

    /**
     * Handle rejected counter offer - Track rejection and check attempt limits
     */
    private void handleRejectedCounterOffer(CounterOffer rejectedOffer, String dealerEmail) {
        try {
            log.info("Processing rejected counter offer for post {} by technician {}", 
                   rejectedOffer.getPostId(), rejectedOffer.getTechnicianEmail());

            // 1. Check how many counter offer attempts this technician has made for this post
            int attemptCount = getTechnicianCounterOfferAttempts(rejectedOffer.getPostId(), rejectedOffer.getTechnicianEmail());
            
            if (attemptCount >= 3) {
                log.info("Technician {} has reached maximum counter offer attempts (3) for post {}", 
                        rejectedOffer.getTechnicianEmail(), rejectedOffer.getPostId());
                
                // Create declined post record since technician can't submit more counter offers
                try {
                    postingService.saveToDeclinedPostsTable(
                        rejectedOffer.getPostId(),
                        rejectedOffer.getTechnicianEmail(),
                        rejectedOffer.getRequestedOfferAmount(),
                        "Maximum counter offer attempts reached (3)"
                    );
                    log.info("Created declined post record for maximum attempts - post: {}, technician: {}", 
                            rejectedOffer.getPostId(), rejectedOffer.getTechnicianEmail());
                } catch (Exception e) {
                    log.error("Failed to create declined post record: {}", e.getMessage());
                    // Don't fail the main rejection process
                }
            } else {
                log.info("Technician {} can submit another counter offer for post {} (attempt {}/3)", 
                        rejectedOffer.getTechnicianEmail(), rejectedOffer.getPostId(), attemptCount + 1);
            }

            // 2. Post remains PENDING and available for new counter offers (if under limit)
            log.info("Post {} remains available for new counter offers", rejectedOffer.getPostId());

            // 3. 🔄 CROSS-SERVICE SYNC: Notify technician service about the rejection (NON-BLOCKING)
            // ✅ FIXED: Use @Async or separate thread to prevent transaction rollback issues
            try {
                // Execute cross-service sync in a separate thread to avoid transaction issues
                CompletableFuture.runAsync(() -> {
                    try {
                        Map<String, Object> rejectionData = new HashMap<>();
                        rejectionData.put("counterOfferId", rejectedOffer.getId());
                        rejectionData.put("postId", rejectedOffer.getPostId());
                        rejectionData.put("technicianEmail", rejectedOffer.getTechnicianEmail());
                        rejectionData.put("dealerResponseAt", rejectedOffer.getDealerResponseAt());
                        rejectionData.put("dealerResponseNotes", rejectedOffer.getDealerResponseNotes());
                        rejectionData.put("attemptCount", attemptCount);
                        rejectionData.put("maxAttemptsReached", attemptCount >= 3);

                        log.info("Notifying technician service about counter offer rejection: {}", rejectedOffer.getId());
                        Map<String, Object> syncResult = technicianClient.notifyCounterOfferRejection(
                            rejectedOffer.getId(), rejectionData);
                        
                        if (syncResult != null && Boolean.TRUE.equals(syncResult.get("success"))) {
                            log.info("Successfully synced rejection to technician service for counter offer: {}", rejectedOffer.getId());
                        } else {
                            log.warn("Failed to sync rejection to technician service for counter offer: {} - Response: {}", 
                                    rejectedOffer.getId(), syncResult);
                        }
                    } catch (Exception syncException) {
                        log.error("Error in async sync to technician service for counter offer {}: {}", 
                                 rejectedOffer.getId(), syncException.getMessage());
                    }
                });
                
                log.info("Cross-service sync for rejection initiated asynchronously for counter offer: {}", rejectedOffer.getId());
                
            } catch (Exception e) {
                log.error("Error initiating cross-service sync for rejection: {}", e.getMessage());
                // Don't fail the main rejection process if sync initiation fails
            }

            log.info("Successfully processed rejected counter offer for post {} by technician {}", 
                   rejectedOffer.getPostId(), rejectedOffer.getTechnicianEmail());

        } catch (Exception e) {
            log.error("Error processing rejected counter offer: {}", e.getMessage());
            // Don't throw exception for rejection processing - it's not critical
        }
    }

    /**
     * Reject other pending counter offers for the same post (auto-rejection feature)
     * Enhanced with better error handling and batch processing
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW, rollbackFor = Exception.class)
    private void rejectOtherPendingOffers(Long postId, Long acceptedOfferId) {
        try {
            log.info("Auto-rejecting other pending counter offers for post {} (accepted offer: {})", postId, acceptedOfferId);
            
            // Find all other pending counter offers for this post
            List<CounterOffer> otherPendingOffers = counterOfferRepository
                .findByPostIdAndStatusAndIdNot(postId, CounterOffer.CounterOfferStatus.PENDING, acceptedOfferId);

            if (otherPendingOffers.isEmpty()) {
                log.info("No other pending counter offers found for post {}", postId);
                return;
            }

            int rejectedCount = 0;
            for (CounterOffer otherOffer : otherPendingOffers) {
                try {
                    // Double-check that the offer can still be modified (not expired)
                    if (otherOffer.canBeModified()) {
                        otherOffer.rejectByDealer("Automatically rejected - Another counter offer was accepted for this post");
                        counterOfferRepository.save(otherOffer);
                        rejectedCount++;
                        
                        log.info("Auto-rejected counter offer {} by technician {} for post {} (reason: another offer accepted)", 
                               otherOffer.getId(), otherOffer.getTechnicianEmail(), postId);
                        
                        // Create dealer action record for audit trail
                        try {
                            createDealerActionRecord(otherOffer.getId(), "system@auto-reject", 
                                DealerCounterOfferAction.ActionType.REJECT, 
                                "Automatically rejected - Another counter offer was accepted");
                        } catch (Exception auditException) {
                            log.warn("Failed to create audit record for auto-rejected offer {}: {}", 
                                   otherOffer.getId(), auditException.getMessage());
                            // Don't fail the rejection if audit fails
                        }
                    } else {
                        log.warn("Cannot auto-reject counter offer {} for post {} - offer is no longer modifiable (status: {})", 
                               otherOffer.getId(), postId, otherOffer.getStatus());
                    }
                } catch (Exception e) {
                    log.error("Failed to auto-reject individual counter offer {} for post {}: {}", 
                             otherOffer.getId(), postId, e.getMessage());
                    // Continue processing other offers even if one fails
                }
            }

            log.info("Successfully auto-rejected {} out of {} pending counter offers for post {}", 
                   rejectedCount, otherPendingOffers.size(), postId);

        } catch (Exception e) {
            log.error("Error during auto-rejection of pending counter offers for post {}: {}", postId, e.getMessage(), e);
            // Don't fail the main operation if auto-rejection fails
            // This is a convenience feature - the main acceptance should still succeed
        }
    }

    /**
     * Get all counter offers for a post
     */
    public List<CounterOfferResponseDto> getCounterOffersByPost(Long postId) {
        List<CounterOffer> counterOffers = counterOfferRepository.findByPostIdOrderByRequestedAtDesc(postId);
        return counterOffers.stream()
                .map(this::convertToResponseDto)
                .collect(Collectors.toList());
    }

    /**
     * Get all counter offers by technician email
     */
    public List<CounterOfferResponseDto> getCounterOffersByTechnician(String technicianEmail) {
        List<CounterOffer> counterOffers = counterOfferRepository.findByTechnicianEmailOrderByRequestedAtDesc(technicianEmail);
        return counterOffers.stream()
                .map(this::convertToResponseDto)
                .collect(Collectors.toList());
    }

    /**
     * Get pending counter offers for a dealer (all posts by dealer) - Grouped by post
     */
    public Map<String, Object> getPendingCounterOffersForDealer(String dealerEmail) {
        try {
            log.info("Fetching pending counter offers for dealer: {}", dealerEmail);
            
            // Get all posts by dealer
            List<Posting> dealerPosts = postingRepository.findByEmailOrderByIdDesc(dealerEmail);
            log.info("Found {} posts for dealer: {}", dealerPosts.size(), dealerEmail);
            
            // Group counter offers by post
            Map<String, Object> groupedOffers = new HashMap<>();
            int totalCount = 0;
            
            for (Posting post : dealerPosts) {
                List<CounterOffer> postOffers = counterOfferRepository.findByPostIdAndStatusOrderByRequestedAtDesc(
                    post.getId(), CounterOffer.CounterOfferStatus.PENDING);
                
                // Filter to only truly pending offers (not expired)
                List<CounterOffer> validPendingOffers = postOffers.stream()
                        .filter(CounterOffer::isPending)
                        .collect(Collectors.toList());
                
                if (!validPendingOffers.isEmpty()) {
                    // Convert to DTOs
                    List<CounterOfferResponseDto> offerDtos = validPendingOffers.stream()
                            .map(this::convertToResponseDto)
                            .collect(Collectors.toList());
                    
                    // Create post data structure
                    Map<String, Object> postData = new HashMap<>();
                    
                    // Post details
                    Map<String, Object> postDetails = new HashMap<>();
                    postDetails.put("id", post.getId());
                    postDetails.put("content", post.getContent());
                    postDetails.put("location", post.getLocation());
                    postDetails.put("offerAmount", post.getOfferAmount());
                    postDetails.put("status", post.getStatus().name());
                    postDetails.put("createdAt", post.getCreatedAt());
                    
                    postData.put("post", postDetails);
                    postData.put("count", validPendingOffers.size());
                    postData.put("pendingOffers", offerDtos);
                    
                    groupedOffers.put("post_" + post.getId(), postData);
                    totalCount += validPendingOffers.size();
                    
                    log.info("Post {} has {} pending counter offers", post.getId(), validPendingOffers.size());
                }
            }
            
            log.info("Total pending counter offers for dealer {}: {}", dealerEmail, totalCount);
            
            // Return the result format expected by frontend
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("pendingOffers", groupedOffers);
            result.put("totalPendingCount", totalCount);
            
            return result;
            
        } catch (Exception e) {
            log.error("Error fetching pending counter offers for dealer {}: {}", dealerEmail, e.getMessage());
            Map<String, Object> errorResult = new HashMap<>();
            errorResult.put("success", false);
            errorResult.put("message", "Failed to fetch pending counter offers");
            errorResult.put("pendingOffers", new HashMap<>());
            errorResult.put("totalPendingCount", 0);
            return errorResult;
        }
    }

    /**
     * Check counter offer eligibility for a technician
     */
    public Map<String, Object> checkCounterOfferEligibility(Long postId, String technicianEmail) {
        Map<String, Object> response = new HashMap<>();

        try {
            // Check if post exists and is available
            Optional<Posting> postOpt = postingRepository.findById(postId);
            if (postOpt.isEmpty()) {
                response.put("canSubmit", false);
                response.put("message", "Post not found");
                return response;
            }

            Posting post = postOpt.get();
            if (!"PENDING".equals(post.getStatus().name())) {
                response.put("canSubmit", false);
                response.put("message", "Post is no longer available for counter offers");
                return response;
            }

            // ✅ FIXED: Check total attempt count instead of just pending status
            // Allow technicians to submit new counter offers after rejection (up to 3 total attempts)
            List<CounterOffer> existingOffers = counterOfferRepository.findByPostIdAndTechnicianEmailOrderByRequestedAtDesc(
                postId, technicianEmail);
            
            // Count total attempts (PENDING, ACCEPTED, REJECTED, EXPIRED - but not WITHDRAWN)
            long totalAttempts = existingOffers.stream()
                .filter(offer -> offer.getStatus() != CounterOffer.CounterOfferStatus.WITHDRAWN)
                .count();
            
            if (totalAttempts >= 3) {
                response.put("canSubmit", false);
                response.put("message", "You have reached the maximum limit of 3 counter offers for this post");
                response.put("attemptCount", totalAttempts);
                response.put("maxAttempts", 3);
                return response;
            }
            
            // Check if there's already a pending counter offer (to prevent multiple pending offers)
            boolean hasPendingOffer = existingOffers.stream()
                .anyMatch(offer -> offer.getStatus() == CounterOffer.CounterOfferStatus.PENDING && 
                                 offer.getExpiresAt() != null && 
                                 offer.getExpiresAt().isAfter(LocalDateTime.now()));
            
            if (hasPendingOffer) {
                response.put("canSubmit", false);
                response.put("message", "You already have a pending counter offer for this post");
                response.put("attemptCount", totalAttempts);
                response.put("maxAttempts", 3);
                return response;
            }

            response.put("canSubmit", true);
            response.put("message", "You can submit a counter offer");
            response.put("attemptCount", totalAttempts);
            response.put("maxAttempts", 3);
            response.put("remainingAttempts", 3 - totalAttempts);

        } catch (Exception e) {
            log.error("Error checking counter offer eligibility: {}", e.getMessage());
            response.put("canSubmit", false);
            response.put("message", "Error checking eligibility: " + e.getMessage());
        }

        return response;
    }

    /**
     * Convert CounterOffer to CounterOfferResponseDto
     */
    private CounterOfferResponseDto convertToResponseDto(CounterOffer counterOffer) {
        CounterOfferResponseDto dto = new CounterOfferResponseDto();
        dto.setId(counterOffer.getId());
        dto.setPostId(counterOffer.getPostId());
        dto.setTechnicianEmail(counterOffer.getTechnicianEmail());
        dto.setTechnicianName(counterOffer.getTechnicianName() != null ? counterOffer.getTechnicianName() : "Unknown Technician");
        dto.setOriginalOfferAmount(counterOffer.getOriginalOfferAmount());
        dto.setRequestedOfferAmount(counterOffer.getRequestedOfferAmount());
        dto.setTechnicianLocation(counterOffer.getTechnicianLocation());
        dto.setRequestedAt(counterOffer.getRequestedAt());
        dto.setRequestReason(counterOffer.getRequestReason());
        dto.setTechnicianNotes(counterOffer.getTechnicianNotes());
        dto.setStatus(counterOffer.getStatus().name());
        dto.setStatusDisplayName(counterOffer.getStatus().getDisplayName());
        dto.setDealerResponseAt(counterOffer.getDealerResponseAt());
        dto.setDealerResponseNotes(counterOffer.getDealerResponseNotes());
        dto.setExpiresAt(counterOffer.getExpiresAt());
        dto.setHoursUntilExpiry(counterOffer.getHoursUntilExpiry());
        dto.setPending(counterOffer.isPending());
        dto.setExpired(counterOffer.isExpired());
        dto.setCreatedAt(counterOffer.getCreatedAt());
        dto.setUpdatedAt(counterOffer.getUpdatedAt());
        return dto;
    }

    /**
     * Create dealer action record for audit trail
     */
    private void createDealerActionRecord(Long counterOfferId, String dealerEmail, 
                                        DealerCounterOfferAction.ActionType actionType, String actionNotes) {
        try {
            DealerCounterOfferAction dealerAction = new DealerCounterOfferAction(
                counterOfferId, dealerEmail, actionType, actionNotes);
            dealerCounterOfferActionRepository.save(dealerAction);
            log.info("Created dealer action record: {} for counter offer {}", actionType, counterOfferId);
        } catch (Exception e) {
            log.error("Failed to create dealer action record: {}", e.getMessage());
            // Don't fail the main operation if action record creation fails
        }
    }

    /**
     * Get dealer email for a counter offer
     */
    private String getDealerEmailForCounterOffer(CounterOffer counterOffer) {
        try {
            Optional<Posting> postOpt = postingRepository.findById(counterOffer.getPostId());
            if (postOpt.isPresent()) {
                return postOpt.get().getEmail();
            } else {
                log.warn("Post not found for counter offer {}: {}", counterOffer.getId(), counterOffer.getPostId());
                return "unknown@dealer.com";
            }
        } catch (Exception e) {
            log.error("Error getting dealer email for counter offer {}: {}", counterOffer.getId(), e.getMessage());
            return "unknown@dealer.com";
        }
    }

    /**
     * Get the number of counter offer attempts by technician for a specific post
     */
    private int getTechnicianCounterOfferAttempts(Long postId, String technicianEmail) {
        try {
            List<CounterOffer> offers = counterOfferRepository.findByPostIdAndTechnicianEmailOrderByRequestedAtDesc(postId, technicianEmail);
            // Count all non-withdrawn attempts
            return (int) offers.stream()
                    .filter(offer -> offer.getStatus() != CounterOffer.CounterOfferStatus.WITHDRAWN)
                    .count();
        } catch (Exception e) {
            log.error("Error counting technician counter offer attempts: {}", e.getMessage());
            return 0;
        }
    }

    /**
     * Mark expired counter offers (called by scheduler)
     */
    public int markExpiredCounterOffers() {
        try {
            log.info("Marking expired counter offers");
            List<CounterOffer> expiredOffers = counterOfferRepository.findExpiredCounterOffers(LocalDateTime.now());
            
            int expiredCount = 0;
            for (CounterOffer offer : expiredOffers) {
                offer.markAsExpired();
                counterOfferRepository.save(offer);
                expiredCount++;
            }
            
            log.info("Marked {} counter offers as expired", expiredCount);
            return expiredCount;
        } catch (Exception e) {
            log.error("Error marking expired counter offers: {}", e.getMessage());
            return 0;
        }
    }

    /**
     * Get dealer action statistics
     */
    public List<Map<String, Object>> getDealerActionStatistics() {
        try {
            List<Object[]> stats = dealerCounterOfferActionRepository.getDealerActionStatistics();
            return stats.stream()
                    .map(row -> {
                        Map<String, Object> stat = new HashMap<>();
                        stat.put("dealerEmail", row[0]);
                        stat.put("actionType", row[1]);
                        stat.put("count", row[2]);
                        return stat;
                    })
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error getting dealer action statistics: {}", e.getMessage());
            return new ArrayList<>();
        }
    }

    /**
     * Withdraw pending counter offers for a post by technician (when accepting directly)
     */
    @Transactional
    public void withdrawCounterOffersForPost(Long postId, String technicianEmail) {
        try {
            log.info("Withdrawing pending counter offers for post {} by technician {}", postId, technicianEmail);
            
            // Find all pending counter offers by this technician for this post
            List<CounterOffer> pendingOffers = counterOfferRepository.findByPostIdAndTechnicianEmailAndStatus(
                postId, technicianEmail, CounterOffer.CounterOfferStatus.PENDING);
            
            int withdrawnCount = 0;
            for (CounterOffer offer : pendingOffers) {
                if (offer.canBeModified()) {
                    offer.withdrawByTechnician();
                    counterOfferRepository.save(offer);
                    withdrawnCount++;
                    log.info("Withdrawn counter offer {} for post {} by technician {}", 
                           offer.getId(), postId, technicianEmail);
                }
            }
            
            log.info("Successfully withdrawn {} counter offers for post {} by technician {}", 
                   withdrawnCount, postId, technicianEmail);
            
        } catch (Exception e) {
            log.error("Error withdrawing counter offers for post {} by technician {}: {}", 
                     postId, technicianEmail, e.getMessage(), e);
            throw new RuntimeException("Failed to withdraw counter offers: " + e.getMessage(), e);
        }
    }
    
    /**
     * Send simple notification to technician about counter offer status update
     * Based on reference implementation - just logs for now, can be enhanced later
     */
    private void sendCounterOfferNotification(CounterOffer counterOffer, String status) {
        try {
            log.info("Sending counter offer {} notification to technician {} for offer {}", 
                   status, counterOffer.getTechnicianEmail(), counterOffer.getId());
            
            // Create notification message
            String message;
            String subject;
            if ("ACCEPTED".equals(status)) {
                subject = "Counter Offer Accepted!";
                message = String.format(
                    "Great news! Your counter offer of $%s for post #%d has been accepted by the dealer. " +
                    "The job has been assigned to you. Please check your dashboard for next steps.",
                    counterOffer.getRequestedOfferAmount(), 
                    counterOffer.getPostId()
                );
            } else {
                subject = "Counter Offer Update";
                message = String.format(
                    "Your counter offer of $%s for post #%d was not accepted by the dealer. " +
                    "You can still submit a new counter offer (up to 3 attempts total) or accept the original offer amount of $%s.",
                    counterOffer.getRequestedOfferAmount(),
                    counterOffer.getPostId(),
                    counterOffer.getOriginalOfferAmount()
                );
            }
            
            // Simple notification logging - just like reference implementation
            log.info("📧 NOTIFICATION: To: {} | Subject: {} | Message: {}", 
                   counterOffer.getTechnicianEmail(), subject, message);
            
            // TODO: In future, implement actual notification delivery:
            // - Email service integration  
            // - WebSocket notifications for real-time updates
            // - Database notification storage for in-app notifications
            
        } catch (Exception e) {
            log.error("Failed to send counter offer notification to technician {}: {}", 
                    counterOffer.getTechnicianEmail(), e.getMessage());
            // Don't fail the entire operation if notification fails
        }
    }

	// ==================== ADMIN METHODS ====================

	/**
	 * Get all counter offers for admin
	 */
	public List<Map<String, Object>> getAllCounterOffersForAdmin(String status, int page, int size) {
		try {
			log.info("Getting all counter offers for admin - status: {}, page: {}, size: {}", status, page, size);
			
			List<CounterOffer> counterOffers;
			if (status != null && !status.isEmpty()) {
				CounterOffer.CounterOfferStatus offerStatus = CounterOffer.CounterOfferStatus.valueOf(status.toUpperCase());
				counterOffers = counterOfferRepository.findByStatusOrderByRequestedAtDesc(offerStatus);
			} else {
				counterOffers = counterOfferRepository.findAll();
			}
			
			// Apply pagination manually
			int startIndex = page * size;
			int endIndex = Math.min(startIndex + size, counterOffers.size());
			
			if (startIndex < counterOffers.size()) {
				counterOffers = counterOffers.subList(startIndex, endIndex);
			} else {
				counterOffers = List.of();
			}
			
			// Convert to Map format for admin
			List<Map<String, Object>> result = counterOffers.stream()
				.map(this::convertCounterOfferToAdminMap)
				.collect(Collectors.toList());
			
			log.info("Retrieved {} counter offers for admin", result.size());
			return result;
		} catch (Exception e) {
			log.error("Error getting counter offers for admin: {}", e.getMessage(), e);
			throw new RuntimeException("Failed to get counter offers for admin: " + e.getMessage());
		}
	}

	/**
	 * Get total counter offers count for admin
	 */
	public long getTotalCounterOffersCount(String status) {
		try {
			log.info("Getting total counter offers count for admin - status: {}", status);
			
			long count;
			if (status != null && !status.isEmpty()) {
				CounterOffer.CounterOfferStatus offerStatus = CounterOffer.CounterOfferStatus.valueOf(status.toUpperCase());
				count = counterOfferRepository.countByStatus(offerStatus);
			} else {
				count = counterOfferRepository.count();
			}
			
			log.info("Total counter offers count for admin: {}", count);
			return count;
		} catch (Exception e) {
			log.error("Error getting counter offers count for admin: {}", e.getMessage(), e);
			throw new RuntimeException("Failed to get counter offers count for admin: " + e.getMessage());
		}
	}

	/**
	 * Get counter offer by ID for admin
	 */
	public Map<String, Object> getCounterOfferByIdForAdmin(Long id) {
		try {
			log.info("Getting counter offer by ID {} for admin", id);
			
			Optional<CounterOffer> counterOfferOpt = counterOfferRepository.findById(id);
			if (counterOfferOpt.isEmpty()) {
				throw new IllegalArgumentException("Counter offer not found with ID: " + id);
			}
			
			CounterOffer counterOffer = counterOfferOpt.get();
			Map<String, Object> result = convertCounterOfferToAdminMap(counterOffer);
			
			log.info("Retrieved counter offer {} for admin", id);
			return result;
		} catch (Exception e) {
			log.error("Error getting counter offer by ID {} for admin: {}", id, e.getMessage(), e);
			throw new RuntimeException("Failed to get counter offer for admin: " + e.getMessage());
		}
	}

	/**
	 * Cancel counter offer by admin
	 */
	@Transactional
	public void cancelCounterOfferByAdmin(Long id, String reason, String adminEmail) {
		try {
			log.info("Admin {} cancelling counter offer {} with reason: {}", adminEmail, id, reason);
			
			Optional<CounterOffer> counterOfferOpt = counterOfferRepository.findById(id);
			if (counterOfferOpt.isEmpty()) {
				throw new IllegalArgumentException("Counter offer not found with ID: " + id);
			}
			
			CounterOffer counterOffer = counterOfferOpt.get();
			// Since there's no CANCELLED status, we'll use REJECTED with admin notes
			counterOffer.rejectByDealer("Cancelled by admin: " + reason);
			
			counterOfferRepository.save(counterOffer);
			
			log.info("Counter offer {} cancelled by admin {}", id, adminEmail);
		} catch (Exception e) {
			log.error("Error cancelling counter offer {} by admin: {}", id, e.getMessage(), e);
			throw new RuntimeException("Failed to cancel counter offer: " + e.getMessage());
		}
	}

	/**
	 * Convert CounterOffer to Map for admin response
	 */
	private Map<String, Object> convertCounterOfferToAdminMap(CounterOffer counterOffer) {
		Map<String, Object> map = new HashMap<>();
		map.put("id", counterOffer.getId());
		map.put("postId", counterOffer.getPostId());
		map.put("technicianEmail", counterOffer.getTechnicianEmail());
		map.put("technicianName", counterOffer.getTechnicianName());
		map.put("originalOfferAmount", counterOffer.getOriginalOfferAmount());
		map.put("requestedOfferAmount", counterOffer.getRequestedOfferAmount());
		map.put("technicianLocation", counterOffer.getTechnicianLocation());
		map.put("status", counterOffer.getStatus());
		map.put("requestedAt", counterOffer.getRequestedAt());
		map.put("expiresAt", counterOffer.getExpiresAt());
		map.put("dealerResponseAt", counterOffer.getDealerResponseAt());
		map.put("dealerResponseNotes", counterOffer.getDealerResponseNotes());
		map.put("requestReason", counterOffer.getRequestReason());
		map.put("technicianNotes", counterOffer.getTechnicianNotes());
		map.put("createdAt", counterOffer.getCreatedAt());
		map.put("updatedAt", counterOffer.getUpdatedAt());
		
		return map;
	}
}
