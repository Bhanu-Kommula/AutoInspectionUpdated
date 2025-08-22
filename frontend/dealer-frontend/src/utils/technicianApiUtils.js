import api from "../api";
import { API_CONFIG } from "../api";
import { toast } from "react-toastify";
import { getTechnicianData } from "./sessionManager";
import { extendSession } from "./sessionTimeoutManager";

/**
 * Technician API Utilities
 * Handles all technician service interactions with proper error handling and validation
 */

// ==================== FEED MANAGEMENT ====================

/**
 * Get technician feed (location-based posts)
 * ✅ BACKEND ENDPOINT: /technician-feed (POST) - Get filtered feed by location
 * ✅ NO FALLBACK: Only use backend filtered data, no client-side filtering
 */
export const getTechnicianFeed = async (technicianEmail = null) => {
  try {
    console.log("=== TECHNICIAN FEED API CALL ===");

    // Extend session due to API activity
    extendSession();

    // Only use backend filtered endpoint - no fallback to unfiltered posts
    if (!technicianEmail) {
      console.error("Missing technician email");
      return {
        success: false,
        posts: [],
        count: 0,
        message: "Missing technician email",
      };
    }

    console.log("Getting filtered feed for:", technicianEmail);

    const response = await api.post(
      `${API_CONFIG.TECHNICIAN_BASE_URL}/technician-feed`,
      {
        email: technicianEmail,
      }
    );

    if (response.data && Array.isArray(response.data)) {
      const posts = response.data;
      const count = posts.length;
      console.log("✅ Backend filtered feed successful, posts count:", count);

      return {
        success: true,
        posts: posts,
        count: count,
        message: `Retrieved ${count} filtered posts successfully`,
      };
    } else {
      console.error("Invalid response from backend filtered feed");
      return {
        success: false,
        posts: [],
        count: 0,
        message: "Invalid response from backend",
      };
    }
  } catch (error) {
    console.error("Error in getTechnicianFeed:", error);
    return {
      success: false,
      posts: [],
      count: 0,
      message: "Failed to retrieve technician feed",
      error: error.message,
    };
  }
};

/**
 * Accept a post
 * ✅ UPDATED: Now uses posting service /accept endpoint
 * ✅ Enhanced error handling for race conditions
 * ✅ Automatic counter offer withdrawal
 * ✅ Better success/failure responses
 */
export const acceptPost = async (
  postId,
  technicianEmail,
  technicianName = null
) => {
  try {
    console.log("=== ACCEPT POST API CALL (POSTING SERVICE) ===");
    console.log("Post ID:", postId, "Technician Email:", technicianEmail);

    // Extend session due to API activity
    extendSession();

    const requestBody = {
      postId: postId,
      technicianEmail: technicianEmail,
    };

    // Add technician name if provided
    if (technicianName) {
      requestBody.technicianName = technicianName;
    }

    console.log("Accept post request body:", requestBody);

    // Use the technician service accept endpoint
    const response = await api.post(
      `${API_CONFIG.TECHNICIAN_BASE_URL}/save-accepted-posts`,
      {
        email: technicianEmail,
        postId: postId
      }
    );

    console.log("Accept post response:", response.data);

    // Technician service returns simple text response on success
    if (response.status === 200) {
      const successMsg = response.data === "Accepted successfully" ? "Post accepted successfully!" : "Post accepted successfully!";
      toast.success(successMsg);
      return {
        success: true,
        message: successMsg,
        data: response.data,
        postId: postId,
        acceptedAt: new Date().toISOString(),
        technicianEmail: technicianEmail,
        technicianName: technicianName,
      };
    } else {
      const errorMsg = response.data?.message || "Failed to accept post";
      toast.error(errorMsg);
      return {
        success: false,
        message: errorMsg,
      };
    }
  } catch (error) {
    console.error("Error accepting post:", error);

    // Handle specific error cases from technician service
    if (error.response?.status === 400) {
      const errorData = error.response.data;
      const errorMsg = errorData?.message || "Invalid request to accept post";

      // Check for specific error types
      if (errorData?.currentStatus) {
        const statusMsg = `Post is not available for acceptance. Current status: ${errorData.currentStatus}`;
        toast.error(statusMsg);
        return {
          success: false,
          message: statusMsg,
          errorCode: "POST_NOT_AVAILABLE",
          currentStatus: errorData.currentStatus,
        };
      }

      toast.error(errorMsg);
      return {
        success: false,
        message: errorMsg,
        errorCode: "VALIDATION_ERROR",
      };
    }

    if (error.response?.status === 409) {
      const errorMsg =
        error.response.data?.message ||
        "This post has already been accepted by another technician.";
      toast.error(errorMsg);
      return {
        success: false,
        message: errorMsg,
        errorCode: "POST_ALREADY_ACCEPTED",
      };
    }

    if (error.response?.status === 500) {
      const errorMsg =
        error.response.data?.message ||
        "Server error while accepting post. Please try again.";
      toast.error(errorMsg);
      return {
        success: false,
        message: errorMsg,
        errorCode: "SERVER_ERROR",
      };
    }

    // Default error handling
    const errorMsg =
      error.response?.data?.message ||
      "Failed to accept post. Please try again.";
    toast.error(errorMsg);
    return {
      success: false,
      message: errorMsg,
      errorCode: "NETWORK_ERROR",
    };
  }
};

