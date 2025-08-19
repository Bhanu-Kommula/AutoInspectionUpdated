package com.auto.dealer.dto;

import lombok.Data;
import lombok.Builder;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class DealerListDto {
    private Long dealerId;
    private String name;
    private String email;
    private String location;
    private String zipcode;
    private String phone;
    private String status;
    private String registeredAt;
    private String lastUpdatedAt;
}
