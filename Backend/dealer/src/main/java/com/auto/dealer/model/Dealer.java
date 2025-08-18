package com.auto.dealer.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Enumerated;
import jakarta.persistence.EnumType;
import jakarta.persistence.PrePersist;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@Data
@Table(name = "Dealer")
public class Dealer {
	
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long dealerId;
	
	@NotBlank(message="Please enter the name")
    @Column(nullable = false)
	private String name;
	
	@Email(message ="enter a valid email")
	@Column(unique=true, nullable = false)
	private String email;
	
	@NotBlank(message="Please enter the password")
	@Size(min=8, message = "Please Choose a larger password of characters more than 8")
    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
	@NotBlank(message="Please enter the city")
    private String location;

    @NotBlank(message="Please enter the Zipcode")
    @Column(nullable = false)
    private String zipcode;

    @Column(nullable = false)
    @NotBlank(message="Please enter the phone number")
    @Pattern(regexp = "^[\\+]?[1-9]?[0-9]{7,15}$", message = "Please provide a valid phone number")
    private String phone;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DealerStatus status = DealerStatus.ACTIVE;
    
    @Column(nullable = false)
    private LocalDateTime registeredAt;
    
    @Column(nullable = false)
    private LocalDateTime lastUpdatedAt;
    
    @PrePersist
    protected void onCreate() {
        registeredAt = LocalDateTime.now();
        lastUpdatedAt = LocalDateTime.now();
    }
    
    public enum DealerStatus {
        ACTIVE, INACTIVE, SUSPENDED, PENDING_VERIFICATION
    }
}
