import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert, Spinner } from 'react-bootstrap';
import { FaStar, FaStarHalfAlt } from 'react-icons/fa';
import api from '../api';
import { toast } from 'react-toastify';

const RatingModal = ({ 
  show, 
  onHide, 
  post, 
  dealerEmail, 
  onRatingSubmitted 
}) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [existingRating, setExistingRating] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (show && post) {
      fetchExistingRating();
    } else {
      resetForm();
    }
  }, [show, post]);

  const resetForm = () => {
    setRating(0);
    setHoverRating(0);
    setReviewComment('');
    setError('');
    setExistingRating(null);
    setIsEditing(false);
  };

  const fetchExistingRating = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/ratings/post/${post.id}`);
      if (response.data) {
        setExistingRating(response.data);
        setRating(response.data.rating);
        setReviewComment(response.data.reviewComment || '');
        setIsEditing(true);
      }
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error('Error fetching existing rating:', error);
      }
      // 404 is expected if no rating exists yet
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const ratingData = {
        postId: post.id,
        dealerEmail: dealerEmail,
        technicianEmail: post.technicianEmail,
        rating: rating,
        reviewComment: reviewComment.trim()
      };

      let response;
      if (isEditing && existingRating) {
        // Update existing rating
        response = await api.put(`/api/ratings/${existingRating.id}`, ratingData);
        toast.success('Rating updated successfully!');
      } else {
        // Create new rating
        response = await api.post('/api/ratings', ratingData);
        toast.success('Rating submitted successfully!');
      }

      if (onRatingSubmitted) {
        onRatingSubmitted(response.data);
      }
      
      onHide();
    } catch (error) {
      console.error('Error submitting rating:', error);
      const errorMessage = error.response?.data || 'Failed to submit rating. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = () => {
    const stars = [];
    const currentRating = hoverRating || rating;
    
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <FaStar
          key={i}
          size={32}
          className={`rating-star ${i <= currentRating ? 'filled' : 'empty'}`}
          style={{
            color: i <= currentRating ? '#ffc107' : '#e4e5e9',
            cursor: 'pointer',
            marginRight: '4px',
            transition: 'color 0.2s ease-in-out'
          }}
          onClick={() => setRating(i)}
          onMouseEnter={() => setHoverRating(i)}
          onMouseLeave={() => setHoverRating(0)}
        />
      );
    }
    
    return stars;
  };

  const getRatingText = (ratingValue) => {
    switch (ratingValue) {
      case 1: return 'Poor';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Very Good';
      case 5: return 'Excellent';
      default: return 'Select Rating';
    }
  };

  if (!post) return null;

  return (
    <Modal show={show} onHide={onHide} centered size="md" className="rating-modal">
      <Modal.Header closeButton className="bg-primary text-white">
        <Modal.Title>
          {isEditing ? 'Update Rating' : 'Rate Technician'}
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body className="p-4">
        {loading && !isEditing ? (
          <div className="text-center py-4">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
            <p className="mt-2">Loading rating information...</p>
          </div>
        ) : (
          <>
            {/* Job Information */}
            <div className="mb-4 p-3 bg-light rounded">
              <h6 className="mb-2 text-primary">Job Details</h6>
              <p className="mb-1"><strong>Job:</strong> {post.content}</p>
              <p className="mb-1"><strong>Location:</strong> {post.location}</p>
              <p className="mb-1"><strong>Technician:</strong> {post.technicianName || post.technicianEmail}</p>
              <p className="mb-0"><strong>Amount:</strong> ${post.offerAmount}</p>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            <Form onSubmit={handleSubmit}>
              {/* Star Rating */}
              <Form.Group className="mb-4">
                <Form.Label className="fw-bold">How would you rate this technician's work?</Form.Label>
                <div className="d-flex align-items-center mb-2">
                  {renderStars()}
                  <span className="ms-3 text-muted">
                    {getRatingText(hoverRating || rating)}
                  </span>
                </div>
                <Form.Text className="text-muted">
                  Click on the stars to rate from 1 (Poor) to 5 (Excellent)
                </Form.Text>
              </Form.Group>

              {/* Review Comment */}
              <Form.Group className="mb-4">
                <Form.Label className="fw-bold">Review Comment (Optional)</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share your experience with this technician's work quality, professionalism, timeliness, etc."
                  maxLength={1000}
                />
                <Form.Text className="text-muted">
                  {reviewComment.length}/1000 characters
                </Form.Text>
              </Form.Group>

              {/* Rating Guidelines */}
              <div className="mb-4 p-3 bg-info bg-opacity-10 rounded">
                <h6 className="text-info mb-2">Rating Guidelines</h6>
                <ul className="mb-0 small">
                  <li><strong>5 Stars:</strong> Exceptional work, exceeded expectations</li>
                  <li><strong>4 Stars:</strong> Very good work, met expectations well</li>
                  <li><strong>3 Stars:</strong> Good work, met basic expectations</li>
                  <li><strong>2 Stars:</strong> Fair work, some issues but acceptable</li>
                  <li><strong>1 Star:</strong> Poor work, did not meet expectations</li>
                </ul>
              </div>

              {/* Existing Rating Info */}
              {existingRating && (
                <div className="mb-3 p-3 bg-warning bg-opacity-10 rounded">
                  <h6 className="text-warning mb-2">Existing Rating</h6>
                  <p className="mb-1">
                    <strong>Previous Rating:</strong> {existingRating.rating}/5 stars
                  </p>
                  <p className="mb-1">
                    <strong>Submitted:</strong> {new Date(existingRating.createdAt).toLocaleDateString()}
                  </p>
                  {existingRating.reviewComment && (
                    <p className="mb-0">
                      <strong>Previous Comment:</strong> {existingRating.reviewComment}
                    </p>
                  )}
                </div>
              )}
            </Form>
          </>
        )}
      </Modal.Body>
      
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={loading}>
          Cancel
        </Button>
        <Button 
          variant="primary" 
          onClick={handleSubmit}
          disabled={loading || rating === 0}
        >
          {loading ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              {isEditing ? 'Updating...' : 'Submitting...'}
            </>
          ) : (
            isEditing ? 'Update Rating' : 'Submit Rating'
          )}
        </Button>
      </Modal.Footer>

      <style jsx>{`
        .rating-star {
          transition: all 0.2s ease-in-out;
        }
        
        .rating-star:hover {
          transform: scale(1.1);
        }
        
        .rating-modal .modal-content {
          border: none;
          border-radius: 12px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.15);
        }
        
        .rating-modal .modal-header {
          border-radius: 12px 12px 0 0;
        }
      `}</style>
    </Modal>
  );
};

export default RatingModal;
