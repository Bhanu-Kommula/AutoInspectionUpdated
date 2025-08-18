import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
// Authentication context import removed as requested
import api, { API_CONFIG } from "./api";
import axios from "axios";
import {
  getTechnicianData,
  clearTechnicianData,
  getCurrentSessionId,
} from "./utils/sessionManager";
// Removed Bootstrap imports since we're using inline styles
import {
  FaMapMarkerAlt,
  FaDollarSign,
  FaUser,
  FaCalendar,
  FaList,
  FaTimes,
  FaEye,
} from "react-icons/fa";
import TechnicianHeader from "./components/TechnicianHeader";
import TechnicianCounterOfferModal from "./components/TechnicianCounterOfferModal";
import TechnicianCounterOfferStatusModal from "./components/TechnicianCounterOfferStatusModal";
import CounterOfferButton from "./components/CounterOfferButton";
import DeclineConfirmationModal from "./components/DeclineConfirmationModal";
import AcceptConfirmationModal from "./components/AcceptConfirmationModal";
import ChatButton from "./components/chat/ChatButton";
import SimpleAcceptModal from "./components/SimpleAcceptModal";
import SimpleDeclineModal from "./components/SimpleDeclineModal";
import useWebSocket from "./hooks/useWebSocket";
import { useSessionTimeout } from "./hooks/useSessionTimeout";
import {
  submitCounterOffer,
  getCounterOfferStatus,
  checkCounterOfferEligibility,
  checkDeclineImpact,
  declinePostWithCounterOfferWithdrawal,
  checkAcceptImpact,
  acceptPostWithCounterOfferWithdrawal,
  getTechnicianFeed,
  acceptPost,
  declinePost,
  getTechnicianProfile,
  getTechnicianByEmail,
  getAcceptedPostsByEmail,
  getAllAcceptedPosts,
  updateTechnicianProfile,
} from "./utils/technicianApiUtils";
// Security config import removed as requested
import "./technician.css";

