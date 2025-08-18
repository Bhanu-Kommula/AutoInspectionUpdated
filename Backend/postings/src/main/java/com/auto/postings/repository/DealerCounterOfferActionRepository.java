package com.auto.postings.repository;

import com.auto.postings.model.DealerCounterOfferAction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface DealerCounterOfferActionRepository extends JpaRepository<DealerCounterOfferAction, Long> {

    /**
     * Find actions by counter offer ID
     */
    List<DealerCounterOfferAction> findByCounterOfferIdOrderByActionAtDesc(Long counterOfferId);

    /**
     * Find actions by dealer email
     */
    List<DealerCounterOfferAction> findByDealerEmailOrderByActionAtDesc(String dealerEmail);

    /**
     * Find actions by action type
     */
    List<DealerCounterOfferAction> findByActionTypeOrderByActionAtDesc(DealerCounterOfferAction.ActionType actionType);

    /**
     * Find recent actions within time period
     */
    @Query("SELECT dca FROM DealerCounterOfferAction dca WHERE dca.actionAt >= :startTime ORDER BY dca.actionAt DESC")
    List<DealerCounterOfferAction> findRecentActions(@Param("startTime") LocalDateTime startTime);

    /**
     * Count actions by dealer and action type
     */
    @Query("SELECT COUNT(dca) FROM DealerCounterOfferAction dca WHERE dca.dealerEmail = :dealerEmail AND dca.actionType = :actionType")
    long countByDealerEmailAndActionType(@Param("dealerEmail") String dealerEmail, 
                                       @Param("actionType") DealerCounterOfferAction.ActionType actionType);

    /**
     * Get dealer action statistics
     */
    @Query("SELECT dca.dealerEmail, dca.actionType, COUNT(dca) FROM DealerCounterOfferAction dca " +
           "GROUP BY dca.dealerEmail, dca.actionType ORDER BY dca.dealerEmail")
    List<Object[]> getDealerActionStatistics();
}