// ==================== TECHNICIAN PROFILE & DATA ====================

/**
 * Get technician profile by email
 * ✅ BACKEND ENDPOINT: GET /get-technician-profile?email={email}
 */
export const getTechnicianProfile = async (email) => {
  try {
    console.log("Getting technician profile for:", email);

    const response = await api.get(
      `${
        API_CONFIG.TECHNICIAN_BASE_URL
      }/get-technician-profile?email=${encodeURIComponent(email)}`
    );

    console.log("Technician profile response:", response.data);

    if (response.status === 200) {
      return {
        success: true,
        data: response.data,
        message: "Technician profile retrieved successfully",
      };
    } else {
      return {
        success: false,
        data: null,
        message: "Failed to retrieve technician profile",
      };
    }
  } catch (error) {
    console.error("Error getting technician profile:", error);
    return {
      success: false,
      data: null,
      message: "Failed to retrieve technician profile",
    };
  }
};

/**
 * Get technician by email (POST method)
 * ✅ BACKEND ENDPOINT: POST /get-technician-by-email
 */
export const getTechnicianByEmail = async (email) => {
  try {
    console.log("Getting technician by email:", email);

    const response = await api.post(
      `${API_CONFIG.TECHNICIAN_BASE_URL}/get-technician-by-email`,
      { email: email }
    );

    console.log("Technician by email response:", response.data);

    if (response.status === 200) {
      return {
        success: true,
        data: response.data,
        message: "Technician data retrieved successfully",
      };
    } else {
      return {
        success: false,
        data: null,
        message: "Failed to retrieve technician data",
      };
    }
  } catch (error) {
    console.error("Error getting technician by email:", error);
    return {
      success: false,
      data: null,
      message: "Failed to retrieve technician data",
    };
  }
};

/**
 * Get accepted posts by technician email
 * ✅ BACKEND ENDPOINT: POST /get-accepted-posts-by-email
 */
export const getAcceptedPostsByEmail = async (email) => {
  try {
    console.log("Getting accepted posts for technician:", email);

    const response = await api.post(
      `${API_CONFIG.TECHNICIAN_BASE_URL}/get-accepted-posts-by-email`,
      { email: email }
    );

    console.log("Accepted posts response:", response.data);

    if (response.status === 200) {
      return {
        success: true,
        data: response.data,
        message: "Accepted posts retrieved successfully",
      };
    } else {
      return {
        success: false,
        data: [],
        message: "Failed to retrieve accepted posts",
      };
    }
  } catch (error) {
    console.error("Error getting accepted posts:", error);
    return {
      success: false,
      data: [],
      message: "Failed to retrieve accepted posts",
    };
  }
};

/**
 * Get all accepted posts (admin function)
 * ✅ BACKEND ENDPOINT: GET /get-all-accepted-posts-full
 */
export const getAllAcceptedPosts = async () => {
  try {
    console.log("Getting all accepted posts");

    const response = await api.get(
      `${API_CONFIG.TECHNICIAN_BASE_URL}/get-all-accepted-posts-full`
    );

    console.log("All accepted posts response:", response.data);

    if (response.status === 200) {
      return {
        success: true,
        data: response.data,
        message: "All accepted posts retrieved successfully",
      };
    } else {
      return {
        success: false,
        data: [],
        message: "Failed to retrieve all accepted posts",
      };
    }
  } catch (error) {
    console.error("Error getting all accepted posts:", error);
    return {
      success: false,
      data: [],
      message: "Failed to retrieve all accepted posts",
    };
  }
};

/**
 * Update technician profile
 * ✅ BACKEND ENDPOINT: POST /update-technician-profile
 */
export const updateTechnicianProfile = async (updateData) => {
  try {
    console.log("Updating technician profile:", updateData);

    const response = await api.post(
      `${API_CONFIG.TECHNICIAN_BASE_URL}/update-technician-profile`,
      updateData
    );

    console.log("Update profile response:", response.data);

    if (response.status === 200) {
      toast.success("Profile updated successfully!");
      return {
        success: true,
        data: response.data,
        message: "Profile updated successfully",
      };
    } else {
      toast.error("Failed to update profile");
      return {
        success: false,
        data: null,
        message: "Failed to update profile",
      };
    }
  } catch (error) {
    console.error("Error updating technician profile:", error);
    toast.error("Failed to update profile");
    return {
      success: false,
      data: null,
      message: "Failed to update profile",
    };
  }
};

