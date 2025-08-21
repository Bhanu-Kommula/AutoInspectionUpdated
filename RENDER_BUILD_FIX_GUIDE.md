# Render Build Fix Guide - localhost:8088 Issue

## Problem

The frontend is still trying to call `http://localhost:8088/dealer/api/dealers/register` instead of the production API gateway URL.

## Root Cause

The build files on Render contain outdated API configuration with hardcoded localhost:8088 URLs. Even though we fixed the source code, Render is serving the old build.

## Solution

### 1. Verify Code is Pushed ✅ DONE

- All changes have been committed and pushed to the main branch
- Source code now uses environment-based API configuration

### 2. Set Environment Variable in Render

In your Render dashboard for the `dealer-frontend` service:

1. Go to **Environment** tab
2. Add this environment variable:
   ```
   Key: REACT_APP_API_BASE
   Value: https://api-gateway.onrender.com
   ```

### 3. Trigger New Build

1. In Render dashboard, go to **Manual Deploy** section
2. Click **Deploy latest commit**
3. Wait for build to complete

### 4. Alternative: Force Rebuild

If manual deploy doesn't work:

1. Go to **Settings** tab
2. Click **Clear build cache & deploy**
3. This will force a complete rebuild

## Expected Result

After the new build:

- Frontend will use `https://api-gateway.onrender.com` instead of localhost:8088
- Dealer registration should work without CORS errors
- All API calls will go through the production gateway

## Verification

Check the browser console after rebuild - you should see:

```
API_CONFIG.DEALER_BASE_URL: https://api-gateway.onrender.com/api/dealers
Using gateway URL: https://api-gateway.onrender.com/api/dealers/register
```

Instead of the current localhost:8088 URLs.

## Why This Happened

- Build files contain compiled JavaScript with hardcoded URLs
- Environment variables are embedded during build time, not runtime
- Old build was created before our API configuration fixes
- Render needs a new build to pick up the changes

## Next Steps

1. Set `REACT_APP_API_BASE` environment variable in Render
2. Trigger new build
3. Test dealer registration
4. Verify all API calls work correctly
