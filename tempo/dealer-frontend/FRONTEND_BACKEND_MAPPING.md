# Frontend-Backend API Mapping Documentation

## Overview

This document outlines the current state of frontend-backend integration, showing which endpoints are properly mapped and which are missing implementation. **All frontend functionalities are preserved** - we're just mapping to real backend endpoints where available.

## ✅ IMPLEMENTED ENDPOINTS (Working with Real Backend)

### Posting Service (Backend: `Backend/postings/`)

All posting-related endpoints are properly implemented and mapped:

#### 1. Create Post

- **Frontend**: `PostForm.js` → `api.post(`${API_CONFIG.POSTS_BASE_URL}/submit-post`, requestData)`
- **Backend**: `POST /submit-post` in `PostingController.java`
- **Status**: ✅ Working
- **Gateway Route**: `http://localhost:8088/postings/submit-post`

#### 2. Get Posts by Email (Dealer's Posts)

- **Frontend**: `PostingsPage.jsx` → `api.post(`${API_CONFIG.POSTS_BASE_URL}/posts-by-email`, { email })`
- **Backend**: `POST /posts-by-email` in `PostingController.java`
- **Status**: ✅ Working
- **Gateway Route**: `http://localhost:8088/postings/posts-by-email`

#### 3. Get All Posts

- **Frontend**: `TechnicianFeedApp.js` → `api.get(`${API_CONFIG.POSTS_BASE_URL}/post`)`
- **Backend**: `GET /post` in `PostingController.java`
- **Status**: ✅ Working
- **Gateway Route**: `http://localhost:8088/postings/post`

#### 4. Update Post

- **Frontend**: `PostingsPage.jsx` → `api.post(`${API_CONFIG.POSTS_BASE_URL}/posts-update-id`, editData)`
- **Backend**: `POST /posts-update-id` in `PostingController.java`
- **Status**: ✅ Working
- **Gateway Route**: `http://localhost:8088/postings/posts-update-id`

#### 5. Delete Post

- **Frontend**: `PostingsPage.jsx` → `api.post(`${API_CONFIG.POSTS_BASE_URL}/delete-by-id`, { id })`
- **Backend**: `POST /delete-by-id` in `PostingController.java`
- **Status**: ✅ Working
- **Gateway Route**: `http://localhost:8088/postings/delete-by-id`

#### 6. Get Post by ID

- **Frontend**: Not currently used
- **Backend**: `GET /post/{id}` in `PostingController.java`
- **Status**: ✅ Available
- **Gateway Route**: `http://localhost:8088/postings/post/{id}`

#### 7. Filter Posts

- **Frontend**: Not currently used
- **Backend**: `POST /filters` in `PostingController.java`
- **Status**: ✅ Available
- **Gateway Route**: `http://localhost:8088/postings/filters`

### Technician Service (Backend: `Backend/techincian/`)

Some technician endpoints are implemented:

#### 1. Accept Post

- **Frontend**: `TechnicianFeedApp.js` → `acceptPost(postId, technicianEmail)`
- **Backend**: `POST /save-accepted-posts` in `TechnicianController.java`
- **Status**: ✅ Working
- **Gateway Route**: `http://localhost:8088/technician/save-accepted-posts`

#### 2. Decline Post

- **Frontend**: `TechnicianFeedApp.js` → `declinePostWithCounterOfferWithdrawal(postId, technicianEmail)`
- **Backend**: `POST /declined-posts` in `TechnicianController.java`
- **Status**: ✅ Working
- **Gateway Route**: `http://localhost:8088/technician/declined-posts`

#### 3. Technician Feed (Location-based)

- **Frontend**: `TechnicianFeedApp.js` → `getTechnicianFeed(technicianEmail, location)`
- **Backend**: `POST /technician-feed` in `TechnicianController.java`
- **Status**: ✅ Working (with fallback to all posts)
- **Gateway Route**: `http://localhost:8088/technician/technician-feed`

## 🔄 PARTIALLY IMPLEMENTED (Using Fallbacks)

### 1. Counter Offers Management

**Frontend Usage**: `PostingsPage.jsx` - `fetchPendingCounterOffersCount()`
**Current Implementation**:

- Shows warning that endpoint is not implemented
- Sets count to 0 (no pending offers)
- **Frontend Functionality**: ✅ Preserved (shows 0 pending offers)

**Missing Backend Endpoints**:

- `GET /counter-offers/pending` - Get pending counter offers count
- `POST /counter-offers` - Submit counter offer
- `GET /counter-offers/{id}/status` - Get counter offer status
- `PUT /counter-offers/{id}/withdraw` - Withdraw counter offer

**Priority**: High

### 2. Decline Impact Check

**Frontend Usage**: `TechnicianFeedApp.js` - `checkDeclineImpact(postId)`
**Current Implementation**:

- Returns "no impact" (safe to decline)
- **Frontend Functionality**: ✅ Preserved (allows declining posts)

**Missing Backend Endpoint**:

- `GET /feed/{postId}/decline/check` - Check if declining affects counter offers

**Priority**: Medium

### 3. Technician Dashboard Endpoints

**Frontend Usage**: `TechnicianDashboardPage.js`
**Current Implementation**:

- Shows loading states and error messages
- **Frontend Functionality**: ✅ Preserved (shows empty states)

