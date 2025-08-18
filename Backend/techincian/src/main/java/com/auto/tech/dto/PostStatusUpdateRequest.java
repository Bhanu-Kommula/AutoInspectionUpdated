package com.auto.tech.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PostStatusUpdateRequest {
    private Long id;
    private String status;
    private String technicianName;
    private String technicianEmail;
}
