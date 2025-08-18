package com.auto.tech.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

/**
 * Counter Offer Request DTO
 * Validated request object for counter offer submissions
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CounterOfferRequest {

    @NotNull(message = "Counter offer amount is required")
    @Size(min = 1, max = 50, message = "Counter offer amount must be between 1 and 50 characters")
    private String counterOfferAmount;

    @Size(max = 500, message = "Request reason must not exceed 500 characters")
    private String requestReason;

    @Size(max = 1000, message = "Notes must not exceed 1000 characters")
    private String notes;
}