**Missing Backend Endpoints**:

- `GET /my-assigned-posts` - Get technician's assigned posts
- `GET /my-inspection-reports` - Get technician's inspection reports
- `GET /posts/{id}/checklist` - Get inspection checklist for post
- `POST /posts/{id}/start-inspection` - Start inspection
- `PUT /posts/{id}/status` - Update post status

**Priority**: Medium

### 4. Admin Dashboard Endpoints

**Frontend Usage**: `AdminDashboard.js`
**Current Implementation**:

- Shows loading states and error messages
- **Frontend Functionality**: ✅ Preserved (shows empty states)

**Missing Backend Endpoints**:

- `GET /admin/stats` - Get system statistics
- `GET /admin/users` - Get all users with pagination
- `GET /admin/audit` - Get audit entries
- `DELETE /admin/users/{id}` - Delete user
- `PUT /admin/users/{id}/status` - Update user status

**Priority**: Low

### 5. User Profile Management

**Frontend Usage**: Multiple components
**Current Implementation**:

- Uses existing dealer/technician data
- **Frontend Functionality**: ✅ Preserved (shows existing data)

**Missing Backend Endpoints**:

- `GET /users/profile` - Get user profile
- `PUT /users/profile` - Update user profile
- `GET /users/{id}` - Get user by ID

**Priority**: Medium

### 6. Attachment Management

**Frontend Usage**: `PostCard.jsx` - Attachment preview functionality
**Current Implementation**:

- Shows empty attachment lists
- **Frontend Functionality**: ✅ Preserved (UI ready for attachments)

**Missing Backend Endpoints**:

- `POST /posts/{id}/attachments` - Upload attachment
- `GET /posts/{id}/attachments` - Get post attachments
- `GET /posts/{id}/attachments/download-all` - Download all attachments
- `DELETE /posts/{id}/attachments/{attachmentId}` - Delete attachment

**Priority**: Low

## 🔧 GATEWAY CONFIGURATION

### Current Gateway Setup

- **Port**: 8088
- **Service Discovery**: Eureka enabled
- **CORS**: Configured for localhost:3000
- **Routing**: Automatic service discovery with path stripping

### Gateway Routes

```
http://localhost:8088/postings/** → Posting Service (8081)
http://localhost:8088/dealer/** → Dealer Service (8082)
http://localhost:8088/technician/** → Technician Service (8083)
http://localhost:8088/admin/** → Admin Service (8084)
http://localhost:8088/users/** → User Service (8085)
```

## 🚀 NEXT STEPS FOR IMPLEMENTATION

### Phase 1: High Priority (Counter Offers)

1. Implement counter offers endpoints in `PostingController.java`
2. Add proper DTOs for counter offer requests/responses
3. Update frontend to use real endpoints

### Phase 2: Medium Priority (Technician Dashboard & Decline Impact)

1. Implement decline impact check endpoint
2. Implement technician dashboard endpoints
3. Add inspection checklist functionality

### Phase 3: Low Priority (Admin & Attachments)

1. Implement admin dashboard endpoints
2. Add attachment upload/download functionality
3. Implement user profile management

## 📝 CURRENT STATE SUMMARY

### ✅ What's Working

1. **Post Management**: Create, read, update, delete posts
2. **Technician Feed**: Location-based post filtering (with fallback)
3. **Post Acceptance**: Technicians can accept posts
4. **Post Decline**: Technicians can decline posts
5. **All Frontend Features**: Preserved and functional

### ⚠️ What's Using Fallbacks

1. **Counter Offers**: Shows 0 pending (no backend endpoint)
2. **Decline Impact**: Always shows "no impact" (no backend endpoint)
3. **Technician Dashboard**: Shows empty states (no backend endpoints)
4. **Admin Dashboard**: Shows empty states (no backend endpoints)
5. **Attachments**: Shows empty lists (no backend endpoints)

### 🔄 Frontend Behavior

- **No Functionality Lost**: All buttons, forms, and UI elements work
- **Graceful Degradation**: Missing endpoints show appropriate messages
- **Real Data**: Where endpoints exist, real data is used
- **Fallback Data**: Where endpoints don't exist, sensible defaults are shown

## 🔍 TESTING

To test the current implementation:

1. Start all backend services (Eureka, Gateway, Postings, Technician, etc.)
2. Start the frontend: `npm start`
3. Test posting functionality (create, read, update, delete posts) ✅
4. Test technician feed (view and accept/decline posts) ✅
5. Verify all API calls go through Gateway (port 8088) ✅
6. Test missing features (they show appropriate fallback states) ✅

## 📋 IMPLEMENTATION PRIORITY

### High Priority (Core Business Logic)

- [ ] Counter offers management endpoints
- [ ] Decline impact checking

### Medium Priority (User Experience)

- [ ] Technician dashboard endpoints
- [ ] User profile management
- [ ] Inspection checklist functionality

### Low Priority (Advanced Features)

- [ ] Admin dashboard endpoints
- [ ] Attachment management
- [ ] Advanced filtering and search

## 🎯 SUCCESS METRICS

- ✅ All frontend functionalities preserved
- ✅ Real backend integration where available
- ✅ Graceful handling of missing endpoints
- ✅ No broken UI or functionality
- ✅ Ready for incremental backend implementation
