import React, { useState, useEffect } from "react";
import {
  Modal,
  Button,
  Form,
  Alert,
  Spinner,
  Card,
  Badge,
  Row,
  Col,
} from "react-bootstrap";
import {
  FaDollarSign,
  FaUser,
  FaMapMarkerAlt,
  FaComment,
  FaExclamationTriangle,
  FaInfoCircle,
  FaHandshake,
  FaFileAlt,
} from "react-icons/fa";

/**
 * Modern Counter Offer Modal - Clean Design
 * Redesigned with better visual hierarchy and modern styling
 */
const TechnicianCounterOfferModal = ({
  show,
  onHide,
  post,
  technician,
  onSubmit,
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState({
    counterOfferAmount: "",
    requestReason: "",
    notes: "",
  });
  const [errors, setErrors] = useState({});
  const [isValid, setIsValid] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (show) {
      setFormData({
        counterOfferAmount: "",
        requestReason: "",
        notes: "",
      });
      setErrors({});
      setIsValid(false);
    }
  }, [show]);

  // Validation constants
  const MIN_AMOUNT = 1.0;
  const MAX_AMOUNT = 10000.0;

  // Clean and format amount input
  const cleanAmountInput = (value) => {
    let cleaned = value.replace(/[^0-9.,]/g, "");
    cleaned = cleaned.replace(/,/g, "");
    const parts = cleaned.split(".");
    if (parts.length > 2) {
      cleaned = parts[0] + "." + parts.slice(1).join("");
    }
    if (parts[1] && parts[1].length > 2) {
      cleaned = parts[0] + "." + parts[1].substring(0, 2);
    }
    return cleaned;
  };

  // Format amount when leaving field
  const formatAmountOnBlur = (value) => {
    if (!value || value.trim() === "") return value;

    let cleaned = value.replace(/[$,]/g, "").trim();
    const num = parseFloat(cleaned);

    if (isNaN(num)) return value;

    if (cleaned.includes(".")) {
      return num.toFixed(Math.min(2, cleaned.split(".")[1].length));
    }

    return num.toFixed(2);
  };

  // Check if form has basic data to enable submit button
  const hasBasicData = () => {
    return formData.counterOfferAmount.trim() !== "";
  };

  // Validate form for submission (strict validation)
  const validateFormForSubmission = () => {
    const newErrors = {};
    let valid = true;

    // Validate counter offer amount
    if (!formData.counterOfferAmount.trim()) {
      newErrors.counterOfferAmount = "Counter offer amount is required";
      valid = false;
    } else {
      // Use the same cleaning logic as the input
      const cleanAmount = cleanAmountInput(formData.counterOfferAmount);
      const amount = parseFloat(cleanAmount);

      if (isNaN(amount) || amount < MIN_AMOUNT) {
        newErrors.counterOfferAmount = `Amount must be at least $${MIN_AMOUNT}`;
        valid = false;
      } else if (amount > MAX_AMOUNT) {
        newErrors.counterOfferAmount = `Amount cannot exceed $${MAX_AMOUNT}`;
        valid = false;
      } else if (post) {
        const originalAmount = parseFloat(
          post.offerAmount.replace(/[$,]/g, "")
        );

        if (amount === originalAmount) {
          newErrors.counterOfferAmount =
            "Counter offer must be different from original amount";
          valid = false;
        }
      }
    }

    // Validate request reason length
    if (formData.requestReason && formData.requestReason.length > 500) {
      newErrors.requestReason = "Request reason must not exceed 500 characters";
      valid = false;
    }

    // Validate notes length
    if (formData.notes && formData.notes.length > 1000) {
      newErrors.notes = "Notes must not exceed 1000 characters";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  // Validate form for display (light validation)
  const validateForm = () => {
    const newErrors = {};
    let valid = true;

    // Only validate if user has entered something
    if (formData.counterOfferAmount.trim()) {
      const cleanAmount = cleanAmountInput(formData.counterOfferAmount);
      const amount = parseFloat(cleanAmount);

      if (isNaN(amount) || amount < MIN_AMOUNT) {
        newErrors.counterOfferAmount = `Amount must be at least $${MIN_AMOUNT}`;
        valid = false;
      } else if (amount > MAX_AMOUNT) {
        newErrors.counterOfferAmount = `Amount cannot exceed $${MAX_AMOUNT}`;
        valid = false;
      } else if (post) {
        const originalAmount = parseFloat(
          post.offerAmount.replace(/[$,]/g, "")
        );

        if (amount === originalAmount) {
          newErrors.counterOfferAmount =
            "Counter offer must be different from original amount";
          valid = false;
        }
      }
    }

    setErrors(newErrors);
    setIsValid(valid);
    return valid;
  };

  // Handle input changes - no validation while typing
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error for this field immediately
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  // Handle field blur - validate only when leaving field
  const handleFieldBlur = (field, value) => {
    // Only validate amount field on blur
    if (field === "counterOfferAmount") {
      const formattedValue = formatAmountOnBlur(value);
      setFormData((prev) => ({
        ...prev,
        [field]: formattedValue,
      }));

      // Validate after formatting
      setTimeout(() => {
        validateForm();
      }, 50);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Use strict validation for submission
    if (!validateFormForSubmission()) {
      return;
    }

    const cleanAmount = formData.counterOfferAmount.replace(/[$,]/g, "").trim();
    const numericAmount = parseFloat(cleanAmount);
    const formattedAmount = numericAmount.toFixed(2);

    const submissionData = {
      postId: post.id,
      counterOfferAmount: formattedAmount,
      requestReason: formData.requestReason.trim(),
      notes: formData.notes.trim(),
    };

    try {
      await onSubmit(submissionData);
      onHide();
    } catch (error) {
      console.error("Error submitting counter offer:", error);
      setErrors({
        submit:
          error.message || "Failed to submit counter offer. Please try again.",
      });
    }
  };

  if (!post) {
    return null;
  }

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header
        closeButton
        className="bg-gradient-primary text-white border-0"
      >
        <Modal.Title className="d-flex align-items-center">
          <FaHandshake className="me-3" size={24} />
          <div>
            <h4 className="mb-0">Submit Counter Offer</h4>
            <small className="opacity-75">Negotiate the best deal</small>
          </div>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="p-0">
        {/* Summary Cards */}
        <div className="p-4 bg-light border-bottom">
          <Row>
            <Col md={6}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body className="p-3">
                  <div className="d-flex align-items-center mb-2">
                    <FaMapMarkerAlt className="text-primary me-2" />
                    <h6 className="mb-0">Post Details</h6>
                  </div>
                  <p className="mb-1 small">
                    <strong>Location:</strong> {post.location}
                  </p>
                  <p className="mb-1 small">
                    <strong>Description:</strong>{" "}
                    {post.content || "No description"}
                  </p>
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="small">
                      <strong>Original:</strong>
                    </span>
                    <Badge bg="secondary" className="fs-6">
                      ${post.offerAmount}
                    </Badge>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body className="p-3">
                  <div className="d-flex align-items-center mb-2">
                    <FaUser className="text-info me-2" />
                    <h6 className="mb-0">Your Info</h6>
                  </div>
                  <p className="mb-1 small">
                    <strong>Name:</strong> {technician?.name}
                  </p>
                  <p className="mb-1 small">
                    <strong>Email:</strong> {technician?.email}
                  </p>
                  <p className="mb-0 small">
                    <strong>Location:</strong> {technician?.location}
                  </p>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </div>

        {/* Form Section */}
        <div className="p-4">
          <Form onSubmit={handleSubmit}>
            {/* Amount Field - Redesigned */}
            <div className="mb-4">
              <Form.Label className="fw-bold text-dark mb-2">
                <FaDollarSign className="me-2 text-success" />
                Counter Offer Amount *
              </Form.Label>

              <div className="position-relative">
                <div className="input-group input-group-lg">
                  <span className="input-group-text bg-success text-white border-0">
                    <FaDollarSign size={18} />
                  </span>
                  <Form.Control
                    type="text"
                    placeholder="Enter your counter offer amount"
                    value={formData.counterOfferAmount}
                    onChange={(e) =>
                      handleInputChange(
                        "counterOfferAmount",
                        cleanAmountInput(e.target.value)
                      )
                    }
                    onBlur={(e) =>
                      handleFieldBlur("counterOfferAmount", e.target.value)
                    }
                    isInvalid={!!errors.counterOfferAmount}
                    disabled={isSubmitting}
                    className="border-0 shadow-none fs-5"
                    style={{
                      backgroundColor: "#f8f9fa",
                      borderLeft: "none",
                      borderRight: "none",
                      borderTop: "none",
                      borderBottom: errors.counterOfferAmount
                        ? "2px solid #dc3545"
                        : "2px solid #28a745",
                    }}
                  />
                </div>

                {errors.counterOfferAmount && (
                  <div className="text-danger small mt-1 d-flex align-items-center">
                    <FaExclamationTriangle className="me-1" />
                    {errors.counterOfferAmount}
                  </div>
                )}

                <div className="text-muted small mt-2">
                  Range: ${MIN_AMOUNT} - ${MAX_AMOUNT.toLocaleString()} • Submit
                  button enables when you enter an amount
                </div>
              </div>
            </div>

            {/* Reason Field - Redesigned */}
            <div className="mb-4">
              <Form.Label className="fw-bold text-dark mb-2">
                <FaComment className="me-2 text-primary" />
                Reason for Counter Offer
              </Form.Label>

              <div className="position-relative">
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Explain why you're requesting a different amount..."
                  value={formData.requestReason}
                  onChange={(e) =>
                    handleInputChange("requestReason", e.target.value)
                  }
                  isInvalid={!!errors.requestReason}
                  disabled={isSubmitting}
                  maxLength={500}
                  className="border-0 shadow-none"
                  style={{
                    backgroundColor: "#f8f9fa",
                    border: "2px solid #e9ecef",
                    borderRadius: "8px",
                    resize: "none",
                  }}
                />

                {errors.requestReason && (
                  <div className="text-danger small mt-1 d-flex align-items-center">
                    <FaExclamationTriangle className="me-1" />
                    {errors.requestReason}
                  </div>
                )}

                <div className="text-muted small mt-2 text-end">
                  {formData.requestReason.length}/500 characters
                </div>
              </div>
            </div>

            {/* Notes Field - Redesigned */}
            <div className="mb-4">
              <Form.Label className="fw-bold text-dark mb-2">
                <FaFileAlt className="me-2 text-info" />
                Additional Notes
              </Form.Label>

              <div className="position-relative">
                <Form.Control
                  as="textarea"
                  rows={2}
                  placeholder="Any additional information or special requirements..."
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  isInvalid={!!errors.notes}
                  disabled={isSubmitting}
                  maxLength={1000}
                  className="border-0 shadow-none"
                  style={{
                    backgroundColor: "#f8f9fa",
                    border: "2px solid #e9ecef",
                    borderRadius: "8px",
                    resize: "none",
                  }}
                />

                {errors.notes && (
                  <div className="text-danger small mt-1 d-flex align-items-center">
                    <FaExclamationTriangle className="me-1" />
                    {errors.notes}
                  </div>
                )}

                <div className="text-muted small mt-2 text-end">
                  {formData.notes.length}/1000 characters
                </div>
              </div>
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <Alert variant="danger" className="border-0 shadow-sm">
                <FaExclamationTriangle className="me-2" />
                {errors.submit}
              </Alert>
            )}

            {/* Info Alert - Redesigned */}
            <Alert
              variant="light"
              className="border-0 shadow-sm bg-info bg-opacity-10"
            >
              <div className="d-flex align-items-start">
                <FaInfoCircle className="text-info me-3 mt-1" size={20} />
                <div>
                  <strong className="text-info">Important Information</strong>
                  <p className="mb-0 small mt-1">
                    Your counter offer will be sent to the dealer for review.
                    You'll be notified of their decision within 48 hours. The
                    offer will automatically expire if not responded to within
                    this timeframe.
                  </p>
                </div>
              </div>
            </Alert>
          </Form>
        </div>
      </Modal.Body>

      <Modal.Footer className="bg-light border-0 p-4">
        <Button
          variant="outline-secondary"
          onClick={onHide}
          disabled={isSubmitting}
          className="px-4 py-2"
        >
          Cancel
        </Button>
        <Button
          variant="success"
          onClick={handleSubmit}
          disabled={!hasBasicData() || isSubmitting}
          className="px-4 py-2 shadow-sm"
        >
          {isSubmitting ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Submitting...
            </>
          ) : (
            <>
              <FaHandshake className="me-2" />
              Submit Counter Offer
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default TechnicianCounterOfferModal;
