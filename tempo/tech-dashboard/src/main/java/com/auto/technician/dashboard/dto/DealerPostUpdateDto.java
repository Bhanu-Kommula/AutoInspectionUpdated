package com.auto.technician.dashboard.dto;

import java.util.Date;

import lombok.Data;

@Data
public class DealerPostUpdateDto {
	
	
	private long postId;
	private String status;
    private Date acceptedAt;
	 private Date expectedCompletionBy;
	 private String technicianName;
	 private String technicianEmail;
	

}
