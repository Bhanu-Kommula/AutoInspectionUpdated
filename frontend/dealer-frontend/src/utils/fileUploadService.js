import api, { API_CONFIG } from "../api";

/**
 * File Upload Service
 * Handles file uploads for inspection reports
 */
class FileUploadService {
  /**
   * Upload files for an inspection report
   * @param {number} reportId - The inspection report ID
   * @param {File[]} files - Array of files to upload
   * @param {string} category - Optional file category
   * @returns {Promise<Array>} - Array of uploaded file data
   */
  static async uploadFiles(reportId, files, category = null) {
    try {
      const formData = new FormData();

      // Add files to form data
      files.forEach((file, index) => {
        formData.append("files", file);
      });

      // Add category if provided
      if (category) {
        formData.append("category", category);
      }

      const response = await api.post(
        `${API_CONFIG.API_GATEWAY_URL}/tech-dashboard/api/v1/dashboard/reports/${reportId}/upload`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          timeout: 60000, // 60 seconds for file uploads
        }
      );

      console.log("Files uploaded successfully:", response.data);
      return response.data.uploadedFiles || [];
    } catch (error) {
      console.error("Error uploading files:", error);
      throw new Error(
        error.response?.data?.message || "Failed to upload files"
      );
    }
  }

  /**
   * Get files for an inspection report
   * @param {number} reportId - The inspection report ID
   * @returns {Promise<Array>} - Array of file data
   */
  static async getFiles(reportId) {
    try {
      const response = await api.get(
        `${API_CONFIG.API_GATEWAY_URL}/tech-dashboard/api/v1/dashboard/reports/${reportId}/files`
      );

      console.log("Files retrieved successfully:", response.data);
      return response.data.files || [];
    } catch (error) {
      console.error("Error getting files:", error);
      throw new Error(error.response?.data?.message || "Failed to get files");
    }
  }

  /**
   * Delete a file
   * @param {number} reportId - The inspection report ID
   * @param {number} fileId - The file ID to delete
   * @returns {Promise<boolean>} - Success status
   */
  static async deleteFile(reportId, fileId) {
    try {
      const response = await api.delete(
        `${API_CONFIG.API_GATEWAY_URL}/tech-dashboard/api/v1/dashboard/reports/${reportId}/files/${fileId}`
      );

      console.log("File deleted successfully:", response.data);
      return true;
    } catch (error) {
      console.error("Error deleting file:", error);
      throw new Error(error.response?.data?.message || "Failed to delete file");
    }
  }

  /**
   * Start inspection for a post
   * @param {number} postId - The post ID
   * @param {number} technicianId - The technician ID
   * @returns {Promise<Object>} - Inspection report data
   */
  static async startInspection(postId, technicianId) {
    try {
      const response = await api.post(
        `${API_CONFIG.API_GATEWAY_URL}/tech-dashboard/api/v1/dashboard/start-inspection/${postId}`,
        { technicianId }
      );

      console.log("Inspection started successfully:", response.data);
      return response.data.report || null;
    } catch (error) {
      console.error("Error starting inspection:", error);
      throw new Error(
        error.response?.data?.message || "Failed to start inspection"
      );
    }
  }

  /**
   * Submit inspection report
   * @param {number} reportId - The inspection report ID
   * @param {Object} data - Report data including final remarks
   * @returns {Promise<Object>} - Submitted report data
   */
  static async submitInspectionReport(reportId, data) {
    try {
      const response = await api.post(
        `${API_CONFIG.API_GATEWAY_URL}/tech-dashboard/api/v1/dashboard/reports/${reportId}/submit`,
        data
      );

      console.log("Inspection report submitted successfully:", response.data);
      return response.data.report || null;
    } catch (error) {
      console.error("Error submitting inspection report:", error);
      throw new Error(
        error.response?.data?.message || "Failed to submit inspection report"
      );
    }
  }

  /**
   * Complete inspection report
   * @param {number} reportId - The inspection report ID
   * @param {Object} data - Report data including final remarks
   * @returns {Promise<Object>} - Completed report data
   */
  static async completeInspectionReport(reportId, data) {
    try {
      const response = await api.post(
        `${API_CONFIG.API_GATEWAY_URL}/tech-dashboard/api/v1/dashboard/reports/${reportId}/complete`,
        data
      );

      console.log("Inspection report completed successfully:", response.data);
      return response.data.report || null;
    } catch (error) {
      console.error("Error completing inspection report:", error);
      throw new Error(
        error.response?.data?.message || "Failed to complete inspection report"
      );
    }
  }
}

export default FileUploadService;
