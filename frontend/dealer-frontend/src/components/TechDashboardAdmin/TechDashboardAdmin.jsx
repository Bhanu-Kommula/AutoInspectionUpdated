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
                        onClick={() => {
                          // View report details
                          toast.info(`Viewing report #${report.id}`);
                        }}
                      >
                        <HiOutlineEye />
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
    </div>
  );
};

export default TechDashboardAdmin;
