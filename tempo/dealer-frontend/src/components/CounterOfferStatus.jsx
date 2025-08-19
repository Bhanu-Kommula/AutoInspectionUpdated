import React, { useState, useEffect } from "react";
import {
  FaDollarSign,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaComment,
} from "react-icons/fa";
import api, { API_CONFIG } from "../api";

const CounterOfferStatus = ({
  technicianId,
  technicianEmail,
  onNewNotification,
}) => {
  const [counterOffers, setCounterOffers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch counter offer status
  const fetchCounterOfferStatus = async () => {
    if (!technicianId && !technicianEmail) return;

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setError("Authentication required");
        return;
      }

      const emailParam = technicianEmail || technicianId;
      const response = await api.get(
        `${
          API_CONFIG.TECHNICIAN_BASE_URL
        }/counter-offers/status?technicianEmail=${encodeURIComponent(
          emailParam
        )}`
      );

      if (response.data && response.data.success) {
        const offers = response.data.counterOffers || [];
        setCounterOffers(offers);

        // Check for newly accepted/rejected offers to show notifications
        const recentOffers = offers.filter((offer) => {
          if (!offer.dealerResponseAt) return false;
          const responseTime = new Date(offer.dealerResponseAt);
          const now = new Date();
          const timeDiff = now - responseTime;
          // Show notification for offers responded to in the last 2 minutes (more immediate)
          return timeDiff < 2 * 60 * 1000 && offer.status !== "PENDING";
        });

        recentOffers.forEach((offer) => {
          if (onNewNotification) {
            const message =
              offer.status === "ACCEPTED"
                ? `Your counter offer of $${offer.requestedOfferAmount} was accepted!`
                : `Your counter offer of $${offer.requestedOfferAmount} was rejected. You can submit another in 3 minutes.`;

            onNewNotification({
              type: offer.status === "ACCEPTED" ? "success" : "warning",
              message: message,
              timestamp: new Date().toISOString(),
            });
          }
        });
      } else {
        setError("Failed to load counter offer status");
      }
    } catch (err) {
      console.error("Error fetching counter offer status:", err);
      setError("Failed to load counter offer status");
    } finally {
      setLoading(false);
    }
  };

  // Fetch counter offer status on component mount
  useEffect(() => {
    fetchCounterOfferStatus();
  }, [technicianId]);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "ACCEPTED":
        return <FaCheckCircle className="text-success" />;
      case "REJECTED":
        return <FaTimesCircle className="text-danger" />;
      case "PENDING":
        return <FaClock className="text-warning" />;
      default:
        return <FaClock className="text-muted" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "ACCEPTED":
        return "#28a745";
      case "REJECTED":
        return "#dc3545";
      case "PENDING":
        return "#ffc107";
      default:
        return "#6c757d";
    }
  };

  if (loading && counterOffers.length === 0) {
    return (
      <div className="p-3 text-center">
        <div className="spinner-border spinner-border-sm" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <div className="mt-2 small">Loading counter offers...</div>
      </div>
    );
  }

  if (error) {
    return <div className="p-3 text-danger text-center small">{error}</div>;
  }

  if (counterOffers.length === 0) {
    return (
      <div className="p-3 text-muted text-center small">
        <FaDollarSign className="mb-2" />
        <div>No counter offers yet</div>
      </div>
    );
  }

  return (
    <div className="counter-offer-status">
      <div className="d-flex justify-content-between align-items-center mb-2 px-3 pt-2">
        <h6 className="mb-0">
          <FaDollarSign className="me-2" />
          Counter Offers ({counterOffers.length})
        </h6>
        <button
          className="btn btn-sm btn-outline-secondary"
          onClick={fetchCounterOfferStatus}
          disabled={loading}
        >
          {loading ? (
            <div className="spinner-border spinner-border-sm" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          ) : (
            "Refresh"
          )}
        </button>
      </div>

      <div style={{ maxHeight: "300px", overflowY: "auto" }}>
        {counterOffers.map((offer) => (
          <div
            key={offer.id}
            className="border-bottom p-3"
            style={{
              borderLeft: `4px solid ${getStatusColor(offer.status)}`,
              backgroundColor:
                offer.status === "ACCEPTED" ? "#f8f9fa" : "transparent",
            }}
          >
            <div className="d-flex justify-content-between align-items-start mb-1">
              <small className="fw-bold">Post #{offer.postId}</small>
              <div className="d-flex align-items-center">
                {getStatusIcon(offer.status)}
                <span
                  className="ms-1 small"
                  style={{ color: getStatusColor(offer.status) }}
                >
                  {offer.status}
                </span>
              </div>
            </div>

            <div className="row small mb-2">
              <div className="col-6">
                <div className="text-muted">Original:</div>
                <div className="fw-bold">${offer.originalOfferAmount}</div>
              </div>
              <div className="col-6">
                <div className="text-muted">Your Offer:</div>
                <div className="fw-bold text-primary">
                  ${offer.requestedOfferAmount}
                </div>
              </div>
            </div>

            {offer.requestReason && (
              <div className="mb-2">
                <small className="text-muted">
                  <FaComment className="me-1" />
                  Reason:
                </small>
                <div className="small">{offer.requestReason}</div>
              </div>
            )}

            <div className="small text-muted">
              Submitted: {formatDate(offer.requestedAt)}
              {offer.dealerResponseAt && (
                <div>Responded: {formatDate(offer.dealerResponseAt)}</div>
              )}
            </div>

            {offer.dealerResponseNotes && (
              <div className="mt-2 p-2 bg-light rounded">
                <small className="text-muted">Dealer Notes:</small>
                <div className="small">{offer.dealerResponseNotes}</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CounterOfferStatus;
