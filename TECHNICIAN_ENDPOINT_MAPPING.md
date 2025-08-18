# 🔧 Technician Service Endpoint Mapping

## 📋 Overview
This document maps all frontend API calls to their corresponding backend endpoints, showing what's implemented and what's missing.

## 🏗️ Backend Service Architecture
- **Gateway**: `http://localhost:8088` (Routes all requests)
- **Technician Service**: `http://localhost:8088/technician/api/technicians`
- **Posts Service**: `http://localhost:8088/postings`
- **Tech Dashboard Service**: `http://localhost:8088/tech-dashboard`

---

## ✅ **IMPLEMENTED ENDPOINTS**

### **Technician Service (`/technician/api/technicians`)**

| Frontend Function | Backend Endpoint | Method | Status | Notes |
|------------------|------------------|--------|--------|-------|
| `getTechnicianFeed()` | `/technician-feed` | POST | ✅ **IMPLEMENTED** | Location-based filtering |
| `acceptPost()` | `/save-accepted-posts` | POST | ✅ **IMPLEMENTED** | Accept a post |
| `declinePostWithCounterOfferWithdrawal()` | `/declined-posts` | POST | ✅ **IMPLEMENTED** | Decline a post |
| `getTechnicianByEmail()` | `/get-technician-by-email` | POST | ✅ **IMPLEMENTED** | Get technician profile |
| `updateTechnicianProfile()` | `/update-technician-profile` | POST | ✅ **IMPLEMENTED** | Update profile |
| `getTechnicianProfile()` | `/get-technician-profile` | GET | ✅ **IMPLEMENTED** | Get profile by email |
| `getAcceptedPostsByEmail()` | `/get-accepted-posts-by-email` | POST | ✅ **IMPLEMENTED** | Get accepted posts |
| `getAllAcceptedPosts()` | `/get-all-accepted-posts-full` | GET | ✅ **IMPLEMENTED** | Get all accepted posts |
| `register()` | `/register` | POST | ✅ **IMPLEMENTED** | Register technician |
| `login()` | `/login` | POST | ✅ **IMPLEMENTED** | Technician login |

### **Posts Service (`/postings`)**

| Frontend Function | Backend Endpoint | Method | Status | Notes |
|------------------|------------------|--------|--------|-------|
| `getTechnicianFeed()` (fallback) | `/post` | GET | ✅ **IMPLEMENTED** | Get all posts |
| `getPostById()` | `/post/{id}` | GET | ✅ **IMPLEMENTED** | Get specific post |
| `submitPost()` | `/submit-post` | POST | ✅ **IMPLEMENTED** | Create new post |
| `getPostsByEmail()` | `/posts-by-email` | POST | ✅ **IMPLEMENTED** | Get posts by email |
| `deletePost()` | `/delete-by-id` | POST | ✅ **IMPLEMENTED** | Delete post |
| `updatePost()` | `/posts-update-id` | POST | ✅ **IMPLEMENTED** | Update post |
| `getPostsByFilter()` | `/filters` | POST | ✅ **IMPLEMENTED** | Filter posts |
| `updateMultipleAcceptedPosts()` | `/update-multiple-acceptedpost-from-Techdash` | POST | ✅ **IMPLEMENTED** | Bulk update |

---

## ❌ **MISSING ENDPOINTS**

### **Counter Offer Management** (Not Implemented in Backend)

| Frontend Function | Expected Backend Endpoint | Method | Status | Priority |
|------------------|---------------------------|--------|--------|----------|
| `submitCounterOffer()` | `/feed/{postId}/counter-offer` | POST | ❌ **MISSING** | 🔴 **HIGH** |
| `getCounterOfferStatus()` | `/feed/counter-offers/status` | GET | ❌ **MISSING** | 🔴 **HIGH** |
| `checkCounterOfferEligibility()` | `/feed/{postId}/counter-offer/eligibility` | GET | ❌ **MISSING** | 🔴 **HIGH** |
| `withdrawCounterOffer()` | `/feed/counter-offers/{offerId}/withdraw` | POST | ❌ **MISSING** | 🟡 **MEDIUM** |

### **Impact Check Endpoints** (Not Implemented in Backend)

