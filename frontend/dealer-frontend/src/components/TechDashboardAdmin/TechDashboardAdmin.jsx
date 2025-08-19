import React, { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Table,
  Button,
  Badge,
  Form,
  Modal,
  Alert,
  Spinner,
  Pagination,
  Tabs,
  Tab,
  ProgressBar,
  Nav,
} from "react-bootstrap";
import {
  HiOutlineDocumentText,
  HiOutlineCheckCircle,
  HiOutlineEye,
  HiOutlineTrash,
  HiOutlineRefresh,
  HiOutlineCog,
  HiOutlineFilter,
  HiOutlineUser,
  HiOutlinePencil,
} from "react-icons/hi";
import {
  FaFileAlt,
  FaCheckCircle,
  FaTimes,
  FaDownload,
  FaEye,
  FaComments,
  FaClipboardCheck,
  FaImage,
  FaVideo,
  FaMicrophone,
} from "react-icons/fa";
import DatePicker from "react-datepicker";
import Select from "react-select";
import techDashboardService from "../../services/techDashboardService";
import { toast } from "react-toastify";
import "react-datepicker/dist/react-datepicker.css";
import "./TechDashboardAdmin.css";

const TechDashboardAdmin = () => {
  // State management
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Dashboard overview state
  const [dashboardOverview, setDashboardOverview] = useState({});
  const [systemStats, setSystemStats] = useState({});

  // Inspection reports state
  const [inspectionReports, setInspectionReports] = useState([]);
  const [reportsPagination, setReportsPagination] = useState({
    currentPage: 0,
    totalPages: 0,
    totalElements: 0,
    size: 20,
  });
  const [reportsFilters, setReportsFilters] = useState({
    status: "",
    technicianId: "",
    dateFrom: null,
    dateTo: null,
  });

  // Report viewing state
  const [selectedReport, setSelectedReport] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [viewingReport, setViewingReport] = useState(false);
  const [reportActiveTab, setReportActiveTab] = useState("summary");

  // Checklist state
  const [checklistItems, setChecklistItems] = useState([]);
  const [checklistPagination, setChecklistPagination] = useState({
    currentPage: 0,
    totalPages: 0,
    totalElements: 0,
    size: 50,
  });
  const [checklistFilters, setChecklistFilters] = useState({
    reportId: "",
    conditionRating: "",
  });

  // Files state
  const [files, setFiles] = useState([]);
  const [filesPagination, setFilesPagination] = useState({
    currentPage: 0,
    totalPages: 0,
    totalElements: 0,
    size: 50,
  });
  const [filesFilters, setFilesFilters] = useState({
    reportId: "",
    category: "",
  });

  // Performance state
  const [performance, setPerformance] = useState({ metrics: null, top: [] });
  const [health, setHealth] = useState(null);

  // Initialize component
  useEffect(() => {
    loadDashboardOverview();
    loadSystemStatistics();
  }, []);

  useEffect(() => {
    if (activeTab === "overview") {
      loadDashboardOverview();
    } else if (activeTab === "reports") {
      loadInspectionReports();
    } else if (activeTab === "checklist") {
      loadChecklistItems();
    } else if (activeTab === "files") {
      loadFiles();
    } else if (activeTab === "performance") {
      loadPerformance();
    } else if (activeTab === "health") {
      loadHealth();
    }
  }, [activeTab]);

  // ==================== DATA LOADING FUNCTIONS ====================

  const loadDashboardOverview = async () => {
    try {
      setLoading(true);
      const response = await techDashboardService.getDashboardOverview();
      console.log("🔍 Dashboard overview response:", response);
      if (response.success) {
        console.log("✅ Setting dashboard overview:", response.overview);
        setDashboardOverview(response.overview);
      } else {
        console.error(
          "❌ Dashboard overview response not successful:",
          response
        );
      }
    } catch (error) {
      console.error("❌ Error loading dashboard overview:", error);
      setError("Failed to load dashboard overview");
      toast.error("Failed to load dashboard overview");
    } finally {
      setLoading(false);
    }
  };

  const loadSystemStatistics = async () => {
    try {
      const response = await techDashboardService.getSystemStatistics();
      console.log("🔍 System statistics response:", response);
      if (response.success) {
        console.log("✅ Setting system stats:", response.statistics);
        setSystemStats(response.statistics);
      } else {
        console.error(
          "❌ System statistics response not successful:",
          response
        );
      }
    } catch (error) {
      console.error("Failed to load system statistics:", error);
    }
  };

  const loadInspectionReports = async () => {
    try {
      setLoading(true);
      const params = {
        page: reportsPagination.currentPage,
        size: reportsPagination.size,
        ...reportsFilters,
      };

      // Convert dates to ISO strings if they exist
      if (params.dateFrom) params.dateFrom = params.dateFrom.toISOString();
      if (params.dateTo) params.dateTo = params.dateTo.toISOString();

      const response = await techDashboardService.getInspectionReports(params);
      if (response.success) {
        setInspectionReports(response.reports.reports || []);
        setReportsPagination((prev) => ({
          ...prev,
          totalPages: response.reports.totalPages || 0,
          totalElements: response.reports.totalCount || 0,
        }));
      }
    } catch (error) {
      setError("Failed to load inspection reports");
      toast.error("Failed to load inspection reports");
      console.error("Error loading inspection reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadChecklistItems = async () => {
    try {
      setLoading(true);
      const params = {
        page: checklistPagination.currentPage,
        size: checklistPagination.size,
        ...checklistFilters,
      };

      const response = await techDashboardService.getChecklistItems(params);
      if (response.success) {
        setChecklistItems(response.checklist.items || []);
        setChecklistPagination((prev) => ({
          ...prev,
          totalPages: response.checklist.totalPages || 0,
          totalElements: response.checklist.totalCount || 0,
        }));
      }
    } catch (error) {
      setError("Failed to load checklist items");
      toast.error("Failed to load checklist items");
      console.error("Error loading checklist items:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadFiles = async () => {
    try {
      setLoading(true);
      const params = {
        page: filesPagination.currentPage,
        size: filesPagination.size,
        ...filesFilters,
      };

      const response = await techDashboardService.getFiles(params);
      if (response.success) {
        setFiles(response.files.items || []);
        setFilesPagination((prev) => ({
          ...prev,
          totalPages: response.files.totalPages || 0,
          totalElements: response.files.totalCount || 0,
        }));
      }
    } catch (error) {
      setError("Failed to load files");
      toast.error("Failed to load files");
    } finally {
      setLoading(false);
    }
  };

  const loadPerformance = async () => {
    try {
      setLoading(true);
      const metrics = await techDashboardService.getTechnicianPerformance({});
      const top = await techDashboardService.getTopPerformers({ limit: 10 });
      setPerformance({
        metrics: metrics?.data || metrics,
        top: top?.data || top,
      });
    } catch (error) {
      setError("Failed to load performance data");
      toast.error("Failed to load performance data");
    } finally {
      setLoading(false);
    }
  };

  const loadHealth = async () => {
    try {
      setLoading(true);
      const data = await techDashboardService.getSystemHealth();
      setHealth(data);
    } catch (error) {
      setError("Failed to load system health");
      toast.error("Failed to load system health");
    } finally {
      setLoading(false);
    }
  };

  // ==================== RENDER FUNCTIONS ====================

  const renderDashboardOverview = () => {
    // Add defensive check to prevent errors
    if (!dashboardOverview || Object.keys(dashboardOverview).length === 0) {
      return (
        <div className="dashboard-overview">
          <Row>
            <Col md={12}>
              <Card>
                <Card.Body className="text-center">
                  <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </Spinner>
                  <p className="mt-2">Loading dashboard data...</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </div>
      );
    }

    return (
      <div className="dashboard-overview">
        <Row>
          <Col md={3}>
            <Card className="stat-card">
              <Card.Body>
                <div className="stat-icon">
                  <HiOutlineDocumentText />
                </div>
                <h3>{dashboardOverview.totalReports || 0}</h3>
                <p>Total Reports</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="stat-card">
              <Card.Body>
                <div className="stat-icon">
                  <HiOutlineCheckCircle />
                </div>
                <h3>{dashboardOverview.totalChecklistItems || 0}</h3>
                <p>Checklist Items</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="stat-card">
              <Card.Body>
                <div className="stat-icon">
                  <HiOutlineEye />
                </div>
                <h3>{dashboardOverview.totalFiles || 0}</h3>
                <p>Total Files</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="stat-card">
              <Card.Body>
                <div className="stat-icon">
                  <HiOutlineUser />
                </div>
                <h3>{dashboardOverview.totalTechnicians || 0}</h3>
                <p>Technicians</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row className="mt-4">
          <Col md={12}>
            <Card>
              <Card.Header>
                <h5>System Status</h5>
              </Card.Header>
              <Card.Body>
                <p>Tech Dashboard Admin is now integrated and ready for use!</p>
                <p>
                  This interface provides comprehensive management of inspection
                  reports, checklists, files, and technician performance.
                </p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>
    );
  };

  const renderInspectionReports = () => (
    <div className="inspection-reports">
      <Card>
        <Card.Header>
          <div className="d-flex justify-content-between align-items-center">
            <h5>Inspection Reports</h5>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={loadInspectionReports}
            >
              <HiOutlineRefresh /> Refresh
            </Button>
          </div>
        </Card.Header>
        <Card.Body>
          {/* Filters */}
          <Row className="mb-3">
            <Col md={2}>
              <Form.Group>
                <Form.Label>Status</Form.Label>
                <Select
                  value={
                    reportsFilters.status
                      ? {
                          value: reportsFilters.status,
                          label: reportsFilters.status,
                        }
                      : null
                  }
                  onChange={(option) =>
                    setReportsFilters((prev) => ({
                      ...prev,
                      status: option?.value || "",
                    }))
                  }
                  options={[
                    { value: "PENDING", label: "Pending" },
                    { value: "IN_PROGRESS", label: "In Progress" },
                    { value: "COMPLETED", label: "Completed" },
                    { value: "REJECTED", label: "Rejected" },
                  ]}
                  isClearable
                  placeholder="All Statuses"
                />
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label>Date From</Form.Label>
                <DatePicker
                  selected={reportsFilters.dateFrom}
                  onChange={(date) =>
                    setReportsFilters((prev) => ({ ...prev, dateFrom: date }))
                  }
                  className="form-control"
                  placeholderText="Select date"
                />
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label>Date To</Form.Label>
                <DatePicker
                  selected={reportsFilters.dateTo}
                  onChange={(date) =>
                    setReportsFilters((prev) => ({ ...prev, dateTo: date }))
                  }
                  className="form-control"
                  placeholderText="Select date"
                />
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label>Technician ID</Form.Label>
                <Form.Control
                  type="text"
                  value={reportsFilters.technicianId}
                  onChange={(e) =>
                    setReportsFilters((prev) => ({
                      ...prev,
                      technicianId: e.target.value,
                    }))
                  }
                  placeholder="Technician ID"
                />
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label>&nbsp;</Form.Label>
                <Button
                  variant="primary"
                  onClick={loadInspectionReports}
                  className="w-100"
                >
                  <HiOutlineFilter /> Apply Filters
                </Button>
              </Form.Group>
            </Col>
          </Row>

          {/* Reports Table */}
          <Table responsive striped hover>
            <thead>
              <tr>
                <th>ID</th>
                <th>Status</th>
                <th>Technician</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {inspectionReports.map((report) => (
                <tr key={report.id}>
                  <td>#{report.id}</td>
                  <td>
                    <Badge bg={getStatusBadgeColor(report.status)}>
                      {report.status}
                    </Badge>
                  </td>
                  <td>{report.technicianName || "N/A"}</td>
                  <td>{new Date(report.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="action-buttons">
                      <Button
                        variant="outline-info"
                        size="sm"
                        onClick={() => viewInspectionReport(report.id)}
                        disabled={viewingReport}
                        title="View complete report details"
                      >
                        {viewingReport ? (
                          <Spinner animation="border" size="sm" />
                        ) : (
                          <HiOutlineEye />
                        )}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          {/* Pagination */}
          <div className="d-flex justify-content-between align-items-center">
            <div>
              Showing{" "}
              {reportsPagination.currentPage * reportsPagination.size + 1} to{" "}
              {Math.min(
                (reportsPagination.currentPage + 1) * reportsPagination.size,
                reportsPagination.totalElements
              )}{" "}
              of {reportsPagination.totalElements} results
            </div>
            <Pagination>
              <Pagination.First
                onClick={() =>
                  setReportsPagination((prev) => ({ ...prev, currentPage: 0 }))
                }
                disabled={reportsPagination.currentPage === 0}
              />
              <Pagination.Prev
                onClick={() =>
                  setReportsPagination((prev) => ({
                    ...prev,
                    currentPage: prev.currentPage - 1,
                  }))
                }
                disabled={reportsPagination.currentPage === 0}
              />
              {Array.from(
                { length: Math.min(5, reportsPagination.totalPages) },
                (_, i) => {
                  const page = reportsPagination.currentPage - 2 + i;
                  if (page < 0 || page >= reportsPagination.totalPages)
                    return null;
                  return (
                    <Pagination.Item
                      key={page}
                      active={page === reportsPagination.currentPage}
                      onClick={() =>
                        setReportsPagination((prev) => ({
                          ...prev,
                          currentPage: page,
                        }))
                      }
                    >
                      {page + 1}
                    </Pagination.Item>
                  );
                }
              )}
              <Pagination.Next
                onClick={() =>
                  setReportsPagination((prev) => ({
                    ...prev,
                    currentPage: prev.currentPage + 1,
                  }))
                }
                disabled={
                  reportsPagination.currentPage ===
                  reportsPagination.totalPages - 1
                }
              />
              <Pagination.Last
                onClick={() =>
                  setReportsPagination((prev) => ({
                    ...prev,
                    currentPage: reportsPagination.totalPages - 1,
                  }))
                }
                disabled={
                  reportsPagination.currentPage ===
                  reportsPagination.totalPages - 1
                }
              />
            </Pagination>
          </div>
        </Card.Body>
      </Card>
    </div>
  );

  const renderChecklistItems = () => (
    <div className="checklist-items">
      <Card>
        <Card.Header>
          <div className="d-flex justify-content-between align-items-center">
            <h5>Checklist Items</h5>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={loadChecklistItems}
            >
              <HiOutlineRefresh /> Refresh
            </Button>
          </div>
        </Card.Header>
        <Card.Body>
          {/* Filters */}
          <Row className="mb-3">
            <Col md={3}>
              <Form.Group>
                <Form.Label>Report ID</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter report ID"
                  value={checklistFilters.reportId}
                  onChange={(e) =>
                    setChecklistFilters((prev) => ({
                      ...prev,
                      reportId: e.target.value,
                    }))
                  }
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Condition Rating</Form.Label>
                <Select
                  value={
                    checklistFilters.conditionRating
                      ? {
                          value: checklistFilters.conditionRating,
                          label: checklistFilters.conditionRating,
                        }
                      : null
                  }
                  onChange={(option) =>
                    setChecklistFilters((prev) => ({
                      ...prev,
                      conditionRating: option?.value || "",
                    }))
                  }
                  options={[
                    { value: "EXCELLENT", label: "Excellent" },
                    { value: "GOOD", label: "Good" },
                    { value: "FAIR", label: "Fair" },
                    { value: "POOR", label: "Poor" },
                    { value: "FAILED", label: "Failed" },
                  ]}
                  isClearable
                  placeholder="All Ratings"
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Button
                variant="primary"
                onClick={loadChecklistItems}
                className="mt-4"
              >
                <HiOutlineFilter /> Apply Filters
              </Button>
            </Col>
          </Row>

          {/* Checklist Table */}
          {loading ? (
            <div className="text-center p-3">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
            </div>
          ) : (
            <>
              <Table striped bordered hover responsive>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Category</th>
                    <th>Item Name</th>
                    <th>Status</th>
                    <th>Condition</th>
                    <th>Working Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {checklistItems.map((item) => (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td>
                        <Badge bg="info">{item.categoryDisplayName}</Badge>
                      </td>
                      <td>{item.itemName}</td>
                      <td>
                        <Badge bg={item.isChecked ? "success" : "secondary"}>
                          {item.isChecked ? "Completed" : "Pending"}
                        </Badge>
                      </td>
                      <td>
                        <Badge
                          bg={item.conditionRating ? "warning" : "secondary"}
                        >
                          {item.conditionDisplayName || "Not Rated"}
                        </Badge>
                      </td>
                      <td>
                        <Badge bg={item.workingStatus ? "info" : "secondary"}>
                          {item.workingStatusDisplayName || "Not Specified"}
                        </Badge>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <Button
                            variant="outline-info"
                            size="sm"
                            title="View Details"
                          >
                            <HiOutlineEye />
                          </Button>
                          <Button
                            variant="outline-warning"
                            size="sm"
                            title="Edit"
                          >
                            <HiOutlinePencil />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              {/* Pagination */}
              <div className="d-flex justify-content-center">
                <Pagination>
                  <Pagination.First
                    onClick={() =>
                      setChecklistPagination((prev) => ({
                        ...prev,
                        currentPage: 0,
                      }))
                    }
                    disabled={checklistPagination.currentPage === 0}
                  />
                  <Pagination.Prev
                    onClick={() =>
                      setChecklistPagination((prev) => ({
                        ...prev,
                        currentPage: Math.max(0, prev.currentPage - 1),
                      }))
                    }
                    disabled={checklistPagination.currentPage === 0}
                  />
                  <Pagination.Next
                    onClick={() =>
                      setChecklistPagination((prev) => ({
                        ...prev,
                        currentPage: Math.min(
                          checklistPagination.totalPages - 1,
                          prev.currentPage + 1
                        ),
                      }))
                    }
                    disabled={
                      checklistPagination.currentPage ===
                      checklistPagination.totalPages - 1
                    }
                  />
                  <Pagination.Last
                    onClick={() =>
                      setChecklistPagination((prev) => ({
                        ...prev,
                        currentPage: checklistPagination.totalPages - 1,
                      }))
                    }
                    disabled={
                      checklistPagination.currentPage ===
                      checklistPagination.totalPages - 1
                    }
                  />
                </Pagination>
              </div>
            </>
          )}
        </Card.Body>
      </Card>
    </div>
  );

  // ==================== UTILITY FUNCTIONS ====================

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case "COMPLETED":
        return "success";
      case "IN_PROGRESS":
        return "warning";
      case "PENDING":
        return "info";
      case "REJECTED":
        return "danger";
      default:
        return "secondary";
    }
  };

  // ==================== REPORT VIEWING FUNCTIONS ====================

  const viewInspectionReport = async (reportId) => {
    try {
      setViewingReport(true);
      setError("");

      // Load the complete inspection report data
      const response = await techDashboardService.getInspectionReport(reportId);
      if (response.success) {
        const report = response.report;

        // Now load the complete report data including checklist items, remarks, and files
        try {
          // Load checklist items for this report
          const checklistResponse =
            await techDashboardService.getChecklistItems({
              reportId: reportId,
              size: 1000, // Get all items
            });

          // Load files for this report
          const filesResponse = await techDashboardService.getFiles({
            reportId: reportId,
            size: 1000, // Get all files
          });

          // Combine all the data into a complete report
          const completeReport = {
            ...report,
            checklistItems: checklistResponse.checklistItems || [],
            files: filesResponse.files || [],
            generalNotes: report.generalNotes || report.remarks || "",
            checklistSummary: {
              totalItems: (checklistResponse.checklistItems || []).length,
              checkedItems: (checklistResponse.checklistItems || []).filter(
                (item) => item.isChecked
              ).length,
              filesCount: (filesResponse.files || []).length,
              totalFilesSize: (filesResponse.files || []).reduce(
                (total, file) => total + (file.fileSize || 0),
                0
              ),
            },
          };

          setSelectedReport(completeReport);
          setShowReportModal(true);
          setReportActiveTab("summary");
          toast.success(`Viewing complete report #${reportId}`);
        } catch (detailError) {
          console.error("Error loading report details:", detailError);
          // Still show the basic report if detailed loading fails
          setSelectedReport(report);
          setShowReportModal(true);
          setReportActiveTab("summary");
          toast.warning(
            `Report loaded with basic info. Some details may be missing.`
          );
        }
      } else {
        toast.error("Failed to load report details");
        setError("Failed to load report details");
      }
    } catch (error) {
      console.error("Error viewing inspection report:", error);
      toast.error("Failed to load report details");
      setError("Failed to load report details");
    } finally {
      setViewingReport(false);
    }
  };

  // ==================== REPORT DISPLAY FUNCTIONS ====================

  const getFileIcon = (type) => {
    if (type.startsWith("image/")) return <FaImage className="text-primary" />;
    if (type.startsWith("video/")) return <FaVideo className="text-danger" />;
    if (type.startsWith("audio/"))
      return <FaMicrophone className="text-warning" />;
    return <FaFileAlt className="text-secondary" />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      DRAFT: { variant: "secondary", text: "Draft" },
      IN_PROGRESS: { variant: "warning", text: "In Progress" },
      COMPLETED: { variant: "success", text: "Completed" },
      SUBMITTED: { variant: "info", text: "Submitted" },
      APPROVED: { variant: "success", text: "Approved" },
      REJECTED: { variant: "danger", text: "Rejected" },
    };

    const config = statusConfig[status] || {
      variant: "secondary",
      text: status,
    };
    return <Badge bg={config.variant}>{config.text}</Badge>;
  };

  const getConditionBadge = (condition) => {
    const conditionConfig = {
      EXCELLENT: { variant: "success", text: "Like New", color: "#28a745" },
      GOOD: { variant: "info", text: "Serviceable", color: "#17a2b8" },
      FAIR: { variant: "warning", text: "Marginal", color: "#ffc107" },
      POOR: { variant: "danger", text: "Requires Repair", color: "#dc3545" },
      CRITICAL: { variant: "dark", text: "Not Inspected", color: "#343a40" },
      FAILED: { variant: "dark", text: "Not Inspected", color: "#343a40" },
    };

    const config = conditionConfig[condition] || {
      variant: "secondary",
      text: condition || "Not Set",
      color: "#6c757d",
    };
    return <Badge bg={config.variant}>{config.text}</Badge>;
  };

  const getConditionColor = (condition) => {
    const conditionConfig = {
      EXCELLENT: "#28a745", // Green
      GOOD: "#17a2b8", // Blue
      FAIR: "#ffc107", // Yellow
      POOR: "#dc3545", // Red
      CRITICAL: "#343a40", // Dark
      FAILED: "#343a40", // Dark (same as CRITICAL)
    };

    return conditionConfig[condition] || "#6c757d"; // Default gray
  };

  const renderChecklistTab = () => {
    if (
      !selectedReport?.checklistItems ||
      selectedReport.checklistItems.length === 0
    ) {
      return (
        <div className="text-center py-4">
          <FaClipboardCheck size={48} className="text-muted mb-3" />
          <h5>No Checklist Data</h5>
          <p className="text-muted">
            No checklist items were recorded for this inspection.
          </p>
        </div>
      );
    }

    // Group checklist items by category
    const groupedItems = selectedReport.checklistItems.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {});

    return (
      <div>
        {/* Summary Stats */}
        <Row className="mb-4">
          <Col md={3}>
            <Card className="text-center bg-light">
              <Card.Body>
                <h4 className="text-primary mb-1">
                  {selectedReport.checklistItems.length}
                </h4>
                <small className="text-muted">Total Items</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center bg-light">
              <Card.Body>
                <h4 className="text-success mb-1">
                  {
                    selectedReport.checklistItems.filter(
                      (item) => item.isChecked
                    ).length
                  }
                </h4>
                <small className="text-muted">Checked Items</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center bg-light">
              <Card.Body>
                <h4 className="text-info mb-1">
                  {
                    selectedReport.checklistItems.filter(
                      (item) => item.conditionRating
                    ).length
                  }
                </h4>
                <small className="text-muted">Rated Items</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center bg-light">
              <Card.Body>
                <h4 className="text-warning mb-1">
                  {
                    selectedReport.checklistItems.filter((item) => item.remarks)
                      .length
                  }
                </h4>
                <small className="text-muted">Items with Remarks</small>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {Object.entries(groupedItems).map(([category, items]) => (
          <Card key={category} className="mb-4">
            <Card.Header className="bg-primary text-white">
              <h6 className="mb-0 d-flex justify-content-between align-items-center">
                <span>{category}</span>
                <Badge bg="light" text="dark">
                  {items.length} items
                </Badge>
              </h6>
            </Card.Header>
            <Card.Body>
              <Row>
                {items.map((item, index) => (
                  <Col key={index} md={6} lg={4} className="mb-3">
                    <div
                      className={`border rounded p-3 condition-card ${
                        item.conditionRating
                          ? `condition-${item.conditionRating.toLowerCase()}`
                          : ""
                      }`}
                      style={{
                        borderColor: item.conditionRating
                          ? getConditionColor(item.conditionRating)
                          : "#dee2e6",
                        borderWidth: "2px",
                        backgroundColor: item.isChecked ? "#f8f9fa" : "#ffffff",
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h6 className="mb-0">
                          {item.isChecked && (
                            <FaCheckCircle className="text-success me-2" />
                          )}
                          {item.itemName}
                        </h6>
                        <div className="d-flex gap-1">
                          {item.conditionRating &&
                            getConditionBadge(item.conditionRating)}
                        </div>
                      </div>

                      {item.description && (
                        <div className="mt-2 mb-2">
                          <small className="text-muted">Description:</small>
                          <p className="mb-0 small">{item.description}</p>
                        </div>
                      )}

                      {item.remarks && (
                        <div className="mt-2">
                          <small className="text-muted">Remarks:</small>
                          <p className="mb-0 small text-primary">
                            {item.remarks}
                          </p>
                        </div>
                      )}

                      <div className="mt-2 pt-2 border-top">
                        <small className="text-muted">
                          <strong>Category:</strong> {item.category}
                        </small>
                        {item.subcategory && (
                          <small className="text-muted d-block">
                            <strong>Subcategory:</strong> {item.subcategory}
                          </small>
                        )}
                      </div>
                    </div>
                  </Col>
                ))}
              </Row>
            </Card.Body>
          </Card>
        ))}
      </div>
    );
  };

  const renderRemarksTab = () => {
    const remarks = selectedReport?.generalNotes;
    const technicianNotes = selectedReport?.technicianNotes;
    const adminNotes = selectedReport?.adminNotes;

    if (!remarks && !technicianNotes && !adminNotes) {
      return (
        <div className="text-center py-4">
          <FaComments size={48} className="text-muted mb-3" />
          <h5>No Remarks</h5>
          <p className="text-muted">
            No remarks or notes were provided for this inspection.
          </p>
        </div>
      );
    }

    return (
      <div>
        {/* General Remarks */}
        {remarks && (
          <Card className="mb-4">
            <Card.Header className="bg-primary text-white">
              <h6 className="mb-0">
                <FaComments className="me-2" />
                Final Remarks
              </h6>
            </Card.Header>
            <Card.Body>
              <div className="bg-light p-3 rounded">
                <p className="mb-0">{remarks}</p>
              </div>
            </Card.Body>
          </Card>
        )}

        {/* Technician Notes */}
        {technicianNotes && (
          <Card className="mb-4">
            <Card.Header className="bg-info text-white">
              <h6 className="mb-0">
                <FaFileAlt className="me-2" />
                Technician Notes
              </h6>
            </Card.Header>
            <Card.Body>
              <div className="bg-light p-3 rounded">
                <p className="mb-0">{technicianNotes}</p>
              </div>
            </Card.Body>
          </Card>
        )}

        {/* Admin Notes */}
        {adminNotes && (
          <Card className="mb-4">
            <Card.Header className="bg-warning text-dark">
              <h6 className="mb-0">
                <FaClipboardCheck className="me-2" />
                Admin Notes
              </h6>
            </Card.Header>
            <Card.Body>
              <div className="bg-light p-3 rounded">
                <p className="mb-0">{adminNotes}</p>
              </div>
            </Card.Body>
          </Card>
        )}

        {/* Additional Report Information */}
        <Card className="mt-4">
          <Card.Header className="bg-secondary text-white">
            <h6 className="mb-0">
              <FaEye className="me-2" />
              Report Metadata
            </h6>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={6}>
                <p>
                  <strong>Inspection Date:</strong>{" "}
                  {selectedReport?.inspectionDate
                    ? new Date(
                        selectedReport.inspectionDate
                      ).toLocaleDateString()
                    : "Not specified"}
                </p>
                <p>
                  <strong>Location:</strong>{" "}
                  {selectedReport?.location || "Not specified"}
                </p>
                <p>
                  <strong>Weather Conditions:</strong>{" "}
                  {selectedReport?.weatherConditions || "Not specified"}
                </p>
              </Col>
              <Col md={6}>
                <p>
                  <strong>Vehicle Mileage:</strong>{" "}
                  {selectedReport?.vehicleMileage
                    ? `${selectedReport.vehicleMileage.toLocaleString()} miles`
                    : "Not specified"}
                </p>
                <p>
                  <strong>Inspection Duration:</strong>{" "}
                  {selectedReport?.inspectionDuration || "Not specified"}
                </p>
                <p>
                  <strong>Quality Score:</strong>{" "}
                  {selectedReport?.qualityScore
                    ? `${selectedReport.qualityScore}/100`
                    : "Not specified"}
                </p>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </div>
    );
  };

  const renderFilesTab = () => {
    if (!selectedReport?.files || selectedReport.files.length === 0) {
      return (
        <div className="text-center py-4">
          <FaFileAlt size={48} className="text-muted mb-3" />
          <h5>No Files</h5>
          <p className="text-muted">
            No files were uploaded for this inspection.
          </p>
        </div>
      );
    }

    // Group files by category
    const groupedFiles = selectedReport.files.reduce((acc, file) => {
      if (!acc[file.category]) {
        acc[file.category] = [];
      }
      acc[file.category].push(file);
      return acc;
    }, {});

    const totalSize = selectedReport.files.reduce(
      (total, file) => total + (file.fileSize || 0),
      0
    );

    return (
      <div>
        {/* File Summary */}
        <Row className="mb-4">
          <Col md={3}>
            <Card className="text-center bg-light">
              <Card.Body>
                <h4 className="text-primary mb-1">
                  {selectedReport.files.length}
                </h4>
                <small className="text-muted">Total Files</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center bg-light">
              <Card.Body>
                <h4 className="text-info mb-1">{formatFileSize(totalSize)}</h4>
                <small className="text-muted">Total Size</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center bg-light">
              <Card.Body>
                <h4 className="text-success mb-1">
                  {
                    selectedReport.files.filter((f) => f.category === "IMAGE")
                      .length
                  }
                </h4>
                <small className="text-muted">Images</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center bg-light">
              <Card.Body>
                <h4 className="text-warning mb-1">
                  {Object.keys(groupedFiles).length}
                </h4>
                <small className="text-muted">Categories</small>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {Object.entries(groupedFiles).map(([category, files]) => (
          <Card key={category} className="mb-4">
            <Card.Header className="bg-info text-white">
              <h6 className="mb-0 d-flex justify-content-between align-items-center">
                <span>
                  {category === "IMAGE" && <FaImage className="me-2" />}
                  {category === "VIDEO" && <FaVideo className="me-2" />}
                  {category === "AUDIO" && <FaMicrophone className="me-2" />}
                  {category === "DOC" && <FaFileAlt className="me-2" />}
                  {category}
                </span>
                <Badge bg="light" text="dark">
                  {files.length} files
                </Badge>
              </h6>
            </Card.Header>
            <Card.Body>
              <Row>
                {files.map((file, index) => (
                  <Col key={index} md={6} lg={4} className="mb-3">
                    <Card className="file-card h-100">
                      <Card.Body className="d-flex flex-column">
                        <div className="d-flex align-items-center mb-2">
                          <span className="file-icon me-2">
                            {getFileIcon(file.fileType)}
                          </span>
                          <div className="flex-grow-1">
                            <h6
                              className="mb-0 small text-truncate"
                              title={file.fileName}
                            >
                              {file.fileName}
                            </h6>
                            <small className="text-muted d-block">
                              {formatFileSize(file.fileSize)}
                            </small>
                            <small className="text-muted d-block">
                              {file.uploadedAt
                                ? new Date(file.uploadedAt).toLocaleDateString()
                                : "Unknown date"}
                            </small>
                          </div>
                        </div>

                        {file.description && (
                          <div className="mb-3 flex-grow-1">
                            <small className="text-muted">Description:</small>
                            <p className="mb-0 small">{file.description}</p>
                          </div>
                        )}

                        <div className="mt-auto">
                          <div className="d-flex gap-2">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              className="flex-grow-1"
                              onClick={() =>
                                window.open(file.fileUrl, "_blank")
                              }
                            >
                              <FaEye className="me-1" />
                              View
                            </Button>
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              className="flex-grow-1"
                              onClick={() =>
                                window.open(file.fileUrl, "_blank")
                              }
                            >
                              <FaDownload className="me-1" />
                              Download
                            </Button>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Card.Body>
          </Card>
        ))}
      </div>
    );
  };

  const renderSummaryTab = () => {
    if (!selectedReport) return null;

    const summary = selectedReport.checklistSummary || {};
    const totalItems = selectedReport.checklistItems?.length || 0;
    const checkedItems =
      selectedReport.checklistItems?.filter((item) => item.isChecked).length ||
      0;
    const filesCount = selectedReport.files?.length || 0;

    return (
      <div>
        <Row>
          <Col md={3} className="mb-3">
            <Card className="text-center report-summary-card">
              <Card.Body>
                <h3 className="text-primary mb-1">{totalItems}</h3>
                <small className="text-muted">Total Items</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} className="mb-3">
            <Card className="text-center report-summary-card">
              <Card.Body>
                <h3 className="text-success mb-1">{checkedItems}</h3>
                <small className="text-muted">Checked Items</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} className="mb-3">
            <Card className="text-center report-summary-card">
              <Card.Body>
                <h3 className="text-info mb-1">{filesCount}</h3>
                <small className="text-muted">Files Uploaded</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} className="mb-3">
            <Card className="text-center report-summary-card">
              <Card.Body>
                <h3 className="text-warning mb-1">
                  {totalItems > 0
                    ? Math.round((checkedItems / totalItems) * 100)
                    : 0}
                  %
                </h3>
                <small className="text-muted">Completion</small>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Card className="mt-3 report-details-section">
          <Card.Header>
            <h6 className="mb-0">Report Details</h6>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={6}>
                <p>
                  <strong>Report ID:</strong> {selectedReport.id}
                </p>
                <p>
                  <strong>Status:</strong>{" "}
                  {getStatusBadge(selectedReport.status)}
                </p>
                <p>
                  <strong>Technician:</strong> {selectedReport.technicianId}
                </p>
                <p>
                  <strong>Created:</strong>{" "}
                  {new Date(selectedReport.createdAt).toLocaleDateString()}
                </p>
              </Col>
              <Col md={6}>
                <p>
                  <strong>Completed:</strong>{" "}
                  {selectedReport.completedAt
                    ? new Date(selectedReport.completedAt).toLocaleDateString()
                    : "Not completed"}
                </p>
                <p>
                  <strong>Overall Condition:</strong>{" "}
                  {getConditionBadge(selectedReport.overallCondition)}
                </p>
                <p>
                  <strong>Safety Rating:</strong>{" "}
                  {getConditionBadge(selectedReport.safetyRating)}
                </p>
                <p>
                  <strong>Total Files Size:</strong>{" "}
                  {formatFileSize(selectedReport.totalFilesSize || 0)}
                </p>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Condition Legend */}
        <Card className="mt-3 condition-legend">
          <Card.Header>
            <h6 className="mb-0">Condition Legend</h6>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={2} className="text-center mb-2">
                <Badge bg="success" className="mb-1">
                  Like New
                </Badge>
                <small className="d-block text-muted">Excellent</small>
              </Col>
              <Col md={2} className="text-center mb-2">
                <Badge bg="info" className="mb-1">
                  Serviceable
                </Badge>
                <small className="d-block text-muted">Good</small>
              </Col>
              <Col md={2} className="text-center mb-2">
                <Badge bg="warning" className="mb-1">
                  Marginal
                </Badge>
                <small className="d-block text-muted">Fair</small>
              </Col>
              <Col md={2} className="text-center mb-2">
                <Badge bg="danger" className="mb-1">
                  Needs Repair
                </Badge>
                <small className="d-block text-muted">Poor</small>
              </Col>
              <Col md={2} className="text-center mb-2">
                <Badge bg="dark" className="mb-1">
                  Not Inspected
                </Badge>
                <small className="d-block text-muted">Critical/Failed</small>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </div>
    );
  };

  // ==================== MAIN RENDER ====================

  if (loading && activeTab === "overview") {
    return (
      <div className="text-center p-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  return (
    <div className="tech-dashboard-admin">
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {/* Navigation Tabs */}
      <Card className="mb-4">
        <Card.Body className="p-0">
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            className="nav-tabs-custom"
          >
            <Tab eventKey="overview" title="Overview">
              {renderDashboardOverview()}
            </Tab>
            <Tab eventKey="reports" title="Inspection Reports">
              {renderInspectionReports()}
            </Tab>
            <Tab eventKey="checklist" title="Checklist">
              {renderChecklistItems()}
            </Tab>
            <Tab eventKey="files" title="Files">
              <div className="files-tab p-3">
                <Row className="mb-3">
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label>Report ID</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Enter report ID"
                        value={filesFilters.reportId}
                        onChange={(e) =>
                          setFilesFilters((prev) => ({
                            ...prev,
                            reportId: e.target.value,
                          }))
                        }
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label>Category</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="e.g., IMAGE, VIDEO, AUDIO, DOC"
                        value={filesFilters.category}
                        onChange={(e) =>
                          setFilesFilters((prev) => ({
                            ...prev,
                            category: e.target.value,
                          }))
                        }
                      />
                    </Form.Group>
                  </Col>
                  <Col md={2} className="d-flex align-items-end">
                    <Button variant="primary" onClick={loadFiles}>
                      <HiOutlineFilter /> Apply Filters
                    </Button>
                  </Col>
                </Row>

                <Table responsive striped hover>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Report</th>
                      <th>Category</th>
                      <th>Name</th>
                      <th>Uploaded</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {files.map((f) => (
                      <tr key={f.id}>
                        <td>#{f.id}</td>
                        <td>{f.reportId}</td>
                        <td>
                          <Badge bg="info">{f.category}</Badge>
                        </td>
                        <td>{f.filename}</td>
                        <td>{new Date(f.uploadedAt).toLocaleString()}</td>
                        <td>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={async () => {
                              try {
                                await techDashboardService.deleteFile(f.id, {
                                  reason: "Admin action",
                                  adminEmail: "admin@example.com",
                                });
                                toast.success("File deleted");
                                loadFiles();
                              } catch (e) {
                                toast.error("Failed to delete file");
                              }
                            }}
                          >
                            <HiOutlineTrash />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Tab>
            <Tab eventKey="performance" title="Performance">
              <div className="p-4">
                {!performance.metrics ? (
                  <div className="text-center text-muted">No data</div>
                ) : (
                  <Row>
                    <Col md={6}>
                      <Card>
                        <Card.Header>Performance Metrics</Card.Header>
                        <Card.Body>
                          <div>
                            Total Earnings: {performance.metrics.totalEarnings}
                          </div>
                          <div>
                            Avg Success Rate:{" "}
                            {performance.metrics.averageSuccessRate}
                          </div>
                          <div>
                            Avg Response Time:{" "}
                            {performance.metrics.averageResponseTime}
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={6}>
                      <Card>
                        <Card.Header>Top Performers</Card.Header>
                        <Card.Body>
                          <Table size="sm" responsive>
                            <thead>
                              <tr>
                                <th>Technician</th>
                                <th>Metric</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(
                                performance.top?.technicians ||
                                performance.top ||
                                []
                              ).map((t, idx) => (
                                <tr key={idx}>
                                  <td>{t.name || t.technicianName || t.id}</td>
                                  <td>
                                    {t.totalEarnings ||
                                      t.successRate ||
                                      t.totalPostsAccepted}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                )}
              </div>
            </Tab>
            <Tab eventKey="health" title="System Health">
              <div className="p-4">
                {!health ? (
                  <div className="text-center text-muted">No data</div>
                ) : (
                  <Card>
                    <Card.Header>Service Health</Card.Header>
                    <Card.Body>
                      <pre className="mb-0" style={{ whiteSpace: "pre-wrap" }}>
                        {JSON.stringify(health, null, 2)}
                      </pre>
                    </Card.Body>
                  </Card>
                )}
              </div>
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>

      {/* Inspection Report View Modal */}
      <Modal
        show={showReportModal}
        onHide={() => setShowReportModal(false)}
        size="xl"
        scrollable
      >
        <Modal.Header closeButton>
          <Modal.Title>
            Inspection Report #{selectedReport?.id} - {selectedReport?.status}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedReport ? (
            <div>
              <Nav variant="tabs" className="mb-3">
                <Nav.Item>
                  <Nav.Link
                    active={reportActiveTab === "summary"}
                    onClick={() => setReportActiveTab("summary")}
                  >
                    <FaEye className="me-1" />
                    Summary
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link
                    active={reportActiveTab === "checklist"}
                    onClick={() => setReportActiveTab("checklist")}
                  >
                    <FaClipboardCheck className="me-1" />
                    Checklist ({selectedReport.checklistItems?.length || 0})
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link
                    active={reportActiveTab === "remarks"}
                    onClick={() => setReportActiveTab("remarks")}
                  >
                    <FaComments className="me-1" />
                    Remarks
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link
                    active={reportActiveTab === "files"}
                    onClick={() => setReportActiveTab("files")}
                  >
                    <FaFileAlt className="me-1" />
                    Files ({selectedReport.files?.length || 0})
                  </Nav.Link>
                </Nav.Item>
              </Nav>

              <Tab.Content>
                <Tab.Pane active={reportActiveTab === "summary"}>
                  {renderSummaryTab()}
                </Tab.Pane>
                <Tab.Pane active={reportActiveTab === "checklist"}>
                  {renderChecklistTab()}
                </Tab.Pane>
                <Tab.Pane active={reportActiveTab === "remarks"}>
                  {renderRemarksTab()}
                </Tab.Pane>
                <Tab.Pane active={reportActiveTab === "files"}>
                  {renderFilesTab()}
                </Tab.Pane>
              </Tab.Content>
            </div>
          ) : (
            <div className="text-center p-4">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
              <p className="mt-2">Loading report details...</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowReportModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default TechDashboardAdmin;