const TechnicianFeedApp = () => {
  // Initialize session timeout monitoring
  useSessionTimeout();

  // Get technician data from session manager (set during login)
  const [technician, setTechnician] = useState(() => {
    const storedTechnician = getTechnicianData();
    if (storedTechnician) {
      return {
        id: storedTechnician.id,
        email: storedTechnician.email,
        name: storedTechnician.name,
        location: storedTechnician.location,
      };
    }

    // No fallback - redirect to login if no technician data
    return null;
  });

  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});

  // Header state management
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Counter offer modal states
  const [showCounterOfferModal, setShowCounterOfferModal] = useState(false);
  const [showCounterOfferStatusModal, setShowCounterOfferStatusModal] =
    useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [counterOfferSubmitting, setCounterOfferSubmitting] = useState(false);
  const [counterOfferEligibility, setCounterOfferEligibility] = useState({});

  // Decline confirmation modal states
  const [showDeclineConfirmationModal, setShowDeclineConfirmationModal] =
    useState(false);
  const [declinePostData, setDeclinePostData] = useState(null); // Renamed to avoid conflict
  const [pendingCounterOfferInfo, setPendingCounterOfferInfo] = useState(null);
  const [declineProcessing, setDeclineProcessing] = useState(false);

  // Accept confirmation modal states
  const [showAcceptConfirmationModal, setShowAcceptConfirmationModal] =
    useState(false);
  const [selectedAcceptPost, setSelectedAcceptPost] = useState(null);
  const [
    pendingCounterOfferInfoForAccept,
    setPendingCounterOfferInfoForAccept,
  ] = useState(null);
  const [acceptProcessing, setAcceptProcessing] = useState(false);

  // Simple modal states for direct accept/decline
  const [showSimpleAcceptModal, setShowSimpleAcceptModal] = useState(false);
  const [showSimpleDeclineModal, setShowSimpleDeclineModal] = useState(false);
  const [simpleModalPost, setSimpleModalPost] = useState(null);
  const [simpleModalProcessing, setSimpleModalProcessing] = useState(false);

  // Optimized fetch function with security and performance enhancements
  const fetchTechnicianFeeds = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("Fetching technician feeds...");

      // ✅ REAL API CALL: Get technician feed through Gateway
      // ✅ AVAILABLE ENDPOINT: /technician-feed (POST) - Get filtered feed by location
      // ✅ AVAILABLE ENDPOINT: /post (GET) - Get all posts (fallback)

      // Use the updated getTechnicianFeed function with technician info
      const feedResult = await getTechnicianFeed(technician.email);

      if (feedResult.success) {
        console.log("Technician feed loaded successfully:", feedResult.message);
        console.log("Posts received:", feedResult.posts);
        setPosts(feedResult.posts);
        await checkCounterOfferEligibilityForPosts(feedResult.posts);

        // Check for counter offer status updates and show notifications
        await checkCounterOfferStatusUpdates();
      } else {
        console.error("Failed to load technician feed:", feedResult.message);
        console.error("Error details:", feedResult.error);
        setError(feedResult.message);
      }
    } catch (err) {
      console.error("Error fetching technician feeds:", err);

      if (err.response?.status === 401) {
        setError("API error - authentication removed");
      } else if (err.response?.status === 403) {
        setError("Access denied");
      } else if (err.response?.status === 404) {
        setError("Technician feeds service not found.");
      } else if (err.response?.status >= 500) {
        setError("Server error. Please try again later.");
      } else if (err.code === "ECONNABORTED") {
        setError(
          "Request timeout. Please check your connection and try again."
        );
      } else {
        setError(
          err.response?.data?.message ||
            "Failed to fetch technician feeds. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Optimized refresh counter offer eligibility for a specific post
  const refreshCounterOfferEligibility = useCallback(async (postId) => {
    try {
      console.log(`Refreshing counter offer eligibility for post ${postId}`);
      const eligibility = await checkCounterOfferEligibility(postId);

      setCounterOfferEligibility((prev) => ({
        ...prev,
        [postId]: {
          postId: postId,
          canSubmit: eligibility.canSubmitCounterOffer,
          canSubmitCounterOffer: eligibility.canSubmitCounterOffer,
          message: eligibility.message,
          cooldownHours: eligibility.cooldownHours,
          success: eligibility.success,
          remainingCooldownSeconds: eligibility.remainingCooldownSeconds,
          remainingCooldownMillis: eligibility.remainingCooldownMillis,
          remainingCooldownHours: eligibility.remainingCooldownHours,
          remainingCooldownMinutes: eligibility.remainingCooldownMinutes,
          lastOfferSubmittedAt: eligibility.lastOfferSubmittedAt,
          canSubmitAfter: eligibility.canSubmitAfter,
          // New attempt tracking fields
          attemptNumber: eligibility.attemptNumber,
          maxAttempts: eligibility.maxAttempts,
          maxAttemptsReached: eligibility.maxAttemptsReached,
          previousAttempts: eligibility.previousAttempts,
          isReCounterOffer: eligibility.isReCounterOffer,
        },
      }));

      console.log(`Updated eligibility for post ${postId}:`, eligibility);
    } catch (error) {
      console.error(
        `Error refreshing counter offer eligibility for post ${postId}:`,
        error
      );
    }
  }, []);

  // Check for counter offer status updates and show notifications
  const checkCounterOfferStatusUpdates = useCallback(async () => {
    try {
      console.log("Checking for counter offer status updates...");

      const statusResult = await getCounterOfferStatus();

      if (statusResult.success && statusResult.counterOffers) {
        const recentOffers = statusResult.counterOffers.filter((offer) => {
          if (!offer.dealerResponseAt) return false;

          const responseTime = new Date(offer.dealerResponseAt);
          const now = new Date();
          const timeDiff = now - responseTime;

          // Show notification for offers responded to in the last 2 minutes (more immediate)
          return timeDiff < 2 * 60 * 1000 && offer.status !== "PENDING";
        });

        // Track posts that need eligibility refresh
        const postsToRefresh = new Set();

        recentOffers.forEach((offer) => {
          const message =
            offer.status === "ACCEPTED"
              ? `Your counter offer of $${offer.requestedOfferAmount} was accepted!`
              : `Your counter offer of $${offer.requestedOfferAmount} was rejected. You can submit another in 3 minutes.`;

          // Add notification to the notifications array using existing format
          setNotifications((prev) => [
            {
              id: Date.now() + Math.random(),
              message: message,
              type: offer.status === "ACCEPTED" ? "success" : "warning",
              timestamp: new Date().toLocaleTimeString(),
              read: false,
            },
            ...prev.slice(0, 19), // Keep only 20 notifications like existing system
          ]);

          // Update unread count using existing pattern
          setUnreadCount((prev) => Math.min(prev + 1, 99)); // Cap at 99 like existing system

          // Toast notifications removed - now shown in notification bell instead

          // Add post to refresh list for rejected offers
          if (offer.status === "REJECTED" && offer.postId) {
            postsToRefresh.add(offer.postId);
          }
        });

        // Refresh counter offer eligibility for posts with recent rejections
        if (postsToRefresh.size > 0) {
          console.log(
            "Refreshing counter offer eligibility for posts:",
            Array.from(postsToRefresh)
          );
          postsToRefresh.forEach((postId) => {
            refreshCounterOfferEligibility(postId);
          });
        }
      }
    } catch (error) {
      console.error("Error checking counter offer status updates:", error);
    }
  }, [setNotifications, setUnreadCount, refreshCounterOfferEligibility]);

  // Optimized filters for WebSocket with security validation
  const filters = useMemo(() => {
    if (!technician?.id || !technician?.location) return null;

    return {
      location: technician.location,
      technicianId: technician.id,
      userType: "TECHNICIAN",
      // Security: Add user role validation
      roles: technician.roles || [],
    };
  }, [technician?.location, technician?.id, technician?.roles]);

  // Debug logging with performance monitoring
  console.log("TechnicianFeedApp render state:", {
    loading,
    postsCount: posts.length,
    hasError: !!error,
    hasValidFilters: !!filters,
    hasTechnician: !!technician,
  });

  // Secure WebSocket integration for real-time updates
  useWebSocket(
    technician,
    filters,
    fetchTechnicianFeeds,
    setNotifications,
    setUnreadCount
  );

  // Redirect to login if no technician data
  useEffect(() => {
    if (!technician) {
      console.log("No technician data found, redirecting to login");
      navigate("/technician-login");
      return;
    }

    console.log("🔍 TechnicianFeedApp - Current technician data:", technician);
    console.log("🔍 TechnicianFeedApp - Session ID:", getCurrentSessionId());
  }, [technician, navigate]);

  useEffect(() => {
    // Only fetch data if technician exists
    if (technician) {
      fetchTechnicianFeeds();
    }
  }, [fetchTechnicianFeeds, technician]);

  // Periodic check for counter offer status updates
  useEffect(() => {
    if (!technician) return;

    // Check immediately
    checkCounterOfferStatusUpdates();

    // Set up periodic check every 30 seconds
    const interval = setInterval(() => {
      checkCounterOfferStatusUpdates();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [technician, checkCounterOfferStatusUpdates]);

  // Accept post handler with counter offer checks (security removed)
  const handleAcceptPost = useCallback(
    async (postId) => {
      // Basic input validation
      if (!postId || typeof postId !== "number") {
        setError("Invalid post ID provided.");
        return;
      }

      // Prevent multiple concurrent requests for same post
      if (actionLoading[postId]) {
        console.log("Accept already in progress for post:", postId);
        return;
      }

      try {
        setActionLoading((prev) => ({ ...prev, [postId]: true }));

        console.log("Checking accept impact for post:", postId);

        // First, check if accepting this post would affect any pending counter offers
        const acceptImpactResponse = await checkAcceptImpact(postId);

        if (acceptImpactResponse.success) {
          const post = posts.find((p) => p.id === postId);

          if (acceptImpactResponse.hasPendingCounterOffer) {
            // Show confirmation modal if there's a pending counter offer
            console.log(
              "Pending counter offer found, showing accept confirmation modal"
            );
            setSelectedAcceptPost(post);
            setPendingCounterOfferInfoForAccept(acceptImpactResponse);
            setShowAcceptConfirmationModal(true);
          } else {
            // No pending counter offer, show simple accept modal
            console.log(
              "No pending counter offer, showing simple accept modal"
            );
            setSimpleModalPost(post);
            setShowSimpleAcceptModal(true);
          }
        } else {
          // If we can't check accept impact, show simple accept modal
          console.warn(
            "Failed to check accept impact, showing simple accept modal"
          );
          const post = posts.find((p) => p.id === postId);
          setSimpleModalPost(post);
          setShowSimpleAcceptModal(true);
        }
      } catch (err) {
        console.error("Error checking accept impact:", err);
        // Fallback to simple accept modal if there's an error
        const post = posts.find((p) => p.id === postId);
        setSimpleModalPost(post);
        setShowSimpleAcceptModal(true);
      } finally {
        setActionLoading((prev) => ({ ...prev, [postId]: false }));
      }
    },
    [posts, actionLoading]
  );

  // Simplified regular accept post function
  const proceedWithRegularAccept = useCallback(
    async (postId) => {
      try {
        console.log("Proceeding with regular accept for post:", postId);

        // Use the updated acceptPost function from technicianApiUtils
        const acceptResult = await acceptPost(
          postId,
          technician.email,
          technician.name
        );

        if (acceptResult.success) {
          // Optimistic UI update - remove post immediately for better UX
          setPosts((prevPosts) =>
            prevPosts.filter((post) => post.id !== postId)
          );
          console.log("Post accepted successfully:", acceptResult.message);
        } else {
          setError(acceptResult.message);
        }
      } catch (err) {
        console.error("Error with regular accept:", err);
        handleAcceptError(err);
      }
    },
    [technician?.email, technician?.name]
  );

  // Accept confirmation handler with counter offer withdrawal (security removed)
  const handleConfirmAcceptWithCounterOffer = useCallback(async () => {
    if (!selectedAcceptPost?.id) {
      setError("No post selected for acceptance.");
      return;
    }

    // Prevent multiple concurrent submissions
    if (acceptProcessing) {
      console.log("Accept with counter offer already in progress");
      return;
    }

    try {
      setAcceptProcessing(true);
      console.log(
        "Confirming accept with counter offer withdrawal for post:",
        selectedAcceptPost.id
      );

      const response = await acceptPostWithCounterOfferWithdrawal(
        selectedAcceptPost.id
      );

      if (response.success) {
        // Optimized state updates with batching
        setPosts((prevPosts) =>
          prevPosts.filter((post) => post.id !== selectedAcceptPost.id)
        );

        console.log(
          "Post accepted with counter offer withdrawal:",
          response.message
        );

        // Close modal and clear state
        setShowAcceptConfirmationModal(false);
        setSelectedAcceptPost(null);
        setPendingCounterOfferInfoForAccept(null);
      } else {
        setError(
          response.message ||
            "Failed to accept post with counter offer withdrawal"
        );
      }
    } catch (err) {
      console.error("Error accepting with counter offer withdrawal:", err);
      setError(
        "Failed to accept post with counter offer withdrawal. Please try again."
      );
    } finally {
      setAcceptProcessing(false);
    }
  }, [selectedAcceptPost?.id, acceptProcessing]);

  // Optimized accept cancellation handler
  const handleCancelAccept = useCallback(() => {
    console.log("Accept cancelled by user");
    setShowAcceptConfirmationModal(false);
    setSelectedAcceptPost(null);
    setPendingCounterOfferInfoForAccept(null);
  }, []);

  // Optimized error handler with security enhancements
  const handleAcceptError = useCallback((err) => {
    if (err.response?.status === 401) {
      setError("Authentication failed. Please login again.");
      // Security: Clear invalid tokens
      localStorage.removeItem("accessToken");
    } else if (err.response?.status === 403) {
      setError(
        "Access denied. You do not have permission to accept this post."
      );
    } else if (err.response?.status === 404) {
      setError("Post not found or already processed.");
    } else if (err.code === "ECONNABORTED") {
      setError("Request timeout. Please check your connection and try again.");
    } else {
      setError(
        err.response?.data?.message ||
          "Failed to accept post. Please try again."
      );
    }
  }, []);

  // Decline post handler - with counter offer checks
  const handleDeclinePost = useCallback(
    async (postId) => {
      // Basic input validation
      if (!postId || typeof postId !== "number") {
        setError("Invalid post ID provided.");
        return;
      }

      // Prevent multiple concurrent requests
      const declineKey = `decline_${postId}`;
      if (actionLoading[declineKey]) {
        console.log("Decline already in progress for post:", postId);
        return;
      }

      try {
        setActionLoading((prev) => ({ ...prev, [declineKey]: true }));

        console.log("Checking decline impact for post:", postId);

        // Check if declining this post would affect any pending counter offers
        const declineImpactResponse = await checkDeclineImpact(postId);

        if (declineImpactResponse.success) {
          const post = posts.find((p) => p.id === postId);

          if (declineImpactResponse.hasPendingCounterOffer) {
            // Show confirmation modal if there's a pending counter offer
            console.log(
              "Pending counter offer found, showing decline confirmation modal"
            );
            setDeclinePostData(post);
            setPendingCounterOfferInfo(declineImpactResponse);
            setShowDeclineConfirmationModal(true);
          } else {
            // No pending counter offer, show simple decline modal
            console.log(
              "No pending counter offer, showing simple decline modal"
            );
            setSimpleModalPost(post);
            setShowSimpleDeclineModal(true);
          }
        } else {
          // If we can't check decline impact, show simple decline modal
          console.warn(
            "Failed to check decline impact, showing simple decline modal"
          );
          const post = posts.find((p) => p.id === postId);
          setSimpleModalPost(post);
          setShowSimpleDeclineModal(true);
        }
      } catch (err) {
        console.error("Error checking decline impact:", err);
        // Fallback to simple decline modal if there's an error
        const post = posts.find((p) => p.id === postId);
        setSimpleModalPost(post);
        setShowSimpleDeclineModal(true);
      } finally {
        setActionLoading((prev) => ({ ...prev, [declineKey]: false }));
      }
    },
    [posts, actionLoading]
  );

  // Simplified regular decline post function
  const proceedWithRegularDecline = useCallback(
    async (postId) => {
      try {
        console.log("Proceeding with regular decline for post:", postId);

        // Use the updated declinePost function from technicianApiUtils
        const declineResult = await declinePost(postId, technician.email);

        if (declineResult.success) {
          // Optimistic UI update - remove post immediately for better UX
          setPosts((prevPosts) =>
            prevPosts.filter((post) => post.id !== postId)
          );
          console.log("Post declined successfully:", declineResult.message);
        } else {
          setError(declineResult.message);
        }
      } catch (err) {
        console.error("Error with regular decline:", err);
        handleDeclineError(err);
      }
    },
    [technician?.email]
  );

  // Decline confirmation handler with counter offer withdrawal (security removed)
  const handleConfirmDeclineWithCounterOffer = useCallback(async () => {
    if (!declinePostData?.id) {
      setError("No post selected for decline.");
      return;
    }

    // Prevent multiple concurrent submissions
    if (declineProcessing) {
      console.log("Decline with counter offer already in progress");
      return;
    }

    try {
      setDeclineProcessing(true);
      console.log(
        "Confirming decline with counter offer withdrawal for post:",
        declinePostData.id
      );

      const response = await declinePostWithCounterOfferWithdrawal(
        declinePostData.id
      );

      if (response.success) {
        // Optimized state updates with batching
        setPosts((prevPosts) =>
          prevPosts.filter((post) => post.id !== declinePostData.id)
        );

        console.log(
          "Post declined with counter offer withdrawal:",
          response.message
        );

        // Close modal and clear state
        setShowDeclineConfirmationModal(false);
        setDeclinePostData(null);
        setPendingCounterOfferInfo(null);
      } else {
        setError(
          response.message ||
            "Failed to decline post with counter offer withdrawal"
        );
      }
    } catch (err) {
      console.error("Error declining with counter offer withdrawal:", err);
      setError(
        "Failed to decline post with counter offer withdrawal. Please try again."
      );
    } finally {
      setDeclineProcessing(false);
    }
  }, [declinePostData?.id, declineProcessing]);

  // Optimized decline cancellation handler
  const handleCancelDecline = useCallback(() => {
    console.log("Decline cancelled by user");
    setShowDeclineConfirmationModal(false);
    setDeclinePostData(null);
    setPendingCounterOfferInfo(null);
  }, []);

  // Simple modal handlers
  const handleSimpleAcceptConfirm = useCallback(async () => {
    if (!simpleModalPost?.id) {
      setError("No post selected for acceptance.");
      return;
    }

    try {
      setSimpleModalProcessing(true);
      console.log("Confirming simple accept for post:", simpleModalPost.id);

      const acceptResult = await acceptPost(
        simpleModalPost.id,
        technician.email,
        technician.name
      );

      if (acceptResult.success) {
        // Optimistic UI update - remove post immediately for better UX
        setPosts((prevPosts) =>
          prevPosts.filter((post) => post.id !== simpleModalPost.id)
        );
        console.log("Post accepted successfully:", acceptResult.message);

        // Close modal and clear state
        setShowSimpleAcceptModal(false);
        setSimpleModalPost(null);
      } else {
        setError(acceptResult.message);
      }
    } catch (err) {
      console.error("Error with simple accept:", err);
      handleAcceptError(err);
    } finally {
      setSimpleModalProcessing(false);
    }
  }, [simpleModalPost, technician?.email, technician?.name]);

  const handleSimpleDeclineConfirm = useCallback(async () => {
    if (!simpleModalPost?.id) {
      setError("No post selected for decline.");
      return;
    }

    try {
      setSimpleModalProcessing(true);
      console.log("Confirming simple decline for post:", simpleModalPost.id);

      const declineResult = await declinePost(
        simpleModalPost.id,
        technician.email
      );

      if (declineResult.success) {
        // Optimistic UI update - remove post immediately for better UX
        setPosts((prevPosts) =>
          prevPosts.filter((post) => post.id !== simpleModalPost.id)
        );
        console.log("Post declined successfully:", declineResult.message);

        // Close modal and clear state
        setShowSimpleDeclineModal(false);
        setSimpleModalPost(null);
      } else {
        setError(declineResult.message);
      }
    } catch (err) {
      console.error("Error with simple decline:", err);
      handleDeclineError(err);
    } finally {
      setSimpleModalProcessing(false);
    }
  }, [simpleModalPost, technician?.email]);

  // Handle decline errors
  const handleDeclineError = (err) => {
    if (err.response?.status === 401) {
      setError("Authentication failed. Please login again.");
    } else if (err.response?.status === 403) {
      setError(
        "Access denied. You do not have permission to decline this post."
      );
    } else if (err.response?.status === 404) {
      setError("Post not found or already processed.");
    } else if (err.response?.status === 400) {
      setError(
        err.response?.data?.message ||
          "Post is already declined or not available."
      );
    } else {
      setError(
        err.response?.data?.message ||
          "Failed to decline post. Please try again."
      );
    }
  };

  // Handle counter offer submission with immediate state updates
  const handleCounterOfferSubmit = useCallback(
    async (counterOfferData) => {
      if (!selectedPost) {
        throw new Error("No post selected for counter offer");
      }

      setCounterOfferSubmitting(true);

      try {
        console.log("Submitting counter offer for post:", selectedPost.id);
        console.log("Counter offer data:", counterOfferData);

        const response = await submitCounterOffer(
          selectedPost.id,
          counterOfferData
        );

        if (response.success) {
          console.log(
            "Counter offer submitted successfully:",
            response.message
          );

          // Performance: Immediately update local state for instant UI feedback
          const postId = selectedPost.id;

          // Update counter offer eligibility state immediately
          setCounterOfferEligibility((prev) => {
            const currentEligibility = prev[postId] || {};
            return {
              ...prev,
              [postId]: {
                postId: postId,
                success: true,
                canSubmit: false,
                canSubmitCounterOffer: false,
                message:
                  "Counter offer submitted successfully. Please wait for dealer response.",
                remainingCooldownSeconds: 0, // Will be updated by background refresh
                remainingCooldownHours: 0,
                remainingCooldownMinutes: 0,
                lastOfferSubmittedAt: new Date().toISOString(),
                canSubmitAfter: null,
                // Preserve and increment attempt tracking fields
                attemptNumber: (currentEligibility.attemptNumber || 0) + 1,
                maxAttempts: currentEligibility.maxAttempts || 3,
                maxAttemptsReached:
                  (currentEligibility.attemptNumber || 0) + 1 >=
                  (currentEligibility.maxAttempts || 3),
                previousAttempts: currentEligibility.previousAttempts || [],
                isReCounterOffer: (currentEligibility.attemptNumber || 0) > 0,
                // Set cooldown fields
                cooldownHours: currentEligibility.cooldownHours || 48,
                remainingCooldownMillis: 0,
              },
            };
          });

          // Close modal and clear selection
          setShowCounterOfferModal(false);
          setSelectedPost(null);

          // Performance: Trigger a background refresh to ensure data consistency
          setTimeout(async () => {
            try {
              const eligibility = await checkCounterOfferEligibility(postId);
              setCounterOfferEligibility((prev) => ({
                ...prev,
                [postId]: {
                  postId: postId,
                  canSubmit: eligibility.canSubmitCounterOffer,
                  canSubmitCounterOffer: eligibility.canSubmitCounterOffer,
                  message: eligibility.message,
                  cooldownHours: eligibility.cooldownHours,
                  success: eligibility.success,
                  remainingCooldownSeconds:
                    eligibility.remainingCooldownSeconds,
                  remainingCooldownMillis: eligibility.remainingCooldownMillis,
                  remainingCooldownHours: eligibility.remainingCooldownHours,
                  remainingCooldownMinutes:
                    eligibility.remainingCooldownMinutes,
                  lastOfferSubmittedAt: eligibility.lastOfferSubmittedAt,
                  canSubmitAfter: eligibility.canSubmitAfter,
                  // New attempt tracking fields
                  attemptNumber: eligibility.attemptNumber,
                  maxAttempts: eligibility.maxAttempts,
                  maxAttemptsReached: eligibility.maxAttemptsReached,
                  previousAttempts: eligibility.previousAttempts,
                  isReCounterOffer: eligibility.isReCounterOffer,
                },
              }));
            } catch (error) {
              console.error(
                "Error refreshing eligibility after counter offer:",
                error
              );
            }
          }, 1000);

          return response;
        } else {
          throw new Error(response.message || "Failed to submit counter offer");
        }
      } catch (error) {
        console.error("Error submitting counter offer:", error);
        throw error;
      } finally {
        setCounterOfferSubmitting(false);
      }
    },
    [selectedPost]
  );

  // Optimized counter offer modal handlers
  const handleOpenCounterOffer = useCallback((post) => {
    setSelectedPost(post);
    setShowCounterOfferModal(true);
  }, []);

  const handleOpenCounterOfferStatus = useCallback(() => {
    console.log("🔍 Opening counter offer status modal");
    console.log("🔍 Current technician data:", technician);
    setShowCounterOfferStatusModal(true);
  }, [technician]);

  const handleCounterOfferStatusRefresh = useCallback(async () => {
    try {
      const response = await getCounterOfferStatus();
      return response;
    } catch (error) {
      console.error("Error refreshing counter offer status:", error);
      throw error;
    }
  }, []);

  // Optimized counter offer eligibility checker for all posts
  const checkCounterOfferEligibilityForPosts = useCallback(
    async (postsList) => {
      if (!postsList || postsList.length === 0) return;

      try {
        const eligibilityChecks = await Promise.all(
          postsList.map(async (post) => {
            const eligibility = await checkCounterOfferEligibility(post.id);
            return {
              postId: post.id,
              canSubmit: eligibility.canSubmitCounterOffer,
              canSubmitCounterOffer: eligibility.canSubmitCounterOffer,
              message: eligibility.message,
              cooldownHours: eligibility.cooldownHours,
              success: eligibility.success,
              remainingCooldownSeconds: eligibility.remainingCooldownSeconds,
              remainingCooldownMillis: eligibility.remainingCooldownMillis,
              remainingCooldownHours: eligibility.remainingCooldownHours,
              remainingCooldownMinutes: eligibility.remainingCooldownMinutes,
              lastOfferSubmittedAt: eligibility.lastOfferSubmittedAt,
              canSubmitAfter: eligibility.canSubmitAfter,
              // New attempt tracking fields
              attemptNumber: eligibility.attemptNumber,
              maxAttempts: eligibility.maxAttempts,
              maxAttemptsReached: eligibility.maxAttemptsReached,
              previousAttempts: eligibility.previousAttempts,
              isReCounterOffer: eligibility.isReCounterOffer,
            };
          })
        );

        const eligibilityMap = {};
        eligibilityChecks.forEach((check) => {
          eligibilityMap[check.postId] = check;
        });

        setCounterOfferEligibility(eligibilityMap);
      } catch (error) {
        console.error("Error checking counter offer eligibility:", error);
      }
    },
    []
  );

  const formatCurrency = (amount) => {
    if (!amount) return "N/A";

    // Remove any existing currency symbols and clean the string
    const cleanAmount = amount.toString().replace(/[$,]/g, "");

    // Check if it's a valid number
    const numAmount = parseFloat(cleanAmount);
    if (isNaN(numAmount)) return amount;

    // Format as currency
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(numAmount);
  };

  // getStatusBadge function removed as it was unused
  /*
  const getStatusBadge = (status) => {
    const getStatusColor = (status) => {
      switch (status?.toUpperCase()) {
        case "PENDING":
          return { bg: "#ffc107", color: "#000" };
        case "ACCEPTED":
          return { bg: "#198754", color: "white" };
        case "CANCELLED":
          return { bg: "#6c757d", color: "white" };
        default:
          return { bg: "#17a2b8", color: "white" };
      }
    };

    const colors = getStatusColor(status);
    return (
      <span
        style={{
          backgroundColor: colors.bg,
          color: colors.color,
          padding: "0.25rem 0.5rem",
          borderRadius: "0.25rem",
          fontSize: "0.75rem",
          fontWeight: "500",
        }}
      >
        {status || "Unknown"}
      </span>
    );
  };
  */

  // Check if technician data exists
  if (!technician) {
    return (
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
        <div style={{ textAlign: "center", marginTop: "3rem" }}>
          <div
            style={{
              width: "3rem",
              height: "3rem",
              border: "4px solid #f3f3f3",
              borderTop: "4px solid #0d6efd",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 1rem",
            }}
          ></div>
          <h5>Redirecting to Login...</h5>
          <p style={{ color: "#6c757d" }}>
            No technician data found. Please log in.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
        <div style={{ textAlign: "center", marginTop: "3rem" }}>
          <div
            style={{
              width: "3rem",
              height: "3rem",
              border: "4px solid #f3f3f3",
              borderTop: "4px solid #0d6efd",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 1rem",
            }}
          ></div>
          <h5>Loading Technician Feeds...</h5>
          <p style={{ color: "#6c757d" }}>
            Please wait while we fetch available posts.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
        <div
          style={{
            backgroundColor: "#f8d7da",
            border: "1px solid #f5c6cb",
            borderRadius: "0.375rem",
            padding: "1rem",
            color: "#721c24",
            marginTop: "3rem",
          }}
        >
          <h5 style={{ marginBottom: "0.5rem" }}>Error Loading Feeds</h5>
          <p style={{ margin: 0 }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Navigation Header */}
      <TechnicianHeader
        technician={technician}
        notifications={notifications}
        unreadCount={unreadCount}
        showNotifDropdown={showNotifDropdown}
        setShowNotifDropdown={setShowNotifDropdown}
        setShowProfileModal={setShowProfileModal}
        handleLogout={() => {
          // Clear all storage using session manager
          clearTechnicianData();
          localStorage.removeItem("accessToken");
          window.location.href = "/";
        }}
        onMarkAllAsRead={() => {
          setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
          setUnreadCount(0);
        }}
        onClearAll={() => {
          setNotifications([]);
          setUnreadCount(0);
        }}
        onMarkAsRead={(id) => {
          setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: true } : n))
          );
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }}
        currentPage="feeds"
      />

      {/* Counter Offers Quick Access */}
      <div
        style={{
          maxWidth: "1200px",
          margin: "1rem auto 0",
          padding: "0 1rem",
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <button
          onClick={handleOpenCounterOfferStatus}
          style={{
            backgroundColor: "#17a2b8",
            color: "white",
            border: "none",
            padding: "0.5rem 1rem",
            borderRadius: "0.375rem",
            fontSize: "0.875rem",
            fontWeight: "500",
            cursor: "pointer",
            transition: "background-color 0.2s ease",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = "#138496";
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = "#17a2b8";
          }}
        >
          <FaEye />
          View All Counter Offers
        </button>
      </div>

      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "20px",
          marginTop: "120px",
        }}
      >
        <div style={{ marginBottom: "2rem" }}>
          <h2
            style={{
              color: "#0d6efd",
              marginBottom: "0.5rem",
              display: "flex",
              alignItems: "center",
            }}
          >
            <FaList style={{ marginRight: "0.5rem" }} />
            Technician Job Feeds
          </h2>
          <p style={{ color: "#6c757d", marginBottom: "1rem" }}>
            Available inspection posts in your area. You can accept posts
            directly, decline them, or submit counter offers for different
            amounts.
          </p>

          {/* Counter Offer Status Button */}
          <div style={{ marginBottom: "1rem" }}>
            <button
              onClick={handleOpenCounterOfferStatus}
              style={{
                backgroundColor: "#6f42c1",
                color: "white",
                border: "none",
                padding: "0.5rem 1rem",
                borderRadius: "0.375rem",
                fontSize: "0.875rem",
                fontWeight: "500",
                cursor: "pointer",
                transition: "background-color 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "#5a32a3";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "#6f42c1";
              }}
            >
              <FaEye style={{ marginRight: "0.5rem" }} />
              View Counter Offer Status
            </button>
          </div>
          {posts.length > 0 && (
            <span
              style={{
                backgroundColor: "#17a2b8",
                color: "white",
                padding: "0.25rem 0.5rem",
                borderRadius: "0.25rem",
                fontSize: "0.875rem",
                marginBottom: "1rem",
                display: "inline-block",
              }}
            >
              {posts.length} post{posts.length !== 1 ? "s" : ""} available
            </span>
          )}
        </div>
      </div>

      {posts.length === 0 ? (
        <div
          style={{
            backgroundColor: "#d1ecf1",
            border: "1px solid #bee5eb",
            borderRadius: "0.375rem",
            padding: "1rem",
            color: "#0c5460",
          }}
        >
          <h5 style={{ marginBottom: "0.5rem" }}>No Posts Available</h5>
          <p style={{ margin: 0 }}>
            There are currently no pending inspection posts in your area. Check
            back later for new opportunities.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {posts.map((post) => (
            <div
              key={post.id}
              style={{
                border: "1px solid #dee2e6",
                borderRadius: "0.375rem",
                backgroundColor: "white",
                boxShadow: "0 0.125rem 0.25rem rgba(0, 0, 0, 0.075)",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  padding: "1rem",
                  borderBottom: "1px solid #dee2e6",
                  backgroundColor: "#f8f9fa",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <div>
                    <h6
                      style={{
                        marginBottom: "0.25rem",
                        color: "#0d6efd",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <FaUser style={{ marginRight: "0.25rem" }} />
                      {post.name || "Unknown Customer"}
                    </h6>
                    <small style={{ color: "#6c757d" }}>
                      {post.dealerName || "Unknown Dealer"}
                    </small>
                  </div>
                  <span
                    style={{
                      backgroundColor:
                        post.status === "PENDING"
                          ? "#ffc107"
                          : post.status === "ACCEPTED"
                          ? "#198754"
                          : post.status === "DECLINED"
                          ? "#dc3545"
                          : "#6c757d",
                      color: post.status === "PENDING" ? "#000" : "white",
                      padding: "0.25rem 0.5rem",
                      borderRadius: "0.25rem",
                      fontSize: "0.75rem",
                      fontWeight: "500",
                    }}
                  >
                    {post.status || "Unknown"}
                  </span>
                </div>
              </div>

              <div
                style={{
                  padding: "1rem",
                  flex: "1",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div style={{ marginBottom: "1rem" }}>
                  <h6
                    style={{
                      color: "#212529",
                      marginBottom: "0.5rem",
                      fontSize: "1rem",
                      fontWeight: "600",
                    }}
                  >
                    Inspection Request
                  </h6>
                  <p
                    style={{
                      color: "#6c757d",
                      margin: 0,
                      fontSize: "0.875rem",
                    }}
                  >
                    {post.content || "No description provided"}
                  </p>
                </div>

                <div style={{ marginTop: "auto" }}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "0.5rem",
                      marginBottom: "1rem",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        color: "#6c757d",
                        fontSize: "0.875rem",
                      }}
                    >
                      <FaMapMarkerAlt style={{ marginRight: "0.25rem" }} />
                      <span>{post.location || "Location not specified"}</span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        color: "#198754",
                        fontSize: "0.875rem",
                      }}
                    >
                      <FaDollarSign style={{ marginRight: "0.25rem" }} />
                      <strong>{formatCurrency(post.offerAmount)}</strong>
                    </div>
                  </div>

                  {post.vin && (
                    <div style={{ marginBottom: "0.5rem" }}>
                      <small style={{ color: "#6c757d" }}>
                        <strong>VIN:</strong> {post.vin}
                      </small>
                    </div>
                  )}

                  {post.auctionLot && (
                    <div style={{ marginBottom: "0.5rem" }}>
                      <small style={{ color: "#6c757d" }}>
                        <strong>Auction Lot:</strong> {post.auctionLot}
                      </small>
                    </div>
                  )}

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginTop: "1rem",
                    }}
                  >
                    <small
                      style={{
                        color: "#6c757d",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <FaCalendar style={{ marginRight: "0.25rem" }} />
                      Post #{post.id}
                    </small>
                    <small style={{ color: "#6c757d" }}>
                      ID: {post.dealerPostId}
                    </small>
                  </div>
                </div>
              </div>

              <div
                style={{
                  padding: "1rem",
                  borderTop: "1px solid #dee2e6",
                  backgroundColor: "transparent",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "0.5rem",
                  }}
                >
                  <small style={{ color: "#6c757d" }}>
                    {post.email || "No contact email"}
                  </small>
                  <span
                    style={{
                      backgroundColor: "#f8f9fa",
                      color: "#212529",
                      padding: "0.25rem 0.5rem",
                      borderRadius: "0.25rem",
                      fontSize: "0.75rem",
                      border: "1px solid #dee2e6",
                    }}
                  >
                    Ready
                  </span>
                </div>

                {/* Action Buttons */}
                <div
                  style={{
                    display: "flex",
                    gap: "0.5rem",
                    flexDirection: "column",
                  }}
                >
                  {/* Top row: Accept and Decline */}
                  <div
                    style={{
                      display: "flex",
                      gap: "0.5rem",
                    }}
                  >
                    <button
                      onClick={() => handleAcceptPost(post.id)}
                      disabled={actionLoading[post.id]}
                      style={{
                        flex: 1,
                        backgroundColor: "#198754",
                        color: "white",
                        border: "none",
                        padding: "0.5rem 1rem",
                        borderRadius: "0.375rem",
                        fontSize: "0.875rem",
                        fontWeight: "500",
                        cursor: actionLoading[post.id]
                          ? "not-allowed"
                          : "pointer",
                        opacity: actionLoading[post.id] ? 0.6 : 1,
                        transition: "background-color 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        if (!actionLoading[post.id]) {
                          e.target.style.backgroundColor = "#157347";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!actionLoading[post.id]) {
                          e.target.style.backgroundColor = "#198754";
                        }
                      }}
                    >
                      {actionLoading[post.id] ? (
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <div
                            style={{
                              width: "1rem",
                              height: "1rem",
                              border: "2px solid #ffffff",
                              borderTop: "2px solid transparent",
                              borderRadius: "50%",
                              animation: "spin 1s linear infinite",
                              marginRight: "0.5rem",
                            }}
                          ></div>
                          Accepting...
                        </span>
                      ) : (
                        "Accept Post"
                      )}
                    </button>

                    <button
                      onClick={() => handleDeclinePost(post.id)}
                      disabled={actionLoading[`decline_${post.id}`]}
                      style={{
                        flex: 1,
                        backgroundColor: "#dc3545",
                        color: "white",
                        border: "none",
                        padding: "0.5rem 1rem",
                        borderRadius: "0.375rem",
                        fontSize: "0.875rem",
                        fontWeight: "500",
                        cursor: actionLoading[`decline_${post.id}`]
                          ? "not-allowed"
                          : "pointer",
                        opacity: actionLoading[`decline_${post.id}`] ? 0.6 : 1,
                        transition: "background-color 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        if (!actionLoading[`decline_${post.id}`]) {
                          e.target.style.backgroundColor = "#c82333";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!actionLoading[`decline_${post.id}`]) {
                          e.target.style.backgroundColor = "#dc3545";
                        }
                      }}
                    >
                      {actionLoading[`decline_${post.id}`] ? (
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <div
                            style={{
                              width: "1rem",
                              height: "1rem",
                              border: "2px solid #ffffff",
                              borderTop: "2px solid transparent",
                              borderRadius: "50%",
                              animation: "spin 1s linear infinite",
                              marginRight: "0.5rem",
                            }}
                          ></div>
                          Declining...
                        </span>
                      ) : (
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <FaTimes style={{ marginRight: "0.25rem" }} />
                          Decline
                        </span>
                      )}
                    </button>
                  </div>

                  {/* Bottom row: Counter Offer with Countdown */}
                  <CounterOfferButton
                    post={post}
                    eligibility={counterOfferEligibility[post.id]}
                    onCounterOfferClick={handleOpenCounterOffer}
                    onEligibilityRefresh={refreshCounterOfferEligibility}
                    hideInfo={true}
                  />

                  {/* Chat Button - hidden for PENDING posts */}
                  {post.email && post.status !== "PENDING" && (
                    <div style={{ marginTop: "0.5rem" }}>
                      <ChatButton
                        dealerEmail={post.email}
                        technicianEmail={technician?.email}
                        userType="TECHNICIAN"
                        variant="outline-primary"
                        size="sm"
                        className="w-100"
                        showText={true}
                        postId={post.id}
                        postTitle={`${post.carMake || "Vehicle"} ${
                          post.carModel || "Inspection"
                        }`}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Counter Offer Modal */}
      <TechnicianCounterOfferModal
        show={showCounterOfferModal}
        onHide={() => {
          setShowCounterOfferModal(false);
          setSelectedPost(null);
        }}
        post={selectedPost}
        technician={technician} // Using technician object which contains technician info
        onSubmit={handleCounterOfferSubmit}
        isSubmitting={counterOfferSubmitting}
      />

      {/* Counter Offer Status Modal */}
      <TechnicianCounterOfferStatusModal
        show={showCounterOfferStatusModal}
        onHide={() => setShowCounterOfferStatusModal(false)}
        technicianId={technician?.email}
        onNewNotification={handleCounterOfferStatusRefresh}
      />

      {/* Decline Confirmation Modal */}
      <DeclineConfirmationModal
        show={showDeclineConfirmationModal}
        onHide={() => setShowDeclineConfirmationModal(false)}
        onConfirm={handleConfirmDeclineWithCounterOffer}
        onCancel={handleCancelDecline}
        post={declinePostData}
        pendingCounterOffer={pendingCounterOfferInfo}
        isProcessing={declineProcessing}
      />

      {/* Accept Confirmation Modal */}
      <AcceptConfirmationModal
        show={showAcceptConfirmationModal}
        onHide={() => setShowAcceptConfirmationModal(false)}
        onConfirm={handleConfirmAcceptWithCounterOffer}
        onCancel={handleCancelAccept}
        post={selectedAcceptPost}
        pendingCounterOffer={pendingCounterOfferInfoForAccept}
        isProcessing={acceptProcessing}
      />

      {/* Simple Accept Modal */}
      <SimpleAcceptModal
        show={showSimpleAcceptModal}
        onHide={() => {
          setShowSimpleAcceptModal(false);
          setSimpleModalPost(null);
        }}
        onConfirm={handleSimpleAcceptConfirm}
        post={simpleModalPost}
        isProcessing={simpleModalProcessing}
      />

      {/* Simple Decline Modal */}
      <SimpleDeclineModal
        show={showSimpleDeclineModal}
        onHide={() => {
          setShowSimpleDeclineModal(false);
          setSimpleModalPost(null);
        }}
        onConfirm={handleSimpleDeclineConfirm}
        post={simpleModalPost}
        isProcessing={simpleModalProcessing}
      />
    </div>
  );
};

export default TechnicianFeedApp;
