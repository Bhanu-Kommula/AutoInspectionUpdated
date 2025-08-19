import React, { useState, useEffect } from "react";
import {
  Modal,
  Button,
  Badge,
  Card,
  Spinner,
  Alert,
  Form,
} from "react-bootstrap";
import {
  FaClock,
  FaUser,
  FaMapMarkerAlt,
  FaDollarSign,
  FaComment,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaHourglassHalf,
  FaSyncAlt,
  FaInfoCircle,
  FaPhone,
  FaEnvelope,
} from "react-icons/fa";
import api from "../api";
import { API_CONFIG } from "../api";

const CounterOffersModal = ({ show, onHide, dealerId, onNotification }) => {
  const [loading, setLoading] = useState(false);
  const [pendingOffers, setPendingOffers] = useState({});
  const [totalCount, setTotalCount] = useState(0);
  const [processingOffer, setProcessingOffer] = useState(null);
  const [error, setError] = useState("");
  const [responseNotes, setResponseNotes] = useState("");
  const [selectedOfferId, setSelectedOfferId] = useState(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responseAction, setResponseAction] = useState("");

  // Fetch pending counter offers
  const fetchPendingOffers = async () => {
    if (!show || !dealerId) return;

    setLoading(true);
    setError("");

    try {
      const response = await api.get(
        // ✅ UPDATED: Use new posting service endpoint for fetching pending counter offers
        `${API_CONFIG.POSTS_BASE_URL}/counter-offers/pending/${dealerId}`
      );

      if (response.data && response.data.success) {
        setPendingOffers(response.data.pendingOffers || {});
        setTotalCount(response.data.totalPendingCount || 0);
      } else {
        setError("Failed to load pending counter offers");
      }
    } catch (err) {
      console.error("Error fetching pending offers:", err);
      setError("Failed to load pending counter offers");
    } finally {
      setLoading(false);
    }
  };

  // Handle dealer response to counter offer
  const handleOfferResponse = async (offerRequestId, action, notes = "") => {
    setProcessingOffer(offerRequestId);

    try {
      const response = await api.put(
        // ✅ UPDATED: Use new posting service endpoint for responding to counter offers
        `${API_CONFIG.POSTS_BASE_URL}/counter-offers/respond`,
        {
          counterOfferId: offerRequestId,
          action,
          responseNotes: notes,
        }
      );

      if (response.data && response.data.success) {
        onNotification(
          "success",
          `Counter offer ${action.toLowerCase()}ed successfully!`
        );
        // Refresh the offers list
        await fetchPendingOffers();
        setShowResponseModal(false);
        setResponseNotes("");
        setSelectedOfferId(null);
      } else {
        onNotification(
          "error",
          response.data?.message ||
            `Failed to ${action.toLowerCase()} counter offer`
        );
      }
    } catch (err) {
      console.error(`Error ${action.toLowerCase()}ing offer:`, err);
      onNotification(
        "error",
        `Failed to ${action.toLowerCase()} counter offer`
      );
    } finally {
      setProcessingOffer(null);
    }
  };

  // Handle response modal
  const handleResponseClick = (offerId, action) => {
    setSelectedOfferId(offerId);
    setResponseAction(action);
    setResponseNotes("");
    setShowResponseModal(true);
  };

  // Fetch offers when modal opens
  useEffect(() => {
    fetchPendingOffers();
  }, [show, dealerId]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status) => {
    const variants = {
      PENDING: "warning",
      ACCEPTED: "success",
      REJECTED: "danger",
      EXPIRED: "secondary",
    };

    return <Badge bg={variants[status] || "secondary"}>{status}</Badge>;
  };

  // Calculate time until expiry
  const getTimeUntilExpiry = (expiresAt, hoursUntilExpiry) => {
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

  // Get price difference display
  const getPriceDifferenceDisplay = (offer) => {
    if (!offer.priceDifference || offer.priceDifference === "N/A") {
      return null;
    }

    const isIncrease = offer.isPriceIncrease;
    const isDecrease = offer.isPriceDecrease;
    const difference = offer.priceDifference;
    const percentage = offer.percentageIncrease;

    return (
      <div
        className={`small ${
          isIncrease
            ? "text-success"
            : isDecrease
            ? "text-danger"
            : "text-muted"
        }`}
      >
        <FaDollarSign className="me-1" />
        {difference} ({percentage})
      </div>
    );
  };

  return (
    <>
      <Modal show={show} onHide={onHide} size="xl" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <FaDollarSign className="me-2 text-primary" />
            Pending Counter Offers ({totalCount})
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: "70vh", overflowY: "auto" }}>
          {loading ? (
            <div className="text-center py-4">
              <Spinner animation="border" />
              <p className="mt-2">Loading counter offers...</p>
            </div>
          ) : error ? (
            <Alert variant="danger">
              <FaExclamationTriangle className="me-2" />
              {error}
            </Alert>
          ) : totalCount === 0 ? (
            <div className="text-center py-4">
              <div className="mb-3">
                <FaDollarSign size={48} className="text-muted" />
              </div>
              <h5>No Pending Counter Offers</h5>
              <p className="text-muted">
                When technicians submit counter offers for your posts, they'll
                appear here.
              </p>
            </div>
          ) : (
            <div>
              {Object.entries(pendingOffers).map(([postKey, postData]) => (
                <Card key={postKey} className="mb-4 border-primary">
                  <Card.Header className="bg-primary bg-opacity-10">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="mb-0">
                          <FaInfoCircle className="me-2 text-primary" />
                          Post #{postData.post.id}
                        </h6>
                        <small className="text-muted">
                          {postData.post.content}
                        </small>
                      </div>
                      <Badge bg="primary" className="fs-6">
                        {postData.count} offer{postData.count !== 1 ? "s" : ""}
                      </Badge>
                    </div>
                  </Card.Header>
                  <Card.Body>
                    <div className="mb-3">
                      <strong>Post Details:</strong>
                      <div className="text-muted small">
                        <FaMapMarkerAlt className="me-1" />
                        {postData.post.location} •
                        <FaDollarSign className="me-1 ms-2" />
                        Original Offer: ${postData.post.offerAmount}
                      </div>
                    </div>

                    {postData.pendingOffers.map((offer, index) => (
                      <div
                        key={offer.id}
                        className={`border rounded p-3 ${
                          index > 0 ? "mt-3" : ""
                        } ${offer.isExpiringSoon ? "border-warning" : ""}`}
                      >
                        <div className="row">
                          <div className="col-md-8">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <div>
                                <h6 className="mb-1">
                                  <FaUser className="me-2 text-primary" />
                                  {offer.technicianName || "Unknown Technician"}
                                </h6>
                              </div>
                              <div className="text-end">
                                {getStatusBadge(offer.status)}
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

                            <div className="mb-3">
                              <div className="row">
                                <div className="col-6">
                                  <small className="text-muted">
                                    Original Amount:
                                  </small>
                                  <div className="fw-bold text-muted">
                                    <FaDollarSign className="me-1" />
                                    {offer.originalOfferAmount}
                                  </div>
                                </div>
                                <div className="col-6">
                                  <small className="text-muted">
                                    Requested Amount:
                                  </small>
                                  <div className="fw-bold text-success">
                                    <FaDollarSign className="me-1" />
                                    {offer.requestedOfferAmount}
                                  </div>
                                  {getPriceDifferenceDisplay(offer)}
                                </div>
                              </div>
                            </div>

                            <div className="mb-2">
                              <FaMapMarkerAlt className="me-1 text-muted" />
                              <small>{offer.technicianLocation}</small>
                            </div>

                            {offer.requestReason && (
                              <div className="mb-2">
                                <small className="text-muted">
                                  <FaComment className="me-1" />
                                  Reason:
                                </small>
                                <div className="small bg-light p-2 rounded">
                                  {offer.requestReason}
                                </div>
                              </div>
                            )}

                            {offer.technicianNotes && (
                              <div className="mb-2">
                                <small className="text-muted">Notes:</small>
                                <div className="small bg-light p-2 rounded">
                                  {offer.technicianNotes}
                                </div>
                              </div>
                            )}

                            <div className="small text-muted">
                              <FaClock className="me-1" />
                              Submitted: {formatDate(offer.requestedAt)}
                              {offer.hoursUntilExpiry > 0 && (
                                <span className="ms-2">
                                  • Expires in {offer.hoursUntilExpiry} hours
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="col-md-4">
                            {offer.status === "PENDING" && (
                              <div className="d-grid gap-2">
                                <Button
                                  variant="success"
                                  size="sm"
                                  disabled={processingOffer === offer.id}
                                  onClick={() =>
                                    handleResponseClick(offer.id, "ACCEPT")
                                  }
                                >
                                  {processingOffer === offer.id ? (
                                    <Spinner animation="border" size="sm" />
                                  ) : (
                                    <>
                                      <FaCheckCircle className="me-1" />
                                      Accept
                                    </>
                                  )}
                                </Button>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  disabled={processingOffer === offer.id}
                                  onClick={() =>
                                    handleResponseClick(offer.id, "REJECT")
                                  }
                                >
                                  <FaTimesCircle className="me-1" />
                                  Decline
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </Card.Body>
                </Card>
              ))}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Close
          </Button>
          <Button
            variant="primary"
            onClick={fetchPendingOffers}
            disabled={loading}
          >
            {loading ? (
              <Spinner animation="border" size="sm" />
            ) : (
              <>
                <FaSyncAlt className="me-1" />
                Refresh
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Response Notes Modal */}
      <Modal
        show={showResponseModal}
        onHide={() => setShowResponseModal(false)}
        size="md"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {responseAction === "ACCEPT" ? (
              <FaCheckCircle className="me-2 text-success" />
            ) : (
              <FaTimesCircle className="me-2 text-danger" />
            )}
            {responseAction === "ACCEPT" ? "Accept" : "Decline"} Counter Offer
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label>Response Notes (Optional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder={`Add a note for the technician about why you're ${responseAction.toLowerCase()}ing this counter offer...`}
                value={responseNotes}
                onChange={(e) => setResponseNotes(e.target.value)}
                maxLength={500}
              />
              <Form.Text className="text-muted">
                {responseNotes.length}/500 characters
              </Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowResponseModal(false)}
          >
            Cancel
          </Button>
          <Button
            variant={responseAction === "ACCEPT" ? "success" : "danger"}
            onClick={() =>
              handleOfferResponse(
                selectedOfferId,
                responseAction,
                responseNotes
              )
            }
            disabled={processingOffer === selectedOfferId}
          >
            {processingOffer === selectedOfferId ? (
              <Spinner animation="border" size="sm" />
            ) : (
              <>
                {responseAction === "ACCEPT" ? (
                  <FaCheckCircle className="me-1" />
                ) : (
                  <FaTimesCircle className="me-1" />
                )}
                {responseAction === "ACCEPT" ? "Accept" : "Decline"} Offer
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default CounterOffersModal;
