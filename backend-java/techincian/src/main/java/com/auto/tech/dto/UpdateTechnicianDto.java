package com.auto.tech.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateTechnicianDto {
    private String email; // Used to identify technician
    private String name;
    private String location;
    private String zipcode;
    private String yearsOfExperience;
    private String updatedBy;
}