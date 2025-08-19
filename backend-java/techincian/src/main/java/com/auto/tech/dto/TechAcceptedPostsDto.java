package com.auto.tech.dto;

import lombok.Data;

@Data
public class TechAcceptedPostsDto {
	
	private long postId;
	private String email;
	

    private String technicianName; // ✅ Add this field

}
