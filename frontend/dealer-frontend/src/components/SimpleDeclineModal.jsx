import React from "react";
import { Modal, Button, Row, Col } from "react-bootstrap";
import { FaExclamationTriangle, FaTimes, FaMapMarkerAlt, FaDollarSign, FaFileAlt } from "react-icons/fa";
import "./ModalStyles.css";

const SimpleDeclineModal = ({ show, onHide, onConfirm, post, isProcessing = false }) => {
  const handleConfirm = () => {
    if (onConfirm) onConfirm();
  };

  const handleCancel = () => {
    onHide();
  };

  return (
    <Modal show={show} onHide={handleCancel} centered size="md" className="pro-modal pro-modal-decline">
      <Modal.Header>
        <div className="pro-icon-circle me-2">
          <FaExclamationTriangle className="text-white" />
        </div>
        <Modal.Title>Decline Post</Modal.Title>
        <Button variant="link" onClick={handleCancel} className="ms-auto p-0 text-white">
          <FaTimes />
        </Button>
      </Modal.Header>

      <Modal.Body>
        <div className="text-center mb-3">
          <div className="text-body-secondary mb-2">Are you sure you want to decline this post?</div>
        </div>

        <div className="pro-card p-3">
          <Row className="gy-3">
            <Col xs={12}>
              <div className="pro-kv">
                <FaMapMarkerAlt className="text-primary" />
                <div>
                  <div className="pro-kv-label">Location</div>
                  <div className="pro-kv-value">{post?.location || "N/A"}</div>
                </div>
              </div>
            </Col>
            <Col xs={12}>
              <div className="pro-kv">
                <FaDollarSign className="text-success" />
                <div>
                  <div className="pro-kv-label">Offer Amount</div>
                  <div className="pro-kv-value">${post?.offerAmount || "N/A"}</div>
                </div>
              </div>
            </Col>
            <Col xs={12}>
              <div className="pro-content-box">
                <div className="pro-kv">
                  <FaFileAlt className="text-primary" />
                  <div>
                    <div className="pro-kv-label">Content</div>
                    <div className="pro-kv-value">{post?.content || "No content available"}</div>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </div>
      </Modal.Body>

      <Modal.Footer className="pro-footer">
        <Button variant="outline-secondary" onClick={handleCancel} disabled={isProcessing}>
          <FaTimes className="me-1" /> Cancel
        </Button>
        <Button className="pro-btn-danger" onClick={handleConfirm} disabled={isProcessing}>
          {isProcessing ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" /> Declining...
            </>
          ) : (
            <>
              <FaExclamationTriangle className="me-1" /> Decline
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default SimpleDeclineModal;
