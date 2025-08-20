package com.auto.tech.service;

import com.auto.tech.client.PostingClient;
import com.auto.tech.dto.CounterOfferRequest;
import com.auto.tech.dto.PostingDTO;
import com.auto.tech.model.TechCounterOffer;
import com.auto.tech.model.Technician;
import com.auto.tech.repository.CounterOfferRepository;
import com.auto.tech.repository.TechnicianRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class CounterOfferService {

    private static final Logger logger = LoggerFactory.getLogger(CounterOfferService.class);

    private final CounterOfferRepository counterOfferRepository;
    private final TechnicianRepository technicianRepository;
    private final PostingClient postingClient;

    /**
     * Submit a counter offer for a post with enhanced validation
     */
    public Map<String, Object> submitCounterOffer(Long postId, String technicianEmail, CounterOfferRequest request) {
        Map<String, Object> response = new HashMap<>();

        try {
            logger.info("Submitting counter offer for post {} by technician {}", postId, technicianEmail);

            // Validate technician exists
            Optional<Technician> technicianOpt = technicianRepository.findByEmailIgnoreCase(technicianEmail);
            if (technicianOpt.isEmpty()) {
                response.put("success", false);
                response.put("message", "Technician not found");
                return response;
            }

            Technician technician = technicianOpt.get();

            // Get post details
            PostingDTO post = postingClient.getPostById(postId);
            if (post == null) {
                response.put("success", false);
                response.put("message", "Post not found");
                return response;
            }

            // Check if post is still available (not accepted by someone else)
            if (!"PENDING".equals(post.getStatus())) {
                response.put("success", false);
                response.put("message", "Post is no longer available for counter offers");
                return response;
            }

            // Check counter offer eligibility (this includes all business rules)
            Map<String, Object> eligibility = checkCounterOfferEligibility(postId, technicianEmail);
            if (!(Boolean) eligibility.get("canSubmit")) {
                response.put("success", false);
                response.put("message", eligibility.get("message"));
                response.put("eligibilityInfo", eligibility);
                return response;
            }

            // Create counter offer
            TechCounterOffer counterOffer = TechCounterOffer.builder()
                    .postId(postId)
                    .technicianEmail(technicianEmail)
                    .originalOfferAmount(post.getOfferAmount())
                    .requestedOfferAmount(request.getCounterOfferAmount())
                    .technicianLocation(technician.getLocation())
                    .requestedAt(LocalDateTime.now())
                    .requestReason(request.getRequestReason())
                    .technicianNotes(request.getNotes())
                    .status(TechCounterOffer.CounterOfferStatus.PENDING)
                    .expiresAt(LocalDateTime.now().plusHours(48)) // 48 hours expiry
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();

            TechCounterOffer savedCounterOffer = counterOfferRepository.save(counterOffer);

            logger.info("Counter offer submitted successfully with ID: {}", savedCounterOffer.getId());
            
            // 🔄 CROSS-SERVICE SYNC: Also create counter offer in posts service for dealer visibility
            try {
                syncCounterOfferToPostsService(savedCounterOffer, post);
                logger.info("Successfully synced counter offer {} to posts service", savedCounterOffer.getId());
            } catch (Exception e) {
                logger.error("Failed to sync counter offer to posts service: {}", e.getMessage());
                // Don't fail the entire operation if sync fails
            }

            response.put("success", true);
            response.put("message", "Counter offer submitted successfully");
            response.put("counterOfferId", savedCounterOffer.getId());
            response.put("postId", postId);
            response.put("technicianEmail", technicianEmail);
            response.put("requestedAmount", request.getCounterOfferAmount());
            response.put("expiresAt", savedCounterOffer.getExpiresAt());
            response.put("attemptNumber", eligibility.get("attemptNumber"));
            response.put("isReCounterOffer", eligibility.get("isReCounterOffer"));

        } catch (Exception e) {
            logger.error("Error submitting counter offer for post {} by technician {}: {}", 
                        postId, technicianEmail, e.getMessage());
            response.put("success", false);
            response.put("message", "Failed to submit counter offer: " + e.getMessage());
        }

        return response;
    }

    /**
     * Check counter offer eligibility with advanced business rules:
     * - 3 attempts per post limit
     * - 3-minute cooldown after rejection
     * - 48-hour dealer response window for pending offers
     */
    @Transactional(readOnly = true)
    public Map<String, Object> checkCounterOfferEligibility(Long postId, String technicianEmail) {
        Map<String, Object> response = new HashMap<>();

        try {
            logger.info("Checking counter offer eligibility for post {} by technician {}", postId, technicianEmail);
            
            // Check if technician exists
            Optional<Technician> technicianOpt = technicianRepository.findByEmailIgnoreCase(technicianEmail);
            if (technicianOpt.isEmpty()) {
                response.put("canSubmit", false);
                response.put("message", "Technician not found");
                response.put("buttonText", "Error: Technician Not Found");
                response.put("buttonDisabled", true);
                return response;
            }

            // Check if post exists and is available
            PostingDTO post = postingClient.getPostById(postId);
            if (post == null) {
                response.put("canSubmit", false);
                response.put("message", "Post not found");
                response.put("buttonText", "Error: Post Not Found");
                response.put("buttonDisabled", true);
                return response;
            }

            if (!"PENDING".equals(post.getStatus())) {
                response.put("canSubmit", false);
                response.put("message", "Post is no longer available for counter offers");
                response.put("buttonText", "Post No Longer Available");
                response.put("buttonDisabled", true);
                return response;
            }

            // Get recent counter offers for this post by this technician
            List<TechCounterOffer> recentOffers = counterOfferRepository.findCounterOffersByPostAndTechnicianOrderByRequestedAtDesc(postId, technicianEmail);
            
            logger.info("Found {} counter offers for post {} by technician {}", recentOffers.size(), postId, technicianEmail);
            
            // Count attempts (count PENDING, ACCEPTED, REJECTED, EXPIRED - not WITHDRAWN)
            long attemptCount = recentOffers.stream()
                .filter(offer -> offer.getStatus() == TechCounterOffer.CounterOfferStatus.PENDING ||
                               offer.getStatus() == TechCounterOffer.CounterOfferStatus.ACCEPTED ||
                               offer.getStatus() == TechCounterOffer.CounterOfferStatus.REJECTED ||
                               offer.getStatus() == TechCounterOffer.CounterOfferStatus.EXPIRED)
                .count();
            
            logger.info("Attempt count calculation - Total offers: {}, Attempt count: {}", recentOffers.size(), attemptCount);
            
            // Check if max attempts reached (3 attempts per post)
            boolean maxAttemptsReached = attemptCount >= 3;
            
            // Check cooldown period based on most recent offer status
            boolean inCooldown = false;
            long remainingCooldownSeconds = 0;
            LocalDateTime canSubmitAfter = null;
            
            if (!recentOffers.isEmpty()) {
                TechCounterOffer mostRecent = recentOffers.get(0);
                LocalDateTime now = LocalDateTime.now();
                
                logger.info("Most recent counter offer - ID: {}, Status: {}, RequestedAt: {}, DealerResponseAt: {} for post {} by technician {}", 
                           mostRecent.getId(), mostRecent.getStatus(), mostRecent.getRequestedAt(), mostRecent.getDealerResponseAt(), postId, technicianEmail);
                
                // If the most recent offer was REJECTED, use 3-minute cooldown from dealer response time
                // If the most recent offer was PENDING (dealer hasn't responded), use 48-hour cooldown from submission time
                // If the most recent offer was EXPIRED, no cooldown (can submit immediately)
                LocalDateTime cooldownEndTime;
                logger.info("Checking cooldown for most recent offer - Status: {}, DealerResponseAt: {}, RequestedAt: {}", 
                           mostRecent.getStatus(), mostRecent.getDealerResponseAt(), mostRecent.getRequestedAt());
                
                if (mostRecent.getStatus() == TechCounterOffer.CounterOfferStatus.REJECTED) {
                    // Use dealer response time for 3-minute cooldown after rejection
                    LocalDateTime rejectionTime = mostRecent.getDealerResponseAt();
                    logger.info("Most recent offer is REJECTED - dealerResponseAt: {}, rejectionTime: {}", 
                               mostRecent.getDealerResponseAt(), rejectionTime);
                    if (rejectionTime != null) {
                        cooldownEndTime = rejectionTime.plusMinutes(3); // 3 minutes after rejection
                        logger.info("Using dealer response time for 3-minute cooldown: {}", cooldownEndTime);
                    } else {
                        // Fallback to requested time if dealer response time is null
                        cooldownEndTime = mostRecent.getRequestedAt().plusMinutes(3);
                        logger.warn("dealerResponseAt is null, using requested time for 3-minute cooldown: {}", cooldownEndTime);
                    }
                } else if (mostRecent.getStatus() == TechCounterOffer.CounterOfferStatus.EXPIRED) {
                    // No cooldown for expired offers - can submit immediately
                    cooldownEndTime = LocalDateTime.now().minusMinutes(1); // Already expired
                    logger.info("Most recent offer is EXPIRED - no cooldown needed");
                } else if (mostRecent.getStatus() == TechCounterOffer.CounterOfferStatus.PENDING) {
                    // Use submission time for 48-hour cooldown (PENDING status)
                    cooldownEndTime = mostRecent.getRequestedAt().plusHours(48); // 48 hours after submission
                    logger.info("Most recent offer is PENDING - using 48-hour cooldown: {}", cooldownEndTime);
                } else {
                    // For ACCEPTED or WITHDRAWN, no additional cooldown
                    cooldownEndTime = LocalDateTime.now().minusMinutes(1);
                    logger.info("Most recent offer is {} - no cooldown needed", mostRecent.getStatus());
                }
                
                if (now.isBefore(cooldownEndTime)) {
                    inCooldown = true;
                    Duration remaining = Duration.between(now, cooldownEndTime);
                    remainingCooldownSeconds = Math.max(0, remaining.getSeconds());
                    canSubmitAfter = cooldownEndTime;
                    logger.info("In cooldown - remaining seconds: {}, cooldown end time: {}", remainingCooldownSeconds, cooldownEndTime);
                } else {
                    logger.info("Not in cooldown - current time: {}, cooldown end time: {}", now, cooldownEndTime);
                }
            }
            
            // Determine if can submit
            boolean canSubmit = !maxAttemptsReached && !inCooldown;
            
            // Build response with enhanced frontend-friendly data
            response.put("canSubmit", canSubmit);
            response.put("attemptNumber", attemptCount);
            response.put("maxAttempts", 3L);
            response.put("maxAttemptsReached", maxAttemptsReached);
            response.put("inCooldown", inCooldown);
            response.put("isReCounterOffer", attemptCount > 0);
            
            // Enhanced button text and hover information
            if (maxAttemptsReached) {
                response.put("buttonText", "Max Counter Offers Reached");
                response.put("buttonDisabled", true);
                response.put("hoverText", "You have reached the maximum of 3 counter offers for this post");
                response.put("message", "Maximum counter offer attempts (3) reached for this post");
            } else if (inCooldown) {
                response.put("remainingCooldownSeconds", remainingCooldownSeconds);
                response.put("canSubmitAfter", canSubmitAfter);
                response.put("buttonDisabled", true);
                
                // Calculate countdown display
                long hours = remainingCooldownSeconds / 3600;
                long minutes = (remainingCooldownSeconds % 3600) / 60;
                long seconds = remainingCooldownSeconds % 60;
                
                String countdownText;
                if (hours > 0) {
                    countdownText = String.format("%02d:%02d:%02d", hours, minutes, seconds);
                } else {
                    countdownText = String.format("%02d:%02d", minutes, seconds);
                }
                
                // Determine button text and hover based on cooldown reason
                if (!recentOffers.isEmpty() && recentOffers.get(0).getStatus() == TechCounterOffer.CounterOfferStatus.REJECTED) {
                    response.put("buttonText", "Counter Offer Request in " + countdownText);
                    response.put("hoverText", "You can submit a new counter offer in " + countdownText + " after rejection");
                    response.put("message", "Please wait " + remainingCooldownSeconds + " seconds after rejection before submitting another counter offer");
                } else {
                    response.put("buttonText", "Counter Offer Request in " + countdownText);
                    response.put("hoverText", "You can submit a new counter offer in " + countdownText + " after your last request");
                    response.put("message", "Please wait " + remainingCooldownSeconds + " seconds after your last counter offer before submitting another");
                }
            } else {
                // Can submit counter offer - differentiate between fresh and rejected posts
                String buttonText;
                String hoverText;
                String message;
                
                if (attemptCount == 0) {
                    // Fresh post - no previous attempts
                    buttonText = "Submit Counter Offer";
                    hoverText = "Click to submit a counter offer for this post";
                    message = "You can submit a counter offer for this post";
                    logger.info("Fresh post - no previous attempts, buttonText: {}", buttonText);
                } else {
                    // Has previous attempts - check if most recent was rejected
                    if (!recentOffers.isEmpty() && recentOffers.get(0).getStatus() == TechCounterOffer.CounterOfferStatus.REJECTED) {
                        buttonText = "Submit Re-Counter Offer";
                        hoverText = "Click to submit a re-counter offer after rejection";
                        message = "You can submit a re-counter offer for this post";
                        logger.info("Rejected post - most recent status: {}, buttonText: {}", 
                                  recentOffers.get(0).getStatus(), buttonText);
                    } else {
                        buttonText = "Submit Counter Offer";
                        hoverText = "Click to submit a counter offer for this post";
                        message = "You can submit a counter offer for this post";
                        logger.info("Other post - most recent status: {}, buttonText: {}", 
                                  !recentOffers.isEmpty() ? recentOffers.get(0).getStatus() : "NONE", buttonText);
                    }
                }
                
                response.put("buttonText", buttonText);
                response.put("buttonDisabled", false);
                response.put("hoverText", hoverText);
                response.put("message", message);
            }
            
            logger.info("Counter offer eligibility check - Post: {}, Technician: {}, CanSubmit: {}, Attempts: {}/{}, InCooldown: {}, RemainingSeconds: {}", 
                       postId, technicianEmail, canSubmit, attemptCount, 3, inCooldown, remainingCooldownSeconds);
            logger.info("Button text: {}, Hover text: {}, Most recent status: {}", 
                       response.get("buttonText"), response.get("hoverText"), 
                       !recentOffers.isEmpty() ? recentOffers.get(0).getStatus() : "NONE");

        } catch (Exception e) {
            logger.error("Error checking counter offer eligibility for post {} by technician {}: {}", 
                        postId, technicianEmail, e.getMessage());
            // Return default values on error with enhanced format
            response.put("canSubmit", false);
            response.put("attemptNumber", 0L);
            response.put("maxAttempts", 3L);
            response.put("maxAttemptsReached", false);
            response.put("inCooldown", false);
            response.put("isReCounterOffer", false);
            response.put("buttonText", "Error Checking Eligibility");
            response.put("buttonDisabled", true);
            response.put("hoverText", "Unable to check counter offer eligibility. Please try again.");
            response.put("message", "Error checking eligibility: " + e.getMessage());
        }

        return response;
    }

    /**
     * Get counter offer status for a technician
     */
    public Map<String, Object> getCounterOfferStatus(String technicianEmail) {
        Map<String, Object> response = new HashMap<>();

        try {
            List<TechCounterOffer> counterOffers = counterOfferRepository.findByTechnicianEmail(technicianEmail);
            
            List<Map<String, Object>> counterOfferList = counterOffers.stream()
                    .map(co -> {
                        Map<String, Object> coMap = new HashMap<>();
                        coMap.put("id", co.getId());
                        coMap.put("postId", co.getPostId());
                        coMap.put("originalAmount", co.getOriginalOfferAmount());
                        coMap.put("requestedAmount", co.getRequestedOfferAmount());
                        coMap.put("status", co.getStatus().name());
                        coMap.put("statusDisplay", co.getStatus().getDisplayName());
                        coMap.put("requestedAt", co.getRequestedAt());
                        coMap.put("expiresAt", co.getExpiresAt());
                        coMap.put("requestReason", co.getRequestReason());
                        coMap.put("technicianNotes", co.getTechnicianNotes());
                        coMap.put("dealerResponseAt", co.getDealerResponseAt());
                        coMap.put("dealerResponseNotes", co.getDealerResponseNotes());
                        
                        // Calculate remaining cooldown time for REJECTED offers
                        if (co.getStatus() == TechCounterOffer.CounterOfferStatus.REJECTED && co.getDealerResponseAt() != null) {
                            LocalDateTime now = LocalDateTime.now();
                            LocalDateTime cooldownEnd = co.getDealerResponseAt().plusMinutes(3);
                            long remainingSeconds = Math.max(0, java.time.Duration.between(now, cooldownEnd).getSeconds());
                            coMap.put("remainingCooldownSeconds", remainingSeconds);
                            coMap.put("cooldownEnd", cooldownEnd);
                        } else {
                            coMap.put("remainingCooldownSeconds", 0);
                            coMap.put("cooldownEnd", null);
                        }
                        
                        // Debug logging
                        boolean isExpired = co.isExpired();
                        long hoursUntilExpiry = co.getHoursUntilExpiry();
                        System.out.println("Counter Offer Debug - ID: " + co.getId() + 
                                         ", Status: " + co.getStatus() + 
                                         ", ExpiresAt: " + co.getExpiresAt() + 
                                         ", IsExpired: " + isExpired + 
                                         ", HoursUntilExpiry: " + hoursUntilExpiry +
                                         ", DealerResponseAt: " + co.getDealerResponseAt());
                        
                        coMap.put("isExpired", isExpired);
                        coMap.put("hoursUntilExpiry", hoursUntilExpiry);
                        return coMap;
                    })
                    .toList();

            response.put("success", true);
            response.put("counterOffers", counterOfferList);
            response.put("totalCount", counterOffers.size());
            response.put("pendingCount", counterOffers.stream()
                    .filter(co -> co.getStatus() == TechCounterOffer.CounterOfferStatus.PENDING)
                    .count());
            response.put("acceptedCount", counterOffers.stream()
                    .filter(co -> co.getStatus() == TechCounterOffer.CounterOfferStatus.ACCEPTED)
                    .count());
            response.put("rejectedCount", counterOffers.stream()
                    .filter(co -> co.getStatus() == TechCounterOffer.CounterOfferStatus.REJECTED)
                    .count());
            response.put("expiredCount", counterOffers.stream()
                    .filter(co -> co.getStatus() == TechCounterOffer.CounterOfferStatus.EXPIRED)
                    .count());
            response.put("withdrawnCount", counterOffers.stream()
                    .filter(co -> co.getStatus() == TechCounterOffer.CounterOfferStatus.WITHDRAWN)
                    .count());

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Failed to get counter offer status: " + e.getMessage());
        }

        return response;
    }

    /**
     * Withdraw a counter offer
     */
    public Map<String, Object> withdrawCounterOffer(Long counterOfferId, String technicianEmail) {
        Map<String, Object> response = new HashMap<>();

        try {
            Optional<TechCounterOffer> counterOfferOpt = counterOfferRepository.findById(counterOfferId);
            if (counterOfferOpt.isEmpty()) {
                response.put("success", false);
                response.put("message", "Counter offer not found");
                return response;
            }

            TechCounterOffer counterOffer = counterOfferOpt.get();

            // Verify ownership
            if (!counterOffer.getTechnicianEmail().equals(technicianEmail)) {
                response.put("success", false);
                response.put("message", "You can only withdraw your own counter offers");
                return response;
            }

            // Check if can be withdrawn
            if (!counterOffer.canBeModified()) {
                response.put("success", false);
                response.put("message", "Counter offer cannot be withdrawn in its current state");
                return response;
            }

            counterOffer.withdrawByTechnician();
            counterOfferRepository.save(counterOffer);

            response.put("success", true);
            response.put("message", "Counter offer withdrawn successfully");

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Failed to withdraw counter offer: " + e.getMessage());
        }

        return response;
    }

    /**
     * Get counter offers for a specific post
     */
    public List<TechCounterOffer> getCounterOffersByPostId(Long postId) {
        return counterOfferRepository.findActiveCounterOffersByPostId(postId, LocalDateTime.now(), TechCounterOffer.CounterOfferStatus.PENDING);
    }

    /**
     * Mark expired counter offers
     */
    public void markExpiredCounterOffers() {
        List<TechCounterOffer> expiredOffers = counterOfferRepository.findExpiredCounterOffers(LocalDateTime.now(), TechCounterOffer.CounterOfferStatus.PENDING);
        for (TechCounterOffer offer : expiredOffers) {
            offer.markAsExpired();
            counterOfferRepository.save(offer);
        }
    }

    /**
     * Clean up and fix any counter offers that might have incorrect status
     * This method can be called to fix existing data issues
     */
    public void cleanupCounterOffers() {
        try {
            // Get all counter offers
            List<TechCounterOffer> allOffers = counterOfferRepository.findAll();
            
            for (TechCounterOffer offer : allOffers) {
                boolean needsUpdate = false;
                
                // Check if PENDING offers are actually expired
                if (offer.getStatus() == TechCounterOffer.CounterOfferStatus.PENDING) {
                    if (offer.isExpired()) {
                        System.out.println("Marking expired counter offer: " + offer.getId());
                        offer.markAsExpired();
                        needsUpdate = true;
                    }
                }
                
                // Ensure expiresAt is set for PENDING offers
                if (offer.getStatus() == TechCounterOffer.CounterOfferStatus.PENDING && offer.getExpiresAt() == null) {
                    System.out.println("Setting expiry for counter offer without expiry: " + offer.getId());
                    offer.setExpiresAt(LocalDateTime.now().plusHours(48));
                    needsUpdate = true;
                }
                
                if (needsUpdate) {
                    counterOfferRepository.save(offer);
                }
            }
            
            System.out.println("Counter offer cleanup completed");
        } catch (Exception e) {
            System.err.println("Error during counter offer cleanup: " + e.getMessage());
        }
    }

    /**
     * Withdraw all counter offers for a specific post by a technician
     */
    public void withdrawCounterOffersForPost(Long postId, String technicianEmail) {
        List<TechCounterOffer> pendingOffers = counterOfferRepository.findActiveCounterOffersByPostId(postId, LocalDateTime.now(), TechCounterOffer.CounterOfferStatus.PENDING);
        int withdrawnCount = 0;
        
        for (TechCounterOffer offer : pendingOffers) {
            if (offer.getTechnicianEmail().equals(technicianEmail)) {
                offer.withdrawByTechnician();
                counterOfferRepository.save(offer);
                withdrawnCount++;
                logger.info("Withdrew counter offer {} for post {} by technician {}", 
                           offer.getId(), postId, technicianEmail);
            }
        }
        
        // 🔄 CROSS-SERVICE SYNC: Notify posting service about withdrawal
        if (withdrawnCount > 0) {
            try {
                Map<String, Object> withdrawalRequest = new HashMap<>();
                withdrawalRequest.put("postId", postId);
                withdrawalRequest.put("technicianEmail", technicianEmail);
                
                logger.info("Notifying posting service about counter offer withdrawal for post: {}", postId);
                Object syncResult = postingClient.withdrawCounterOffersForPost(withdrawalRequest);
                
                if (syncResult != null) {
                    logger.info("Successfully synced withdrawal to posting service for post: {} - {} offers withdrawn", 
                               postId, withdrawnCount);
                } else {
                    logger.warn("Failed to sync withdrawal to posting service for post: {} - Response: {}", postId, syncResult);
                }
            } catch (Exception syncException) {
                logger.error("Error syncing withdrawal to posting service for post {}: {}", postId, syncException.getMessage());
                // Don't fail the main operation if sync fails
            }
        }
        
        logger.info("Successfully withdrawn {} counter offers for post {} by technician {}", 
                   withdrawnCount, postId, technicianEmail);
    }

    /**
     * Check if technician has an ACTIVE cooldown for a specific post
     * Returns true ONLY if:
     * 1. PENDING counter offer (waiting for dealer response within 48 hours)
     * 2. REJECTED counter offer with active 3-minute cooldown
     */
    @Transactional(readOnly = true)
    public boolean hasActiveCooldown(Long postId, String technicianEmail) {
        try {
            // Get the most recent counter offer for this post by this technician
            List<TechCounterOffer> recentOffers = counterOfferRepository.findCounterOffersByPostAndTechnicianOrderByRequestedAtDesc(
                postId, technicianEmail);
            
            if (recentOffers.isEmpty()) {
                logger.debug("No counter offers found for post {} by technician {}", postId, technicianEmail);
                return false;
            }
            
            TechCounterOffer latestOffer = recentOffers.get(0);
            LocalDateTime now = LocalDateTime.now();
            
            logger.info("Checking active cooldown - Post: {}, Technician: {}, LatestOfferStatus: {}, RequestedAt: {}", 
                       postId, technicianEmail, latestOffer.getStatus(), latestOffer.getRequestedAt());
            
            // Case 1: PENDING offer (waiting for dealer response within 48 hours)
            if (latestOffer.getStatus() == TechCounterOffer.CounterOfferStatus.PENDING) {
                Duration timeSinceRequest = Duration.between(latestOffer.getRequestedAt(), now);
                boolean withinReviewPeriod = timeSinceRequest.toHours() < 48;
                
                if (withinReviewPeriod) {
                    logger.info("Active cooldown: PENDING offer within 48-hour review period. Hours elapsed: {}", 
                               timeSinceRequest.toHours());
                    return true;
                }
            }
            
            // Case 2: REJECTED offer with active 3-minute cooldown
            if (latestOffer.getStatus() == TechCounterOffer.CounterOfferStatus.REJECTED && latestOffer.getDealerResponseAt() != null) {
                Duration timeSinceRejection = Duration.between(latestOffer.getDealerResponseAt(), now);
                boolean within3MinuteCooldown = timeSinceRejection.toMinutes() < 3;
                
                if (within3MinuteCooldown) {
                    logger.info("Active cooldown: REJECTED offer within 3-minute cooldown. Minutes elapsed: {}", 
                               timeSinceRejection.toMinutes());
                    return true;
                }
            }
            
            // No active cooldown
            logger.info("No active cooldown for post {} by technician {} - Status: {}, TimeElapsed: varies", 
                       postId, technicianEmail, latestOffer.getStatus());
            return false;
            
        } catch (Exception e) {
            logger.error("Error checking active cooldown for post {} by technician {}: {}", 
                        postId, technicianEmail, e.getMessage());
            return false; // Safe fallback - no warning if error
        }
    }

    /**
     * Get remaining cooldown time for technician counter offer
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getRemainingCooldownTime(Long postId, String technicianEmail) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            // Find the most recent counter offer for this post by this technician
            Optional<TechCounterOffer> mostRecentOffer = counterOfferRepository.findMostRecentCounterOfferByPostAndTechnician(postId, technicianEmail);
            
            if (mostRecentOffer.isPresent()) {
                TechCounterOffer offer = mostRecentOffer.get();
                LocalDateTime now = LocalDateTime.now();
                
                // Add status information for better frontend messaging
                result.put("offerStatus", offer.getStatus().toString());
                result.put("lastOfferSubmittedAt", offer.getRequestedAt());
                
                long remainingMillis = 0;
                long remainingSeconds = 0;
                long remainingMinutes = 0;
                long remainingHours = 0;
                LocalDateTime cooldownEndTime = null;
                String cooldownType = "NONE";
                
                if (offer.getStatus() == TechCounterOffer.CounterOfferStatus.PENDING) {
                    // 48-hour dealer response window
                    cooldownEndTime = offer.getRequestedAt().plusHours(48);
                    
                    Duration remaining = Duration.between(now, cooldownEndTime);
                    
                    if (remaining.toMillis() > 0) {
                        remainingMillis = remaining.toMillis();
                        remainingSeconds = remaining.getSeconds();
                        remainingMinutes = remaining.toMinutes();
                        remainingHours = remaining.toHours();
                        cooldownType = "DEALER_RESPONSE";
                    }
                    
                } else if (offer.getStatus() == TechCounterOffer.CounterOfferStatus.REJECTED && offer.getDealerResponseAt() != null) {
                    // 3-minute rejection cooldown
                    cooldownEndTime = offer.getDealerResponseAt().plusMinutes(3);
                    Duration remaining = Duration.between(now, cooldownEndTime);
                    
                    if (remaining.toMillis() > 0) {
                        remainingMillis = remaining.toMillis();
                        remainingSeconds = remaining.getSeconds();
                        remainingMinutes = remaining.toMinutes();
                        remainingHours = remaining.toHours();
                        cooldownType = "REJECTION_COOLDOWN";
                    }
                }
                
                // Ensure we don't return negative values
                remainingMillis = Math.max(0, remainingMillis);
                remainingSeconds = Math.max(0, remainingSeconds);
                remainingMinutes = Math.max(0, remainingMinutes);
                remainingHours = Math.max(0, remainingHours);
                
                result.put("remainingMillis", remainingMillis);
                result.put("remainingSeconds", remainingSeconds);
                result.put("remainingMinutes", remainingMinutes);
                result.put("remainingHours", remainingHours);
                result.put("canSubmitAfter", cooldownEndTime);
                result.put("cooldownType", cooldownType);
                
                logger.info("Calculated remaining cooldown for post {} by technician {} - remaining: {} hours, {} minutes", 
                           postId, technicianEmail, remainingHours, remainingMinutes % 60);
            } else {
                // No offer found, return zero values
                result.put("remainingMillis", 0L);
                result.put("remainingSeconds", 0L);
                result.put("remainingMinutes", 0L);
                result.put("remainingHours", 0L);
                result.put("lastOfferSubmittedAt", null);
                result.put("canSubmitAfter", null);
                result.put("offerStatus", "NONE");
                result.put("cooldownType", "NONE");
                
                logger.info("No recent counter offer found for post {} by technician {}", postId, technicianEmail);
            }
            
        } catch (Exception e) {
            logger.error("Error calculating remaining cooldown time for post {} by technician {}: {}", 
                        postId, technicianEmail, e.getMessage());
            // Return zero values on error
            result.put("remainingMillis", 0L);
            result.put("remainingSeconds", 0L);
            result.put("remainingMinutes", 0L);
            result.put("remainingHours", 0L);
            result.put("lastOfferSubmittedAt", null);
            result.put("canSubmitAfter", null);
        }
        
        return result;
    }

    /**
     * Mark expired counter offers (called by scheduler)
     */
    @Transactional
    public int markExpiredCounterOffersScheduled() {
        logger.info("Marking expired counter offers");
        int expiredCount = counterOfferRepository.markExpiredCounterOffers(
            LocalDateTime.now(), 
            TechCounterOffer.CounterOfferStatus.PENDING, 
            TechCounterOffer.CounterOfferStatus.EXPIRED
        );
        logger.info("Marked {} counter offers as expired", expiredCount);
        return expiredCount;
    }

    /**
     * Cleanup old expired requests (administrative function)
     */
    @Transactional
    public int cleanupOldExpiredCounterOffers(int daysOld) {
        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(daysOld);
        int deletedCount = counterOfferRepository.deleteOldExpiredCounterOffers(cutoffDate, TechCounterOffer.CounterOfferStatus.EXPIRED);
        logger.info("Cleaned up {} old expired counter offers older than {} days", deletedCount, daysOld);
        return deletedCount;
    }

    /**
     * Sync counter offer to posts service for dealer visibility
     * This ensures dealers can see counter offers in their dashboard
     */
    private void syncCounterOfferToPostsService(TechCounterOffer counterOffer, PostingDTO post) {
        try {
            logger.info("Syncing counter offer {} to posts service", counterOffer.getId());
            
            // Create posts service compatible request
            Map<String, Object> postsServiceRequest = new HashMap<>();
            postsServiceRequest.put("postId", counterOffer.getPostId());
            postsServiceRequest.put("technicianEmail", counterOffer.getTechnicianEmail());
            
            // Get technician name from repository
            Optional<Technician> technicianOpt = technicianRepository.findByEmailIgnoreCase(counterOffer.getTechnicianEmail());
            String technicianName = technicianOpt.map(Technician::getName).orElse("Unknown Technician");
            postsServiceRequest.put("technicianName", technicianName);
            
            postsServiceRequest.put("originalOfferAmount", counterOffer.getOriginalOfferAmount());
            postsServiceRequest.put("requestedOfferAmount", counterOffer.getRequestedOfferAmount());
            postsServiceRequest.put("technicianLocation", counterOffer.getTechnicianLocation());
            postsServiceRequest.put("requestReason", counterOffer.getRequestReason());
            postsServiceRequest.put("technicianNotes", counterOffer.getTechnicianNotes());
            
            // Call posts service to create counter offer there too
            Object result = postingClient.submitCounterOfferToPostsService(postsServiceRequest);
            logger.info("Posts service response for counter offer sync: {}", result);
            
            // Store the posting service counter offer ID for future reference
            if (result instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<String, Object> resultMap = (Map<String, Object>) result;
                if (resultMap.containsKey("counterOfferId")) {
                    Long postingServiceId = Long.valueOf(resultMap.get("counterOfferId").toString());
                    counterOffer.setPostingServiceCounterOfferId(postingServiceId);
                    counterOfferRepository.save(counterOffer);
                    logger.info("Stored posting service counter offer ID: {} for technician counter offer: {}", 
                               postingServiceId, counterOffer.getId());
                }
            }
            
        } catch (Exception e) {
            logger.error("Error syncing counter offer to posts service: {}", e.getMessage());
            throw e; // Re-throw so calling method can handle
        }
    }

    /**
     * Update counter offer status to REJECTED (called by posting service notification)
     */
    @Transactional
    public boolean updateCounterOfferStatusToRejected(Long postingServiceCounterOfferId, String technicianEmail, Map<String, Object> rejectionData) {
        try {
            logger.info("Updating counter offer with posting service ID {} to REJECTED status for technician {}", 
                       postingServiceCounterOfferId, technicianEmail);
            
            // Find the counter offer by posting service ID
            Optional<TechCounterOffer> counterOfferOpt = counterOfferRepository.findByPostingServiceCounterOfferId(postingServiceCounterOfferId);
            if (counterOfferOpt.isEmpty()) {
                logger.warn("Counter offer with posting service ID {} not found for technician {}", 
                           postingServiceCounterOfferId, technicianEmail);
                return false;
            }
            
            TechCounterOffer counterOffer = counterOfferOpt.get();
            
            // Verify it belongs to the technician
            if (!counterOffer.getTechnicianEmail().equals(technicianEmail)) {
                logger.warn("Counter offer {} does not belong to technician {}", counterOffer.getId(), technicianEmail);
                return false;
            }
            
            // Update status to REJECTED with dealer response data
            counterOffer.rejectByDealer((String) rejectionData.get("dealerResponseNotes"));
            counterOfferRepository.save(counterOffer);
            
            // Debug logging to verify dealerResponseAt is set
            logger.info("Counter offer {} updated to REJECTED status - dealerResponseAt: {}, dealerResponseNotes: {}", 
                       counterOffer.getId(), counterOffer.getDealerResponseAt(), counterOffer.getDealerResponseNotes());
            
            // Check if maximum attempts reached (from posting service data)
            Integer attemptCount = (Integer) rejectionData.get("attemptCount");
            
            if (attemptCount != null && attemptCount >= 3) {
                logger.info("Maximum attempts (3) reached for post {} by technician {} - marking as EXPIRED", 
                           counterOffer.getPostId(), technicianEmail);
                
                // Mark this counter offer as EXPIRED since max attempts reached
                counterOffer.markAsExpired();
                counterOfferRepository.save(counterOffer);
                
                logger.info("Successfully marked counter offer {} as EXPIRED due to maximum attempts (3) reached", 
                           counterOffer.getId());
            } else {
                logger.info("Successfully updated counter offer {} to REJECTED status - 3-minute cooldown activated (attempt {}/3)", 
                           counterOffer.getId(), attemptCount);
            }
            
            return true;
            
        } catch (Exception e) {
            logger.error("Error updating counter offer with posting service ID {} to REJECTED status: {}", 
                        postingServiceCounterOfferId, e.getMessage());
            return false;
        }
    }

    /**
     * Update counter offer status to ACCEPTED (called by posting service notification)
     */
    @Transactional
    public boolean updateCounterOfferStatusToAccepted(Long postingServiceCounterOfferId, String technicianEmail, Map<String, Object> acceptanceData) {
        try {
            logger.info("Updating counter offer with posting service ID {} to ACCEPTED status for technician {}", 
                       postingServiceCounterOfferId, technicianEmail);
            
            // Find the counter offer by posting service ID
            Optional<TechCounterOffer> counterOfferOpt = counterOfferRepository.findByPostingServiceCounterOfferId(postingServiceCounterOfferId);
            if (counterOfferOpt.isEmpty()) {
                logger.warn("Counter offer with posting service ID {} not found for technician {}", 
                           postingServiceCounterOfferId, technicianEmail);
                return false;
            }
            
            TechCounterOffer counterOffer = counterOfferOpt.get();
            
            // Verify it belongs to the technician
            if (!counterOffer.getTechnicianEmail().equals(technicianEmail)) {
                logger.warn("Counter offer {} does not belong to technician {}", counterOffer.getId(), technicianEmail);
                return false;
            }
            
            // Update status to ACCEPTED with dealer response data
            counterOffer.acceptByDealer((String) acceptanceData.get("dealerResponseNotes"));
            counterOfferRepository.save(counterOffer);
            
            logger.info("Successfully updated counter offer {} to ACCEPTED status", counterOffer.getId());
            return true;
            
        } catch (Exception e) {
            logger.error("Error updating counter offer with posting service ID {} to ACCEPTED status: {}", 
                        postingServiceCounterOfferId, e.getMessage());
            return false;
        }
    }
}
