package com.auto.postings.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.Map;

@FeignClient(name = "technician", url = "http://localhost:8082")
public interface TechnicianClient {

    /**
     * Get technician details by email
     * POST /api/technicians/get-technician-by-email
     */
    @PostMapping("/api/technicians/get-technician-by-email")
    Map<String, Object> getTechnicianByEmail(@RequestBody Map<String, String> emailRequest);

    /**
     * Notify technician service about counter offer rejection
     * PUT /api/technicians/counter-offer/{counterOfferId}/reject
     */
    @PutMapping("/api/technicians/counter-offer/{counterOfferId}/reject")
    Map<String, Object> notifyCounterOfferRejection(
        @PathVariable("counterOfferId") Long counterOfferId,
        @RequestBody Map<String, Object> rejectionData
    );

    /**
     * Notify technician service about counter offer acceptance
     * PUT /api/technicians/counter-offer/{counterOfferId}/accept
     */
    @PutMapping("/api/technicians/counter-offer/{counterOfferId}/accept")
    Map<String, Object> notifyCounterOfferAcceptance(
        @PathVariable("counterOfferId") Long counterOfferId,
        @RequestBody Map<String, Object> acceptanceData
    );
    
    /**
     * Notify technician service about counter offer withdrawal
     * POST /api/technicians/counter-offer/withdraw
     */
    @PutMapping("/api/technicians/counter-offer/withdraw")
    Map<String, Object> notifyCounterOfferWithdrawal(
        @RequestBody Map<String, Object> withdrawalData
    );
}
