package com.auto.technician.dashboard.service;

import com.auto.technician.dashboard.entity.InspectionChecklistItem;
import com.auto.technician.dashboard.entity.InspectionReport;
import com.auto.technician.dashboard.repository.InspectionChecklistItemRepository;
import com.auto.technician.dashboard.repository.InspectionReportRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

/**
 * Enhanced Checklist Service
 * Handles initialization and management of all 66 inspection checklist items
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EnhancedChecklistService {

    private final InspectionChecklistItemRepository checklistItemRepository;
    private final InspectionReportRepository inspectionReportRepository;

    /**
     * Initialize complete 66-item checklist for an inspection report
     * This ensures EVERY report has ALL required items
     */
    @Transactional
    public void initializeCompleteChecklist(Long inspectionReportId) {
        try {
            log.info("Initializing complete 66-item checklist for report ID: {}", inspectionReportId);

            // Verify report exists
            InspectionReport report = inspectionReportRepository.findById(inspectionReportId)
                .orElseThrow(() -> new IllegalArgumentException("Inspection report not found: " + inspectionReportId));

            // Check if checklist already exists
            long existingItemsCount = checklistItemRepository.countByInspectionReportId(inspectionReportId);
            if (existingItemsCount > 0) {
                log.warn("Checklist already exists for report {}, existing items: {}", inspectionReportId, existingItemsCount);
                return;
            }

            List<InspectionChecklistItem> allItems = new ArrayList<>();

            // EXTERIOR (8 items)
            allItems.addAll(createCategoryItems(report, InspectionChecklistItem.InspectionCategory.EXTERIOR, new String[]{
                "Body panels and paint condition",
                "Windows and windshield condition", 
                "Headlights, taillights, and turn signals",
                "Tires, wheels, and wheel alignment",
                "Side mirrors and visibility",
                "Doors, handles, and locks",
                "Hood and trunk operation",
                "Bumpers, grille, and trim"
            }));

            // INTERIOR (8 items)
            allItems.addAll(createCategoryItems(report, InspectionChecklistItem.InspectionCategory.INTERIOR, new String[]{
                "Seats, upholstery, and comfort",
                "Dashboard, gauges, and controls",
                "Air conditioning and heating system",
                "Radio, infotainment, and connectivity",
                "Instrument cluster and warning lights",
                "Steering wheel and steering column",
                "Carpets, floor mats, and cleanliness",
                "Interior lighting and accessories"
            }));

            // ENGINE (8 items)
            allItems.addAll(createCategoryItems(report, InspectionChecklistItem.InspectionCategory.ENGINE, new String[]{
                "Engine oil level and quality",
                "Coolant level and radiator condition",
                "Battery, terminals, and charging system",
                "Drive belts and cooling hoses",
                "Air filter and intake system",
                "Engine mounts and vibration",
                "Exhaust system and emissions",
                "Engine performance and idle"
            }));

            // TRANSMISSION (6 items)
            allItems.addAll(createCategoryItems(report, InspectionChecklistItem.InspectionCategory.TRANSMISSION, new String[]{
                "Transmission fluid level and color",
                "Gear shifting operation (manual/automatic)",
                "Clutch operation and engagement",
                "Transmission mounts and support",
                "Driveshaft and CV joints",
                "Differential and axle condition"
            }));

            // BRAKES (6 items)
            allItems.addAll(createCategoryItems(report, InspectionChecklistItem.InspectionCategory.BRAKES, new String[]{
                "Brake pads thickness and wear",
                "Brake rotors and disc condition",
                "Brake lines, hoses, and connections",
                "Brake fluid level and quality",
                "Parking brake adjustment and operation",
                "ABS system and brake assist"
            }));

            // SUSPENSION (6 items)
            allItems.addAll(createCategoryItems(report, InspectionChecklistItem.InspectionCategory.SUSPENSION, new String[]{
                "Shock absorbers and dampers",
                "Springs, struts, and coil springs",
                "Control arms and suspension bushings",
                "Ball joints and tie rod ends",
                "Steering components and alignment",
                "Wheel bearings and hub assembly"
            }));

            // ELECTRICAL (6 items)
            allItems.addAll(createCategoryItems(report, InspectionChecklistItem.InspectionCategory.ELECTRICAL, new String[]{
                "Alternator and charging system",
                "Starter motor and ignition system",
                "Wiring harnesses and connections",
                "Fuses, relays, and electrical panels",
                "Engine control unit (ECU) and sensors",
                "Power accessories and electronics"
            }));

            // SAFETY (6 items)
            allItems.addAll(createCategoryItems(report, InspectionChecklistItem.InspectionCategory.SAFETY, new String[]{
                "Seat belts and restraint systems",
                "Airbag system and SRS warning",
                "Child safety locks and LATCH system",
                "Emergency brake and hazard lights",
                "Safety warning systems and alerts",
                "Security system and anti-theft"
            }));

            // UNDERCARRIAGE (6 items)
            allItems.addAll(createCategoryItems(report, InspectionChecklistItem.InspectionCategory.UNDERCARRIAGE, new String[]{
                "Frame, chassis, and structural integrity",
                "Fuel tank, lines, and vapor system",
                "Steering rack and power steering",
                "Exhaust system and catalytic converter",
                "Heat shields and protective covers",
                "Undercarriage protection and skid plates"
            }));

            // TEST_DRIVE (6 items)
            allItems.addAll(createCategoryItems(report, InspectionChecklistItem.InspectionCategory.TEST_DRIVE, new String[]{
                "Engine acceleration and power delivery",
                "Braking performance and stopping distance",
                "Steering response and handling",
                "Suspension comfort and road feel",
                "Unusual noises, vibrations, or odors",
                "Transmission shifting and operation"
            }));

            // Save all items in batch
            checklistItemRepository.saveAll(allItems);

            // Update report with total items count
            report.setTotalChecklistItems(allItems.size());
            report.setCompletedChecklistItems(0);
            inspectionReportRepository.save(report);

            log.info("Successfully initialized {} checklist items for report {}", allItems.size(), inspectionReportId);

        } catch (Exception e) {
            log.error("Error initializing checklist for report {}: {}", inspectionReportId, e.getMessage(), e);
            throw new RuntimeException("Failed to initialize checklist", e);
        }
    }

    /**
     * Create checklist items for a specific category
     */
    private List<InspectionChecklistItem> createCategoryItems(InspectionReport report, 
                                                            InspectionChecklistItem.InspectionCategory category, 
                                                            String[] itemNames) {
        List<InspectionChecklistItem> items = new ArrayList<>();
        
        for (int i = 0; i < itemNames.length; i++) {
            InspectionChecklistItem item = new InspectionChecklistItem(category, itemNames[i], i + 1);
            item.setInspectionReport(report);
            items.add(item);
        }
        
        return items;
    }

    /**
     * Update checklist item with complete inspection data
     */
    @Transactional
    public boolean updateChecklistItem(Long itemId, 
                                     Boolean checked,
                                     InspectionChecklistItem.ConditionRating conditionRating,
                                     InspectionChecklistItem.WorkingStatus workingStatus,
                                     String remarks,
                                     String technicianNotes,
                                     String repairDescription) {
        try {
            InspectionChecklistItem item = checklistItemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("Checklist item not found: " + itemId));

            // Update all fields (cost fields removed)
            item.completeInspection(
                conditionRating,
                workingStatus,
                remarks,
                technicianNotes,
                repairDescription
            );

            if (checked != null) {
                item.setIsChecked(checked);
            }

            checklistItemRepository.save(item);

            // Update report completion count
            updateReportCompletionCount(item.getInspectionReport().getId());

            log.debug("Updated checklist item {} for report {}", itemId, item.getInspectionReport().getId());
            return true;

        } catch (Exception e) {
            log.error("Error updating checklist item {}: {}", itemId, e.getMessage(), e);
            return false;
        }
    }

    /**
     * Update the report's completion count based on checked items
     */
    @Transactional
    public void updateReportCompletionCount(Long reportId) {
        try {
            long checkedCount = checklistItemRepository.countByInspectionReportIdAndIsChecked(reportId, true);
            
            InspectionReport report = inspectionReportRepository.findById(reportId)
                .orElseThrow(() -> new IllegalArgumentException("Report not found: " + reportId));
            
            report.setCompletedChecklistItems((int) checkedCount);
            inspectionReportRepository.save(report);

            log.debug("Updated completion count for report {}: {}/66", reportId, checkedCount);

        } catch (Exception e) {
            log.error("Error updating completion count for report {}: {}", reportId, e.getMessage(), e);
        }
    }

    /**
     * Get checklist completion statistics
     */
    public ChecklistStats getChecklistStats(Long reportId) {
        try {
            long totalItems = checklistItemRepository.countByInspectionReportId(reportId);
            long checkedItems = checklistItemRepository.countByInspectionReportIdAndIsChecked(reportId, true);
            long itemsNeedingRepair = checklistItemRepository.countByInspectionReportIdAndConditionRatingIn(
                reportId, List.of(
                    InspectionChecklistItem.ConditionRating.POOR,
                    InspectionChecklistItem.ConditionRating.FAILED
                )
            );
            long criticalItems = checklistItemRepository.countByInspectionReportIdAndPriorityLevel(
                reportId, InspectionChecklistItem.PriorityLevel.CRITICAL
            );

            return new ChecklistStats(totalItems, checkedItems, itemsNeedingRepair, criticalItems);

        } catch (Exception e) {
            log.error("Error getting checklist stats for report {}: {}", reportId, e.getMessage(), e);
            return new ChecklistStats(0, 0, 0, 0);
        }
    }

    /**
     * Checklist statistics DTO
     */
    public static class ChecklistStats {
        public final long totalItems;
        public final long checkedItems;
        public final long itemsNeedingRepair;
        public final long criticalItems;
        public final double completionPercentage;

        public ChecklistStats(long totalItems, long checkedItems, long itemsNeedingRepair, long criticalItems) {
            this.totalItems = totalItems;
            this.checkedItems = checkedItems;
            this.itemsNeedingRepair = itemsNeedingRepair;
            this.criticalItems = criticalItems;
            this.completionPercentage = totalItems > 0 ? (checkedItems * 100.0 / totalItems) : 0.0;
        }
    }

    /**
     * Validate that report has complete 66-item checklist
     */
    public boolean validateCompleteChecklist(Long reportId) {
        try {
            long itemCount = checklistItemRepository.countByInspectionReportId(reportId);
            
            if (itemCount != 66) {
                log.warn("Report {} has incomplete checklist: {} items instead of 66", reportId, itemCount);
                
                // Auto-fix by initializing missing items
                if (itemCount == 0) {
                    initializeCompleteChecklist(reportId);
                    return true;
                }
                return false;
            }
            
            return true;

        } catch (Exception e) {
            log.error("Error validating checklist for report {}: {}", reportId, e.getMessage(), e);
            return false;
        }
    }
}
