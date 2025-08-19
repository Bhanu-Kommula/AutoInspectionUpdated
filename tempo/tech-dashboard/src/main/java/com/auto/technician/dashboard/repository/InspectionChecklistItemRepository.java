package com.auto.technician.dashboard.repository;

import com.auto.technician.dashboard.entity.InspectionChecklistItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for InspectionChecklistItem entity
 */
@Repository
public interface InspectionChecklistItemRepository extends JpaRepository<InspectionChecklistItem, Long> {

    /**
     * Find checklist items by inspection report ID ordered by category
     */
    List<InspectionChecklistItem> findByInspectionReportIdOrderByCategoryAsc(Long inspectionReportId);

    /**
     * Find checklist items by inspection report ID and category
     */
    List<InspectionChecklistItem> findByInspectionReportIdAndCategoryOrderByItemNameAsc(
        Long inspectionReportId, InspectionChecklistItem.InspectionCategory category);

    /**
     * Get checklist summary for an inspection report
     */
    @Query(value = """
        SELECT 
            COUNT(*) as totalItems,
            COUNT(CASE WHEN is_checked = true THEN 1 END) as checkedItems,
            COUNT(CASE WHEN is_checked = false THEN 1 END) as uncheckedItems
        FROM inspection_checklist_items 
        WHERE inspection_report_id = :inspectionReportId
        """, nativeQuery = true)
    Object[] getChecklistSummary(@Param("inspectionReportId") Long inspectionReportId);

    /**
     * Count checklist items by inspection report and status
     */
    long countByInspectionReportIdAndIsChecked(Long inspectionReportId, Boolean isChecked);

    // Removed repair cost query methods

    /**
     * Find critical priority items for a report
     */
    @Query("SELECT ici FROM InspectionChecklistItem ici WHERE ici.inspectionReport.id = :inspectionReportId AND ici.priorityLevel = 'CRITICAL'")
    List<InspectionChecklistItem> findCriticalItems(@Param("inspectionReportId") Long inspectionReportId);

    /**
     * Count checklist items by inspection report ID
     */
    long countByInspectionReportId(Long inspectionReportId);

    /**
     * Count items by condition rating
     */
    long countByInspectionReportIdAndConditionRatingIn(Long inspectionReportId, 
        List<InspectionChecklistItem.ConditionRating> conditionRatings);

    /**
     * Count items by priority level
     */
    long countByInspectionReportIdAndPriorityLevel(Long inspectionReportId, 
        InspectionChecklistItem.PriorityLevel priorityLevel);

    /**
     * Find items by category and report
     */
    List<InspectionChecklistItem> findByInspectionReportIdAndCategoryOrderByItemOrder(
        Long inspectionReportId, InspectionChecklistItem.InspectionCategory category);

    /**
     * Find all items for a report ordered by category and item order
     */
    @Query("SELECT ici FROM InspectionChecklistItem ici WHERE ici.inspectionReport.id = :reportId ORDER BY ici.category, ici.itemOrder")
    List<InspectionChecklistItem> findByInspectionReportIdOrderByCategoryAndItemOrder(@Param("reportId") Long reportId);
    
    /**
     * Find all items by inspection_report_id (direct column mapping)
     */
    @Query(value = "SELECT * FROM inspection_checklist_items WHERE inspection_report_id = :reportId ORDER BY category, item_order", nativeQuery = true)
    List<InspectionChecklistItem> findByInspectionReportIdNative(@Param("reportId") Long reportId);
}
