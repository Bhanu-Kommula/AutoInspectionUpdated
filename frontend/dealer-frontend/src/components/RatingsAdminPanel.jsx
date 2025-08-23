import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Badge, 
  Button, 
  Row, 
  Col, 
  Form, 
  Alert, 
  Spinner,
  Modal,
  Pagination,
  InputGroup
} from 'react-bootstrap';
import { 
  FaStar, 
  FaStarHalfAlt, 
  FaSearch, 
  FaFilter, 
  FaDownload,
  FaTrash,
  FaEye,
  FaSort,
  FaSortUp,
  FaSortDown
} from 'react-icons/fa';
import api from '../api';
import { toast } from 'react-toastify';

const RatingsAdminPanel = () => {
  // State management
  const [ratings, setRatings] = useState([]);
  const [topRatedTechnicians, setTopRatedTechnicians] = useState([]);
  const [lowRatings, setLowRatings] = useState([]);
  const [recentRatings, setRecentRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Pagination and filtering
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [pageSize] = useState(20);
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRating, setSelectedRating] = useState(null);
  const [showRatingDetails, setShowRatingDetails] = useState(false);
  
  // Statistics
  const [stats, setStats] = useState({
    totalRatings: 0,
    averageRating: 0,
    ratingDistribution: {}
  });

  useEffect(() => {
    fetchRatingsData();
    fetchStatistics();
    fetchTopRatedTechnicians();
    fetchLowRatings();
    fetchRecentRatings();
  }, [currentPage, searchTerm, ratingFilter, sortBy, sortOrder]);

  const fetchRatingsData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/ratings/admin/all', {
        params: {
          page: currentPage,
          size: pageSize,
          search: searchTerm,
          rating: ratingFilter,
          sortBy: sortBy,
          sortOrder: sortOrder
        }
      });
      
      if (response.data.content) {
        setRatings(response.data.content);
        setTotalPages(response.data.totalPages);
      } else {
        setRatings(response.data);
      }
    } catch (error) {
      console.error('Error fetching ratings:', error);
      setError('Failed to load ratings data');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      // This would need to be implemented in the backend
      // For now, calculate from current data
      if (ratings.length > 0) {
        const totalRatings = ratings.length;
        const averageRating = ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings;
        const distribution = ratings.reduce((acc, r) => {
          acc[r.rating] = (acc[r.rating] || 0) + 1;
          return acc;
        }, {});
        
        setStats({
          totalRatings,
          averageRating: averageRating.toFixed(2),
          ratingDistribution: distribution
        });
      }
    } catch (error) {
      console.error('Error calculating statistics:', error);
    }
  };

  const fetchTopRatedTechnicians = async () => {
    try {
      const response = await api.get('/api/ratings/top-rated', {
        params: { minRatings: 3, limit: 10 }
      });
      setTopRatedTechnicians(response.data);
    } catch (error) {
      console.error('Error fetching top rated technicians:', error);
    }
  };

  const fetchLowRatings = async () => {
    try {
      const response = await api.get('/api/ratings/low-ratings', {
        params: { maxRating: 2, limit: 10 }
      });
      setLowRatings(response.data);
    } catch (error) {
      console.error('Error fetching low ratings:', error);
    }
  };

  const fetchRecentRatings = async () => {
    try {
      const response = await api.get('/api/ratings/recent', {
        params: { limit: 10 }
      });
      setRecentRatings(response.data);
    } catch (error) {
      console.error('Error fetching recent ratings:', error);
    }
  };

  const handleDeleteRating = async () => {
    if (!selectedRating) return;
    
    try {
      await api.delete(`/api/ratings/admin/${selectedRating.id}`);
      toast.success('Rating deleted successfully');
      setShowDeleteModal(false);
      setSelectedRating(null);
      fetchRatingsData();
    } catch (error) {
      console.error('Error deleting rating:', error);
      toast.error('Failed to delete rating');
    }
  };

  const renderStars = (rating, size = 16) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(
          <FaStar key={i} size={size} style={{ color: '#ffc107', marginRight: '2px' }} />
        );
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(
          <FaStarHalfAlt key={i} size={size} style={{ color: '#ffc107', marginRight: '2px' }} />
        );
      } else {
        stars.push(
          <FaStar key={i} size={size} style={{ color: '#e4e5e9', marginRight: '2px' }} />
        );
      }
    }
    
    return stars;
  };

  const getRatingColor = (rating) => {
    if (rating >= 4.5) return 'success';
    if (rating >= 4.0) return 'primary';
    if (rating >= 3.5) return 'info';
    if (rating >= 3.0) return 'warning';
    return 'danger';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) return <FaSort className="text-muted" />;
    return sortOrder === 'asc' ? <FaSortUp /> : <FaSortDown />;
  };

  if (loading && ratings.length === 0) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-2">Loading ratings data...</p>
      </div>
    );
  }

  return (
    <div className="ratings-admin-panel">
      <Row className="mb-4">
        <Col>
          <h2>Ratings Management</h2>
          <p className="text-muted">Manage and monitor technician ratings across the platform</p>
        </Col>
      </Row>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Statistics Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="stat-card">
            <Card.Body className="text-center">
              <h3 className="text-primary">{stats.totalRatings}</h3>
              <p className="text-muted mb-0">Total Ratings</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="stat-card">
            <Card.Body className="text-center">
              <h3 className="text-success">{stats.averageRating}</h3>
              <p className="text-muted mb-0">Average Rating</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="stat-card">
            <Card.Body className="text-center">
              <h3 className="text-info">{topRatedTechnicians.length}</h3>
              <p className="text-muted mb-0">Top Technicians</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="stat-card">
            <Card.Body className="text-center">
              <h3 className="text-warning">{lowRatings.length}</h3>
              <p className="text-muted mb-0">Low Ratings</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Filters and Search */}
      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={4}>
              <InputGroup>
                <InputGroup.Text>
                  <FaSearch />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search by technician or dealer email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={3}>
              <Form.Select
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value)}
              >
                <option value="">All Ratings</option>
                <option value="5">5 Stars</option>
                <option value="4">4 Stars</option>
                <option value="3">3 Stars</option>
                <option value="2">2 Stars</option>
                <option value="1">1 Star</option>
              </Form.Select>
            </Col>
            <Col md={3}>
              <Button variant="outline-primary" onClick={fetchRatingsData}>
                <FaFilter className="me-2" />
                Apply Filters
              </Button>
            </Col>
            <Col md={2}>
              <Button variant="outline-success">
                <FaDownload className="me-2" />
                Export
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Ratings Table */}
      <Card>
        <Card.Header>
          <h5 className="mb-0">All Ratings</h5>
        </Card.Header>
        <Card.Body className="p-0">
          <Table responsive hover>
            <thead className="table-light">
              <tr>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('id')}>
                  ID {getSortIcon('id')}
                </th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('rating')}>
                  Rating {getSortIcon('rating')}
                </th>
                <th>Technician</th>
                <th>Dealer</th>
                <th>Job</th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('createdAt')}>
                  Date {getSortIcon('createdAt')}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {ratings.map((rating) => (
                <tr key={rating.id}>
                  <td>#{rating.id}</td>
                  <td>
                    <div className="d-flex align-items-center">
                      {renderStars(rating.rating, 14)}
                      <Badge bg={getRatingColor(rating.rating)} className="ms-2">
                        {rating.rating}
                      </Badge>
                    </div>
                  </td>
                  <td>
                    <div>
                      <div className="fw-semibold">{rating.technicianName || 'N/A'}</div>
                      <small className="text-muted">{rating.technicianEmail}</small>
                    </div>
                  </td>
                  <td>
                    <div>
                      <div className="fw-semibold">{rating.dealerName || 'N/A'}</div>
                      <small className="text-muted">{rating.dealerEmail}</small>
                    </div>
                  </td>
                  <td>
                    <div>
                      <div className="fw-semibold">Post #{rating.postId}</div>
                      <small className="text-muted">{rating.postTitle}</small>
                    </div>
                  </td>
                  <td>
                    <small>{formatDate(rating.createdAt)}</small>
                  </td>
                  <td>
                    <div className="d-flex gap-1">
                      <Button
                        variant="outline-info"
                        size="sm"
                        onClick={() => {
                          setSelectedRating(rating);
                          setShowRatingDetails(true);
                        }}
                      >
                        <FaEye />
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => {
                          setSelectedRating(rating);
                          setShowDeleteModal(true);
                        }}
                      >
                        <FaTrash />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          
          {ratings.length === 0 && !loading && (
            <div className="text-center py-4">
              <p className="text-muted">No ratings found</p>
            </div>
          )}
        </Card.Body>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <Card.Footer>
            <Pagination className="justify-content-center mb-0">
              <Pagination.Prev 
                disabled={currentPage === 0}
                onClick={() => setCurrentPage(currentPage - 1)}
              />
              {[...Array(totalPages)].map((_, index) => (
                <Pagination.Item
                  key={index}
                  active={index === currentPage}
                  onClick={() => setCurrentPage(index)}
                >
                  {index + 1}
                </Pagination.Item>
              ))}
              <Pagination.Next 
                disabled={currentPage === totalPages - 1}
                onClick={() => setCurrentPage(currentPage + 1)}
              />
            </Pagination>
          </Card.Footer>
        )}
      </Card>

      {/* Rating Details Modal */}
      <Modal show={showRatingDetails} onHide={() => setShowRatingDetails(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Rating Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedRating && (
            <div>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Rating:</strong>
                  <div className="mt-1">
                    {renderStars(selectedRating.rating, 20)}
                    <Badge bg={getRatingColor(selectedRating.rating)} className="ms-2">
                      {selectedRating.rating}/5
                    </Badge>
                  </div>
                </Col>
                <Col md={6}>
                  <strong>Date:</strong>
                  <div>{formatDate(selectedRating.createdAt)}</div>
                </Col>
              </Row>
              
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Technician:</strong>
                  <div>{selectedRating.technicianName || 'N/A'}</div>
                  <small className="text-muted">{selectedRating.technicianEmail}</small>
                </Col>
                <Col md={6}>
                  <strong>Dealer:</strong>
                  <div>{selectedRating.dealerName || 'N/A'}</div>
                  <small className="text-muted">{selectedRating.dealerEmail}</small>
                </Col>
              </Row>
              
              <div className="mb-3">
                <strong>Job Details:</strong>
                <div>Post #{selectedRating.postId}</div>
                <div>{selectedRating.postTitle}</div>
                <small className="text-muted">{selectedRating.postLocation}</small>
              </div>
              
              {selectedRating.reviewComment && (
                <div>
                  <strong>Review Comment:</strong>
                  <div className="mt-2 p-3 bg-light rounded">
                    <em>"{selectedRating.reviewComment}"</em>
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRatingDetails(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete this rating? This action cannot be undone.
          {selectedRating && (
            <div className="mt-3 p-3 bg-light rounded">
              <strong>Rating:</strong> {selectedRating.rating}/5 stars<br />
              <strong>Technician:</strong> {selectedRating.technicianEmail}<br />
              <strong>Date:</strong> {formatDate(selectedRating.createdAt)}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteRating}>
            Delete Rating
          </Button>
        </Modal.Footer>
      </Modal>

      <style jsx>{`
        .stat-card {
          border: none;
          box-shadow: 0 2px 20px rgba(0,0,0,0.08);
          border-radius: 12px;
          transition: transform 0.2s ease-in-out;
        }
        
        .stat-card:hover {
          transform: translateY(-2px);
        }
        
        .ratings-admin-panel .table th {
          border-top: none;
          font-weight: 600;
          color: #495057;
        }
        
        .ratings-admin-panel .pagination {
          margin: 0;
        }
      `}</style>
    </div>
  );
};

export default RatingsAdminPanel;
