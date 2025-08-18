package com.auto.postings.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * DTO for dealer responses to counter offers
 */
@Data
public class DealerResponseDto {

    @NotNull(message = "Counter offer ID is required")
    private Long counterOfferId;

    @NotBlank(message = "Response action is required")
    private String action; // "ACCEPT" or "REJECT"

    @Size(max = 1000, message = "Response notes must not exceed 1000 characters")
    private String responseNotes;

    // Helper methods
    public boolean isAcceptAction() {
        return "ACCEPT".equalsIgnoreCase(action);
    }

    public boolean isRejectAction() {
        return "REJECT".equalsIgnoreCase(action);
    }
}
