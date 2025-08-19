import React, { useState, useEffect } from "react";
import {
  Modal,
  Button,
  Badge,
  Card,
  Row,
  Col,
  Tab,
  Nav,
} from "react-bootstrap";
import { toast } from "react-toastify";
import { API_CONFIG } from "../api";
import "./InspectionReportViewer.css";
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

const InspectionReportViewer = ({ show, onHide, postId, post }) => {
  const [activeTab, setActiveTab] = useState("checklist");
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (show && postId) {
      loadInspectionReport();
    }
  }, [show, postId]);

  const loadInspectionReport = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log("🔄 Loading inspection report for post:", postId);

      const response = await fetch(
        `${API_CONFIG.API_GATEWAY_URL}/tech-dashboard/api/v1/dashboard/reports/by-post/${postId}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("No inspection report found for this post");
        }
        throw new Error(`Failed to load report: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.report) {
        setReportData(data.report);
        console.log("✅ Inspection report loaded:", data.report);
        toast.success("Inspection report loaded successfully!");
      } else {
        throw new Error(data.message || "Failed to load inspection report");
      }
    } catch (error) {
      console.error("❌ Error loading inspection report:", error);
      setError(error.message);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (type) => {
    if (type.startsWith("image/")) return <FaImage className="text-primary" />;
    if (type.startsWith("video/")) return <FaVideo className="text-success" />;
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
    if (!reportData?.checklistItems || reportData.checklistItems.length === 0) {
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
    const groupedItems = reportData.checklistItems.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {});

    return (
      <div>
        {Object.entries(groupedItems).map(([category, items]) => (
          <Card key={category} className="mb-3">
            <Card.Header className="bg-light">
              <h6 className="mb-0">{category}</h6>
            </Card.Header>
            <Card.Body>
              <Row>
                {items.map((item, index) => (
                  <Col key={index} md={6} className="mb-3">
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
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h6 className="mb-0">{item.itemName}</h6>
                        <div className="d-flex gap-1">
                          {item.conditionRating &&
                            getConditionBadge(item.conditionRating)}
                        </div>
                      </div>
                      {item.remarks && (
                        <div className="mt-2">
                          <small className="text-muted">Remarks:</small>
                          <p className="mb-0 small">{item.remarks}</p>
                        </div>
                      )}
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
    const remarks = reportData?.generalNotes;

    if (!remarks || remarks.trim() === "") {
      return (
        <div className="text-center py-4">
          <FaComments size={48} className="text-muted mb-3" />
          <h5>No Remarks</h5>
          <p className="text-muted">
            No final remarks were provided for this inspection.
          </p>
        </div>
      );
    }

    return (
      <Card>
        <Card.Body>
          <h6 className="mb-3">Final Remarks</h6>
          <div className="bg-light p-3 rounded">
            <p className="mb-0">{remarks}</p>
          </div>
        </Card.Body>
      </Card>
    );
  };

  const renderFilesTab = () => {
    if (!reportData?.files || reportData.files.length === 0) {
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

    return (
      <div>
        <Row>
          {reportData.files.map((file, index) => (
            <Col key={index} md={6} lg={4} className="mb-3">
              <Card>
                <Card.Body>
                  <div className="d-flex align-items-center mb-2">
                    {getFileIcon(file.fileType)}
                    <div className="ms-2 flex-grow-1">
                      <h6 className="mb-0 small">{file.fileName}</h6>
                      <small className="text-muted">
                        {formatFileSize(file.fileSize)}
                      </small>
                    </div>
                  </div>
                  <div className="d-flex gap-2">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => window.open(file.fileUrl, "_blank")}
                    >
                      <FaEye className="me-1" />
                      View
                    </Button>
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={() => window.open(file.fileUrl, "_blank")}
                    >
                      <FaDownload className="me-1" />
                      Download
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    );
  };

  const renderSummaryTab = () => {
    if (!reportData) return null;

    const summary = reportData.checklistSummary || {};
    const totalItems = reportData.checklistItems?.length || 0;
    const checkedItems =
      reportData.checklistItems?.filter((item) => item.isChecked).length || 0;
    const filesCount = reportData.files?.length || 0;

    return (
      <div>
        <Row>
          <Col md={3} className="mb-3">
            <Card className="text-center">
              <Card.Body>
                <h3 className="text-primary mb-1">{totalItems}</h3>
                <small className="text-muted">Total Items</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} className="mb-3">
            <Card className="text-center">
              <Card.Body>
                <h3 className="text-success mb-1">{checkedItems}</h3>
                <small className="text-muted">Checked Items</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} className="mb-3">
            <Card className="text-center">
              <Card.Body>
                <h3 className="text-info mb-1">{filesCount}</h3>
                <small className="text-muted">Files Uploaded</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} className="mb-3">
            <Card className="text-center">
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

        <Card className="mt-3">
          <Card.Header>
            <h6 className="mb-0">Report Details</h6>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={6}>
                <p>
                  <strong>Report ID:</strong> {reportData.id}
                </p>
                <p>
                  <strong>Status:</strong> {getStatusBadge(reportData.status)}
                </p>
                <p>
                  <strong>Technician:</strong> {reportData.technicianId}
                </p>
                <p>
                  <strong>Created:</strong>{" "}
                  {new Date(reportData.createdAt).toLocaleDateString()}
                </p>
              </Col>
              <Col md={6}>
                <p>
                  <strong>Completed:</strong>{" "}
                  {reportData.completedAt
                    ? new Date(reportData.completedAt).toLocaleDateString()
                    : "Not completed"}
                </p>
                <p>
                  <strong>Overall Condition:</strong>{" "}
                  {getConditionBadge(reportData.overallCondition)}
                </p>
                <p>
                  <strong>Safety Rating:</strong>{" "}
                  {getConditionBadge(reportData.safetyRating)}
                </p>
                <p>
                  <strong>Total Files Size:</strong>{" "}
                  {formatFileSize(reportData.totalFilesSize || 0)}
                </p>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Condition Legend */}
        <Card className="mt-3">
          <Card.Header>
            <h6 className="mb-0">Condition Legend</h6>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={2} className="text-center mb-2">
                <Badge bg="success" className="mb-1">
                  Like New
                </Badge>
                <small className="d-block text-muted">
                  Excellent condition
                </small>
              </Col>
              <Col md={2} className="text-center mb-2">
                <Badge bg="info" className="mb-1">
                  Serviceable
                </Badge>
                <small className="d-block text-muted">
                  Good working condition
                </small>
              </Col>
              <Col md={2} className="text-center mb-2">
                <Badge bg="warning" className="mb-1">
                  Marginal
                </Badge>
                <small className="d-block text-muted">Needs attention</small>
              </Col>
              <Col md={2} className="text-center mb-2">
                <Badge bg="danger" className="mb-1">
                  Requires Repair
                </Badge>
                <small className="d-block text-muted">
                  Needs immediate repair
                </small>
              </Col>
              <Col md={2} className="text-center mb-2">
                <Badge bg="dark" className="mb-1">
                  Not Inspected
                </Badge>
                <small className="d-block text-muted">
                  Item was not inspected
                </small>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </div>
    );
  };

  return (
    <Modal show={show} onHide={onHide} size="xl" centered>
      <Modal.Header closeButton className="bg-primary text-white">
        <Modal.Title>
          <FaFileAlt className="me-2" />
          Inspection Report - {post?.displayId || `Post #${postId}`}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3">Loading inspection report...</p>
          </div>
        ) : error ? (
          <div className="text-center py-5">
            <FaTimes size={48} className="text-danger mb-3" />
            <h5>Error Loading Report</h5>
            <p className="text-muted">{error}</p>
            <Button variant="primary" onClick={loadInspectionReport}>
              Try Again
            </Button>
          </div>
        ) : reportData ? (
          <div>
            <Nav variant="tabs" className="mb-3">
              <Nav.Item>
                <Nav.Link
                  active={activeTab === "summary"}
                  onClick={() => setActiveTab("summary")}
                >
                  <FaEye className="me-1" />
                  Summary
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link
                  active={activeTab === "checklist"}
                  onClick={() => setActiveTab("checklist")}
                >
                  <FaClipboardCheck className="me-1" />
                  Checklist ({reportData.checklistItems?.length || 0})
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link
                  active={activeTab === "remarks"}
                  onClick={() => setActiveTab("remarks")}
                >
                  <FaComments className="me-1" />
                  Remarks
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link
                  active={activeTab === "files"}
                  onClick={() => setActiveTab("files")}
                >
                  <FaFileAlt className="me-1" />
                  Files ({reportData.files?.length || 0})
                </Nav.Link>
              </Nav.Item>
            </Nav>

            <Tab.Content>
              <Tab.Pane active={activeTab === "summary"}>
                {renderSummaryTab()}
              </Tab.Pane>
              <Tab.Pane active={activeTab === "checklist"}>
                {renderChecklistTab()}
              </Tab.Pane>
              <Tab.Pane active={activeTab === "remarks"}>
                {renderRemarksTab()}
              </Tab.Pane>
              <Tab.Pane active={activeTab === "files"}>
                {renderFilesTab()}
              </Tab.Pane>
            </Tab.Content>
          </div>
        ) : null}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
        {reportData && (
          <Button
            variant="primary"
            onClick={() => {
              // TODO: Implement PDF export functionality
              toast.info("PDF export functionality coming soon!");
            }}
          >
            <FaDownload className="me-1" />
            Export PDF
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default InspectionReportViewer;
