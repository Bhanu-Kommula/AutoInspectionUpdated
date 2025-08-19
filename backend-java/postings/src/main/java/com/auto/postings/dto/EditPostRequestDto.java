package com.auto.postings.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class EditPostRequestDto {
	
	
	private long id;
	private String content;
	private String location;
	private String offerAmount;
	
	// New fields for VIN and auction lot
	@Pattern(regexp = "^$|^[A-Za-z0-9]{16}$", message = "VIN must be exactly 16 alphanumeric characters (no spaces or special characters) or empty")
	@Size(max = 16, message = "VIN must not exceed 16 characters")
	private String vin;
	
	private String auctionLot;
	
	// New fields for status updates when technician accepts
	private String status;
	private String technicianName;
	private String technicianEmail;
	
	// Link to inspection report
	private Long inspectionReportId;

}
