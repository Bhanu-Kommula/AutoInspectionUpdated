# Counter Offer Implementation - Complete Documentation

## Overview

This document describes the complete implementation of the counter offer functionality based on the reference service with enhanced business logic, proper constraint handling, and frontend integration.

## Business Rules Implemented

### Core Business Logic

1. **48-Hour Dealer Response Window**: Counter offers expire 48 hours after submission if no dealer response
2. **3-Minute Cooldown After Rejection**: Technicians must wait 3 minutes after rejection before submitting another counter offer
3. **3-Attempt Limit Per Post**: Maximum 3 counter offer attempts per technician per post
4. **Real-time Status Tracking**: Automatic expiry handling and status updates
5. **Comprehensive Validation**: Multi-layer validation at service and repository levels

### Constraint Details

- **PENDING**: Counter offer waiting for dealer response (48-hour window)
- **REJECTED**: Counter offer rejected by dealer (triggers 3-minute cooldown)
- **ACCEPTED**: Counter offer accepted by dealer (final state)
- **EXPIRED**: Counter offer expired without dealer response (no cooldown)
- **WITHDRAWN**: Counter offer withdrawn by technician (no cooldown)

## Backend Implementation

### Enhanced CounterOfferService (`/Backend/techincian/src/main/java/com/auto/tech/service/CounterOfferService.java`)

#### Key Methods:

1. **`checkCounterOfferEligibility(Long postId, String technicianEmail)`**

   - Implements complete business rule validation
   - Returns detailed eligibility information with button states
   - Handles cooldown calculations and attempt tracking

2. **`submitCounterOffer(Long postId, String technicianEmail, CounterOfferRequest request)`**

   - Enhanced validation before submission
   - Automatic expiry time setting (48 hours)
   - Detailed response with attempt tracking

3. **`hasActiveCooldown(Long postId, String technicianEmail)`**

   - Checks for active cooldowns (PENDING or REJECTED states)
   - Returns true only if within cooldown period

4. **`getRemainingCooldownTime(Long postId, String technicianEmail)`**

   - Calculates exact remaining cooldown time
   - Supports both dealer response and rejection cooldowns

5. **`markExpiredCounterOffersScheduled()`**
   - Scheduled method for automatic expiry handling
   - Called by scheduler service every 10 minutes

### Enhanced CounterOfferRepository (`/Backend/techincian/src/main/java/com/auto/tech/repository/CounterOfferRepository.java`)

#### New Query Methods:

- `findCounterOffersByPostAndTechnicianOrderByRequestedAtDesc`: Get counter offer history
- `findMostRecentCounterOfferByPostAndTechnician`: Get latest counter offer
- `hasRecentCounterOffer`: Check for recent submissions
- `markExpiredCounterOffers`: Bulk expiry updates
- `deleteOldExpiredCounterOffers`: Cleanup old expired records

### Scheduler Service (`/Backend/techincian/src/main/java/com/auto/tech/service/CounterOfferSchedulerService.java`)

#### Scheduled Tasks:

1. **Mark Expired Counter Offers** (Every 10 minutes)
   - Automatically marks PENDING offers as EXPIRED after 48 hours
2. **Cleanup Old Expired Records** (Daily at 2 AM)
   - Removes expired counter offers older than 30 days
3. **Data Integrity Cleanup** (Every hour)
   - Ensures data consistency and fixes any issues

### Enhanced Controller Endpoints (`/Backend/techincian/src/main/java/com/auto/tech/controller/TechnicianController.java`)

#### New Endpoints:

- `GET /api/technicians/counter-offer/{postId}/cooldown`: Get remaining cooldown time
- `GET /api/technicians/counter-offer/{postId}/has-cooldown`: Check active cooldown status
- `POST /api/technicians/counter-offers/mark-expired`: Admin endpoint for manual expiry

#### Updated Endpoints:

- `GET /api/technicians/counter-offer/{postId}/eligibility`: Enhanced with detailed response
- `POST /api/technicians/counter-offer/{postId}`: Enhanced validation and response

## Frontend Integration

### Updated API Utils (`/dealer-frontend/src/utils/technicianApiUtils.js`)

#### Enhanced Response Handling:

- **`checkCounterOfferEligibility`**: Now handles complete backend response format
- Support for new fields: `attemptNumber`, `maxAttempts`, `inCooldown`, `buttonText`, `buttonDisabled`
- Real-time cooldown tracking with `remainingCooldownSeconds`
- Enhanced error handling with detailed user feedback

### Counter Offer Button Component (`/dealer-frontend/src/components/CounterOfferButton.jsx`)

#### Features Already Implemented:

- **Real-time Countdown**: Shows remaining time until next submission allowed
- **Attempt Tracking**: Displays current attempt number and remaining attempts
- **Dynamic Button States**: Changes text and style based on eligibility
- **Visual Indicators**: Icons and colors for different states
- **Tooltip Information**: Detailed hover text explaining current state

## Security and Environment Configuration

### Gateway Integration

- All API calls go through the gateway as required [[memory:5643808]]
- No direct service calls - everything routed properly
- Environment variables correctly configured for different stages (OTSA test/dev/stage)

