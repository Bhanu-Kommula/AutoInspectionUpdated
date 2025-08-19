package com.auto.tech.service;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

/**
 * Scheduler service for counter offer related tasks
 */
@Service
@RequiredArgsConstructor
public class CounterOfferSchedulerService {

    private static final Logger logger = LoggerFactory.getLogger(CounterOfferSchedulerService.class);

    private final CounterOfferService counterOfferService;

    /**
     * Mark expired counter offers every 10 minutes
     */
    @Scheduled(fixedRate = 600000) // 10 minutes = 600,000 milliseconds
    public void markExpiredCounterOffers() {
        try {
            logger.info("Running scheduled task to mark expired counter offers");
            int expiredCount = counterOfferService.markExpiredCounterOffersScheduled();
            if (expiredCount > 0) {
                logger.info("Marked {} counter offers as expired", expiredCount);
            } else {
                logger.debug("No counter offers to mark as expired");
            }
        } catch (Exception e) {
            logger.error("Error in scheduled task for marking expired counter offers: {}", e.getMessage());
        }
    }

    /**
     * Cleanup old expired counter offers daily at 2 AM
     */
    @Scheduled(cron = "0 0 2 * * ?") // Daily at 2:00 AM
    public void cleanupOldExpiredCounterOffers() {
        try {
            logger.info("Running scheduled cleanup of old expired counter offers");
            int deletedCount = counterOfferService.cleanupOldExpiredCounterOffers(30); // Delete counter offers older than 30 days
            if (deletedCount > 0) {
                logger.info("Cleaned up {} old expired counter offers", deletedCount);
            } else {
                logger.debug("No old expired counter offers to cleanup");
            }
        } catch (Exception e) {
            logger.error("Error in scheduled cleanup of old expired counter offers: {}", e.getMessage());
        }
    }

    /**
     * Run cleanup of counter offer data integrity every hour
     */
    @Scheduled(fixedRate = 3600000) // 1 hour = 3,600,000 milliseconds
    public void cleanupCounterOfferDataIntegrity() {
        try {
            logger.debug("Running scheduled counter offer data integrity cleanup");
            counterOfferService.cleanupCounterOffers();
        } catch (Exception e) {
            logger.error("Error in scheduled counter offer data integrity cleanup: {}", e.getMessage());
        }
    }
}
