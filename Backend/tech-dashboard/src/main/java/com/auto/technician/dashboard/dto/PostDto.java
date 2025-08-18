package com.auto.technician.dashboard.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Post Data Transfer Object
 * Used for transferring post data between services
 */
@Data
@NoArgsConstructor
public class PostDto {
    private Long id;
    private Long dealerPostId;
    private String dealerName;
    private Long assignedTechnicianId;
    private String assignedTechnicianName;
    private String assignedTechnicianEmail;
    private String name;
    private String email;
    private String content;
    private String location;
    private String offerAmount;
    private String vin;
    private String auctionLot;
    private String status;
    private String createdAt;
    private String updatedAt;
    private String acceptedAt;
    private String estimatedCompletionTime;

    // Additional fields for enhanced functionality
    private String make;
    private String model;
    private Integer year;
    private String color;
    private Integer mileage;

    // ==================== HELPER METHODS ====================

    public boolean isAssignedTo(Long technicianId) {
        return technicianId != null && technicianId.equals(this.assignedTechnicianId);
    }

    public boolean isAccepted() {
        return "ACCEPTED".equalsIgnoreCase(this.status);
    }

    public boolean isPending() {
        return "PENDING".equalsIgnoreCase(this.status);
    }

    public boolean isCompleted() {
        return "COMPLETED".equalsIgnoreCase(this.status);
    }

    public boolean isInProgress() {
        return "IN_PROGRESS".equalsIgnoreCase(this.status);
    }

    // Vehicle information getters for compatibility
    public String getVehicleMake() {
        return make;
    }

    public void setVehicleMake(String vehicleMake) {
        this.make = vehicleMake;
    }

    public String getVehicleModel() {
        return model;
    }

    public void setVehicleModel(String vehicleModel) {
        this.model = vehicleModel;
    }

    public Integer getVehicleYear() {
        return year;
    }

    public void setVehicleYear(Integer vehicleYear) {
        this.year = vehicleYear;
    }

    public String getVehicleColor() {
        return color;
    }

    public void setVehicleColor(String vehicleColor) {
        this.color = vehicleColor;
    }

    public Integer getVehicleMileage() {
        return mileage;
    }

    public void setVehicleMileage(Integer vehicleMileage) {
        this.mileage = vehicleMileage;
    }

    public String getVehicleVin() {
        return vin;
    }

    public void setVehicleVin(String vehicleVin) {
        this.vin = vehicleVin;
    }
}
