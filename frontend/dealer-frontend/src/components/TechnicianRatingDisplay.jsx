import React, { useState, useEffect } from "react";
import {
  Card,
  Badge,
  Spinner,
  Alert,
  Row,
  Col,
  ProgressBar,
  Modal,
  Button,
} from "react-bootstrap";
import {
  FaStar,
  FaStarHalfAlt,
  FaUser,
  FaCalendarAlt,
  FaComment,
} from "react-icons/fa";
import api from "../api";

const TechnicianRatingDisplay = ({
  technicianEmail,
  showDetailed = false,
  className = "",
}) => {
  const [ratingSummary, setRatingSummary] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAllRatings, setShowAllRatings] = useState(false);

  useEffect(() => {
    if (technicianEmail) {
      fetchRatingData();
    }
  }, [technicianEmail]);

  const fetchRatingData = async () => {
    try {
      setLoading(true);
      setError("");

      // Fetch rating summary
      const summaryResponse = await api.get(
        `/api/ratings/technician/${technicianEmail}/summary`
      );
      setRatingSummary(summaryResponse.data);

      // If detailed view is requested, also fetch individual ratings
      if (showDetailed) {
        const ratingsResponse = await api.get(
          `/api/ratings/technician/${technicianEmail}`
        );
        setRatings(
          Array.isArray(ratingsResponse.data)
            ? ratingsResponse.data
            : ratingsResponse.data.content || []
        );
      }
    } catch (error) {
      console.error("Error fetching rating data:", error);
      setError("Failed to load rating information");
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating, size = 16) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(
          <FaStar
            key={i}
            size={size}
            style={{ color: "#ffc107", marginRight: "2px" }}
          />
        );
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(
          <FaStarHalfAlt
            key={i}
            size={size}
            style={{ color: "#ffc107", marginRight: "2px" }}
          />
        );
      } else {
        stars.push(
          <FaStar
            key={i}
            size={size}
            style={{ color: "#e4e5e9", marginRight: "2px" }}
          />
        );
      }
    }

    return stars;
  };

  const getRatingColor = (rating) => {
    if (rating >= 4.5) return "success";
    if (rating >= 4.0) return "primary";
    if (rating >= 3.5) return "info";
    if (rating >= 3.0) return "warning";
    return "danger";
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className={`text-center py-3 ${className}`}>
        <Spinner animation="border" size="sm" />
        <span className="ms-2">Loading ratings...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="warning" className={className}>
        {error}
      </Alert>
    );
  }

  if (!ratingSummary || ratingSummary.totalRatings === 0) {
    return (
      <div className={`text-muted text-center py-2 ${className}`}>
        <small>No ratings yet</small>
      </div>
    );
  }

  const avgRating = parseFloat(ratingSummary.averageRating);

  return (
    <div className={className}>
      {/* Compact Rating Display */}
      {!showDetailed && (
        <div className="d-flex align-items-center">
          <div className="me-2">{renderStars(avgRating)}</div>
          <Badge bg={getRatingColor(avgRating)} className="me-2">
            {avgRating.toFixed(1)}
          </Badge>
          <small className="text-muted">
            ({ratingSummary.totalRatings} review
            {ratingSummary.totalRatings !== 1 ? "s" : ""})
          </small>
        </div>
      )}

      {/* Detailed Rating Display */}
      {showDetailed && (
        <Card className="rating-summary-card">
          <Card.Header className="bg-light">
            <div className="d-flex justify-content-between align-items-center">
              <h6 className="mb-0">Technician Ratings</h6>
              <Badge
                bg={getRatingColor(avgRating)}
                className="rating-quality-badge"
              >
                {ratingSummary.ratingQuality}
              </Badge>
            </div>
          </Card.Header>

          <Card.Body>
            {/* Overall Rating */}
            <Row className="mb-4">
              <Col md={6}>
                <div className="text-center">
                  <div className="display-4 fw-bold text-primary mb-2">
                    {avgRating.toFixed(1)}
                  </div>
                  <div className="mb-2">{renderStars(avgRating, 24)}</div>
                  <div className="text-muted">
                    Based on {ratingSummary.totalRatings} review
                    {ratingSummary.totalRatings !== 1 ? "s" : ""}
                  </div>
                </div>
              </Col>

              <Col md={6}>
                {/* Rating Distribution */}
                <div className="rating-distribution">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count =
                      ratingSummary[
                        `${
                          ["", "one", "two", "three", "four", "five"][star]
                        }StarCount`
                      ];
                    const percentage =
                      ratingSummary.totalRatings > 0
                        ? (count / ratingSummary.totalRatings) * 100
                        : 0;

                    return (
                      <div
                        key={star}
                        className="d-flex align-items-center mb-2"
                      >
                        <span className="me-2" style={{ minWidth: "60px" }}>
                          {star}{" "}
                          <FaStar size={12} style={{ color: "#ffc107" }} />
                        </span>
                        <ProgressBar
                          now={percentage}
                          className="flex-grow-1 me-2"
                          style={{ height: "8px" }}
                          variant={getRatingColor(star)}
                        />
                        <span
                          className="text-muted"
                          style={{ minWidth: "40px" }}
                        >
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </Col>
            </Row>

            {/* Rating Insights */}
            <Row className="mb-3">
              <Col md={4}>
                <div className="text-center p-3 bg-light rounded">
                  <div className="fw-bold text-success">
                    {ratingSummary.eligibleForPremiumJobs ? "Yes" : "No"}
                  </div>
                  <small className="text-muted">Premium Eligible</small>
                </div>
              </Col>
              <Col md={4}>
                <div className="text-center p-3 bg-light rounded">
                  <div className="fw-bold">
                    {ratingSummary.ratingPercentage?.toFixed(0)}%
                  </div>
                  <small className="text-muted">Rating Score</small>
                </div>
              </Col>
              <Col md={4}>
                <div className="text-center p-3 bg-light rounded">
                  <div className="fw-bold text-info">
                    {ratingSummary.lastRatedAt
                      ? formatDate(ratingSummary.lastRatedAt)
                      : "N/A"}
                  </div>
                  <small className="text-muted">Last Rated</small>
                </div>
              </Col>
            </Row>

            {/* Recent Reviews */}
            {ratings.length > 0 && (
              <>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="mb-0">Recent Reviews</h6>
                  {ratings.length > 3 && (
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => setShowAllRatings(true)}
                    >
                      View All ({ratings.length})
                    </Button>
                  )}
                </div>

                {ratings.slice(0, 3).map((rating, index) => (
                  <div key={rating.id} className="border-bottom pb-3 mb-3">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        {renderStars(rating.rating, 14)}
                        <span className="ms-2 fw-bold">{rating.rating}/5</span>
                      </div>
                      <small className="text-muted">
                        <FaCalendarAlt className="me-1" />
                        {formatDate(rating.createdAt)}
                      </small>
                    </div>

                    {rating.reviewComment && (
                      <div className="text-muted">
                        <FaComment className="me-2" />
                        <em>"{rating.reviewComment}"</em>
                      </div>
                    )}

                    <div className="mt-2">
                      <small className="text-muted">
                        Job: {rating.postTitle || "Vehicle Inspection"} •{" "}
                        {rating.postLocation}
                      </small>
                    </div>
                  </div>
                ))}
              </>
            )}
          </Card.Body>
        </Card>
      )}

      {/* All Ratings Modal */}
      <Modal
        show={showAllRatings}
        onHide={() => setShowAllRatings(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            All Ratings for {ratingSummary.technicianName || technicianEmail}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: "500px", overflowY: "auto" }}>
          {ratings.map((rating, index) => (
            <div key={rating.id} className="border-bottom pb-3 mb-3">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div>
                  {renderStars(rating.rating, 16)}
                  <span className="ms-2 fw-bold">{rating.rating}/5</span>
                </div>
                <small className="text-muted">
                  <FaCalendarAlt className="me-1" />
                  {formatDate(rating.createdAt)}
                </small>
              </div>

              {rating.reviewComment && (
                <div className="mb-2">
                  <FaComment className="me-2 text-muted" />
                  <em>"{rating.reviewComment}"</em>
                </div>
              )}

              <div>
                <small className="text-muted">
                  <strong>Job:</strong>{" "}
                  {rating.postTitle || "Vehicle Inspection"} •{" "}
                  {rating.postLocation}
                </small>
              </div>
            </div>
          ))}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAllRatings(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      <style jsx>{`
        .rating-summary-card {
          border: none;
          box-shadow: 0 2px 20px rgba(0, 0, 0, 0.08);
          border-radius: 12px;
        }

        .rating-quality-badge {
          font-size: 0.75rem;
          padding: 0.5rem 0.75rem;
        }

        .rating-distribution .progress {
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
};

export default TechnicianRatingDisplay;
