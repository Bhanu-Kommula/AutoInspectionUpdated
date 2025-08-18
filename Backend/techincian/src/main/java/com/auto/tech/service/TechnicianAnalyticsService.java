package com.auto.tech.service;

import com.auto.tech.model.TechnicianPostInteraction;
import com.auto.tech.model.TechnicianPerformanceMetrics;
import com.auto.tech.repository.TechnicianPostInteractionRepository;
import com.auto.tech.repository.TechnicianPerformanceMetricsRepository;
import com.auto.tech.repository.TechnicianRepository;
import com.auto.tech.dto.TechnicianAnalyticsSummaryDto;
import com.auto.tech.dto.TechnicianPerformanceMetricsDto;
import com.auto.tech.dto.TechnicianPostInteractionDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Technician Analytics Service
 * Handles local storage of technician interactions and performance metrics
 * Following the current main service pattern
 */
@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class TechnicianAnalyticsService {

    private final TechnicianPostInteractionRepository interactionRepository;
    private final TechnicianPerformanceMetricsRepository metricsRepository;
    private final TechnicianRepository technicianRepository;

    /**
     * Record technician post interaction
     */
    public TechnicianPostInteraction recordInteraction(String technicianEmail, Long postId, 
                                                      TechnicianPostInteraction.ActionType actionType) {
        try {
            TechnicianPostInteraction interaction = new TechnicianPostInteraction(technicianEmail, postId, actionType);
            TechnicianPostInteraction saved = interactionRepository.save(interaction);
            log.debug("Recorded interaction: {} for technician {} on post {}", actionType, technicianEmail, postId);
            return saved;
        } catch (Exception e) {
            log.error("Error recording interaction for technician {} on post {}: {}", 
                     technicianEmail, postId, e.getMessage());
            return null;
        }
    }

    /**
     * Update interaction with external service result
     */
    public void updateInteractionResult(Long interactionId, boolean externalServiceSuccess, 
                                       Long responseTimeMs, String errorMessage) {
        try {
            Optional<TechnicianPostInteraction> optional = interactionRepository.findById(interactionId);
            if (optional.isPresent()) {
                TechnicianPostInteraction interaction = optional.get();
                
                if (externalServiceSuccess) {
                    interaction.markSuccess();
                } else {
                    interaction.markFailed(errorMessage);
                }
                
                interaction.setExternalServiceResult(externalServiceSuccess);
                if (responseTimeMs != null) {
                    interaction.setResponseTime(responseTimeMs);
                }
                
                interactionRepository.save(interaction);
                log.debug("Updated interaction {} with result: success={}, responseTime={}ms", 
                         interactionId, externalServiceSuccess, responseTimeMs);
            }
        } catch (Exception e) {
            log.error("Error updating interaction {}: {}", interactionId, e.getMessage());
        }
    }

    /**
     * Update technician performance metrics
     */
    public void updatePerformanceMetrics(String technicianEmail, TechnicianPostInteraction.ActionType actionType, 
                                        boolean success, Long responseTimeMs) {
        try {
            TechnicianPerformanceMetrics metrics = getOrCreateMetrics(technicianEmail);
            
            // Update metrics based on action type
            switch (actionType) {
                case ACCEPT:
                    if (success) {
                        metrics.incrementPostsAccepted();
                    } else {
                        metrics.incrementPostsDeclined();
                    }
                    break;
                case DECLINE:
                    metrics.incrementPostsDeclined();
                    break;
                case COUNTER_OFFER:
                    metrics.incrementCounterOffers();
                    break;
                case VIEW:
                    metrics.incrementPostsViewed();
                    break;
            }
            
            if (responseTimeMs != null) {
                metrics.updateAvgResponseTime(responseTimeMs);
            }
            
            metricsRepository.save(metrics);
            log.debug("Updated performance metrics for technician {}: action={}, success={}", 
                     technicianEmail, actionType, success);
        } catch (Exception e) {
            log.error("Error updating performance metrics for technician {}: {}", technicianEmail, e.getMessage());
        }
    }

    /**
     * Get or create metrics for technician
     */
    private TechnicianPerformanceMetrics getOrCreateMetrics(String technicianEmail) {
        Optional<TechnicianPerformanceMetrics> optional = metricsRepository.findByTechnicianEmailIgnoreCase(technicianEmail);
        if (optional.isPresent()) {
            return optional.get();
        } else {
            TechnicianPerformanceMetrics newMetrics = new TechnicianPerformanceMetrics(technicianEmail);
            return metricsRepository.save(newMetrics);
        }
    }

    /**
     * Record post view for analytics
     */
    public void recordPostView(String technicianEmail) {
        try {
            TechnicianPerformanceMetrics metrics = getOrCreateMetrics(technicianEmail);
            metrics.incrementPostsViewed();
            metricsRepository.save(metrics);
            log.debug("Recorded post view for technician: {}", technicianEmail);
        } catch (Exception e) {
            log.error("Error recording post view for technician {}: {}", technicianEmail, e.getMessage());
        }
    }

    /**
     * Get technician metrics
     */
    public Optional<TechnicianPerformanceMetricsDto> getTechnicianMetrics(String technicianEmail) {
        try {
            Optional<TechnicianPerformanceMetrics> optional = metricsRepository.findByTechnicianEmailIgnoreCase(technicianEmail);
            if (optional.isPresent()) {
                TechnicianPerformanceMetrics metrics = optional.get();
                return Optional.of(convertToDto(metrics));
            }
            return Optional.empty();
        } catch (Exception e) {
            log.error("Error getting metrics for technician {}: {}", technicianEmail, e.getMessage());
            return Optional.empty();
        }
    }

    /**
     * Get technician interactions
     */
    public List<TechnicianPostInteractionDto> getTechnicianInteractions(String technicianEmail) {
        try {
            List<TechnicianPostInteraction> interactions = interactionRepository.findByTechnicianEmailIgnoreCaseOrderByCreatedAtDesc(technicianEmail);
            return interactions.stream()
                    .map(this::convertToDto)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error getting interactions for technician {}: {}", technicianEmail, e.getMessage());
            return List.of();
        }
    }

    /**
     * Get post interactions
     */
    public List<TechnicianPostInteractionDto> getPostInteractions(Long postId) {
        try {
            List<TechnicianPostInteraction> interactions = interactionRepository.findByPostIdOrderByCreatedAtDesc(postId);
            return interactions.stream()
                    .map(this::convertToDto)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error getting interactions for post {}: {}", postId, e.getMessage());
            return List.of();
        }
    }

    /**
     * Check if technician has interacted with post
     */
    public boolean hasTechnicianInteractedWithPost(String technicianEmail, Long postId) {
        return interactionRepository.existsByTechnicianEmailIgnoreCaseAndPostId(technicianEmail, postId);
    }

    /**
     * Get top performers
     */
    public List<TechnicianPerformanceMetricsDto> getTopPerformers(int minActions) {
        try {
            List<TechnicianPerformanceMetrics> topPerformers = metricsRepository.findTopPerformers(minActions);
            return topPerformers.stream()
                    .map(this::convertToDto)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error getting top performers: {}", e.getMessage());
            return List.of();
        }
    }

    /**
     * Get top earners
     */
    public List<TechnicianPerformanceMetricsDto> getTopEarners() {
        try {
            List<TechnicianPerformanceMetrics> topEarners = metricsRepository.findTopEarners();
            return topEarners.stream()
                    .map(this::convertToDto)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error getting top earners: {}", e.getMessage());
            return List.of();
        }
    }

    /**
     * Get inactive technicians
     */
    public List<TechnicianPerformanceMetricsDto> getInactiveTechnicians(int daysInactive) {
        try {
            LocalDateTime cutoffDate = LocalDateTime.now().minusDays(daysInactive);
            List<TechnicianPerformanceMetrics> inactiveTechnicians = metricsRepository.findInactiveTechnicians(cutoffDate);
            return inactiveTechnicians.stream()
                    .map(this::convertToDto)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error getting inactive technicians: {}", e.getMessage());
            return List.of();
        }
    }

    /**
     * Get analytics summary
     */
    public TechnicianAnalyticsSummaryDto getAnalyticsSummary() {
        try {
            BigDecimal totalEarnings = metricsRepository.getTotalEarnings();
            BigDecimal averageSuccessRate = metricsRepository.getAverageSuccessRate();
            Long activeTechnicians = metricsRepository.countActiveTechnicians(LocalDateTime.now().minusDays(30));
            Long totalTechnicians = metricsRepository.count();
            
            // Get additional metrics
            Long totalPostsViewed = metricsRepository.findAll().stream()
                    .mapToLong(m -> m.getTotalPostsViewed())
                    .sum();
            Long totalPostsAccepted = metricsRepository.findAll().stream()
                    .mapToLong(m -> m.getTotalPostsAccepted())
                    .sum();
            Long totalPostsDeclined = metricsRepository.findAll().stream()
                    .mapToLong(m -> m.getTotalPostsDeclined())
                    .sum();
            Long totalCounterOffers = metricsRepository.findAll().stream()
                    .mapToLong(m -> m.getTotalCounterOffers())
                    .sum();
            Long acceptedCounterOffers = metricsRepository.findAll().stream()
                    .mapToLong(m -> m.getAcceptedCounterOffers())
                    .sum();
            Long rejectedCounterOffers = metricsRepository.findAll().stream()
                    .mapToLong(m -> m.getRejectedCounterOffers())
                    .sum();
            
            // Calculate average response time
            Double averageResponseTimeMs = metricsRepository.findAll().stream()
                    .filter(m -> m.getAvgResponseTimeMs() > 0)
                    .mapToLong(m -> m.getAvgResponseTimeMs())
                    .average()
                    .orElse(0.0);

            return TechnicianAnalyticsSummaryDto.builder()
                    .averageSuccessRate(averageSuccessRate.doubleValue())
                    .totalEarnings(totalEarnings)
                    .activeTechnicians(activeTechnicians)
                    .totalTechnicians(totalTechnicians)
                    .totalPostsViewed(totalPostsViewed)
                    .totalPostsAccepted(totalPostsAccepted)
                    .totalPostsDeclined(totalPostsDeclined)
                    .totalCounterOffers(totalCounterOffers)
                    .acceptedCounterOffers(acceptedCounterOffers)
                    .rejectedCounterOffers(rejectedCounterOffers)
                    .averageResponseTimeMs(averageResponseTimeMs)
                    .build();
        } catch (Exception e) {
            log.error("Error getting analytics summary: {}", e.getMessage());
            return TechnicianAnalyticsSummaryDto.builder().build();
        }
    }

    /**
     * Convert entity to DTO
     */
    private TechnicianPerformanceMetricsDto convertToDto(TechnicianPerformanceMetrics metrics) {
        String technicianName = technicianRepository.findByEmailIgnoreCase(metrics.getTechnicianEmail())
                .map(tech -> tech.getName())
                .orElse("Unknown");
        
        return TechnicianPerformanceMetricsDto.builder()
                .id(metrics.getId())
                .technicianEmail(metrics.getTechnicianEmail())
                .technicianName(technicianName)
                .totalPostsViewed(metrics.getTotalPostsViewed())
                .totalPostsAccepted(metrics.getTotalPostsAccepted())
                .totalPostsDeclined(metrics.getTotalPostsDeclined())
                .totalCounterOffers(metrics.getTotalCounterOffers())
                .acceptedCounterOffers(metrics.getAcceptedCounterOffers())
                .rejectedCounterOffers(metrics.getRejectedCounterOffers())
                .totalEarnings(metrics.getTotalEarnings())
                .avgResponseTimeMs(metrics.getAvgResponseTimeMs())
                .successRate(metrics.getSuccessRate())
                .lastActivityAt(metrics.getLastActivityAt())
                .createdAt(metrics.getCreatedAt())
                .updatedAt(metrics.getUpdatedAt())
                .build();
    }

    /**
     * Convert entity to DTO
     */
    private TechnicianPostInteractionDto convertToDto(TechnicianPostInteraction interaction) {
        return TechnicianPostInteractionDto.builder()
                .id(interaction.getId())
                .technicianEmail(interaction.getTechnicianEmail())
                .postId(interaction.getPostId())
                .actionType(interaction.getActionType())
                .actionStatus(interaction.getActionStatus())
                .originalOfferAmount(interaction.getOriginalOfferAmount())
                .counterOfferAmount(interaction.getCounterOfferAmount())
                .requestReason(interaction.getRequestReason())
                .notes(interaction.getNotes())
                .responseTimeMs(interaction.getResponseTimeMs())
                .externalServiceSuccess(interaction.getExternalServiceSuccess())
                .errorMessage(interaction.getErrorMessage())
                .createdAt(interaction.getCreatedAt())
                .updatedAt(interaction.getUpdatedAt())
                .build();
    }
}
