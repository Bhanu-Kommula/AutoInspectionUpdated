package com.auto.postings.model;


import java.util.Date;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name="PostingDashboard")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Posting {
	
	
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
private Long id;
	private String name;
	private String email;
	@Column(nullable = false)
	private String content;
	@Column(nullable = false)
	private String location;
	private String offerAmount;
	@Column(name = "created_at")
	private Date createdAt;
    @Enumerated(EnumType.STRING)
	private PostStatus status;
    @Column(name = "updated_at")
    private Date updatedAt;
    
    private Date acceptedAt;
    private String technicianName;
    private String technicianEmail;
    private String technicianPhone;
    private String dealerPhone;
    private Date expectedCompletionBy;
    
    // New fields for VIN and auction lot
    @Column(name = "vin", length = 16)
    @Pattern(regexp = "^$|^[A-Za-z0-9]{16}$", message = "VIN must be exactly 16 alphanumeric characters or empty")
    @Size(max = 16, message = "VIN must not exceed 16 characters")
    private String vin;
    
    @Column(name = "auction_lot")
    private String auctionLot;
    
    // Link to inspection report in tech-dashboard service
    @Column(name = "inspection_report_id")
    private Long inspectionReportId;




    @PrePersist
    protected void onCreate() {
        this.createdAt = new Date();
        if (this.status == null) {
 this.status = PostStatus.PENDING;
        }
    }


}
