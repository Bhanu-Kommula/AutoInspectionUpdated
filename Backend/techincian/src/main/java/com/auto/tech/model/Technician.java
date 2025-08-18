package com.auto.tech.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import jakarta.persistence.EntityListeners;
import java.time.LocalDateTime;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@Data
@Table(name = "Technicians")
@EntityListeners(AuditingEntityListener.class)
public class Technician {
	
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;
	
	@NotBlank(message="Please enter the name")
    @Column(nullable = false)
	private String name;
	
	private String delearshipName;
    
	@Email(message ="enter a valid email")
	@Column(unique=true, nullable = false)
	private String email;
	@NotBlank(message="Please enter the password")
	@Size(min=8, message = "Please Choose a larger password of characters more than 8")
    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
	@NotBlank(message="Please enter the location")
    private String location;
	
    @NotBlank(message="Please enter the Zipcode")
    @Column(nullable = false)
    private String zipcode;
    
    @Column(nullable = false)
   	@NotBlank(message="Please enter the yearsOfExperience")
       private String yearsOfExperience;
    
    @LastModifiedDate
    @Column(name = "last_activity_at")
    private LocalDateTime lastActivityAt;
    
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @Column(name = "status", nullable = false)
    private String status = "ACTIVE"; // ACTIVE, SUSPENDED, DELETED
    
    // Helper method to update last activity
    public void updateLastActivity() {
        this.lastActivityAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
    
    // Helper method to update status
    public void setStatus(String status) {
        this.status = status;
        this.updatedAt = LocalDateTime.now();
    }
}