| Frontend Function | Expected Backend Endpoint | Method | Status | Priority |
|------------------|---------------------------|--------|--------|----------|
| `checkDeclineImpact()` | `/feed/{postId}/decline/check` | GET | ❌ **MISSING** | 🟡 **MEDIUM** |
| `checkAcceptImpact()` | `/feed/{postId}/accept/check` | GET | ❌ **MISSING** | 🟡 **MEDIUM** |
| `acceptPostWithCounterOfferWithdrawal()` | `/feed/{postId}/accept/confirm` | POST | ❌ **MISSING** | 🟡 **MEDIUM** |
| `declinePostWithCounterOfferWithdrawal()` | `/feed/{postId}/decline/confirm` | POST | ❌ **MISSING** | 🟡 **MEDIUM** |

### **Analytics Endpoints** (Not Implemented in Backend)

| Frontend Function | Expected Backend Endpoint | Method | Status | Priority |
|------------------|---------------------------|--------|--------|----------|
| `getTechnicianMetrics()` | `/analytics/metrics` | GET | ❌ **MISSING** | 🟢 **LOW** |
| `getTechnicianInteractions()` | `/analytics/interactions` | GET | ❌ **MISSING** | 🟢 **LOW** |

---

## 🔄 **CURRENT WORKAROUNDS**

### **Counter Offer Features**
- **Frontend**: All counter offer functionality is implemented
- **Backend**: No counter offer endpoints exist
- **Workaround**: Functions return mock data or error messages
- **Impact**: Counter offer buttons show but don't work

### **Impact Check Features**
- **Frontend**: Accept/decline impact checking is implemented
- **Backend**: No impact check endpoints exist
- **Workaround**: Functions return "no impact" (safe to proceed)
- **Impact**: Users can accept/decline without impact warnings

### **Analytics Features**
- **Frontend**: Analytics dashboard is implemented
- **Backend**: No analytics endpoints exist
- **Workaround**: Functions return empty data
- **Impact**: Analytics sections show empty or loading states

---

## 🎯 **IMPLEMENTATION PRIORITY**

### **🔴 HIGH PRIORITY** (Core Functionality)
1. **Counter Offer Submission** - `/feed/{postId}/counter-offer` (POST)
2. **Counter Offer Status** - `/feed/counter-offers/status` (GET)
3. **Counter Offer Eligibility** - `/feed/{postId}/counter-offer/eligibility` (GET)

### **🟡 MEDIUM PRIORITY** (Enhanced UX)
1. **Impact Check Endpoints** - For accept/decline confirmations
2. **Counter Offer Withdrawal** - `/feed/counter-offers/{offerId}/withdraw` (POST)

### **🟢 LOW PRIORITY** (Nice to Have)
1. **Analytics Endpoints** - For performance metrics
2. **Interaction History** - For detailed activity tracking

---

## 📝 **BACKEND IMPLEMENTATION NOTES**

### **Counter Offer Model Needed**
```java
@Entity
public class CounterOffer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private Long postId;
    private String technicianEmail;
    private BigDecimal amount;
    private String reason;
    private String status; // PENDING, ACCEPTED, REJECTED, WITHDRAWN
    private LocalDateTime submittedAt;
    private LocalDateTime respondedAt;
    // ... other fields
}
```

### **Required DTOs**
```java
public class CounterOfferRequestDto {
    private Long postId;
    private String technicianEmail;
    private BigDecimal amount;
    private String reason;
    private String notes;
}

public class CounterOfferResponseDto {
    private Long id;
    private String status;
    private String message;
    private LocalDateTime submittedAt;
    // ... other fields
}
```

### **Required Service Methods**
```java
public interface CounterOfferService {
    CounterOffer submitCounterOffer(CounterOfferRequestDto request);
    List<CounterOffer> getCounterOffersByTechnician(String technicianEmail);
    boolean checkEligibility(Long postId, String technicianEmail);
    CounterOffer withdrawCounterOffer(Long offerId, String technicianEmail);
}
```

---

## 🚀 **NEXT STEPS**

1. **Implement Counter Offer Model** in technician service
2. **Add Counter Offer Endpoints** to TechnicianController
3. **Update Database Schema** to include counter_offers table
4. **Test Frontend Integration** with real backend endpoints
5. **Add Analytics Endpoints** for performance tracking

---

## 📊 **STATUS SUMMARY**

- **✅ Implemented**: 10/10 core technician endpoints
- **✅ Implemented**: 8/8 posts service endpoints  
- **❌ Missing**: 8 counter offer & analytics endpoints
- **🔄 Working**: All core functionality (feed, accept, decline, profile)
- **⚠️ Limited**: Counter offer features (frontend ready, backend missing)

**Overall Progress**: 18/26 endpoints (69% complete)
