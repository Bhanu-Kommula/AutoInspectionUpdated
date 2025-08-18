package com.auto.dealer.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;
import lombok.Data;

@Data
public class DealerSearchDto {
    private String name;
    private String email;
    private String location;
    private String zipcode;
    private String status;
    private String phone;
    private String registeredAfter;
    private String registeredBefore;
    
    @Min(value = 0, message = "Page number must be 0 or greater")
    private Integer page = 0;
    
    @Min(value = 1, message = "Page size must be at least 1")
    @Max(value = 100, message = "Page size cannot exceed 100")
    private Integer size = 20;
    
    private String sortBy = "registeredAt";
    private String sortDirection = "DESC";
}
