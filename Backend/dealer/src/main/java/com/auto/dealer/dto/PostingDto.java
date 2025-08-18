package com.auto.dealer.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class PostingDto {
	
	private long dealerId;
	private String email;
	private String name;
	private String phone;

}