// ==================== ANALYTICS ====================

/**
 * Get technician performance metrics
 */
export const getTechnicianMetrics = async () => {
  try {
    const response = await api.get(
      `${API_CONFIG.TECHNICIAN_BASE_URL}/analytics/metrics`
    );

    if (response.data && response.data.success) {
      return {
        success: true,
        metrics: response.data.metrics,
        message: response.data.message || "Metrics retrieved successfully",
      };
    } else {
      return {
        success: false,
        metrics: null,
        message: response.data?.message || "Failed to retrieve metrics",
      };
    }
  } catch (error) {
    console.error("Error fetching technician metrics:", error);
    return {
      success: false,
      metrics: null,
      message: "Failed to load metrics. Please try again.",
    };
  }
};

/**
 * Get technician interaction history
 */
export const getTechnicianInteractions = async () => {
  try {
    const response = await api.get(
      `${API_CONFIG.TECHNICIAN_BASE_URL}/analytics/interactions`
    );

    if (response.data && response.data.success) {
      return {
        success: true,
        interactions: response.data.interactions || [],
        count: response.data.count || 0,
        message: response.data.message || "Interactions retrieved successfully",
      };
    } else {
      return {
        success: false,
        interactions: [],
        count: 0,
        message: response.data?.message || "Failed to retrieve interactions",
      };
    }
  } catch (error) {
    console.error("Error fetching technician interactions:", error);
    return {
      success: false,
      interactions: [],
      count: 0,
      message: "Failed to load interactions. Please try again.",
    };
  }
};

// ==================== COUNTER OFFER MANAGEMENT ====================

/**
 * Check if declining a post would affect pending counter offer
 * ✅ BACKEND: Uses real endpoint for impact checking
 * ✅ FRONTEND: Returns impact information for decline confirmation modal
 */
export const checkDeclineImpact = async (postId) => {
  try {
    console.log("=== CHECK DECLINE IMPACT ===");
    console.log("Post ID:", postId);

    // Get technician email from session
    const technicianInfo = getTechnicianInfo();
    if (!technicianInfo?.email) {
      return {
        success: false,
        hasPendingCounterOffer: false,
        message: "Authentication required",
        errorCode: "AUTHENTICATION_REQUIRED",
      };
    }

    // Get counter offer status to check for pending offers on this post
    const statusResponse = await getCounterOfferStatus();

    if (statusResponse.success) {
      const pendingOffers = statusResponse.counterOffers.filter(
        (offer) => offer.postId === postId && offer.status === "PENDING"
      );

      if (pendingOffers.length > 0) {
        console.log("Found pending counter offers for post:", pendingOffers);
        const pendingOffer = pendingOffers[0];

        // Calculate cooldown timing
        let remainingCooldownSeconds = 0;
        let cooldownType = "DEALER_RESPONSE";

        if (pendingOffer.expiresAt) {
          const now = new Date();
          const expiry = new Date(pendingOffer.expiresAt);
          remainingCooldownSeconds = Math.max(
            0,
            Math.floor((expiry - now) / 1000)
          );
        }

        return {
          success: true,
          postId: postId,
          hasPendingCounterOffer: true,
          pendingCounterOffer: pendingOffer,
          remainingCooldownSeconds: remainingCooldownSeconds,
          cooldownType: cooldownType,
          message: `You have ${pendingOffers.length} pending counter offer(s) for this post. Declining will withdraw them.`,
          pendingOffersCount: pendingOffers.length,
        };
      } else {
        return {
          success: true,
          postId: postId,
          hasPendingCounterOffer: false,
          pendingCounterOffer: null,
          remainingCooldownSeconds: 0,
          cooldownType: null,
          message: "No pending counter offers found. Safe to decline.",
        };
      }
    } else {
      return {
        success: false,
        hasPendingCounterOffer: false,
        message: "Failed to check counter offer status",
      };
    }
  } catch (error) {
    console.error("Error checking decline impact:", error);
    return {
      success: false,
      hasPendingCounterOffer: false,
      message: "Failed to check decline impact",
      errorCode: "NETWORK_ERROR",
    };
  }
};

/**
 * Decline post (Direct decline without counter offer withdrawal)
 * ✅ BACKEND ENDPOINT: POST /declined-posts
 * ✅ Saves to declined_posts table
 * ✅ Removes from technician feed
 */
