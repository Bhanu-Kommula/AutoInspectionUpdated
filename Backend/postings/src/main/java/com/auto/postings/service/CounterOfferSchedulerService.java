package com.auto.postings.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

/**
 * Scheduler service for counter offer related tasks
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CounterOfferSchedulerService {

    private final CounterOfferService counterOfferService;

    /**
     * Mark expired counter offers every 10 minutes
     */
    @Scheduled(fixedRate = 600000) // 10 minutes = 600,000 milliseconds
    public void markExpiredCounterOffers() {
        try {
            log.info("Running scheduled task to mark expired counter offers");
            int expiredCount = counterOfferService.markExpiredCounterOffers();
            
            if (expiredCount > 0) {
                log.info("Marked {} counter offers as expired", expiredCount);
            }
        } catch (Exception e) {
            log.error("Error in scheduled task to mark expired counter offers: {}", e.getMessage());
        }
    }

    /**
     * Log counter offer statistics every hour
     */
    @Scheduled(fixedRate = 3600000) // 1 hour = 3,600,000 milliseconds
    public void logCounterOfferStatistics() {
        try {
            log.info("Running scheduled task to log counter offer statistics");
            var statistics = counterOfferService.getDealerActionStatistics();
            
            if (!statistics.isEmpty()) {
                log.info("Counter offer statistics: {}", statistics);
            } else {
                log.info("No counter offer statistics available");
            }
        } catch (Exception e) {
            log.error("Error in scheduled task to log counter offer statistics: {}", e.getMessage());
        }
    }
}
