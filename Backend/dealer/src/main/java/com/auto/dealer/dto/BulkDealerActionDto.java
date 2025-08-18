package com.auto.dealer.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.List;

@Data
public class BulkDealerActionDto {
    @NotEmpty(message = "Dealer IDs list cannot be empty")
    private List<Long> dealerIds;
    
    @NotNull(message = "Action is required")
    private String action; // UPDATE_STATUS, DELETE, SUSPEND, ACTIVATE
    
    private String newStatus; // For status updates
    
    private String reason; // Optional reason for the action
    
    @NotNull(message = "Performed by field is required for audit trail")
    private String performedBy; // Who performed the action
}
