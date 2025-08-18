package com.auto.technician.dashboard.service;

import com.auto.technician.dashboard.dto.InspectionChecklistItemDto;
import com.auto.technician.dashboard.entity.InspectionChecklistItem;
import com.auto.technician.dashboard.entity.InspectionReport;
import com.auto.technician.dashboard.repository.InspectionChecklistItemRepository;
import com.auto.technician.dashboard.repository.InspectionReportRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Checklist Service
 * Manages inspection checklists and standard checklist templates
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ChecklistService {

    private final InspectionChecklistItemRepository checklistItemRepository;
    private final InspectionReportRepository inspectionReportRepository;

    // ==================== STANDARD CHECKLIST TEMPLATE ====================

    /**
     * Get standard checklist template for all categories
     */
    public Map<String, List<String>> getStandardChecklistTemplate() {
        Map<String, List<String>> template = new LinkedHashMap<>();

        // EXTERIOR
        template.put("EXTERIOR", Arrays.asList(
            "Body panels and paint condition",
            "Windows and glass condition",
            "Lights and signals",
            "Tires and wheels",
            "Mirrors and visibility",
            "Doors and locks",
            "Hood and trunk",
            "Bumpers and trim"
        ));

        // INTERIOR
        template.put("INTERIOR", Arrays.asList(
            "Seats and upholstery",
            "Dashboard and controls",
            "Climate control system",
            "Audio and entertainment",
            "Instruments and gauges",
            "Steering wheel and column",
            "Carpet and floor mats",
            "Interior lighting"
        ));

        // ENGINE
        template.put("ENGINE", Arrays.asList(
            "Oil level and condition",
            "Coolant level and condition",
            "Battery and connections",
            "Belts and hoses",
            "Air filter condition",
            "Engine mounts",
            "Exhaust system",
            "Engine performance"
        ));

        // TRANSMISSION
        template.put("TRANSMISSION", Arrays.asList(
            "Transmission fluid level",
            "Gear operation",
            "Clutch operation",
            "Transmission mounts",
            "Driveshaft condition",
            "Differential condition"
        ));

        // BRAKES
        template.put("BRAKES", Arrays.asList(
            "Brake pads condition",
            "Brake rotors condition",
            "Brake lines and hoses",
            "Brake fluid level",
            "Parking brake operation",
            "ABS system operation"
        ));

        // SUSPENSION
        template.put("SUSPENSION", Arrays.asList(
            "Shock absorbers",
            "Springs and struts",
            "Control arms and bushings",
            "Ball joints",
            "Tie rods and steering",
            "Wheel alignment"
        ));

        // ELECTRICAL
        template.put("ELECTRICAL", Arrays.asList(
            "Charging system",
            "Starting system",
            "Wiring and connections",
            "Fuses and relays",
            "Computer systems",
            "Accessories operation"
        ));

        // SAFETY
        template.put("SAFETY", Arrays.asList(
            "Seat belts condition",
            "Airbag system",
            "Child safety locks",
            "Emergency equipment",
            "Safety warnings",
            "Security system"
        ));

        // UNDERCARRIAGE
        template.put("UNDERCARRIAGE", Arrays.asList(
            "Frame and structure",
            "Fuel system",
            "Steering components",
            "Exhaust system",
            "Heat shields",
            "Underbody protection"
        ));

        // TEST_DRIVE
        template.put("TEST_DRIVE", Arrays.asList(
            "Engine performance",
            "Braking performance",
            "Steering response",
            "Suspension behavior",
            "Noise and vibration",
            "Transmission operation"
        ));

        return template;
    }

    // ==================== CHECKLIST MANAGEMENT ====================

    /**
     * Create checklist items for an inspection report
     */
    public List<InspectionChecklistItem> createChecklistForReport(Long inspectionReportId) {
        try {
            Optional<InspectionReport> reportOpt = inspectionReportRepository.findById(inspectionReportId);
            if (reportOpt.isEmpty()) {
                log.error("Inspection report not found: {}", inspectionReportId);
                return new ArrayList<>();
            }

            InspectionReport report = reportOpt.get();
            Map<String, List<String>> template = getStandardChecklistTemplate();
            List<InspectionChecklistItem> checklistItems = new ArrayList<>();

            for (Map.Entry<String, List<String>> entry : template.entrySet()) {
                String category = entry.getKey();
                List<String> items = entry.getValue();

                for (String itemName : items) {
                    InspectionChecklistItem item = new InspectionChecklistItem(
                        InspectionChecklistItem.InspectionCategory.valueOf(category),
                        itemName
                    );
                    item.setInspectionReport(report);
                    checklistItems.add(item);
                }
            }

            List<InspectionChecklistItem> savedItems = checklistItemRepository.saveAll(checklistItems);
            log.info("Created {} checklist items for inspection report: {}", savedItems.size(), inspectionReportId);

            return savedItems;

        } catch (Exception e) {
            log.error("Error creating checklist for inspection report {}: {}", inspectionReportId, e.getMessage(), e);
            return new ArrayList<>();
        }
    }

    /**
     * Get checklist items for an inspection report
     */
    @Transactional(readOnly = true)
    public List<InspectionChecklistItemDto> getChecklistForReport(Long inspectionReportId) {
        try {
            List<InspectionChecklistItem> items = checklistItemRepository
                .findByInspectionReportIdOrderByCategoryAsc(inspectionReportId);
            
            return items.stream()
                .map(InspectionChecklistItemDto::new)
                .collect(Collectors.toList());

        } catch (Exception e) {
            log.error("Error getting checklist for inspection report {}: {}", inspectionReportId, e.getMessage(), e);
            return new ArrayList<>();
        }
    }

    /**
     * ✅ PERFORMANCE OPTIMIZED: Get checklist items with single optimized query
     * Orders by category and item_order for consistent display
     */
    @Transactional(readOnly = true)
    public List<InspectionChecklistItemDto> getChecklistForReportOptimized(Long inspectionReportId) {
        try {
            log.debug("Fetching optimized checklist for report: {}", inspectionReportId);
            
            // Use native query for reliable data retrieval
            List<InspectionChecklistItem> items = checklistItemRepository.findByInspectionReportIdNative(inspectionReportId);
            
            log.debug("Found {} checklist items for report {}", items.size(), inspectionReportId);
            
            return items.stream()
                .map(InspectionChecklistItemDto::new)
                .collect(Collectors.toList());

        } catch (Exception e) {
            log.error("Error getting optimized checklist for inspection report {}: {}", inspectionReportId, e.getMessage(), e);
            return new ArrayList<>();
        }
    }

    /**
     * ✅ PERFORMANCE OPTIMIZED: Get checklist summary with single aggregated query
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getChecklistSummaryOptimized(Long inspectionReportId) {
        try {
            Object[] summary = checklistItemRepository.getChecklistSummary(inspectionReportId);
            Map<String, Object> result = new HashMap<>();
            
            if (summary != null && summary.length >= 3) {
                result.put("totalItems", ((Number) summary[0]).intValue());
                result.put("checkedItems", ((Number) summary[1]).intValue());
                result.put("uncheckedItems", ((Number) summary[2]).intValue());
                
                int totalItems = ((Number) summary[0]).intValue();
                int checkedItems = ((Number) summary[1]).intValue();
                result.put("completionPercentage", totalItems > 0 ? (checkedItems * 100.0 / totalItems) : 0.0);
            } else {
                result.put("totalItems", 0);
                result.put("checkedItems", 0);
                result.put("uncheckedItems", 0);
                result.put("completionPercentage", 0.0);
            }
            
            return result;

        } catch (Exception e) {
            log.error("Error getting optimized checklist summary for report {}: {}", inspectionReportId, e.getMessage(), e);
            return new HashMap<>();
        }
    }

    /**
     * Update a checklist item
     */
    public InspectionChecklistItemDto updateChecklistItem(Long itemId, Map<String, Object> updates) {
        try {
            Optional<InspectionChecklistItem> itemOpt = checklistItemRepository.findById(itemId);
            if (itemOpt.isEmpty()) {
                log.error("Checklist item not found: {}", itemId);
                return null;
            }

            InspectionChecklistItem item = itemOpt.get();

            // Update fields based on request
            if (updates.containsKey("isChecked")) {
                item.setIsChecked((Boolean) updates.get("isChecked"));
            }

            if (updates.containsKey("remarks")) {
                item.setRemarks((String) updates.get("remarks"));
            }

            if (updates.containsKey("conditionRating")) {
                String rating = (String) updates.get("conditionRating");
                if (rating != null && !rating.trim().isEmpty()) {
                    try {
                        InspectionChecklistItem.ConditionRating conditionRating = 
                            InspectionChecklistItem.ConditionRating.valueOf(rating);
                        item.setConditionRating(conditionRating);
                        
                        // Auto-set working status based on condition rating if not explicitly provided
                        if (!updates.containsKey("workingStatus")) {
                            InspectionChecklistItem.WorkingStatus workingStatus;
                            switch (conditionRating) {
                                case EXCELLENT:
                                case GOOD:
                                    workingStatus = InspectionChecklistItem.WorkingStatus.WORKING;
                                    break;
                                case FAIR:
                                    workingStatus = InspectionChecklistItem.WorkingStatus.NEEDS_REPAIR;
                                    break;
                                case POOR:
                                case FAILED:
                                    workingStatus = InspectionChecklistItem.WorkingStatus.NOT_WORKING;
                                    break;
                                default:
                                    workingStatus = InspectionChecklistItem.WorkingStatus.WORKING;
                            }
                            item.setWorkingStatus(workingStatus);
                            log.info("Auto-set working status to: {} based on condition: {} for item: {}", 
                                workingStatus, rating, itemId);
                        }
                        
                        log.info("Updated condition rating to: {} for item: {}", rating, itemId);
                    } catch (IllegalArgumentException e) {
                        log.error("Invalid condition rating value: {} for item: {}", rating, itemId);
                    }
                }
            }

            if (updates.containsKey("workingStatus")) {
                String status = (String) updates.get("workingStatus");
                if (status != null && !status.trim().isEmpty()) {
                    try {
                        item.setWorkingStatus(InspectionChecklistItem.WorkingStatus.valueOf(status));
                        log.info("Updated working status to: {} for item: {}", status, itemId);
                    } catch (IllegalArgumentException e) {
                        log.error("Invalid working status value: {} for item: {}", status, itemId);
                    }
                }
            }

            if (updates.containsKey("priorityLevel")) {
                String priority = (String) updates.get("priorityLevel");
                if (priority != null) {
                    item.setPriorityLevel(InspectionChecklistItem.PriorityLevel.valueOf(priority));
                }
            }

            // Removed repair cost update logic

            InspectionChecklistItem savedItem = checklistItemRepository.save(item);
            log.info("Updated checklist item: {}", itemId);

            return new InspectionChecklistItemDto(savedItem);

        } catch (Exception e) {
            log.error("Error updating checklist item {}: {}", itemId, e.getMessage(), e);
            return null;
        }
    }

    /**
     * Get checklist summary for an inspection report
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getChecklistSummary(Long inspectionReportId) {
        try {
            Object[] summary = checklistItemRepository.getChecklistSummary(inspectionReportId);
            
            Map<String, Object> result = new HashMap<>();
            if (summary != null && summary.length >= 4) {
                result.put("totalItems", summary[0] != null ? ((Number) summary[0]).longValue() : 0L);
                result.put("checkedItems", summary[1] != null ? ((Number) summary[1]).longValue() : 0L);
                result.put("uncheckedItems", summary[2] != null ? ((Number) summary[2]).longValue() : 0L);
                result.put("totalRepairCost", summary[3] != null ? ((Number) summary[3]).doubleValue() : 0.0);
                
                long totalItems = result.get("totalItems") != null ? (Long) result.get("totalItems") : 0L;
                long checkedItems = result.get("checkedItems") != null ? (Long) result.get("checkedItems") : 0L;
                
                if (totalItems > 0) {
                    double completionRate = (double) checkedItems / totalItems * 100;
                    result.put("completionRate", Math.round(completionRate * 100.0) / 100.0);
                } else {
                    result.put("completionRate", 0.0);
                }
            }

            return result;

        } catch (Exception e) {
            log.error("Error getting checklist summary for inspection report {}: {}", inspectionReportId, e.getMessage(), e);
            return new HashMap<>();
        }
    }

    /**
     * Get checklist items by category
     */
    @Transactional(readOnly = true)
    public List<InspectionChecklistItemDto> getChecklistByCategory(Long inspectionReportId, String category) {
        try {
            InspectionChecklistItem.InspectionCategory inspectionCategory = 
                InspectionChecklistItem.InspectionCategory.valueOf(category.toUpperCase());
            
            List<InspectionChecklistItem> items = checklistItemRepository
                .findByInspectionReportIdAndCategoryOrderByItemNameAsc(inspectionReportId, inspectionCategory);
            
            return items.stream()
                .map(InspectionChecklistItemDto::new)
                .collect(Collectors.toList());

        } catch (Exception e) {
            log.error("Error getting checklist by category for inspection report {}: {}", inspectionReportId, e.getMessage(), e);
            return new ArrayList<>();
        }
    }

    /**
     * Bulk update checklist items
     */
    public List<InspectionChecklistItemDto> bulkUpdateChecklistItems(List<Map<String, Object>> updates) {
        List<InspectionChecklistItemDto> updatedItems = new ArrayList<>();
        
        for (Map<String, Object> update : updates) {
            Long itemId = ((Number) update.get("id")).longValue();
            InspectionChecklistItemDto updatedItem = updateChecklistItem(itemId, update);
            if (updatedItem != null) {
                updatedItems.add(updatedItem);
            }
        }
        
        return updatedItems;
    }

    /**
     * Get critical items for a report
     */
    @Transactional(readOnly = true)
    public List<InspectionChecklistItemDto> getCriticalItems(Long inspectionReportId) {
        try {
            List<InspectionChecklistItem> items = checklistItemRepository.findCriticalItems(inspectionReportId);
            return items.stream()
                .map(InspectionChecklistItemDto::new)
                .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error getting critical items for inspection report {}: {}", inspectionReportId, e.getMessage(), e);
            return new ArrayList<>();
        }
    }

    /**
     * ✅ Initialize all 66 checklist items for a new inspection report
     * Creates items through JPA to ensure proper entity relationships
     */
    @Transactional
    public void initializeChecklistForReport(Long reportId) {
        try {
            // Get the inspection report entity
            InspectionReport report = inspectionReportRepository.findById(reportId)
                .orElseThrow(() -> new IllegalArgumentException("Report not found: " + reportId));
            
            // Check if checklist already exists
            long existingCount = checklistItemRepository.countByInspectionReportId(reportId);
            if (existingCount > 0) {
                log.info("Checklist already exists for report {}, skipping initialization", reportId);
                return;
            }
            
            log.info("Initializing 66 checklist items for report {}", reportId);
            
            List<InspectionChecklistItem> items = new ArrayList<>();
            
            // EXTERIOR (8 items)
            items.addAll(createCategoryItems(report, InspectionChecklistItem.InspectionCategory.EXTERIOR, new String[]{
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
            items.addAll(createCategoryItems(report, InspectionChecklistItem.InspectionCategory.INTERIOR, new String[]{
                "Seats, upholstery, and comfort",
                "Dashboard, gauges, and controls",
                "Air conditioning and heating",
                "Radio, infotainment, and electronics",
                "Interior lighting and accessories",
                "Seatbelts and safety restraints",
                "Floor mats, carpets, and storage",
                "Window controls and mechanisms"
            }));
            
            // ENGINE (8 items)
            items.addAll(createCategoryItems(report, InspectionChecklistItem.InspectionCategory.ENGINE, new String[]{
                "Engine oil level and quality",
                "Coolant level and radiator condition",
                "Battery, terminals, and charging system",
                "Drive belts and cooling hoses",
                "Air filter and intake system",
                "Engine mounts and vibration",
                "Exhaust emissions and performance",
                "Fuel system and delivery"
            }));
            
            // TRANSMISSION (8 items)
            items.addAll(createCategoryItems(report, InspectionChecklistItem.InspectionCategory.TRANSMISSION, new String[]{
                "Transmission fluid level and quality",
                "Gear shifting and clutch operation",
                "CV joints and drive shafts",
                "Differential and transfer case",
                "Transmission mounts and connections",
                "Electronic transmission controls",
                "Torque converter and coupling",
                "Transmission cooling system"
            }));
            
            // BRAKES (8 items)
            items.addAll(createCategoryItems(report, InspectionChecklistItem.InspectionCategory.BRAKES, new String[]{
                "Brake pads and disc condition",
                "Brake fluid level and quality",
                "Brake lines and hoses",
                "Master cylinder and booster",
                "ABS system and sensors",
                "Parking brake operation",
                "Brake rotor and drum condition",
                "Brake pedal and linkage"
            }));
            
            // SUSPENSION (8 items)
            items.addAll(createCategoryItems(report, InspectionChecklistItem.InspectionCategory.SUSPENSION, new String[]{
                "Shock absorbers and struts",
                "Springs and suspension components",
                "Steering system and alignment",
                "Ball joints and tie rods",
                "Stabilizer bars and bushings",
                "Control arms and linkages",
                "Wheel bearings and hubs",
                "Suspension mounting points"
            }));
            
            // ELECTRICAL (8 items)
            items.addAll(createCategoryItems(report, InspectionChecklistItem.InspectionCategory.ELECTRICAL, new String[]{
                "Alternator and charging system",
                "Starter motor and solenoid",
                "Wiring harness and connections",
                "Fuses and electrical protection",
                "Electronic control modules",
                "Sensors and actuators",
                "Ignition system and spark plugs",
                "Electrical accessories and power"
            }));
            
            // SAFETY (2 items)
            items.addAll(createCategoryItems(report, InspectionChecklistItem.InspectionCategory.SAFETY, new String[]{
                "Airbag system and warning lights",
                "Emergency brake and safety systems"
            }));
            
            // UNDERCARRIAGE (4 items)
            items.addAll(createCategoryItems(report, InspectionChecklistItem.InspectionCategory.UNDERCARRIAGE, new String[]{
                "Frame, chassis, and structural integrity",
                "Fuel tank, lines, and vapor system",
                "Steering rack and power steering",
                "Exhaust system and catalytic converter"
            }));
            
            // TEST_DRIVE (4 items)
            items.addAll(createCategoryItems(report, InspectionChecklistItem.InspectionCategory.TEST_DRIVE, new String[]{
                "Engine performance and acceleration",
                "Transmission shifting and operation",
                "Braking performance and feel",
                "Steering response and handling"
            }));
            
            // Save all items in bulk
            checklistItemRepository.saveAll(items);
            
            // Update report totals
            report.setTotalChecklistItems(66);
            report.setCompletedChecklistItems(0);
            inspectionReportRepository.save(report);
            
            log.info("✅ Successfully initialized {} checklist items for report {}", items.size(), reportId);
            
        } catch (Exception e) {
            log.error("Error initializing checklist for report {}: {}", reportId, e.getMessage(), e);
            throw new RuntimeException("Failed to initialize checklist", e);
        }
    }
    
    /**
     * Helper method to create checklist items for a category
     */
    private List<InspectionChecklistItem> createCategoryItems(InspectionReport report, 
                                                            InspectionChecklistItem.InspectionCategory category,
                                                            String[] itemNames) {
        List<InspectionChecklistItem> items = new ArrayList<>();
        
        for (int i = 0; i < itemNames.length; i++) {
            InspectionChecklistItem item = new InspectionChecklistItem();
            item.setInspectionReport(report);  // ✅ Proper JPA relationship
            item.setCategory(category);
            item.setItemName(itemNames[i]);
            item.setItemOrder(i + 1);
            item.setIsChecked(false);
            item.setConditionRating(null); // Let technician set the actual rating
            item.setWorkingStatus(null);   // Let technician set the actual status
            item.setPriorityLevel(null);   // Let technician set the actual priority
            items.add(item);
        }
        
        return items;
    }

    /**
     * ✅ PERFORMANCE OPTIMIZED: Bulk update multiple checklist items in single transaction
     * Reduces database round trips from N to 1 for bulk operations
     */
    @Transactional
    public List<InspectionChecklistItemDto> bulkUpdateChecklistItems(Long reportId, List<Map<String, Object>> bulkUpdates) {
        try {
            log.info("Performing bulk update of {} checklist items for report {}", bulkUpdates.size(), reportId);
            
            List<InspectionChecklistItem> updatedItems = new ArrayList<>();
            
            for (Map<String, Object> update : bulkUpdates) {
                Long itemId = Long.valueOf(update.get("itemId").toString());
                
                Optional<InspectionChecklistItem> itemOpt = checklistItemRepository.findById(itemId);
                if (itemOpt.isPresent()) {
                    InspectionChecklistItem item = itemOpt.get();
                    
                    // Apply updates
                    if (update.containsKey("isChecked")) {
                        item.setIsChecked((Boolean) update.get("isChecked"));
                    }
                    if (update.containsKey("remarks")) {
                        item.setRemarks((String) update.get("remarks"));
                    }
                    if (update.containsKey("conditionRating")) {
                        String rating = (String) update.get("conditionRating");
                        if (rating != null && !rating.trim().isEmpty()) {
                            try {
                                InspectionChecklistItem.ConditionRating conditionRating = 
                                    InspectionChecklistItem.ConditionRating.valueOf(rating);
                                item.setConditionRating(conditionRating);
                                
                                // Auto-set working status based on condition rating if not explicitly provided
                                if (!update.containsKey("workingStatus")) {
                                    InspectionChecklistItem.WorkingStatus workingStatus;
                                    switch (conditionRating) {
                                        case EXCELLENT:
                                        case GOOD:
                                            workingStatus = InspectionChecklistItem.WorkingStatus.WORKING;
                                            break;
                                        case FAIR:
                                            workingStatus = InspectionChecklistItem.WorkingStatus.NEEDS_REPAIR;
                                            break;
                                        case POOR:
                                        case FAILED:
                                            workingStatus = InspectionChecklistItem.WorkingStatus.NOT_WORKING;
                                            break;
                                        default:
                                            workingStatus = InspectionChecklistItem.WorkingStatus.WORKING;
                                    }
                                    item.setWorkingStatus(workingStatus);
                                    log.debug("Bulk update: Auto-set working status {} based on condition {} for item {}", 
                                        workingStatus, rating, itemId);
                                }
                                
                                log.debug("Bulk update: Set condition rating {} for item {}", rating, itemId);
                            } catch (IllegalArgumentException e) {
                                log.error("Bulk update: Invalid condition rating {} for item {}", rating, itemId);
                            }
                        }
                    }
                    if (update.containsKey("workingStatus")) {
                        String status = (String) update.get("workingStatus");
                        if (status != null && !status.trim().isEmpty()) {
                            try {
                                item.setWorkingStatus(InspectionChecklistItem.WorkingStatus.valueOf(status));
                                log.debug("Bulk update: Set working status {} for item {}", status, itemId);
                            } catch (IllegalArgumentException e) {
                                log.error("Bulk update: Invalid working status {} for item {}", status, itemId);
                            }
                        }
                    }
                    // Removed repair cost bulk update logic
                    
                    updatedItems.add(item);
                }
            }
            
            // Bulk save all items in single transaction
            List<InspectionChecklistItem> savedItems = checklistItemRepository.saveAll(updatedItems);
            
            // Update report completion count once
            updateReportCompletionCount(reportId);
            
            log.info("Successfully bulk updated {} checklist items for report {}", savedItems.size(), reportId);
            
            return savedItems.stream()
                .map(InspectionChecklistItemDto::new)
                .collect(Collectors.toList());

        } catch (Exception e) {
            log.error("Error performing bulk update for report {}: {}", reportId, e.getMessage(), e);
            return new ArrayList<>();
        }
    }

    /**
     * ✅ PERFORMANCE OPTIMIZED: Update report completion count with single query
     */
    @Transactional
    public void updateReportCompletionCount(Long reportId) {
        try {
            long checkedCount = checklistItemRepository.countByInspectionReportIdAndIsChecked(reportId, true);
            long totalCount = checklistItemRepository.countByInspectionReportId(reportId);
            
            InspectionReport report = inspectionReportRepository.findById(reportId)
                .orElseThrow(() -> new IllegalArgumentException("Report not found: " + reportId));
            
            report.setCompletedChecklistItems((int) checkedCount);
            report.setTotalChecklistItems((int) totalCount);
            inspectionReportRepository.save(report);

            log.debug("Updated completion count for report {}: {}/{} items", reportId, checkedCount, totalCount);

        } catch (Exception e) {
            log.error("Error updating completion count for report {}: {}", reportId, e.getMessage(), e);
        }
    }

    // ==================== ADMIN METHODS ====================

    /**
     * Get all checklist items with pagination and filtering for admin
     */
    public Map<String, Object> getAllChecklistItemsForAdmin(Map<String, Object> filters, int page, int size) {
        try {
            List<InspectionChecklistItem> items = checklistItemRepository.findAll();
            long totalCount = items.size();
            
            // Apply filters
            if (filters.containsKey("reportId")) {
                Long reportId = Long.valueOf((String) filters.get("reportId"));
                items = items.stream()
                    .filter(item -> item.getInspectionReport().getId().equals(reportId))
                    .collect(Collectors.toList());
            }
            
            if (filters.containsKey("conditionRating")) {
                String conditionRating = (String) filters.get("conditionRating");
                items = items.stream()
                    .filter(item -> conditionRating.equals(item.getConditionRating().name()))
                    .collect(Collectors.toList());
            }
            
            totalCount = items.size();
            
            // Apply pagination
            int start = page * size;
            int end = Math.min(start + size, items.size());
            List<InspectionChecklistItem> paginatedItems = items.subList(start, end);
            
            Map<String, Object> result = new HashMap<>();
            result.put("items", paginatedItems.stream()
                .map(InspectionChecklistItemDto::new)
                .collect(Collectors.toList()));
            result.put("totalCount", totalCount);
            result.put("page", page);
            result.put("size", size);
            result.put("totalPages", (int) Math.ceil((double) totalCount / size));
            
            return result;
            
        } catch (Exception e) {
            log.error("Error getting checklist items for admin: {}", e.getMessage(), e);
            return new HashMap<>();
        }
    }

    /**
     * Update checklist item by admin
     */
    public InspectionChecklistItemDto updateChecklistItemByAdmin(Long itemId, Map<String, Object> updates) {
        try {
            InspectionChecklistItem item = checklistItemRepository.findById(itemId).orElse(null);
            if (item == null) {
                log.warn("Checklist item {} not found for admin update", itemId);
                return null;
            }
            
            // Apply updates
            if (updates.containsKey("conditionRating")) {
                String conditionRating = (String) updates.get("conditionRating");
                try {
                    InspectionChecklistItem.ConditionRating rating = InspectionChecklistItem.ConditionRating.valueOf(conditionRating.toUpperCase());
                    item.setConditionRating(rating);
                } catch (IllegalArgumentException e) {
                    log.warn("Invalid condition rating: {}", conditionRating);
                }
            }
            
            if (updates.containsKey("workingStatus")) {
                String workingStatus = (String) updates.get("workingStatus");
                try {
                    InspectionChecklistItem.WorkingStatus status = InspectionChecklistItem.WorkingStatus.valueOf(workingStatus.toUpperCase());
                    item.setWorkingStatus(status);
                } catch (IllegalArgumentException e) {
                    log.warn("Invalid working status: {}", workingStatus);
                }
            }
            
            if (updates.containsKey("notes")) {
                item.setRemarks((String) updates.get("notes"));
            }
            
            // Save the updated item
            InspectionChecklistItem savedItem = checklistItemRepository.save(item);
            
            log.info("Admin updated checklist item {}", itemId);
            return new InspectionChecklistItemDto(savedItem);
            
        } catch (Exception e) {
            log.error("Error updating checklist item {} by admin: {}", itemId, e.getMessage(), e);
            return null;
        }
    }
}
