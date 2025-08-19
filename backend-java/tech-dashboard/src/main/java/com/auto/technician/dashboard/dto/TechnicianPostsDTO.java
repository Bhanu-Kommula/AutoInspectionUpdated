package com.auto.technician.dashboard.dto;

import java.util.Date;

import lombok.Data;

@Data
public class TechnicianPostsDTO {
    private Long id;
    private String name;
    private String email;
    private String content;
    private String location;
    private String offerAmount;
    private String status;

    private String technicianEmail;
    private String technicianName;

    private Date acceptedAt;           // ✅ Add this
    private Date completeBy;           // ✅ Add this
    
    // New fields for VIN and auction lot
    private String vin;
    private String auctionLot;
} 