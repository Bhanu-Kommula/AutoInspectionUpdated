import React, { useState, useEffect } from "react";
import { Modal, Button, Card, Row, Col } from "react-bootstrap";
import {
  FaCheck,
  FaClock,
  FaTimes,
  FaHandshake,
  FaMapMarkerAlt,
  FaDollarSign,
  FaFileAlt,
} from "react-icons/fa";
import { useCountdown } from "../hooks/useCountdown";
import "./ModalStyles.css";

const AcceptConfirmationModal = ({
  show,
  onHide,
  onConfirm,
  onCancel,
  post,
  pendingCounterOffer,
  isProcessing = false,
}) => {
  const [isCountingDown, setIsCountingDown] = useState(false);

  // Initialize countdown with remaining seconds from pending counter offer
  const remainingSeconds = pendingCounterOffer?.remainingCooldownSeconds || 0;
  const { formatTime, formatTimeHuman, start, timeLeft, isComplete } =
    useCountdown(remainingSeconds);

  useEffect(() => {
    if (show && remainingSeconds > 0) {
      setIsCountingDown(true);
      start(remainingSeconds);
    } else {
      setIsCountingDown(false);
    }
  }, [show, remainingSeconds, start]);

  const handleConfirmAccept = () => {
    if (onConfirm) onConfirm();
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    onHide();
  };

  const hasPending = !!pendingCounterOffer?.hasPendingCounterOffer;
  const humanTime = formatTimeHuman();
  const isExpired = isComplete || timeLeft <= 0;

  const getTitle = () =>
    hasPending
      ? isExpired
        ? "Accept Original Offer (Counter Offer Expired)"
        : "Accept Original Offer with Pending Counter Offer"
      : "Accept Post";

  const getWarning = () => {
    if (!hasPending)
      return "Are you sure you want to accept this post with the original offer amount?";
    const type = pendingCounterOffer?.cooldownType;
    if (isExpired) {
      if (type === "DEALER_RESPONSE")
        return "Your counter offer has expired (dealer didn't respond within 48 hours). You can now accept the original offer without any restrictions.";
      if (type === "REJECTION_COOLDOWN")
        return "Your rejection cooldown has ended - you can now submit new counter offers or accept the original offer.";
      return "Your counter offer cooldown has expired. You can now accept the original offer.";
    }
    if (type === "DEALER_RESPONSE")
      return `Your counter offer is under review by the dealer. If you accept now, your counter offer will be withdrawn. Dealer has ${humanTime} left to respond.`;
    if (type === "REJECTION_COOLDOWN")
      return `Your counter offer was rejected. If you accept now, you cannot submit a new counter offer for ${humanTime} (${formatTime()}).`;
    return `You have a pending counter offer that will be withdrawn if you accept. Time remaining: ${humanTime} (${formatTime()})`;
  };

  return (
    <Modal
      show={show}
      onHide={handleCancel}
      centered
      size="lg"
      className="pro-modal pro-modal-accept"
    >
      <Modal.Header>
        <div className="pro-icon-circle me-2">
          <FaCheck className="text-white" />
        </div>
        <Modal.Title>{getTitle()}</Modal.Title>
        <Button
          variant="link"
          onClick={handleCancel}
          className="ms-auto p-0 text-white"
        >
          <FaTimes />
        </Button>
      </Modal.Header>

      <Modal.Body>
        <Card className="pro-card mb-3">
          <Card.Header>
            <FaFileAlt className="me-2 text-primary" /> Post Details
          </Card.Header>
          <Card.Body>
            <Row className="gy-3">
              <Col md={6}>
                <div className="pro-kv">
                  <FaMapMarkerAlt className="text-primary" />
                  <div>
                    <div className="pro-kv-label">Location</div>
                    <div className="pro-kv-value">
                      {post?.location || "N/A"}
                    </div>
                  </div>
                </div>
              </Col>
              <Col md={6}>
                <div className="pro-kv">
                  <FaDollarSign className="text-success" />
                  <div>
                    <div className="pro-kv-label">Original Offer</div>
                    <div className="pro-kv-value">
                      ${post?.offerAmount || "N/A"}
                    </div>
                  </div>
                </div>
              </Col>
              <Col xs={12}>
                <div className="pro-content-box">
                  <div className="pro-section-title mb-1">Content</div>
                  <div>{post?.content || "No content available"}</div>
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        <div
          className={`pro-alert ${
            hasPending ? "pro-alert-warning" : "pro-alert-success"
          } p-3 mb-3`}
        >
          <div className="d-flex align-items-start">
            {hasPending ? (
              <FaClock className="me-2 mt-1 text-warning" />
            ) : (
              <FaCheck className="me-2 mt-1 text-success" />
            )}
            <div>
              <div className="fw-semibold mb-1">
                {hasPending ? "Warning" : "Confirm"}
              </div>
              <div className="text-body-secondary small">{getWarning()}</div>
            </div>
          </div>
        </div>

        {hasPending && (
          <Card className="pro-card mb-2">
            <Card.Header>
              <FaHandshake className="me-2 text-warning" />
              {pendingCounterOffer?.cooldownType === "DEALER_RESPONSE"
                ? "Counter Offer Under Review"
                : pendingCounterOffer?.cooldownType === "REJECTION_COOLDOWN"
                ? "Rejection Cooldown Active"
                : "Pending Counter Offer Details"}
            </Card.Header>
            <Card.Body>
              <Row className="gy-2">
                <Col md={6}>
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="pro-kv-label">
                      {pendingCounterOffer?.cooldownType === "DEALER_RESPONSE"
                        ? "Dealer Response Time Left"
                        : pendingCounterOffer?.cooldownType ===
                          "REJECTION_COOLDOWN"
                        ? "Next Submission Available In"
                        : "Time Remaining"}
                    </div>
                    <div
                      className={`fw-bold ${
                        isExpired ? "text-success" : "text-warning"
                      }`}
                    >
                      {isExpired ? "Expired" : `${humanTime} (${formatTime()})`}
                    </div>
                  </div>
                </Col>
                {pendingCounterOffer?.pendingCounterOffer
                  ?.requestedOfferAmount && (
                  <Col md={6}>
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="pro-kv-label">
                        Your Counter Offer Amount
                      </div>
                      <div className="fw-bold text-success">
                        $
                        {
                          pendingCounterOffer.pendingCounterOffer
                            .requestedOfferAmount
                        }
                      </div>
                    </div>
                  </Col>
                )}
                {pendingCounterOffer?.pendingCounterOffer?.requestedAt && (
                  <Col xs={12}>
                    <div className="pro-kv-label">Submitted</div>
                    <div className="small text-body-secondary">
                      {new Date(
                        pendingCounterOffer.pendingCounterOffer.requestedAt
                      ).toLocaleString()}
                    </div>
                  </Col>
                )}
              </Row>
            </Card.Body>
          </Card>
        )}
      </Modal.Body>

      <Modal.Footer className="pro-footer">
        <Button
          variant="outline-secondary"
          onClick={handleCancel}
          disabled={isProcessing}
        >
          <FaTimes className="me-1" /> Cancel
        </Button>
        <Button
          className="pro-btn-primary"
          onClick={handleConfirmAccept}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" />{" "}
              Accepting...
            </>
          ) : (
            <>
              <FaCheck className="me-1" /> Accept Post
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AcceptConfirmationModal;
