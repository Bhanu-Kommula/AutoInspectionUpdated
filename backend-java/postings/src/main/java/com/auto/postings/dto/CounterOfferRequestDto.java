package com.auto.postings.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * DTO for counter offer requests from technicians
 */
@Data
public class CounterOfferRequestDto {

    @NotNull(message = "Post ID is required")
    private Long postId;

    @NotNull(message = "Technician email is required")
    private String technicianEmail;

    @Size(max = 255, message = "Technician name must not exceed 255 characters")
    private String technicianName;

    @NotNull(message = "Original offer amount is required")
    @Size(max = 100, message = "Original offer amount must not exceed 100 characters")
    private String originalOfferAmount;

    @NotNull(message = "Requested offer amount is required")
    @Size(max = 100, message = "Requested offer amount must not exceed 100 characters")
    private String requestedOfferAmount;

    @NotNull(message = "Technician location is required")
    @Size(max = 255, message = "Location must not exceed 255 characters")
    private String technicianLocation;

    @Size(max = 1000, message = "Request reason must not exceed 1000 characters")
    private String requestReason;

    @Size(max = 1000, message = "Technician notes must not exceed 1000 characters")
    private String technicianNotes;
}
