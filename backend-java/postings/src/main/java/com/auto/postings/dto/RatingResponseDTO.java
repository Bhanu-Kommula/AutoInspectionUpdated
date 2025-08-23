package com.auto.postings.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class RatingResponseDTO {
    
    private Long id;
    private Long postId;
    private String dealerEmail;
    private String technicianEmail;
    private Integer rating;
    private String reviewComment;
    private Date createdAt;
    private Date updatedAt;
    
    // Additional fields for enhanced response
    private String dealerName;
    private String technicianName;
    private String postTitle;
    private String postLocation;
}
