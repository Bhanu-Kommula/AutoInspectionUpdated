# Technician Service Admin Endpoints Summary

## Overview

This document outlines all the admin endpoints implemented for the technician service, providing comprehensive administrative capabilities for managing technicians, monitoring performance, and overseeing business operations.

## Base URL

```
/api/admin/technicians
```

## Endpoint Categories

### 1. Technician Management Endpoints

#### Get All Technicians

- **URL**: `GET /api/admin/technicians`
- **Parameters**:
  - `page` (default: 0) - Page number for pagination
  - `size` (default: 20) - Page size
  - `location` (optional) - Filter by location
  - `experience` (optional) - Filter by years of experience
  - `searchTerm` (optional) - Search across name, email, location, dealership
- **Response**: Paginated list of technicians with metadata

#### Get Technician by ID

- **URL**: `GET /api/admin/technicians/{id}`
- **Response**: Technician details or 404 if not found

#### Update Technician Profile

- **URL**: `PUT /api/admin/technicians/{id}`
- **Body**: Technician object with updated fields
- **Response**: Updated technician object

#### Delete Technician

- **URL**: `DELETE /api/admin/technicians/{id}`
- **Validation**: Prevents deletion if technician has active post engagements
- **Response**: Success message or error details

#### Get Technician Statistics

- **URL**: `GET /api/admin/technicians/statistics`
- **Response**:
  - Total technicians count
  - Active technicians (last 30 days)
  - New technicians this month
  - Inactive technicians
  - Activity rate

### 2. Performance Monitoring Endpoints

#### Get All Performance Metrics

- **URL**: `GET /api/admin/performance-metrics`
- **Parameters**:
  - `page` (default: 0) - Page number
  - `size` (default: 20) - Page size
  - `sortBy` (default: totalEarnings) - Sort field
  - `sortOrder` (default: desc) - Sort direction
- **Response**: Paginated performance metrics

#### Get Top Performers

- **URL**: `GET /api/admin/performance-metrics/top-performers`
- **Parameters**:
  - `limit` (default: 10) - Number of top performers
  - `metric` (default: totalEarnings) - Metric to rank by
    - `earnings` - Total earnings
    - `acceptance_rate` - Success rate
    - `posts_accepted` - Number of accepted posts
    - `response_time` - Average response time
- **Response**: Top performing technicians by specified metric

#### Get Performance Summary

- **URL**: `GET /api/admin/performance-metrics/summary`
- **Response**:
  - Total earnings across all technicians
  - Average success rate
  - Average response time
  - Total posts accepted/declined
  - Overall success rate

### 3. Counter Offer Management Endpoints

#### Get All Counter Offers

- **URL**: `GET /api/admin/counter-offers`
- **Parameters**:
  - `page` (default: 0) - Page number
  - `size` (default: 20) - Page size
  - `status` (optional) - Filter by status
  - `technicianEmail` (optional) - Filter by technician
  - `postId` (optional) - Filter by post
- **Response**: Paginated counter offers

#### Get Counter Offer Statistics

- **URL**: `GET /api/admin/counter-offers/statistics`
- **Response**:
  - Total counter offers
  - Counts by status (pending, accepted, rejected, withdrawn, expired)
  - Acceptance rate

#### Force Expire Counter Offer

- **URL**: `POST /api/admin/counter-offers/{id}/force-expire`
- **Response**: Success message

### 4. Post Engagement Monitoring Endpoints

#### Get All Accepted Posts

- **URL**: `GET /api/admin/accepted-posts`
- **Parameters**:
  - `page` (default: 0) - Page number
  - `size` (default: 20) - Page size
  - `technicianEmail` (optional) - Filter by technician
- **Response**: Paginated accepted posts

#### Get All Declined Posts

- **URL**: `GET /api/admin/declined-posts`
- **Parameters**:
  - `page` (default: 0) - Page number
  - `size` (default: 20) - Page size
  - `technicianEmail` (optional) - Filter by technician
- **Response**: Paginated declined posts

#### Get Engagement Statistics

- **URL**: `GET /api/admin/engagement-statistics`
- **Response**:
  - Total accepted/declined posts
  - Total engagements
  - Acceptance rate
  - Recent activity (last 30 days)

### 5. Audit and Monitoring Endpoints

#### Get Audit Logs

- **URL**: `GET /api/admin/audit-logs`
- **Parameters**:
  - `page` (default: 0) - Page number
  - `size` (default: 20) - Page size
  - `email` (optional) - Filter by technician email
  - `fieldName` (optional) - Filter by changed field
- **Response**: Paginated audit logs

#### Get System Health

- **URL**: `GET /api/admin/health`
- **Response**: System status, database connection, service status

### 6. Maintenance and Utility Endpoints

#### Perform Maintenance Cleanup

