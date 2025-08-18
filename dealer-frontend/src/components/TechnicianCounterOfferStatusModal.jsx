import React, { useState, useEffect, useCallback } from "react";
import {
  Modal,
  Button,
  Card,
  Row,
  Col,
  Badge,
  Spinner,
  Alert,
  Tab,
  Tabs,
} from "react-bootstrap";
import {
  FaTimes,
  FaClock,
  FaDollarSign,
  FaComment,
  FaUser,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaHourglassHalf,
  FaSyncAlt,
  FaInfoCircle,
  FaPhone,
  FaEnvelope,
  FaHandshake,
  FaRedo,
} from "react-icons/fa";
import { useCountdown } from "../hooks/useCountdown";
import api, { API_CONFIG } from "../api";
import "./ModalStyles.css";

/**
 * Technician Counter Offer Status Modal
 * Shows technician their submitted counter offers and dealer responses
 */
const TechnicianCounterOfferStatusModal = ({
  show,
  onHide,
  technicianId,
  onNewNotification,
}) => {
  const [counterOffers, setCounterOffers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Function to format cooldown time in MM:SS format
  const formatCooldownTime = (remainingSeconds) => {
    if (remainingSeconds <= 0) return "00:00";

    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;

    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  // Update current time every second for live countdown
  useEffect(() => {
    if (show) {
      const interval = setInterval(() => {
        setCurrentTime(Date.now());
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [show]);

  // Function to calculate remaining cooldown time based on current time
  const getRemainingCooldownTime = (offer) => {
    if (offer.status !== "REJECTED" || !offer.dealerResponseAt) return 0;

    // Calculate based on dealerResponseAt timestamp for live countdown
    const responseTime = new Date(offer.dealerResponseAt);
    const cooldownEndTime = new Date(responseTime.getTime() + 3 * 60 * 1000); // 3 minutes
    const remaining = Math.max(
      0,
      Math.floor((cooldownEndTime - currentTime) / 1000)
    );

    return remaining;
  };

  // Function to get the most accurate remaining time for display
  const getDisplayRemainingTime = (offer) => {
    if (offer.status !== "REJECTED") return 0;

    // Always use calculated time for live countdown - no API calls needed
    return getRemainingCooldownTime(offer);
  };

  // Fetch counter offer status when modal opens
  useEffect(() => {
    console.log("🔍 Modal useEffect triggered:", { show, technicianId });
    if (show && technicianId) {
      console.log(
        "🔍 Fetching counter offer status for technicianId:",
        technicianId
      );
      fetchCounterOfferStatus();
    } else {
      console.log("🔍 Modal not ready:", { show, technicianId });
    }
  }, [show, technicianId]);

  const fetchCounterOfferStatus = useCallback(async () => {
    if (!technicianId) {
      setError("Technician information not available");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Call the actual API to get counter offer status
      const response = await api.get(
        `${
          API_CONFIG.TECHNICIAN_BASE_URL
        }/counter-offers/status?technicianEmail=${encodeURIComponent(
          technicianId
        )}`
      );

      if (response.data && response.data.success) {
        // Map backend fields to UI schema (no mock data)
        const rawOffers = response.data.counterOffers || [];
        const mappedOffers = rawOffers.map((co) => ({
          id: co.id,
          postId: co.postId,
          // Amount fields (support multiple naming variants)
          originalOfferAmount:
            co.originalOfferAmount ??
            co.originalAmount ??
            co.original_offer_amount ??
            null,
          requestedOfferAmount:
            co.requestedOfferAmount ??
            co.requestedAmount ??
            co.requested_offer_amount ??
            null,
          // Dates
          requestedAt: co.requestedAt || co.requested_at || null,
          expiresAt: co.expiresAt || co.expires_at || null,
          dealerResponseAt:
            co.dealerResponseAt || co.dealer_response_at || null,
          // Notes / reasons
          requestReason: co.requestReason || null,
          technicianNotes: co.technicianNotes || null,
          dealerResponseNotes: co.dealerResponseNotes || null,
          // Status
          status: co.status,
          statusDisplay: co.statusDisplay || null,
          // Timing helpers
          hoursUntilExpiry: co.hoursUntilExpiry,
          isExpired: co.isExpired,
          remainingCooldownSeconds: co.remainingCooldownSeconds ?? 0,
          // Optional post/loc fields (if backend supplies)
          postTitle: co.postTitle,
          postContent: co.postContent,
          postLocation: co.postLocation,
          technicianLocation: co.technicianLocation,
        }));

        setCounterOffers(mappedOffers);

        // Check for recent rejections and show notification
        const recentRejections =
          response.data.counterOffers?.filter((offer) => {
            if (offer.status !== "REJECTED" || !offer.dealerResponseAt)
              return false;
            const responseTime = new Date(offer.dealerResponseAt);
            const now = new Date();
            const timeDiff = now - responseTime;
            // Show notification for rejections in the last 5 minutes
            return timeDiff < 5 * 60 * 1000;
          }) || [];

        if (recentRejections.length > 0) {
          // Toast notifications removed - now shown in notification bell instead
        }
      } else {
        setError(
          response.data?.message || "Failed to load counter offer status"
        );
      }
    } catch (err) {
      console.error("Error fetching counter offer status:", err);
      setError("Failed to load counter offer status. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [technicianId]);

  // Filter counter offers by status
  const filterOffersByStatus = (status) => {
    if (status === "all") return counterOffers;
    return counterOffers.filter((offer) => offer.status === status);
  };

  // Get status badge component
  const getStatusBadge = (status) => {
    const statusConfig = {
      PENDING: { variant: "warning", icon: FaHourglassHalf, text: "Pending" },
      ACCEPTED: { variant: "success", icon: FaCheckCircle, text: "Accepted" },
      REJECTED: { variant: "danger", icon: FaTimesCircle, text: "Rejected" },
      EXPIRED: {
        variant: "secondary",
        icon: FaExclamationTriangle,
        text: "Expired",
      },
      WITHDRAWN: { variant: "info", icon: FaInfoCircle, text: "Withdrawn" },
    };

    const config = statusConfig[status] || statusConfig.PENDING;
    const IconComponent = config.icon;

    return (
      <Badge bg={config.variant} className="d-flex align-items-center">
        <IconComponent className="me-1" size={12} />
        {config.text}
      </Badge>
    );
  };

  // Format date display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Calculate hours until expiry with enhanced display
  const getTimeUntilExpiry = (expiresAt, hoursUntilExpiry) => {
    // Use backend calculated hours if available, otherwise calculate
    let hours = hoursUntilExpiry;
    if (hours === undefined || hours === null) {
      if (!expiresAt) return null;
      const now = new Date();
      const expiry = new Date(expiresAt);
      hours = Math.max(0, Math.floor((expiry - now) / (1000 * 60 * 60)));
    }

    if (hours <= 0) {
      return { hours: 0, display: "Expired", className: "text-danger" };
    } else if (hours < 24) {
      return {
        hours,
        display: `${hours}h left`,
        className: hours <= 6 ? "text-danger" : "text-warning",
      };
    } else {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      return {
        hours,
        display: `${days}d ${remainingHours}h left`,
        className: "text-success",
      };
    }
  };

  // Get summary counts
  const getSummaryCounts = () => {
    return {
      total: counterOffers.length,
      pending: filterOffersByStatus("PENDING").length,
      accepted: filterOffersByStatus("ACCEPTED").length,
      rejected: filterOffersByStatus("REJECTED").length,
      expired: filterOffersByStatus("EXPIRED").length,
      withdrawn: filterOffersByStatus("WITHDRAWN").length,
    };
  };

  const counts = getSummaryCounts();

  return (
    <Modal show={show} onHide={onHide} size="xl" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <FaDollarSign className="me-2 text-primary" />
          My Counter Offers ({counts.total})
        </Modal.Title>
      </Modal.Header>

      <Modal.Body style={{ maxHeight: "70vh", overflowY: "auto" }}>
        {loading ? (
          <div className="text-center py-4">
            <Spinner animation="border" className="mb-3" />
            <p>Loading your counter offers...</p>
          </div>
        ) : error ? (
          <Alert variant="danger">
            <FaExclamationTriangle className="me-2" />
            {error}
          </Alert>
        ) : counterOffers.length === 0 ? (
          <div className="text-center py-5">
            <FaDollarSign size={48} className="text-muted mb-3" />
            <h5>No Counter Offers Yet</h5>
            <p className="text-muted">
              When you submit counter offers for posts, they'll appear here. You
              can track their status and see dealer responses.
            </p>
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="row mb-4">
              <div className="col-md-2">
                <div className="text-center">
                  <div className="h4 mb-0 text-primary">{counts.total}</div>
                  <small className="text-muted">Total</small>
                </div>
              </div>
              <div className="col-md-2">
                <div className="text-center">
                  <div className="h4 mb-0 text-warning">{counts.pending}</div>
                  <small className="text-muted">Pending</small>
                </div>
              </div>
              <div className="col-md-2">
                <div className="text-center">
                  <div className="h4 mb-0 text-success">{counts.accepted}</div>
                  <small className="text-muted">Accepted</small>
                </div>
              </div>
              <div className="col-md-2">
                <div className="text-center">
                  <div className="h4 mb-0 text-danger">{counts.rejected}</div>
                  <small className="text-muted">Rejected</small>
                </div>
              </div>
              <div className="col-md-2">
                <div className="text-center">
                  <div className="h4 mb-0 text-secondary">{counts.expired}</div>
                  <small className="text-muted">Expired</small>
                </div>
              </div>
              <div className="col-md-2">
                <div className="text-center">
                  <div className="h4 mb-0 text-info">{counts.withdrawn}</div>
                  <small className="text-muted">Withdrawn</small>
                </div>
              </div>
            </div>

            {/* Refresh Button */}
            <div className="row mb-3">
              <div className="col-12 text-end">
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={fetchCounterOfferStatus}
                  disabled={loading}
                >
                  <FaSyncAlt className={loading ? "fa-spin" : ""} />
                  Refresh
                </Button>
              </div>
            </div>

            {/* Filter Tabs */}
            <Tabs
              activeKey={activeTab}
              onSelect={(k) => setActiveTab(k)}
              className="mb-3"
            >
              <Tab eventKey="all" title={`All (${counts.total})`} />
              <Tab eventKey="PENDING" title={`Pending (${counts.pending})`} />
              <Tab
                eventKey="ACCEPTED"
                title={`Accepted (${counts.accepted})`}
              />
              <Tab
                eventKey="REJECTED"
                title={`Rejected (${counts.rejected})`}
              />
              <Tab eventKey="EXPIRED" title={`Expired (${counts.expired})`} />
              <Tab
                eventKey="WITHDRAWN"
                title={`Withdrawn (${counts.withdrawn})`}
              />
            </Tabs>

            {/* Counter Offers List */}
            <div>
              {filterOffersByStatus(activeTab).map((offer) => (
                <Card key={offer.id} className="mb-3">
                  <Card.Header className="bg-light">
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="flex-grow-1">
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <h6 className="mb-1">
                              {offer.postTitle
                                ? offer.postTitle
                                : `Post #${offer.postId}`}
                            </h6>
                            <div className="small text-muted mb-1">
                              {offer.postContent &&
                                offer.postContent !==
                                  "Details not available" && (
                                  <div
                                    className="text-truncate"
                                    style={{ maxWidth: "300px" }}
                                  >
                                    {offer.postContent.length > 100
                                      ? `${offer.postContent.substring(
                                          0,
                                          100
                                        )}...`
                                      : offer.postContent}
                                  </div>
                                )}
                              <div>
                                <FaMapMarkerAlt className="me-1" />
                                {offer.postLocation || offer.technicianLocation}
                              </div>
                            </div>
                          </div>
                          <div className="d-flex flex-column align-items-end">
                            {getStatusBadge(offer.status)}
                            {offer.status === "PENDING" &&
                              (() => {
                                const timeInfo = getTimeUntilExpiry(
                                  offer.expiresAt,
                                  offer.hoursUntilExpiry
                                );
                                return timeInfo ? (
                                  <small
                                    className={`mt-1 ${timeInfo.className}`}
                                  >
                                    <FaClock className="me-1" />
                                    {timeInfo.display}
                                  </small>
                                ) : null;
                              })()}
                            {offer.status === "REJECTED" &&
                              getDisplayRemainingTime(offer) > 0 && (
                                <small className="mt-1 text-warning">
                                  <FaClock className="me-1" />
                                  Cooldown:{" "}
                                  {formatCooldownTime(
                                    getDisplayRemainingTime(offer)
                                  )}
                                </small>
                              )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card.Header>

                  <Card.Body>
                    <div className="row">
                      {/* Offer Details */}
                      <div className="col-md-6">
                        <h6 className="mb-3">Offer Details</h6>

                        <div className="row mb-2">
                          <div className="col-4">
                            <small className="text-muted">
                              Original Amount:
                            </small>
                            <div className="fw-bold">
                              <FaDollarSign className="me-1" />
                              {offer.originalOfferAmount}
                            </div>
                          </div>
                          <div className="col-4">
                            <small className="text-muted">
                              Your Counter Offer:
                            </small>
                            <div className="fw-bold text-primary">
                              <FaDollarSign className="me-1" />
                              {offer.requestedOfferAmount}
                            </div>
                          </div>
                          <div className="col-4">
                            <small className="text-muted">Attempt:</small>
                            <div className="fw-bold">
                              {(() => {
                                // Calculate attempt number based on post and chronological order
                                const postOffers = counterOffers
                                  .filter((co) => co.postId === offer.postId)
                                  .sort(
                                    (a, b) =>
                                      new Date(a.requestedAt) -
                                      new Date(b.requestedAt)
                                  );
                                const attemptNum =
                                  postOffers.findIndex(
                                    (co) => co.id === offer.id
                                  ) + 1;
                                const maxAttempts =
                                  postOffers.length >= 3 ? 3 : 3;
                                return `${attemptNum}/${maxAttempts}`;
                              })()}
                            </div>
                          </div>
                        </div>

                        {offer.requestReason && (
                          <div className="mb-2">
                            <small className="text-muted">
                              <FaComment className="me-1" />
                              Your Reason:
                            </small>
                            <div className="small bg-light p-2 rounded">
                              {offer.requestReason}
                            </div>
                          </div>
                        )}

                        {offer.technicianNotes && (
                          <div className="mb-2">
                            <small className="text-muted">Your Notes:</small>
                            <div className="small bg-light p-2 rounded">
                              {offer.technicianNotes}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Status & Timeline */}
                      <div className="col-md-6">
                        <h6 className="mb-3">Status & Timeline</h6>

                        <div className="timeline">
                          <div className="timeline-item">
                            <FaClock className="me-2 text-muted" />
                            <small className="text-muted">Submitted:</small>
                            <div className="small">
                              {formatDate(offer.requestedAt)}
                            </div>
                          </div>

                          {offer.status === "PENDING" && offer.expiresAt && (
                            <div className="timeline-item mt-2">
                              <FaHourglassHalf className="me-2 text-warning" />
                              <small className="text-muted">Expires:</small>
                              <div className="small">
                                {formatDate(offer.expiresAt)}
                                {(() => {
                                  const timeInfo = getTimeUntilExpiry(
                                    offer.expiresAt,
                                    offer.hoursUntilExpiry
                                  );
                                  return timeInfo ? (
                                    <span
                                      className={`ms-2 fw-bold ${timeInfo.className}`}
                                    >
                                      ({timeInfo.display})
                                    </span>
                                  ) : null;
                                })()}
                                {offer.isExpiringSoon && (
                                  <div className="mt-1">
                                    <small className="badge bg-warning text-dark">
                                      <FaExclamationTriangle className="me-1" />
                                      Expires soon!
                                    </small>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {offer.dealerResponseAt && (
                            <div className="timeline-item mt-2">
                              {offer.status === "ACCEPTED" ? (
                                <FaCheckCircle className="me-2 text-success" />
                              ) : (
                                <FaTimesCircle className="me-2 text-danger" />
                              )}
                              <small className="text-muted">
                                {offer.status === "ACCEPTED"
                                  ? "Accepted"
                                  : "Rejected"}
                                :
                              </small>
                              <div className="small">
                                {formatDate(offer.dealerResponseAt)}
                              </div>

                              {/* Show cooldown timer for rejected offers */}
                              {offer.status === "REJECTED" &&
                                getDisplayRemainingTime(offer) > 0 && (
                                  <div className="mt-1">
                                    <small className="badge bg-warning text-dark">
                                      <FaClock className="me-1" />
                                      Cooldown:{" "}
                                      {formatCooldownTime(
                                        getDisplayRemainingTime(offer)
                                      )}
                                    </small>
                                  </div>
                                )}

                              {/* Show "Can resubmit" for rejected offers past cooldown */}
                              {offer.status === "REJECTED" &&
                                getDisplayRemainingTime(offer) === 0 && (
                                  <div className="mt-1">
                                    <small className="badge bg-success">
                                      <FaCheckCircle className="me-1" />
                                      Can submit new counter offer
                                    </small>
                                  </div>
                                )}

                              {/* Show expired status for max attempts reached */}
                              {offer.status === "EXPIRED" && (
                                <div className="mt-1">
                                  <small className="badge bg-secondary">
                                    <FaExclamationTriangle className="me-1" />
                                    Max attempts reached (3/3)
                                  </small>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Dealer Response */}
                        {offer.dealerResponseNotes && (
                          <div className="mt-3">
                            <small className="text-muted">
                              <FaUser className="me-1" />
                              Dealer Response:
                            </small>
                            <div
                              className={`small p-2 rounded ${
                                offer.status === "ACCEPTED"
                                  ? "bg-success bg-opacity-10"
                                  : "bg-danger bg-opacity-10"
                              }`}
                            >
                              {offer.dealerResponseNotes}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              ))}
            </div>
          </>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
        <Button
          variant="primary"
          onClick={fetchCounterOfferStatus}
          disabled={loading}
        >
          {loading ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Refreshing...
            </>
          ) : (
            <>
              <FaSyncAlt className="me-2" />
              Refresh
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default TechnicianCounterOfferStatusModal;
