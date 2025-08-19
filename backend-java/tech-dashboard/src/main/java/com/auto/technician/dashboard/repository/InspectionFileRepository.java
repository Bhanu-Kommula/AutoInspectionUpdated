package com.auto.technician.dashboard.repository;

import com.auto.technician.dashboard.entity.InspectionFile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for InspectionFile entity
 */
@Repository
public interface InspectionFileRepository extends JpaRepository<InspectionFile, Long> {

    /**
     * Find files by inspection report ID
     */
    List<InspectionFile> findByInspectionReportIdOrderByUploadedAtDesc(Long inspectionReportId);

    /**
     * Find files by inspection report ID and category
     */
    List<InspectionFile> findByInspectionReportIdAndCategoryOrderByUploadedAtDesc(
        Long inspectionReportId, InspectionFile.FileCategory category);

    /**
     * Find files by stored filename
     */
    List<InspectionFile> findByStoredFilename(String storedFilename);

    /**
     * Count files by inspection report ID
     */
    long countByInspectionReportId(Long inspectionReportId);

    /**
     * Get total file size for an inspection report
     */
    @Query("SELECT COALESCE(SUM(f.fileSize), 0) FROM InspectionFile f WHERE f.inspectionReport.id = :inspectionReportId")
    Long getTotalFileSizeByInspectionReportId(@Param("inspectionReportId") Long inspectionReportId);

    /**
     * Find valid files only (not virus infected)
     */
    List<InspectionFile> findByInspectionReportIdAndIsValidTrueOrderByUploadedAtDesc(Long inspectionReportId);

    /**
     * Find files by category across all reports
     */
    List<InspectionFile> findByCategoryOrderByUploadedAtDesc(InspectionFile.FileCategory category);

    /**
     * Find files that need virus scanning
     */
    List<InspectionFile> findByIsVirusScannedFalseOrderByUploadedAtAsc();
}
