# Production Environment Setup Guide

## Required Environment Variables for Render

### Frontend (dealer-frontend)
Set these environment variables in your Render dashboard for the frontend service:

```bash
# Primary API configuration (REQUIRED)
REACT_APP_API_BASE=https://api-gateway.onrender.com

# Optional: Individual service URLs (fallback to gateway routing)
REACT_APP_WEBSOCKET_BASE_URL=https://chat-service.onrender.com

# Feature flags
REACT_APP_ENABLE_WEBSOCKET=true
REACT_APP_ENABLE_CHAT=true
REACT_APP_ENABLE_CALLS=true
REACT_APP_ENABLE_ANALYTICS=false

# Security
REACT_APP_SECURITY_DISABLED=false
REACT_APP_JWT_STORAGE_KEY=allstate_access_token
REACT_APP_REFRESH_TOKEN_KEY=allstate_refresh_token
REACT_APP_USER_INFO_KEY=allstate_user_info
```

### Gateway Service
```bash
FRONTEND_ORIGIN=https://dealer-frontend.onrender.com
```

### Individual Services (dealer, postings, technician, tech-dashboard)
```bash
GATEWAY_URL=https://api-gateway.onrender.com
```

## Build Steps

1. **Delete old build**: The build directory has been removed to force a fresh build
2. **Set environment variables**: Configure the variables above in Render
3. **Deploy**: Trigger a new deployment in Render
4. **Verify**: Check browser console for correct API URLs

## Expected Results

After setting `REACT_APP_API_BASE=https://api-gateway.onrender.com`, you should see:

```
API_CONFIG.DEALER_BASE_URL: https://api-gateway.onrender.com/api/dealers
API_CONFIG.TECHNICIAN_BASE_URL: https://api-gateway.onrender.com/api/technicians
```

Instead of localhost:8088 URLs.

## Troubleshooting

If you still see localhost:8088 URLs after deployment:
1. Ensure `REACT_APP_API_BASE` is set in Render environment variables
2. Clear build cache and redeploy
3. Check that the frontend service is using the latest code commit
