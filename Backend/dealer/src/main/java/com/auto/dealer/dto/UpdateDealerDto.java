package com.auto.dealer.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateDealerDto {
    
    @NotNull(message = "Dealer ID is required")
    private long dealerId;     // Business dealer ID
    
    @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
    private String name;
    
    @Email(message = "Please provide a valid email address")
    private String email;
    
    @Size(min = 8, message = "Password must be at least 8 characters long")
    private String password;
    
    @Size(min = 2, max = 100, message = "Location must be between 2 and 100 characters")
    private String location;
    
    @Size(min = 5, max = 10, message = "Zipcode must be between 5 and 10 characters")
    private String zipcode;
    
    @Pattern(regexp = "^[\\+]?[1-9]?[0-9]{7,15}$", message = "Please provide a valid phone number")
    private String phone;
    
    @NotNull(message = "Updated by field is required for audit trail")
    private String updatedBy;  // Required for audit trail
}