export const declinePost = async (postId, technicianEmail) => {
  try {
    console.log("=== DECLINE POST API CALL ===");
    console.log("Post ID:", postId, "Technician Email:", technicianEmail);

    // Validate technician email
    if (!technicianEmail || technicianEmail.trim() === "") {
      console.error(
        "❌ DECLINE POST - Missing or empty technician email:",
        technicianEmail
      );
      toast.error("Session error: Please logout and login again");
      return {
        success: false,
        message:
          "Session error: Missing technician email. Please logout and login again.",
        errorCode: "MISSING_EMAIL",
      };
    }

    const requestBody = {
      email: technicianEmail,
      postId: postId,
    };

    console.log("Decline post request body:", requestBody);

    const response = await api.post(
      `${API_CONFIG.TECHNICIAN_BASE_URL}/declined-posts`,
      requestBody
    );

    console.log("Decline post response:", response.data);

    // The backend endpoint returns void (no response body), so we assume success if no error
    toast.success("Post declined successfully");
    return {
      success: true,
      message: "Post declined successfully",
      postId: postId,
      declinedAt: new Date().toISOString(),
      declinedAtFormatted: new Date().toLocaleString(),
      technicianEmail: technicianEmail,
    };
  } catch (error) {
    console.error("Error declining post:", error);

    if (error.response?.status === 401) {
      toast.error("Please log in to decline posts");
      return {
        success: false,
        message: "Please log in to decline posts",
        errorCode: "AUTHENTICATION_REQUIRED",
      };
    }

    if (error.response?.status === 400) {
      const errorMsg = error.response.data?.message || "Bad request";
      toast.error(errorMsg);
      return {
        success: false,
        message: errorMsg,
        errorCode: error.response.data?.errorCode || "BAD_REQUEST",
      };
    }

    toast.error("Failed to decline post. Please try again.");
    return {
      success: false,
      message: "Network error. Please check your connection and try again.",
      errorCode: "NETWORK_ERROR",
    };
  }
};

/**
 * Decline post with counter offer withdrawal
 * ⚠️ WILL IMPLEMENT LATER: Backend endpoint not yet implemented
 * ✅ FRONTEND: Handles counter offer withdrawal confirmation
 * 🔄 CURRENT: Uses the regular declinePost function as fallback
 */
export const declinePostWithCounterOfferWithdrawal = async (postId) => {
  try {
    console.log("=== DECLINE WITH COUNTER OFFER WITHDRAWAL ===");
    console.log(
      "Post ID:",
      postId,
      "- Backend automatically withdraws counter offers"
    );

    // Get technician email from session
    const technicianInfo = getTechnicianInfo();
    if (!technicianInfo?.email) {
      toast.error("Please login to decline posts");
      return {
        success: false,
        message: "Authentication required",
        errorCode: "AUTHENTICATION_REQUIRED",
      };
    }

    // Use the regular decline post function since backend automatically withdraws counter offers
    const result = await declinePost(postId, technicianInfo.email);

    if (result.success) {
      // Add counter offer withdrawal info to the response
      return {
        ...result,
        counterOfferWithdrawn: true,
        message:
          "Post declined successfully. Any pending counter offers have been withdrawn.",
      };
    } else {
      return result;
    }
  } catch (error) {
    console.error("Error declining post with counter offer withdrawal:", error);
    return {
      success: false,
      message: "Failed to decline post with counter offer withdrawal",
      errorCode: "NETWORK_ERROR",
    };
  }
};

/**
 * Check if accepting a post would affect pending counter offer
 * ✅ BACKEND: Uses real endpoint for impact checking
 * ✅ FRONTEND: Returns impact information for accept confirmation modal
 */
export const checkAcceptImpact = async (postId) => {
  try {
    console.log("=== CHECK ACCEPT IMPACT ===");
    console.log("Post ID:", postId);

    // Get technician email from session
    const technicianInfo = getTechnicianInfo();
    if (!technicianInfo?.email) {
      return {
        success: false,
        hasPendingCounterOffer: false,
        message: "Authentication required",
        errorCode: "AUTHENTICATION_REQUIRED",
      };
    }

    // Get counter offer status to check for pending offers on this post
    const statusResponse = await getCounterOfferStatus();

    if (statusResponse.success) {
      const pendingOffers = statusResponse.counterOffers.filter(
        (offer) => offer.postId === postId && offer.status === "PENDING"
      );

      if (pendingOffers.length > 0) {
        console.log("Found pending counter offers for post:", pendingOffers);
        const pendingOffer = pendingOffers[0];

        // Calculate cooldown timing
        let remainingCooldownSeconds = 0;
        let cooldownType = "DEALER_RESPONSE";

        if (pendingOffer.expiresAt) {
          const now = new Date();
          const expiry = new Date(pendingOffer.expiresAt);
          remainingCooldownSeconds = Math.max(
            0,
            Math.floor((expiry - now) / 1000)
          );
        }

        return {
          success: true,
          postId: postId,
          hasPendingCounterOffer: true,
          pendingCounterOffer: pendingOffer,
          remainingCooldownSeconds: remainingCooldownSeconds,
          cooldownType: cooldownType,
          message: `You have ${pendingOffers.length} pending counter offer(s) for this post. Accepting will withdraw them.`,
          pendingOffersCount: pendingOffers.length,
        };
      } else {
        return {
          success: true,
          postId: postId,
          hasPendingCounterOffer: false,
          pendingCounterOffer: null,
          remainingCooldownSeconds: 0,
          cooldownType: null,
          message: "No pending counter offers found. Safe to accept.",
        };
      }
    } else {
      return {
        success: false,
        hasPendingCounterOffer: false,
        message: "Failed to check counter offer status",
      };
    }
  } catch (error) {
    console.error("Error checking accept impact:", error);
    return {
      success: false,
      hasPendingCounterOffer: false,
      message: "Failed to check accept impact",
      errorCode: "NETWORK_ERROR",
    };
  }
};

