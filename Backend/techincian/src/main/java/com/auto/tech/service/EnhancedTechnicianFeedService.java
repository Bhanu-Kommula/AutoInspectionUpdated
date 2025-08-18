package com.auto.tech.service;

import com.auto.tech.client.PostingClient;
import com.auto.tech.dto.PostingDTO;
import com.auto.tech.dto.TechInfoToGetPostsByLocationDto;
import com.auto.tech.model.TechCounterOffer;
import com.auto.tech.model.TechDeclinedPosts;
import com.auto.tech.model.TechnicianPostInteraction;
import com.auto.tech.repository.CounterOfferRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Enhanced Technician Feed Service
 * Handles advanced feed functionality with impact checking and analytics
 * Following the current main service pattern
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EnhancedTechnicianFeedService {

    private final TechnicianService technicianService;
    private final CounterOfferService counterOfferService;
    private final TechnicianAnalyticsService analyticsService;
    private final CounterOfferRepository counterOfferRepository;
    private final PostingClient postingClient;

    /**
     * Check if accepting a post would affect pending counter offers
     */
    public Map<String, Object> checkAcceptImpact(Long postId, String technicianEmail) {
        try {
            log.info("Checking accept impact for post {} by technician {}", postId, technicianEmail);

            // Find pending counter offers for this post by this technician
            Optional<TechCounterOffer> pendingOfferOpt = counterOfferRepository.findByPostIdAndTechnicianEmail(postId, technicianEmail);

            if (pendingOfferOpt.isPresent()) {
                TechCounterOffer pendingOffer = pendingOfferOpt.get();
                
                // Calculate remaining time
                long remainingSeconds = 0;
                if (pendingOffer.getExpiresAt() != null) {
                    remainingSeconds = java.time.Duration.between(LocalDateTime.now(), pendingOffer.getExpiresAt()).getSeconds();
                }

                Map<String, Object> impact = new HashMap<>();
                impact.put("success", true);
                impact.put("hasImpact", true);
                impact.put("hasPendingCounterOffer", true);
                impact.put("pendingCounterOffer", pendingOffer);
                impact.put("message", "You have 1 pending counter offer for this post. Accepting will withdraw it.");
                impact.put("pendingOffersCount", 1);
                impact.put("remainingCooldownSeconds", Math.max(0, remainingSeconds));
                impact.put("cooldownType", "DEALER_RESPONSE");

                log.info("Found pending counter offer for post {}: {}", postId, pendingOffer.getId());
                return impact;
            } else {
                Map<String, Object> impact = new HashMap<>();
                impact.put("success", true);
                impact.put("hasImpact", false);
                impact.put("hasPendingCounterOffer", false);
                impact.put("pendingCounterOffer", null);
                impact.put("message", "No pending counter offers found. Safe to accept.");
                impact.put("pendingOffersCount", 0);

                log.info("No pending counter offers found for post {}", postId);
                return impact;
            }
        } catch (Exception e) {
            log.error("Error checking accept impact for post {}: {}", postId, e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("hasPendingCounterOffer", false);
            error.put("message", "Failed to check accept impact");
            return error;
        }
    }

    /**
     * Check if declining a post would affect pending counter offers
     */
    public Map<String, Object> checkDeclineImpact(Long postId, String technicianEmail) {
        try {
            log.info("Checking decline impact for post {} by technician {}", postId, technicianEmail);

            // Find pending counter offers for this post by this technician
            Optional<TechCounterOffer> pendingOfferOpt = counterOfferRepository.findByPostIdAndTechnicianEmail(postId, technicianEmail);

            if (pendingOfferOpt.isPresent()) {
                TechCounterOffer pendingOffer = pendingOfferOpt.get();
                
                // Calculate remaining time
                long remainingSeconds = 0;
                if (pendingOffer.getExpiresAt() != null) {
                    remainingSeconds = java.time.Duration.between(LocalDateTime.now(), pendingOffer.getExpiresAt()).getSeconds();
                }

                Map<String, Object> impact = new HashMap<>();
                impact.put("success", true);
                impact.put("hasImpact", true);
                impact.put("hasPendingCounterOffer", true);
                impact.put("pendingCounterOffer", pendingOffer);
                impact.put("message", "You have 1 pending counter offer for this post. Declining will withdraw it.");
                impact.put("pendingOffers", List.of(pendingOffer));
                impact.put("pendingOffersCount", 1);
                impact.put("remainingCooldownSeconds", Math.max(0, remainingSeconds));
                impact.put("cooldownType", "DEALER_RESPONSE");

                log.info("Found pending counter offer for post {}: {}", postId, pendingOffer.getId());
                return impact;
            } else {
                Map<String, Object> impact = new HashMap<>();
                impact.put("success", true);
                impact.put("hasImpact", false);
                impact.put("hasPendingCounterOffer", false);
                impact.put("pendingCounterOffer", null);
                impact.put("message", "No pending counter offers found. Safe to decline.");
                impact.put("pendingOffers", List.of());
                impact.put("pendingOffersCount", 0);

                log.info("No pending counter offers found for post {}", postId);
                return impact;
            }
        } catch (Exception e) {
            log.error("Error checking decline impact for post {}: {}", postId, e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("hasPendingCounterOffer", false);
            error.put("message", "Failed to check decline impact");
            return error;
        }
    }

    /**
     * Accept post with counter offer withdrawal
     */
    public Map<String, Object> acceptPostWithCounterOfferWithdrawal(Long postId, String technicianEmail) {
        try {
            log.info("Accepting post {} with counter offer withdrawal by technician {}", postId, technicianEmail);

            // Record interaction for analytics
            TechnicianPostInteraction interaction = analyticsService.recordInteraction(
                    technicianEmail, postId, TechnicianPostInteraction.ActionType.ACCEPT);

            long startTime = System.currentTimeMillis();

            // Find and withdraw pending counter offers
            Optional<TechCounterOffer> pendingOfferOpt = counterOfferRepository.findByPostIdAndTechnicianEmail(postId, technicianEmail);
            int withdrawnCount = 0;

            if (pendingOfferOpt.isPresent()) {
                TechCounterOffer offer = pendingOfferOpt.get();
                offer.withdrawByTechnician();
                counterOfferRepository.save(offer);
                withdrawnCount = 1;
                log.info("Withdrew counter offer {} for post {}", offer.getId(), postId);
                
                // 🔄 CROSS-SERVICE SYNC: Notify posting service about withdrawal
                try {
                    Map<String, Object> withdrawalRequest = new HashMap<>();
                    withdrawalRequest.put("postId", postId);
                    withdrawalRequest.put("technicianEmail", technicianEmail);
                    
                    log.info("Notifying posting service about counter offer withdrawal for post: {}", postId);
                    Object syncResult = postingClient.withdrawCounterOffersForPost(withdrawalRequest);
                    
                    if (syncResult != null) {
                        log.info("Successfully synced withdrawal to posting service for post: {}", postId);
                    } else {
                        log.warn("Failed to sync withdrawal to posting service for post: {} - Response: {}", postId, syncResult);
                    }
                } catch (Exception syncException) {
                    log.error("Error syncing withdrawal to posting service for post {}: {}", postId, syncException.getMessage());
                    // Don't fail the main operation if sync fails
                }
            }

            // Proceed with regular accept
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "Post accepted successfully. " + withdrawnCount + " counter offer(s) withdrawn.");
            result.put("postId", postId);
            result.put("counterOffersWithdrawn", withdrawnCount);

            // Update analytics
            long responseTime = System.currentTimeMillis() - startTime;
            analyticsService.updatePerformanceMetrics(technicianEmail, TechnicianPostInteraction.ActionType.ACCEPT, true, responseTime);
            
            if (interaction != null) {
                analyticsService.updateInteractionResult(interaction.getId(), true, responseTime, null);
            }

            log.info("Successfully accepted post {} with {} counter offers withdrawn", postId, withdrawnCount);
            return result;

        } catch (Exception e) {
            log.error("Error accepting post {} with counter offer withdrawal: {}", postId, e.getMessage());
            
            // Update analytics on failure
            analyticsService.updatePerformanceMetrics(technicianEmail, TechnicianPostInteraction.ActionType.ACCEPT, false, null);
            
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to accept post with counter offer withdrawal: " + e.getMessage());
            return error;
        }
    }

    /**
     * Decline post with counter offer withdrawal
     */
    public Map<String, Object> declinePostWithCounterOfferWithdrawal(Long postId, String technicianEmail) {
        try {
            log.info("Declining post {} with counter offer withdrawal by technician {}", postId, technicianEmail);

            // Record interaction for analytics
            TechnicianPostInteraction interaction = analyticsService.recordInteraction(
                    technicianEmail, postId, TechnicianPostInteraction.ActionType.DECLINE);

            long startTime = System.currentTimeMillis();

            // Find and withdraw pending counter offers
            Optional<TechCounterOffer> pendingOfferOpt = counterOfferRepository.findByPostIdAndTechnicianEmail(postId, technicianEmail);
            int withdrawnCount = 0;

            if (pendingOfferOpt.isPresent()) {
                TechCounterOffer offer = pendingOfferOpt.get();
                offer.withdrawByTechnician();
                counterOfferRepository.save(offer);
                withdrawnCount = 1;
                log.info("Withdrew counter offer {} for post {}", offer.getId(), postId);
                
                // 🔄 CROSS-SERVICE SYNC: Notify posting service about withdrawal
                try {
                    Map<String, Object> withdrawalRequest = new HashMap<>();
                    withdrawalRequest.put("postId", postId);
                    withdrawalRequest.put("technicianEmail", technicianEmail);
                    
                    log.info("Notifying posting service about counter offer withdrawal for post: {}", postId);
                    Object syncResult = postingClient.withdrawCounterOffersForPost(withdrawalRequest);
                    
                    if (syncResult != null) {
                        log.info("Successfully synced withdrawal to posting service for post: {}", postId);
                    } else {
                        log.warn("Failed to sync withdrawal to posting service for post: {} - Response: {}", postId, syncResult);
                    }
                } catch (Exception syncException) {
                    log.error("Error syncing withdrawal to posting service for post {}: {}", postId, syncException.getMessage());
                    // Don't fail the main operation if sync fails
                }
            }

            // ✅ Save to declined posts table (same as regular decline)
            TechDeclinedPosts declinedPost = TechDeclinedPosts.builder()
                    .email(technicianEmail)
                    .postId(postId)
                    .build();
            
            technicianService.declinedPosts(declinedPost);
            log.info("Saved declined post to database: postId={}, technicianEmail={}", postId, technicianEmail);

            // Proceed with regular decline
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "Post declined successfully. " + withdrawnCount + " counter offer(s) withdrawn.");
            result.put("postId", postId);
            result.put("counterOffersWithdrawn", withdrawnCount);

            // Update analytics
            long responseTime = System.currentTimeMillis() - startTime;
            analyticsService.updatePerformanceMetrics(technicianEmail, TechnicianPostInteraction.ActionType.DECLINE, true, responseTime);
            
            if (interaction != null) {
                analyticsService.updateInteractionResult(interaction.getId(), true, responseTime, null);
            }

            log.info("Successfully declined post {} with {} counter offers withdrawn", postId, withdrawnCount);
            return result;

        } catch (Exception e) {
            log.error("Error declining post {} with counter offer withdrawal: {}", postId, e.getMessage());
            
            // Update analytics on failure
            analyticsService.updatePerformanceMetrics(technicianEmail, TechnicianPostInteraction.ActionType.DECLINE, false, null);
            
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to decline post with counter offer withdrawal: " + e.getMessage());
            return error;
        }
    }

    /**
     * Get enhanced technician feed with analytics tracking
     */
    public List<PostingDTO> getEnhancedTechnicianFeed(String technicianEmail, String location) {
        try {
            log.info("Getting enhanced technician feed for {} in location: {}", technicianEmail, location);

            // Record feed view for analytics
            analyticsService.recordPostView(technicianEmail);

            // Get regular feed
            TechInfoToGetPostsByLocationDto dto = new TechInfoToGetPostsByLocationDto();
            dto.setEmail(technicianEmail);
            List<PostingDTO> feed = technicianService.getFilteredFeed(dto);

            log.info("Retrieved {} posts for technician {} in location: {}", feed.size(), technicianEmail, location);
            return feed;

        } catch (Exception e) {
            log.error("Error getting enhanced technician feed for {}: {}", technicianEmail, e.getMessage());
            return List.of();
        }
    }

    /**
     * Find pending counter offer for a post by technician
     */
    private Optional<TechCounterOffer> findPendingCounterOffer(Long postId, String technicianEmail) {
        try {
            return counterOfferRepository.findByPostIdAndTechnicianEmail(postId, technicianEmail);
        } catch (Exception e) {
            log.error("Error finding pending counter offer for post {} by technician {}: {}", postId, technicianEmail, e.getMessage());
            return Optional.empty();
        }
    }
}