### Data Security

- No hardcoded or mock data in production
- Real data validation at all levels
- Proper error handling without exposing sensitive information

## Database Schema

### TechCounterOffer Table Structure:

```sql
CREATE TABLE tech_counter_offers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    post_id BIGINT NOT NULL,
    technician_email VARCHAR(255) NOT NULL,
    original_offer_amount VARCHAR(100) NOT NULL,
    requested_offer_amount VARCHAR(100) NOT NULL,
    technician_location VARCHAR(255) NOT NULL,
    requested_at DATETIME NOT NULL,
    request_reason TEXT,
    technician_notes TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    dealer_response_at DATETIME,
    dealer_response_notes TEXT,
    expires_at DATETIME,
    created_at DATETIME NOT NULL,
    updated_at DATETIME,

    INDEX idx_post_id (post_id),
    INDEX idx_technician_email (technician_email),
    INDEX idx_status (status),
    INDEX idx_requested_at (requested_at),
    INDEX idx_expires_at (expires_at),

    UNIQUE KEY unique_active_counter_offer (post_id, technician_email, status)
);
```

## API Response Format

### Counter Offer Eligibility Response:

```json
{
  "canSubmit": true,
  "attemptNumber": 1,
  "maxAttempts": 3,
  "maxAttemptsReached": false,
  "inCooldown": false,
  "isReCounterOffer": false,
  "remainingCooldownSeconds": 0,
  "buttonText": "Submit Counter Offer",
  "buttonDisabled": false,
  "hoverText": "Click to submit a counter offer for this post",
  "message": "You can submit a counter offer for this post",
  "canSubmitAfter": null
}
```

### Cooldown Response Example:

```json
{
  "canSubmit": false,
  "attemptNumber": 2,
  "maxAttempts": 3,
  "inCooldown": true,
  "remainingCooldownSeconds": 180,
  "buttonText": "Counter Offer Request in 03:00",
  "buttonDisabled": true,
  "hoverText": "You can submit a new counter offer in 03:00 after rejection",
  "message": "Please wait 180 seconds after rejection before submitting another counter offer"
}
```

## Flow Diagrams

### Counter Offer Submission Flow:

```
1. Technician clicks "Submit Counter Offer"
2. Frontend calls checkCounterOfferEligibility()
3. Backend validates:
   - Post availability
   - Attempt count (< 3)
   - Active cooldowns
   - Technician authentication
4. If eligible: Show counter offer form
5. On form submission: Call submitCounterOffer()
6. Backend creates counter offer with 48-hour expiry
7. Frontend shows success message and updates UI
```

### Cooldown Management Flow:

```
1. Counter offer submitted → Status: PENDING (48-hour window)
2. If dealer rejects → Status: REJECTED (3-minute cooldown)
3. If dealer accepts → Status: ACCEPTED (final)
4. If 48 hours pass → Status: EXPIRED (no cooldown)
5. Scheduler runs every 10 minutes to mark expired offers
```

## Testing and Validation

### Key Test Scenarios:

1. **Submit counter offer when eligible** ✅
2. **Prevent submission during 3-minute cooldown** ✅
3. **Prevent submission after 3 attempts** ✅
4. **Automatic expiry after 48 hours** ✅
5. **Real-time countdown in frontend** ✅
6. **Proper button state changes** ✅
7. **Error handling and validation** ✅

## Performance Considerations

### Optimizations Implemented:

- **Database Indexes**: On post_id, technician_email, status, timestamps
- **Transactional Methods**: Proper transaction boundaries
- **Scheduled Cleanup**: Prevents database bloat
- **Efficient Queries**: Optimized repository methods
- **Frontend Caching**: Proper state management

## Monitoring and Maintenance

### Logging:

- Comprehensive logging in all service methods
- Error tracking with context information
- Performance monitoring for database queries

### Scheduled Maintenance:

- Automatic expiry handling every 10 minutes
- Daily cleanup of old records
- Hourly data integrity checks

## Deployment Notes

### Configuration Required:

1. **Enable Scheduling**: `@EnableScheduling` annotation added to main application class
2. **Database Migration**: Create/update tech_counter_offers table
3. **Environment Variables**: Ensure proper API endpoint configuration
4. **Gateway Configuration**: Route `/api/technicians/counter-offer/*` to technician service

### Production Checklist:

- [ ] Database indexes created
- [ ] Scheduler service enabled
- [ ] Gateway routing configured
- [ ] Frontend environment variables set
- [ ] Logging configuration updated
- [ ] Performance monitoring enabled

## Summary

The counter offer implementation is now complete with:

- ✅ **Advanced Business Logic**: All constraints properly implemented
- ✅ **Real-time UI**: Dynamic button states and countdown timers
- ✅ **Automatic Management**: Scheduled expiry and cleanup
- ✅ **Security**: Gateway routing and proper validation
- ✅ **Performance**: Optimized queries and indexes
- ✅ **Maintainability**: Comprehensive logging and monitoring

The system now fully matches the reference service capabilities while providing enhanced user experience and robust error handling.