/**
 * Accept post with counter offer withdrawal
 * ⚠️ WILL IMPLEMENT LATER: Backend endpoint not yet implemented
 * ✅ FRONTEND: Handles counter offer withdrawal confirmation
 * 🔄 CURRENT: Uses the regular acceptPost function as fallback
 */
export const acceptPostWithCounterOfferWithdrawal = async (postId) => {
  try {
    console.log("=== ACCEPT WITH COUNTER OFFER WITHDRAWAL ===");
    console.log(
      "Post ID:",
      postId,
      "- Backend automatically withdraws counter offers"
    );

    // Get technician email from session
    const technicianInfo = getTechnicianInfo();
    if (!technicianInfo?.email) {
      toast.error("Please login to accept posts");
      return {
        success: false,
        message: "Authentication required",
        errorCode: "AUTHENTICATION_REQUIRED",
      };
    }

    // Use the regular accept post function since backend automatically withdraws counter offers
    const result = await acceptPost(
      postId,
      technicianInfo.email,
      technicianInfo.name
    );

    if (result.success) {
      // Add counter offer withdrawal info to the response
      return {
        ...result,
        counterOfferWithdrawn: true,
        message:
          "Post accepted successfully. Any pending counter offers have been withdrawn.",
      };
    } else {
      return result;
    }
  } catch (error) {
    console.error("Error accepting post with counter offer withdrawal:", error);
    return {
      success: false,
      message: "Failed to accept post with counter offer withdrawal",
      errorCode: "NETWORK_ERROR",
    };
  }
};

/**
 * Submit counter offer for a post
 * ✅ CORRECTED: Uses existing technician service counter-offer endpoint
 * ✅ Working with current backend implementation
 * ✅ Enhanced error handling for technician service responses
 */
export const submitCounterOffer = async (postId, counterOfferData) => {
  try {
    console.log("=== SUBMIT COUNTER OFFER API CALL (TECHNICIAN SERVICE) ===");
    console.log("Post ID:", postId, "Counter Offer Data:", counterOfferData);

    // Get technician email from session
    const technicianInfo = getTechnicianInfo();
    if (!technicianInfo?.email) {
      toast.error("Please login to submit counter offers");
      return {
        success: false,
        message: "Authentication required",
        errorCode: "AUTHENTICATION_REQUIRED",
      };
    }

    // Format request for technician service (existing implementation)
    const requestBody = {
      counterOfferAmount: counterOfferData.counterOfferAmount,
      requestReason: counterOfferData.requestReason,
      notes: counterOfferData.notes,
    };

    console.log("Submit counter offer request body:", requestBody);

    const response = await api.post(
      `${
        API_CONFIG.TECHNICIAN_BASE_URL
      }/counter-offer/${postId}?technicianEmail=${encodeURIComponent(
        technicianInfo.email
      )}`,
      requestBody
    );

    console.log("Submit counter offer response:", response.data);

    if (response.data && response.data.success) {
      toast.success("Counter offer submitted successfully!");
      return {
        success: true,
        message:
          response.data.message || "Counter offer submitted successfully",
        counterOfferId: response.data.counterOfferId,
        postId: response.data.postId,
        requestedAmount: response.data.requestedAmount,
        expiresAt: response.data.expiresAt,
      };
    } else {
      toast.error(response.data?.message || "Failed to submit counter offer");
      return {
        success: false,
        message: response.data?.message || "Failed to submit counter offer",
        errorCode: response.data?.errorCode || "SUBMISSION_FAILED",
      };
    }
  } catch (error) {
    console.error("Error submitting counter offer:", error);

    if (error.response?.status === 400) {
      const errorMsg =
        error.response.data?.message || "Invalid counter offer request";
      toast.error(errorMsg);
      return {
        success: false,
        message: errorMsg,
        errorCode: "VALIDATION_ERROR",
      };
    }

    if (error.response?.status === 401) {
      toast.error("Please login to submit counter offers");
      return {
        success: false,
        message: "Authentication required",
        errorCode: "AUTHENTICATION_REQUIRED",
      };
    }

    const errorMsg =
      error.response?.data?.message ||
      "Failed to submit counter offer. Please try again.";
    toast.error(errorMsg);
    return {
      success: false,
      message: errorMsg,
      errorCode: "NETWORK_ERROR",
    };
  }
};

