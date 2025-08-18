package com.auto.postings.dto;

import lombok.Data;

@Data
public class GetByFiltersDto {
	
	private String email;
	private String offerAmount;
	private String location;
	private String status;

}
