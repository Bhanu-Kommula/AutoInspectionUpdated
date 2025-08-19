package com.auto.postings.dto;

import java.util.Date;

import com.auto.postings.model.PostStatus;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import lombok.Data;

@Data
public class PostRequestDto {
    private String email;         // User's email (for fetching name)
    private String content;       // Posting content
    private String location;      // Location
    private String offerAmount;
    private PostStatus status;    // Post status
    
    // New fields for VIN and auction lot
    @Pattern(regexp = "^$|^[A-Za-z0-9]{16}$", message = "VIN must be exactly 16 alphanumeric characters or empty")
    @Size(max = 16, message = "VIN must not exceed 16 characters")
    private String vin;
    
    private String auctionLot;
    
    //This all will be updated whern technician accepts 
    private Long postId;
    private Date statusUpdatedAt;
private String technicianName;
private String technicianEmail;


 private Date expectedCompletionBy;
 
 // Link to inspection report
 private Long inspectionReportId;



}