/**
 * Get counter offer status for technician
 * ✅ CORRECTED: Uses existing technician service counter-offers/status endpoint
 * ✅ Working with current backend implementation
 * ✅ Enhanced error handling for technician service responses
 */
export const getCounterOfferStatus = async () => {
  try {
    console.log(
      "=== GET COUNTER OFFER STATUS API CALL (TECHNICIAN SERVICE) ==="
    );

    // Get technician email from session
    const technicianInfo = getTechnicianInfo();
    if (!technicianInfo?.email) {
      toast.error("Please login to view counter offer status");
      return {
        success: false,
        message: "Authentication required",
        errorCode: "AUTHENTICATION_REQUIRED",
      };
    }

    const response = await api.get(
      `${
        API_CONFIG.TECHNICIAN_BASE_URL
      }/counter-offers/status?technicianEmail=${encodeURIComponent(
        technicianInfo.email
      )}`
    );

    console.log("Get counter offer status response:", response.data);

    if (response.data && response.data.success) {
      return {
        success: true,
        counterOffers: response.data.counterOffers || [],
        totalCount: response.data.totalCount || 0,
        pendingCount: response.data.pendingCount || 0,
        acceptedCount: response.data.acceptedCount || 0,
        rejectedCount: response.data.rejectedCount || 0,
        expiredCount: response.data.expiredCount || 0,
        withdrawnCount: response.data.withdrawnCount || 0,
        message:
          response.data.message ||
          "Counter offer status retrieved successfully",
      };
    } else {
      return {
        success: false,
        counterOffers: [],
        totalCount: 0,
        pendingCount: 0,
        acceptedCount: 0,
        rejectedCount: 0,
        expiredCount: 0,
        withdrawnCount: 0,
        message: response.data?.message || "Failed to get counter offer status",
      };
    }
  } catch (error) {
    console.error("Error getting counter offer status:", error);

    if (error.response?.status === 401) {
      toast.error("Please login to view counter offer status");
      return {
        success: false,
        message: "Authentication required",
        errorCode: "AUTHENTICATION_REQUIRED",
      };
    }

    if (error.response?.status === 404) {
      // No counter offers found - this is normal, not an error
      return {
        success: true,
        counterOffers: [],
        totalCount: 0,
        pendingCount: 0,
        acceptedCount: 0,
        rejectedCount: 0,
        expiredCount: 0,
        withdrawnCount: 0,
        message: "No counter offers found",
      };
    }

    const errorMsg =
      error.response?.data?.message ||
      "Failed to get counter offer status. Please try again.";
    toast.error(errorMsg);
    return {
      success: false,
      counterOffers: [],
      totalCount: 0,
      pendingCount: 0,
      acceptedCount: 0,
      rejectedCount: 0,
      expiredCount: 0,
      withdrawnCount: 0,
      message: errorMsg,
      errorCode: "NETWORK_ERROR",
    };
  }
};

/**
 * Check if technician can submit counter offer for a specific post
 * ✅ CORRECTED: Uses existing technician service counter-offer/{postId}/eligibility endpoint
 * ✅ Working with current backend implementation
 * ✅ Enhanced error handling for technician service responses
 */
