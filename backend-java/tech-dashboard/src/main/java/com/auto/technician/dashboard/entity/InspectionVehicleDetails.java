package com.auto.technician.dashboard.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Inspection Vehicle Details Entity
 * Normalized table for vehicle information
 */
@Entity
@Table(name = "inspection_vehicle_details")
@Data
@NoArgsConstructor
public class InspectionVehicleDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inspection_report_id", nullable = false)
    private InspectionReport inspectionReport;

    // Vehicle identification
    @Column(name = "vin_number", length = 17)
    private String vinNumber;

    @Column(name = "license_plate", length = 20)
    private String licensePlate;

    // Vehicle specifications
    @Column(name = "make", length = 50)
    private String make;

    @Column(name = "model", length = 50)
    private String model;

    @Column(name = "year")
    private Integer year;

    @Column(name = "trim_level", length = 50)
    private String trimLevel;

    @Column(name = "engine_type", length = 100)
    private String engineType;

    @Column(name = "transmission_type", length = 50)
    private String transmissionType;

    @Column(name = "fuel_type", length = 30)
    private String fuelType;

    // Vehicle condition
    @Column(name = "mileage")
    private Integer mileage;

    @Column(name = "color_exterior", length = 30)
    private String colorExterior;

    @Column(name = "color_interior", length = 30)
    private String colorInterior;

    // Vehicle history
    @Enumerated(EnumType.STRING)
    @Column(name = "accident_history")
    private AccidentHistory accidentHistory = AccidentHistory.UNKNOWN;

    @Column(name = "service_history_available")
    private Boolean serviceHistoryAvailable = false;

    @Column(name = "previous_owner_count")
    private Integer previousOwnerCount;

    // Location and context
    @Column(name = "inspection_location")
    private String inspectionLocation;

    @Column(name = "weather_conditions", length = 100)
    private String weatherConditions;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    // ==================== ENUMS ====================

    public enum AccidentHistory {
        NONE,
        MINOR,
        MAJOR,
        UNKNOWN
    }

    // ==================== CONSTRUCTORS ====================

    public InspectionVehicleDetails(InspectionReport inspectionReport) {
        this.inspectionReport = inspectionReport;
    }

    // ==================== BUSINESS METHODS ====================

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public void updateFromReportData(InspectionReport report) {
        if (report.getVinNumber() != null) this.vinNumber = report.getVinNumber();
        if (report.getVehicleMake() != null) this.make = report.getVehicleMake();
        if (report.getVehicleModel() != null) this.model = report.getVehicleModel();
        if (report.getVehicleYear() != null) this.year = report.getVehicleYear();
        if (report.getVehicleMileage() != null) this.mileage = report.getVehicleMileage();
        if (report.getVehicleColor() != null) this.colorExterior = report.getVehicleColor();
    }
}
