# Rating System Implementation

## Overview

A comprehensive 5-star rating system has been implemented to allow dealers to rate technicians after job completion. This system includes rating impact on job visibility and eligibility.

## Features Implemented

### 1. Database Schema
- **ratings** table: Stores individual ratings with post, dealer, technician, rating (1-5), and review comments
- **technician_rating_summary** table: Maintains aggregated rating statistics for quick lookups
- **Triggers**: Automatically update summary statistics when ratings are added/updated/deleted

### 2. Backend APIs (Postings Service)

#### Rating Management
- `POST /api/ratings` - Create new rating
- `PUT /api/ratings/{id}` - Update existing rating
- `GET /api/ratings/post/{postId}` - Get rating for specific post
- `GET /api/ratings/technician/{email}` - Get all ratings for technician
- `GET /api/ratings/technician/{email}/summary` - Get rating summary for technician

#### Admin APIs
- `GET /api/ratings/admin/all` - Get all ratings with pagination
- `DELETE /api/ratings/admin/{id}` - Delete rating (admin only)
- `GET /api/ratings/recent` - Get recent ratings
- `GET /api/ratings/low-ratings` - Get ratings needing attention

#### Analytics APIs
- `GET /api/ratings/top-rated` - Get top-rated technicians
- `GET /api/ratings/needing-improvement` - Get technicians needing improvement
- `GET /api/ratings/premium-eligible` - Get technicians eligible for premium jobs
- `GET /api/ratings/technician/{email}/eligibility` - Check job eligibility

### 3. Frontend Components

#### For Dealers
- **RatingModal**: Modal to rate technicians after job completion
- **TechnicianRatingDisplay**: Shows technician ratings in job cards
- **Rating Button**: Added to completed job cards for easy rating access

#### For Technicians
- **TechnicianRatingDisplay**: View their own ratings and statistics
- **Rating Summary**: Shows average rating, total reviews, rating distribution

#### For Admins
- **RatingsAdminPanel**: Complete admin interface for rating management
- **Statistics Dashboard**: Overview of rating metrics
- **Rating Management**: View, filter, and delete ratings

### 4. Rating Impact System

#### Job Filtering Rules
- **Premium Jobs** ($500+): Only available to technicians with 4.0+ average rating and 5+ reviews
- **Regular Jobs**: Available to all technicians unless they have poor ratings (<3.0 with 3+ reviews)

#### Job Prioritization
- **Excellent Ratings** (4.5+): 50% boost in job visibility
- **Very Good Ratings** (4.0+): 20% boost in job visibility
- **Good Ratings** (3.5+): Neutral visibility
- **Average Ratings** (3.0+): 20% reduction in visibility
- **Poor Ratings** (<3.0): 50% reduction in visibility

#### Rating Quality Categories
- **Excellent**: 4.5+ stars
- **Very Good**: 4.0-4.4 stars
- **Good**: 3.5-3.9 stars
- **Average**: 3.0-3.4 stars
- **Below Average**: 2.0-2.9 stars
- **Poor**: <2.0 stars

### 5. Business Logic

#### Rating Validation
- Only dealers can rate technicians on completed jobs
- One rating per job (post)
- Rating must be 1-5 stars
- Review comments limited to 1000 characters
- Only the dealer who posted the job can rate

#### Rating Impact
- New technicians (no ratings) are eligible for regular jobs but not premium jobs
- Technicians with <3 ratings get benefit of doubt for job eligibility
- Rating summary is automatically updated via database triggers
- Poor ratings impact future job opportunities

#### Admin Controls
- Admins can view all ratings and statistics
- Admins can delete inappropriate ratings
- Comprehensive filtering and search capabilities
- Export functionality for reporting

## Technical Implementation

### Database Triggers
Automatic rating summary updates ensure data consistency:
```sql
-- Triggers update technician_rating_summary on INSERT/UPDATE/DELETE
-- Calculates: total_ratings, average_rating, star distribution, last_rated_at
```

### Rating Service Architecture
- **RatingService**: Core business logic for rating operations
- **RatingRepository**: Data access layer with complex queries
- **RatingController**: REST API endpoints with validation
- **DTOs**: Request/Response objects with validation annotations

### Frontend Integration
- **PostCard Component**: Enhanced with rating display and rating button
- **AdminDashboard**: New ratings tab for comprehensive management
- **API Integration**: Seamless communication with backend services

## Usage Instructions

### For Dealers
1. Complete a job with a technician
2. Click "⭐ Rate Work" button on completed job card
3. Select 1-5 stars and optionally add review comment
4. Submit rating - can be updated later if needed

### For Technicians
1. View ratings on job cards when assigned to jobs
2. See rating summary in technician dashboard
3. Monitor rating trends and feedback

### For Admins
1. Access "Ratings" tab in admin dashboard
2. View comprehensive statistics and recent activity
3. Filter and search ratings by various criteria
4. Manage inappropriate ratings if needed

## Future Enhancements

### Planned Features
1. **Email Notifications**: Notify technicians of new ratings
2. **Rating Trends**: Historical rating analysis and trends
3. **Automated Responses**: Suggested responses for low ratings
4. **Rating Incentives**: Rewards for maintaining high ratings
5. **Detailed Analytics**: Advanced reporting and insights

### Integration Opportunities
1. **Feign Client**: Direct rating service calls from technician service
2. **Real-time Updates**: WebSocket notifications for new ratings
3. **Mobile App**: Rating functionality in mobile applications
4. **Third-party Integration**: Export ratings to external platforms

## Configuration

### Environment Variables
- Rating system is enabled by default
- Premium job threshold: $500 (configurable)
- Minimum ratings for premium eligibility: 5 (configurable)
- Rating multiplier thresholds: Configurable per rating range

### Database Configuration
- PostgreSQL triggers handle rating aggregation
- Indexes optimize rating queries for performance
- Constraints ensure data integrity

## Monitoring and Maintenance

### Key Metrics to Monitor
- Average rating across all technicians
- Rating distribution trends
- Premium job eligibility rates
- Rating submission rates

### Maintenance Tasks
- Regular cleanup of old ratings (if needed)
- Monitor rating summary accuracy
- Review and update rating impact rules
- Analyze rating trends for business insights

## Security Considerations

### Access Control
- Only authorized dealers can rate technicians
- Admin-only access to rating deletion
- Input validation prevents malicious data

### Data Privacy
- Rating comments are moderated
- Personal information is protected
- Audit trail for rating changes

This rating system provides a comprehensive solution for quality control and technician performance management while maintaining fairness and transparency in the job marketplace.
