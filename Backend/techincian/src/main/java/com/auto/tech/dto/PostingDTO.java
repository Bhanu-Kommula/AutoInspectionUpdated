package com.auto.tech.dto;

import java.util.Date;

import lombok.Data;

@Data
public class PostingDTO {
    private Long id;
    private String name;
    private String email;
    private String content;
    private String location;
    private String offerAmount;
    private String status;

    private String technicianEmail;
    private String technicianName;

    private Date acceptedAt;
    private Date expectedCompletionBy;
    private Date createdAt;
    private Date updatedAt;
    
    // New fields for VIN and auction lot
    private String vin;
    private String auctionLot;
}