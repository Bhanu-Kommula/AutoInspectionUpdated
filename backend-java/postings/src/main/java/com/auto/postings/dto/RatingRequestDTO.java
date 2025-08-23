package com.auto.postings.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class RatingRequestDTO {
    
    @NotNull(message = "Post ID is required")
    private Long postId;
    
    @NotBlank(message = "Dealer email is required")
    @Email(message = "Invalid dealer email format")
    private String dealerEmail;
    
    @NotBlank(message = "Technician email is required")
    @Email(message = "Invalid technician email format")
    private String technicianEmail;
    
    @NotNull(message = "Rating is required")
    @Min(value = 1, message = "Rating must be at least 1")
    @Max(value = 5, message = "Rating must be at most 5")
    private Integer rating;
    
    @Size(max = 1000, message = "Review comment must not exceed 1000 characters")
    private String reviewComment;
}