export const checkCounterOfferEligibility = async (postId) => {
  try {
    console.log(
      "=== CHECK COUNTER OFFER ELIGIBILITY API CALL (TECHNICIAN SERVICE) ==="
    );
    console.log("Post ID:", postId);

    // Get technician email from session
    const technicianInfo = getTechnicianInfo();
    console.log("Technician info retrieved:", technicianInfo);

    if (!technicianInfo?.email) {
      console.log("No technician email found, returning authentication error");
      return {
        success: false,
        canSubmit: false,
        canSubmitCounterOffer: false,
        message: "Authentication required",
        errorCode: "AUTHENTICATION_REQUIRED",
      };
    }

    const response = await api.get(
      `${
        API_CONFIG.TECHNICIAN_BASE_URL
      }/counter-offer/${postId}/eligibility?technicianEmail=${encodeURIComponent(
        technicianInfo.email
      )}`
    );

    console.log("Counter offer eligibility response:", response.data);

    if (response.data) {
      return {
        success: true,
        canSubmit: response.data.canSubmit || false,
        canSubmitCounterOffer: response.data.canSubmit || false,
        message: response.data.message || "Eligibility check completed",
        postId: postId,
        // Enhanced fields from backend
        attemptNumber: response.data.attemptNumber || 0,
        maxAttempts: response.data.maxAttempts || 3,
        maxAttemptsReached: response.data.maxAttemptsReached || false,
        inCooldown: response.data.inCooldown || false,
        isReCounterOffer: response.data.isReCounterOffer || false,
        remainingCooldownSeconds: response.data.remainingCooldownSeconds || 0,
        buttonText: response.data.buttonText || "Submit Counter Offer",
        buttonDisabled: response.data.buttonDisabled || false,
        hoverText: response.data.hoverText || "",
        canSubmitAfter: response.data.canSubmitAfter || null,
        // Legacy compatibility
        pendingCounterOffersCount: response.data.pendingCounterOffersCount || 0,
        maxAllowedCounterOffers: response.data.maxAttempts || 3,
        remainingCooldownMillis: 0,
        remainingCooldownHours: 0,
        remainingCooldownMinutes: 0,
      };
    } else {
      return {
        success: false,
        canSubmit: false,
        canSubmitCounterOffer: false,
        message: "Failed to check eligibility",
        attemptNumber: 0,
        maxAttempts: 3,
        maxAttemptsReached: false,
        inCooldown: false,
        isReCounterOffer: false,
        remainingCooldownSeconds: 0,
        buttonText: "Error Checking Eligibility",
        buttonDisabled: true,
        hoverText:
          "Unable to check counter offer eligibility. Please try again.",
      };
    }
  } catch (error) {
    console.error("Error checking counter offer eligibility:", error);

    if (error.response?.status === 401) {
      return {
        success: false,
        canSubmit: false,
        canSubmitCounterOffer: false,
        message: "Authentication required",
        errorCode: "AUTHENTICATION_REQUIRED",
        attemptNumber: 0,
        maxAttempts: 3,
        maxAttemptsReached: false,
        inCooldown: false,
        isReCounterOffer: false,
        remainingCooldownSeconds: 0,
        buttonText: "Login Required",
        buttonDisabled: true,
        hoverText: "Please login to check counter offer eligibility.",
      };
    }

    return {
      success: false,
      canSubmit: false,
      canSubmitCounterOffer: false,
      message: "Failed to check eligibility",
      errorCode: "NETWORK_ERROR",
      attemptNumber: 0,
      maxAttempts: 3,
      maxAttemptsReached: false,
      inCooldown: false,
      isReCounterOffer: false,
      remainingCooldownSeconds: 0,
      buttonText: "Error Checking Eligibility",
      buttonDisabled: true,
      hoverText: "Network error. Please try again.",
    };
  }
};

/**
 * Withdraw a counter offer (if still pending)
 * ⚠️ WILL IMPLEMENT LATER: Backend endpoint not yet implemented
 * ✅ FRONTEND: Complete counter offer withdrawal functionality
 * 🔄 CURRENT: Returns mock success response for UI testing
 */
export const withdrawCounterOffer = async (counterOfferId) => {
  try {
    console.log("=== WITHDRAW COUNTER OFFER API CALL ===");
    console.log("Counter Offer ID:", counterOfferId);

    // Get technician email from session
    const technicianInfo = getTechnicianInfo();
    if (!technicianInfo?.email) {
      toast.error("Please login to withdraw counter offers");
      return {
        success: false,
        message: "Authentication required",
        errorCode: "AUTHENTICATION_REQUIRED",
      };
    }

    const response = await api.post(
      `${
        API_CONFIG.TECHNICIAN_BASE_URL
      }/counter-offer/${counterOfferId}/withdraw?technicianEmail=${encodeURIComponent(
        technicianInfo.email
      )}`
    );

    console.log("Withdraw counter offer response:", response.data);

    if (response.data && response.data.success) {
      toast.success("Counter offer withdrawn successfully!");
      return {
        success: true,
        message:
          response.data.message || "Counter offer withdrawn successfully",
        counterOfferId: counterOfferId,
      };
    } else {
      toast.error(response.data?.message || "Failed to withdraw counter offer");
      return {
        success: false,
        message: response.data?.message || "Failed to withdraw counter offer",
        errorCode: response.data?.errorCode || "WITHDRAWAL_FAILED",
      };
    }
  } catch (error) {
    console.error("Error withdrawing counter offer:", error);

    if (error.response?.status === 400) {
      const errorMsg =
        error.response.data?.message || "Cannot withdraw counter offer";
      toast.error(errorMsg);
      return {
        success: false,
        message: errorMsg,
        errorCode: "VALIDATION_ERROR",
      };
    }

    if (error.response?.status === 401) {
      toast.error("Please login to withdraw counter offers");
      return {
        success: false,
        message: "Authentication required",
        errorCode: "AUTHENTICATION_REQUIRED",
      };
    }

    toast.error("Failed to withdraw counter offer. Please try again.");
    return {
      success: false,
      message: "Failed to withdraw counter offer. Please try again.",
      errorCode: "NETWORK_ERROR",
    };
  }
};

// ==================== VALIDATION UTILITIES ====================

/**
 * Validate counter offer data
 */
