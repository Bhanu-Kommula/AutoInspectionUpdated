package com.auto.dealer.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class RegisterDealerDto {
    
    // dealerId removed - auto-generated in backend
    
    @NotBlank(message = "Please enter the name")
    @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
    private String name;
    
    @NotBlank(message = "Please enter the email")
    @Email(message = "Please provide a valid email address")
    private String email;
    
    @NotBlank(message = "Please enter the password")
    @Size(min = 8, message = "Password must be at least 8 characters long")
    private String password;
    
    @NotBlank(message = "Please enter the city")
    @Size(min = 2, max = 100, message = "Location must be between 2 and 100 characters")
    private String location;
    
    @NotBlank(message = "Please enter the zipcode")
    @Size(min = 5, max = 10, message = "Zipcode must be between 5 and 10 characters")
    private String zipcode;
    
    @NotBlank(message = "Please enter the phone number")
    @Pattern(regexp = "^[\\+]?[1-9]?[0-9]{7,15}$", message = "Please provide a valid phone number")
    private String phone;
} 