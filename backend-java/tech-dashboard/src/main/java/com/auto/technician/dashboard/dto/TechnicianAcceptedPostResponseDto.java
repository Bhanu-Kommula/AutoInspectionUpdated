package com.auto.technician.dashboard.dto;

import java.util.Date;

import lombok.Data;

@Data
public class TechnicianAcceptedPostResponseDto {
    private long postId;
    private String name;
    private String email;
    private String content;
    private String location;
    private String offerAmount;
    private String status;

    private String technicianEmail;
    private String technicianName;

    private Date acceptedAt;
    private Date expectedCompletionBy; // for Dealer postpage
    private Date completeBy;  // for technician dashboard. 
}