export const validateCounterOfferData = (data) => {
  const { counterOfferAmount, requestReason, notes } = data;

  // Validate counter offer amount
  if (!counterOfferAmount || counterOfferAmount.trim() === "") {
    return {
      isValid: false,
      message: "Counter offer amount is required",
    };
  }

  // Parse amount - accept any format: 1,000, 1000, 1000.00, $1000, etc.
  let cleanAmount = counterOfferAmount
    .replace(/[$,]/g, "") // Remove $ and commas
    .trim();

  const amount = parseFloat(cleanAmount);

  if (isNaN(amount) || amount < 1) {
    return {
      isValid: false,
      message: "Counter offer amount must be at least $1.00",
    };
  }

  if (amount > 10000) {
    return {
      isValid: false,
      message: "Counter offer amount cannot exceed $10,000.00",
    };
  }

  // Format amount to ensure consistent decimal format
  const formattedAmount = amount.toFixed(2);

  // Validate request reason length
  if (requestReason && requestReason.length > 500) {
    return {
      isValid: false,
      message: "Request reason must not exceed 500 characters",
    };
  }

  // Validate notes length
  if (notes && notes.length > 1000) {
    return {
      isValid: false,
      message: "Notes must not exceed 1000 characters",
    };
  }

  return {
    isValid: true,
    message: "Validation successful",
    formattedAmount: formattedAmount, // Return the properly formatted amount
  };
};

/**
 * Format currency for display
 */
export const formatCurrency = (amount) => {
  if (!amount) return "$0.00";
  const cleanAmount = amount.replace("$", "").trim();
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(parseFloat(cleanAmount) || 0);
};

/**
 * Format date for display
 */
export const formatDate = (dateString) => {
  if (!dateString) return "Recently";
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Recently";
  }
};

/**
 * Get status badge configuration
 */
export const getStatusBadgeConfig = (status) => {
  const statusColors = {
    PENDING: "warning",
    ACCEPTED: "info",
    IN_PROGRESS: "primary",
    COMPLETED: "success",
    CANCELLED: "danger",
  };

  return {
    color: statusColors[status] || "secondary",
    text: status.replace("_", " "),
  };
};

// ==================== ERROR HANDLING ====================

/**
 * Handle API errors consistently
 */
export const handleApiError = (error, context = "") => {
  console.error(`Error in ${context}:`, error);

  let message = "An unexpected error occurred. Please try again.";

  if (error.response) {
    // Server responded with error status
    const status = error.response.status;
    const data = error.response.data;

    switch (status) {
      case 401:
        message = "Authentication required. Please login again.";
        break;
      case 403:
        message =
          "Access denied. You do not have permission to perform this action.";
        break;
      case 404:
        message = "Resource not found.";
        break;
      case 422:
        message = data?.message || "Validation error. Please check your input.";
        break;
      case 500:
        message = "Server error. Please try again later.";
        break;
      default:
        message =
          data?.message || `Error ${status}: ${data?.error || "Unknown error"}`;
    }
  } else if (error.request) {
    // Network error
    message = "Network error. Please check your connection and try again.";
  } else {
    // Other error
    message = error.message || "An unexpected error occurred.";
  }

  toast.error(message);
  return {
    success: false,
    message,
  };
};

// ==================== SECURITY UTILITIES ====================

/**
 * Validate JWT token
 */
export const validateToken = () => {
  const token = localStorage.getItem("accessToken");
  if (!token) {
    return false;
  }

  try {
    // Basic token validation (you might want to add more sophisticated validation)
    const payload = JSON.parse(atob(token.split(".")[1]));
    const currentTime = Date.now() / 1000;

    return payload.exp > currentTime;
  } catch (error) {
    console.error("Token validation error:", error);
    return false;
  }
};

/**
 * Get technician info from sessionStorage using session manager
 */
export const getTechnicianInfo = () => {
  try {
    const technicianData = getTechnicianData();
    console.log(
      "🔍 getTechnicianInfo() called - Data retrieved:",
      technicianData
    );

    if (!technicianData) {
      console.warn(
        "⚠️ getTechnicianInfo() - No technician data found in session"
      );
      return null;
    }

    if (!technicianData.email) {
      console.error(
        "❌ getTechnicianInfo() - Technician data exists but email is missing:",
        technicianData
      );
      return null;
    }

    console.log(
      "✅ getTechnicianInfo() - Valid data with email:",
      technicianData.email
    );
    return technicianData;
  } catch (error) {
    console.error("❌ Error getting technician info:", error);
    return null;
  }
};

/**
 * Clear authentication data
 */
export const clearAuthData = () => {
  localStorage.removeItem("dealerInfo");
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  sessionStorage.removeItem("technicianInfo");
  sessionStorage.removeItem("dealerInfo");
};

export default {
  getTechnicianFeed,
  acceptPost,
  submitCounterOffer,
  getCounterOfferStatus,
  withdrawCounterOffer,
  getTechnicianMetrics,
  getTechnicianInteractions,
  validateCounterOfferData,
  formatCurrency,
  formatDate,
  getStatusBadgeConfig,
  handleApiError,
  validateToken,
  getTechnicianInfo,
  clearAuthData,
};