- **URL**: `POST /api/admin/maintenance/cleanup`
- **Actions**:
  - Clean up expired counter offers
  - Delete old audit logs (older than 1 year)
- **Response**: Cleanup results summary

#### Export Technician Data

- **URL**: `GET /api/admin/export/technicians`
- **Parameters**:
  - `format` (optional) - Export format (default: JSON)
  - `location` (optional) - Filter by location
- **Response**: Exported data with metadata

#### Get Dashboard Summary

- **URL**: `GET /api/admin/dashboard`
- **Response**: Comprehensive dashboard with:
  - Technician statistics
  - Performance metrics
  - Counter offer statistics
  - Engagement statistics
  - Last updated timestamp

## Data Models Enhanced

### Technician Model

- Added `lastActivityAt` - Last activity timestamp
- Added `createdAt` - Creation timestamp
- Added `updatedAt` - Last update timestamp
- Added `@EntityListeners(AuditingEntityListener.class)` for automatic timestamp management

### TechAcceptedPost Model

- Added `createdAt` - Creation timestamp
- Added `@EntityListeners(AuditingEntityListener.class)`

### TechDeclinedPosts Model

- Added `createdAt` - Creation timestamp
- Added `@EntityListeners(AuditingEntityListener.class)`

## Repository Enhancements

### TechnicianRepository

- `findByLocationContainingIgnoreCase(String, Pageable)`
- `findByYearsOfExperienceContainingIgnoreCase(String, Pageable)`
- `findBySearchTerm(String, Pageable)` - Full-text search
- `countByLastActivityAfter(LocalDateTime)`
- `countByCreatedAtAfter(LocalDateTime)`

### AcceptedPostRepository

- `findByEmail(String, Pageable)`
- `countByAcceptedAtAfter(LocalDateTime)`

### DeclinedPostsRepository

- `findByEmail(String, Pageable)`
- `countByCreatedAtAfter(LocalDateTime)`

### CounterOfferRepository

- `findByStatus(CounterOfferStatus, Pageable)`
- `findByTechnicianEmail(String, Pageable)`
- `findByPostId(Long, Pageable)`
- `countByStatus(CounterOfferStatus)`

### TechnicianPerformanceMetricsRepository

- `findTop10ByOrderByTotalEarningsDesc()`
- `findTop10ByOrderBySuccessRateDesc()`
- `findTop10ByOrderByTotalPostsAcceptedDesc()`
- `findTop10ByOrderByAvgResponseTimeMsAsc()`
- `calculateTotalEarnings()`
- `calculateAverageSuccessRate()`
- `calculateAverageResponseTime()`
- `calculateTotalPostsAccepted()`
- `calculateTotalPostsDeclined()`

### TechnicianAuditLogRepository

- `findByEmail(String, Pageable)`
- `findByFieldName(String, Pageable)`
- `deleteByUpdatedAtBefore(LocalDateTime)`

## Business Logic Features

### 1. Comprehensive Technician Management

- Full CRUD operations for technicians
- Advanced filtering and search capabilities
- Pagination support for large datasets
- Activity tracking and statistics

### 2. Performance Analytics

- Real-time performance metrics
- Top performer identification
- Success rate calculations
- Earnings tracking
- Response time monitoring

### 3. Counter Offer Oversight

- Status monitoring across all counter offers
- Force expiration capabilities
- Statistical analysis
- Technician-specific tracking

### 4. Engagement Monitoring

- Post acceptance/decline tracking
- Technician activity patterns
- Success rate analysis
- Recent activity monitoring

### 5. Audit Trail

- Complete change history
- Field-level tracking
- Technician-specific audit logs
- Automated cleanup of old data

### 6. System Health Monitoring

- Service status checking
- Database connectivity verification
- Performance metrics overview
- Maintenance scheduling

## Security Considerations

**Note**: These endpoints are designed for administrative use and should be protected with appropriate authentication and authorization mechanisms in production environments.

## Usage Examples

### Get Dashboard Overview

```bash
GET /api/admin/technicians/dashboard
```

### Monitor Top Performers

```bash
GET /api/admin/performance-metrics/top-performers?metric=earnings&limit=5
```

### Export Technician Data

```bash
GET /api/admin/export/technicians?location=Dallas&format=json
```

### Clean Up System

```bash
POST /api/admin/maintenance/cleanup
```

## Future Enhancements

1. **CSV Export**: Implement CSV export functionality
2. **Real-time Notifications**: WebSocket-based admin notifications
3. **Advanced Analytics**: Machine learning-based performance predictions
4. **Bulk Operations**: Batch technician management operations
5. **Custom Reports**: Configurable reporting system
6. **Integration APIs**: Third-party system integrations

## Conclusion

The admin endpoints provide a comprehensive administrative interface for the technician service, enabling efficient management, monitoring, and oversight of all business operations. The implementation follows Spring Boot best practices and provides robust error handling, pagination, and filtering capabilities.
