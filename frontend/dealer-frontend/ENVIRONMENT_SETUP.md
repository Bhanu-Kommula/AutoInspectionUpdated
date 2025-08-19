# Frontend Environment Setup Guide

## Overview

This guide ensures all frontend connections go through the API Gateway with no hardcoded values, maintaining security and centralized configuration.

## Required Environment Variables

Create a `.env` file in the frontend directory with the following variables:

### API Gateway Configuration (Required)

```bash
# Primary API Gateway URL - All requests must go through this
REACT_APP_API_GATEWAY_URL=http://localhost:8080

# Authentication Endpoints (via Gateway)
REACT_APP_AUTH_BASE_URL=http://localhost:8080/api/users/auth

# User Management Endpoints (via Gateway)
REACT_APP_USER_BASE_URL=http://localhost:8080/api/users

# Service Endpoints (via Gateway)
REACT_APP_POSTS_BASE_URL=http://localhost:8080/api/v1/posts
REACT_APP_DEALER_BASE_URL=http://localhost:8080/api/v1/dealer
REACT_APP_TECHNICIAN_BASE_URL=http://localhost:8080/api/technicians
REACT_APP_ADMIN_BASE_URL=http://localhost:8080/api/v1/admin
```

### Security Configuration (Required)

```bash
# JWT Token Storage Keys
REACT_APP_JWT_STORAGE_KEY=allstate_access_token
REACT_APP_REFRESH_TOKEN_KEY=allstate_refresh_token
REACT_APP_USER_INFO_KEY=allstate_user_info
```

### Feature Flags (Optional)

```bash
# Debug and Development
REACT_APP_ENABLE_DEBUG_MODE=false
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_ENABLE_ERROR_REPORTING=true
REACT_APP_ENABLE_MOCK_DATA=false
REACT_APP_LOG_LEVEL=info

# Application Information
REACT_APP_APP_NAME=All State Auto Inspection
REACT_APP_APP_VERSION=1.0.0
REACT_APP_SUPPORT_EMAIL=support@allstate.com
```

## Security Validation

The application automatically validates that:

1. **All URLs point to the API Gateway** - No direct service connections allowed
2. **Required environment variables are present** - Application won't start without them
3. **No hardcoded fallback URLs** - All configuration must come from environment variables

## Architecture Flow

```
Frontend → API Gateway (Port 8080) → Microservices
                ↓
        - Authentication & Authorization
        - Rate Limiting
        - Request Routing
        - Security Headers
        - Token Validation
```

## Service Endpoints

All service endpoints are routed through the API Gateway:

- **Authentication**: `/api/users/auth/*`
- **User Management**: `/api/users/*`
- **Posts Service**: `/api/v1/posts/*`
- **Dealer Service**: `/api/v1/dealer/*`
- **Technician Service**: `/api/v1/technician/*`
- **Admin Service**: `/api/v1/admin/*`

## Troubleshooting

### Common Issues

1. **403 Forbidden Errors**: Check that API Gateway is running and properly configured
2. **Missing Environment Variables**: Ensure all required variables are set in `.env`
3. **Direct Service Access**: Verify no hardcoded URLs bypass the API Gateway

### Validation Commands

```bash
# Check if environment variables are loaded
npm start

# Look for validation errors in console
# Should see: "Environment validation passed"
```

## Production Deployment

For production, update the URLs to point to your production API Gateway:

```bash
REACT_APP_API_GATEWAY_URL=https://api.yourdomain.com
REACT_APP_AUTH_BASE_URL=https://api.yourdomain.com/api/users/auth
# ... other URLs
```

## Security Best Practices

1. **Never hardcode URLs** - Always use environment variables
2. **Use HTTPS in production** - All production URLs should use HTTPS
3. **Validate environment on startup** - Application validates configuration
4. **Centralized authentication** - All auth goes through API Gateway
5. **No direct service access** - Frontend never connects directly to microservices
