import api, { API_CONFIG } from "../api";

/**
 * Tech Dashboard Admin Service
 * Handles all admin operations for inspection reports, checklists, files, and technician performance
 */
class TechDashboardAdminService {
  constructor() {
    this.baseURL = `${API_CONFIG.TECH_DASHBOARD_BASE_URL}/admin/dashboard`;
  }

  // ==================== DASHBOARD OVERVIEW & ANALYTICS ====================

  /**
   * Get comprehensive admin dashboard overview
   */
  async getDashboardOverview() {
    try {
      const response = await api.get(`${this.baseURL}/overview`);
      return response.data;
    } catch (error) {
      console.error("Error fetching dashboard overview:", error);
      throw error;
    }
  }

  /**
   * Get system statistics for admin
   */
  async getSystemStatistics() {
    try {
      const response = await api.get(`${this.baseURL}/statistics`);
      return response.data;
    } catch (error) {
      console.error("Error fetching system statistics:", error);
      throw error;
    }
  }

  // ==================== INSPECTION REPORTS MANAGEMENT ====================

  /**
   * Get all inspection reports with pagination and filtering
   */
  async getInspectionReports(params = {}) {
    try {
      const {
        page = 0,
        size = 20,
        status,
        technicianId,
        dateFrom,
        dateTo,
      } = params;

      const queryParams = new URLSearchParams();
      queryParams.append("page", page);
      queryParams.append("size", size);
      if (status) queryParams.append("status", status);
      if (technicianId) queryParams.append("technicianId", technicianId);
      if (dateFrom) queryParams.append("dateFrom", dateFrom);
      if (dateTo) queryParams.append("dateTo", dateTo);

      const response = await api.get(`${this.baseURL}/reports?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching inspection reports:", error);
      throw error;
    }
  }

  /**
   * Get specific inspection report by ID
   */
  async getInspectionReport(reportId) {
    try {
      const response = await api.get(`${this.baseURL}/reports/${reportId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching inspection report:", error);
      throw error;
    }
  }

  /**
   * Get all checklist items with pagination and filtering
   */
  async getChecklistItems(params = {}) {
    try {
      const { page = 0, size = 50, reportId, conditionRating } = params;

      const queryParams = new URLSearchParams();
      queryParams.append("page", page);
      queryParams.append("size", size);
      if (reportId) queryParams.append("reportId", reportId);
      if (conditionRating)
        queryParams.append("conditionRating", conditionRating);

      const response = await api.get(
        `${this.baseURL}/checklist?${queryParams}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching checklist items:", error);
      throw error;
    }
  }

  /**
   * Update inspection report status
   */
  async updateReportStatus(reportId, statusData) {
    try {
      const response = await api.put(
        `${this.baseURL}/reports/${reportId}/status`,
        statusData
      );
      return response.data;
    } catch (error) {
      console.error("Error updating report status:", error);
      throw error;
    }
  }

  /**
   * Delete inspection report (soft delete)
   */
  async deleteInspectionReport(reportId, deleteData) {
    try {
      const response = await api.delete(`${this.baseURL}/reports/${reportId}`, {
        data: deleteData,
      });
      return response.data;
    } catch (error) {
      console.error("Error deleting inspection report:", error);
      throw error;
    }
  }

  /**
   * Restore deleted inspection report
   */
  async restoreInspectionReport(reportId, restoreData) {
    try {
      const response = await api.put(
        `${this.baseURL}/reports/${reportId}/restore`,
        restoreData
      );
      return response.data;
    } catch (error) {
      console.error("Error restoring inspection report:", error);
      throw error;
    }
  }

  // ==================== CHECKLIST MANAGEMENT ====================

  /**
   * Get all checklist items with pagination and filtering
   */
  async getChecklistItems(params = {}) {
    try {
      const { page = 0, size = 50, reportId, conditionRating } = params;

      const queryParams = new URLSearchParams();
      queryParams.append("page", page);
      queryParams.append("size", size);
      if (reportId) queryParams.append("reportId", reportId);
      if (conditionRating)
        queryParams.append("conditionRating", conditionRating);

      const response = await api.get(
        `${this.baseURL}/checklist?${queryParams}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching checklist items:", error);
      throw error;
    }
  }

  /**
   * Update checklist item
   */
  async updateChecklistItem(itemId, updateData) {
    try {
      const response = await api.put(
        `${this.baseURL}/checklist/${itemId}`,
        updateData
      );
      return response.data;
    } catch (error) {
      console.error("Error updating checklist item:", error);
      throw error;
    }
  }

  // ==================== FILE MANAGEMENT ====================

  /**
   * Get all files with pagination and filtering
   */
  async getFiles(params = {}) {
    try {
      const { page = 0, size = 50, reportId, category } = params;

      const queryParams = new URLSearchParams();
      queryParams.append("page", page);
      queryParams.append("size", size);
      if (reportId) queryParams.append("reportId", reportId);
      if (category) queryParams.append("category", category);

      const response = await api.get(`${this.baseURL}/files?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching files:", error);
      throw error;
    }
  }

  /**
   * Delete file
   */
  async deleteFile(fileId, deleteData) {
    try {
      const response = await api.delete(`${this.baseURL}/files/${fileId}`, {
        data: deleteData,
      });
      return response.data;
    } catch (error) {
      console.error("Error deleting file:", error);
      throw error;
    }
  }

  // ==================== TECHNICIAN PERFORMANCE MONITORING ====================

  /**
   * Get technician performance metrics
   */
  async getTechnicianPerformance(params = {}) {
    try {
      const { technicianId, dateFrom, dateTo } = params;

      const queryParams = new URLSearchParams();
      if (technicianId) queryParams.append("technicianId", technicianId);
      if (dateFrom) queryParams.append("dateFrom", dateFrom);
      if (dateTo) queryParams.append("dateTo", dateTo);

      const response = await api.get(
        `${this.baseURL}/technicians/performance?${queryParams}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching technician performance:", error);
      throw error;
    }
  }

  /**
   * Get top performing technicians
   */
  async getTopPerformers(params = {}) {
    try {
      const { limit = 10, metric } = params;

      const queryParams = new URLSearchParams();
      queryParams.append("limit", limit);
      if (metric) queryParams.append("metric", metric);

      const response = await api.get(
        `${this.baseURL}/technicians/top-performers?${queryParams}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching top performers:", error);
      throw error;
    }
  }

  // ==================== SYSTEM HEALTH & MAINTENANCE ====================

  /**
   * Get system health status
   */
  async getSystemHealth() {
    try {
      const response = await api.get(`${this.baseURL}/health`);
      return response.data;
    } catch (error) {
      console.error("Error fetching system health:", error);
      throw error;
    }
  }

  /**
   * Perform data cleanup
   */
  async performDataCleanup(cleanupData) {
    try {
      const response = await api.post(
        `${this.baseURL}/maintenance/cleanup`,
        cleanupData
      );
      return response.data;
    } catch (error) {
      console.error("Error performing data cleanup:", error);
      throw error;
    }
  }

  // ==================== DATA EXPORT ====================

  /**
   * Export inspection data
   */
  async exportInspectionData(params = {}) {
    try {
      const { format = "json", dateFrom, dateTo } = params;

      const queryParams = new URLSearchParams();
      queryParams.append("format", format);
      if (dateFrom) queryParams.append("dateFrom", dateFrom);
      if (dateTo) queryParams.append("dateTo", dateTo);

      const response = await api.get(
        `${this.baseURL}/export/inspections?${queryParams}`
      );
      return response.data;
    } catch (error) {
      console.error("Error exporting inspection data:", error);
      throw error;
    }
  }

  /**
   * Export technician performance data
   */
  async exportTechnicianPerformanceData(params = {}) {
    try {
      const { format = "json", dateFrom, dateTo } = params;

      const queryParams = new URLSearchParams();
      queryParams.append("format", format);
      if (dateFrom) queryParams.append("dateFrom", dateFrom);
      if (dateTo) queryParams.append("dateTo", dateTo);

      const response = await api.get(
        `${this.baseURL}/export/technician-performance?${queryParams}`
      );
      return response.data;
    } catch (error) {
      console.error("Error exporting technician performance data:", error);
      throw error;
    }
  }

  // ==================== BULK OPERATIONS ====================

  /**
   * Bulk update inspection report statuses
   */
  async bulkUpdateReportStatuses(bulkData) {
    try {
      const response = await api.put(
        `${this.baseURL}/reports/bulk/status`,
        bulkData
      );
      return response.data;
    } catch (error) {
      console.error("Error bulk updating report statuses:", error);
      throw error;
    }
  }

  /**
   * Bulk delete inspection reports
   */
  async bulkDeleteReports(bulkData) {
    try {
      const response = await api.delete(`${this.baseURL}/reports/bulk`, {
        data: bulkData,
      });
      return response.data;
    } catch (error) {
      console.error("Error bulk deleting reports:", error);
      throw error;
    }
  }
}

export default new TechDashboardAdminService();
