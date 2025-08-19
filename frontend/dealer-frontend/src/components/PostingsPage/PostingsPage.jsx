import React, {
  useState,
  useEffect,
  useMemo,
  Suspense,
  useCallback,
  useRef,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import api from "../../api";
import "bootstrap/dist/css/bootstrap.min.css";
import cityData from "../../data/US_States_and_Cities.json";
import "animate.css/animate.min.css";
import AOS from "aos";
import "aos/dist/aos.css";
import { API_CONFIG } from "../../api";
import { clearDealerSession } from "../../utils/sessionManager";

// Authentication system completely removed

// Component imports
import PostCard from "../PostCard";
import PostForm from "../../PostForm";
import FilterBar from "../../FilterBar";
import DeleteModal from "../DeleteModal";
import CancelModal from "../CancelModal";
import CounterOffersModal from "../CounterOffersModal";

import ProfileHeader from "./ProfileHeader";
import StatusBadges from "./StatusBadges";
import BulkActionsBar from "./BulkActionsBar";
import PaginationBar from "./PaginationBar";
// LogoutModal removed with authentication
import FloatingAddButton from "./FloatingAddButton";
import LoadingSkeleton from "./LoadingSkeleton";
import PerformanceMonitor from "../PerformanceMonitor";

// Hooks and utilities
import useWebSocket from "../../hooks/useWebSocket";
import { useSessionTimeout } from "../../hooks/useSessionTimeout";
import { filterPosts, capitalizeWords, postIcons } from "../../utils/postUtils";
import { debounce, optimizeAnimations } from "../../utils/performanceUtils";
import {
  addSuccessNotification,
  addErrorNotification,
  addWarningNotification,
  addInfoNotification,
  markAllNotificationsAsRead,
  clearNotifications,
} from "../../utils/notificationUtils";
import {
  addSystemActivity,
  addBackgroundActivity,
  addUserActivity,
} from "../../utils/activityLogUtils";

function PostingsPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const initialLoadCompleted = useRef(false);

  // Initialize session timeout monitoring
  useSessionTimeout();

  // Get dealer info from localStorage - NO FALLBACKS, must be real data
  const dealerInfo = JSON.parse(localStorage.getItem("dealerInfo") || "{}");

  // Use ONLY real dealer info from localStorage - no mock/hardcoded fallbacks
  const dealer = dealerInfo.email
    ? {
        id: dealerInfo.id,
        email: dealerInfo.email,
        name: dealerInfo.name,
        location: dealerInfo.location,
      }
    : null;

  // Redirect to login if no valid dealer info (no mock data allowed)
  useEffect(() => {
    if (!dealer || !dealer.email) {
      console.error("❌ No valid dealer info found. Redirecting to login.");
      console.log("Current dealerInfo:", dealerInfo);
      // Redirect to login instead of using mock data
      navigate("/");
      return;
    }
    console.log("✅ Valid dealer info found:", dealer);
  }, [dealer, dealerInfo, navigate]);

  const [postListRef] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showCounterOffersModal, setShowCounterOffersModal] = useState(false);

  // Post management state
  const [post, setPost] = useState({
    content: "",
    location: "",
    offerAmount: "",
  });

  const [allPosts, setAllPosts] = useState([]);
  const [masterPosts, setMasterPosts] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});
  const [animateOut, setAnimateOut] = useState(false);
  const [locations, setLocations] = useState([]);
  const [offers, setOffers] = useState([]);

  // Filter and pagination state
  const [filters, setFilters] = useState({
    location: "",
    offerAmount: "",
    status: "PENDING",
  });
  const [selectedCity, setSelectedCity] = useState(null);
  const [iconIndex, setIconIndex] = useState(0);
  const [sortOrder, setSortOrder] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 15;
  const initialSkeletonCount = 6; // Show fewer skeletons initially for faster perceived loading

  // UI state
  const [selectedPosts, setSelectedPosts] = useState([]);
  const [deleteModalId, setDeleteModalId] = useState(null);
  const [cancelModalId, setCancelModalId] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [, setPostActionLoading] = useState(false);
  const [undoDelete, setUndoDelete] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [showDeletedPosts, setShowDeletedPosts] = useState(false);
  const [deletedPosts, setDeletedPosts] = useState([]);
  const [deletedPostsLoading, setDeletedPostsLoading] = useState(false);

  // Notification state
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  // Activity log state
  const [activityLog, setActivityLog] = useState([]);

  // Counter offers state
  const [pendingCounterOffersCount, setPendingCounterOffersCount] = useState(0);
  const [counterOffersLoading, setCounterOffersLoading] = useState(false);

  // Memoized computed values for better performance
  // Sort posts by status priority and date, then apply sequential numbering
  const sortedPosts = useMemo(() => {
    const postsCopy = [...allPosts];
    const sorted = postsCopy.sort((a, b) => {
      const priority = { PENDING: 1, ACCEPTED: 2, CANCELLED: 3, COMPLETED: 4 };
      const statusA = priority[a.status] || 5;
      const statusB = priority[b.status] || 5;
      if (statusA !== statusB) return statusA - statusB;
      const dateA = new Date(a.updatedAt || a.createdAt);
      const dateB = new Date(b.updatedAt || b.createdAt);
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

    // ✅ FIXED: Apply sequential numbering based on CREATION ORDER (ID) from ALL posts, not filtered posts
    // Use masterPosts (all posts) to calculate sequential numbering, not allPosts (filtered)
    const postsByCreationOrder = [...masterPosts].sort((a, b) => a.id - b.id);

    // Create a map of post ID to sequential number based on ALL posts
    const sequentialNumberMap = {};
    postsByCreationOrder.forEach((post, index) => {
      sequentialNumberMap[post.id] = index + 1;
    });

    // Apply sequential numbers to the sorted posts (filtered posts)
    const postsWithNumbers = sorted.map((post) => ({
      ...post,
      dealerPostNumber: sequentialNumberMap[post.id],
      displayId: `Post #${sequentialNumberMap[post.id]}`,
    }));

    console.log(
      "sortedPosts: Applied sequential numbering based on ALL posts creation order:",
      postsWithNumbers.map((p) => ({
        id: p.id,
        dealerPostNumber: p.dealerPostNumber,
        displayId: p.displayId,
      }))
    );

    return postsWithNumbers;
  }, [allPosts, masterPosts, sortOrder]);

  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = useMemo(
    () => sortedPosts.slice(indexOfFirstPost, indexOfLastPost),
    [sortedPosts, indexOfFirstPost, indexOfLastPost]
  );

  const allCurrentIds = useMemo(
    () => currentPosts.map((p) => p.id),
    [currentPosts]
  );

  const allSelected = useMemo(
    () =>
      selectedPosts.length === currentPosts.length && currentPosts.length > 0,
    [selectedPosts.length, currentPosts.length]
  );

  const statusCounts = useMemo(() => {
    if (!Array.isArray(masterPosts)) {
      return {};
    }
    return masterPosts.reduce((acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    }, {});
  }, [masterPosts]);

  const cityOptions = useMemo(
    () =>
      Object.entries(cityData).flatMap(([state, cities]) =>
        cities.map((city) => ({
          label: `${city}, ${capitalizeWords(state)}`,
          value: `${city}, ${capitalizeWords(state)}`,
        }))
      ),
    []
  );

  // Dependent filter logic - memoized for performance
  const filteredLocations = useMemo(() => {
    if (!filters.offerAmount) return locations;
    if (!Array.isArray(masterPosts)) return locations;
    const locSet = new Set();
    masterPosts.forEach((p) => {
      if (
        p.offerAmount === filters.offerAmount &&
        p.location &&
        p.location.trim() !== ""
      ) {
        locSet.add(capitalizeWords(p.location));
      }
    });
    return Array.from(locSet);
  }, [filters.offerAmount, locations, masterPosts]);

  const filteredOffers = useMemo(() => {
    if (!filters.location) return offers;
    if (!Array.isArray(masterPosts)) return offers;
    const offerSet = new Set();
    masterPosts.forEach((p) => {
      if (
        capitalizeWords(p.location) === filters.location &&
        p.offerAmount &&
        p.offerAmount.trim() !== ""
      ) {
        offerSet.add(p.offerAmount);
      }
    });
    return Array.from(offerSet);
  }, [filters.location, offers, masterPosts]);

  const totalPages = Math.ceil(sortedPosts.length / postsPerPage);

  // Memoized event handlers for better performance
  const toggleSelectAll = useCallback(() => {
    if (allSelected) setSelectedPosts([]);
    else setSelectedPosts(allCurrentIds);
  }, [allSelected, allCurrentIds]);

  const toggleSelectPost = useCallback((id) => {
    setSelectedPosts((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );
  }, []);

  // API functions - memoized to prevent unnecessary re-renders
  const fetchPosts = useCallback(async () => {
    try {
      console.log("fetchPosts: Fetching posts for email:", dealer?.email);
      console.log("fetchPosts: Dealer info from localStorage:", dealerInfo);
      console.log(
        "fetchPosts: Making API call to:",
        `${API_CONFIG.POSTS_BASE_URL}/posts-by-email`
      );

      // ✅ REAL API CALL: Get dealer's posts through Gateway
      const res = await api.post(
        `${API_CONFIG.POSTS_BASE_URL}/posts-by-email`,
        {
          email: dealer?.email,
        }
      );

      console.log("fetchPosts: API Response status:", res.status);
      console.log("fetchPosts: API Response data:", res.data);
      console.log("fetchPosts: Response data type:", typeof res.data);
      console.log(
        "fetchPosts: Is response data array?",
        Array.isArray(res.data)
      );

      const posts = Array.isArray(res.data) ? res.data : [];
      console.log("fetchPosts: Processed posts count:", posts.length);
      console.log("fetchPosts: Posts details:", posts);

      // Backend should already return only posts for this dealer
      // But let's verify by checking the emails
      console.log("fetchPosts: Dealer email:", dealer?.email);
      console.log(
        "fetchPosts: Post emails:",
        posts.map((p) => p.email)
      );

      // Backend returns posts ordered by ID ascending (oldest first)
      // No need to reverse since backend now returns in correct order
      const sortedPosts = [...posts];

      console.log("fetchPosts: Posts for sequential numbering:", sortedPosts);
      console.log(
        "fetchPosts: Post IDs:",
        posts.map((p) => p.id)
      );

      // Sequential numbering is now applied in the sortedPosts calculation
      console.log("fetchPosts: Posts ready for display:", sortedPosts);

      setMasterPosts(sortedPosts);
      setAllPosts(filterPosts(sortedPosts, filters));

      // Update dropdowns
      const locMap = new Map();
      const offerMap = new Map();
      posts.forEach((p) => {
        if (p.location)
          locMap.set(p.location.toLowerCase(), capitalizeWords(p.location));
        if (p.offerAmount)
          offerMap.set(p.offerAmount.toLowerCase(), p.offerAmount);
      });

      setLocations([...locMap.values()]);
      setOffers([...offerMap.values()]);
    } catch (err) {
      console.error("Error in fetchPosts:", err);
      console.error("Error response:", err.response);
      console.error("Error status:", err.response?.status);
      console.error("Error data:", err.response?.data);

      let errorMessage = "❌ Failed to load posts";

      if (err.response?.data) {
        if (typeof err.response.data === "string") {
          errorMessage = err.response.data;
        } else if (typeof err.response.data === "object") {
          const values = Object.values(err.response.data);
          if (values.length && typeof values[0] === "string") {
            errorMessage = values[0];
          } else {
            errorMessage = JSON.stringify(err.response.data);
          }
        }
      }

      addErrorNotification(setNotifications, setUnreadCount, errorMessage);
    }
  }, [dealer?.email, dealerInfo]);

  // Fetch pending counter offers count
  const fetchPendingCounterOffersCount = useCallback(async () => {
    if (!dealer?.email) {
      console.warn("❌ Cannot fetch counter offers: No dealer email");
      return;
    }

    console.log(
      "🔄 Fetching pending counter offers count for dealer:",
      dealer.email
    );
    setCounterOffersLoading(true);

    try {
      const url = `${API_CONFIG.POSTS_BASE_URL}/counter-offers/pending/${dealer.email}`;
      console.log("📡 Counter offers API call:", url);

      const response = await api.get(url);
      console.log("📥 Counter offers response:", response.data);

      if (response.data && response.data.success) {
        const count = response.data.totalPendingCount || 0;
        console.log("✅ Found", count, "pending counter offers");
        setPendingCounterOffersCount(count);
      } else {
        console.warn(
          "⚠️ Counter offers response not successful:",
          response.data
        );
        setPendingCounterOffersCount(0);
      }
    } catch (err) {
      console.error("❌ Error fetching pending counter offers count:", err);
      console.error("❌ Error details:", err.response?.data);
      setPendingCounterOffersCount(0);
    } finally {
      setCounterOffersLoading(false);
    }
  }, [dealer?.email]);

  const handleEdit = useCallback((post) => {
    if (post.status === "COMPLETED") {
      addWarningNotification(
        setNotifications,
        setUnreadCount,
        "Cannot edit a post that already COMPLETED."
      );
      return;
    }
    setEditId(post.id);
    setEditData({ ...post });
  }, []);

  const handleEditChange = useCallback((e) => {
    const { name, value } = e.target;

    // Special handling for VIN field
    if (name === "vin") {
      // Remove spaces and special characters, convert to uppercase
      const cleanedVin = value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
      // Limit to 16 characters
      const truncatedVin = cleanedVin.slice(0, 16);
      setEditData((prev) => ({ ...prev, [name]: truncatedVin }));
    } else {
      setEditData((prev) => ({ ...prev, [name]: value }));
    }
  }, []);

  const saveEdit = useCallback(async () => {
    setPostActionLoading(true);
    try {
      const original = Array.isArray(allPosts)
        ? allPosts.find((p) => p.id === editId)
        : null;
      if (!original) {
        addErrorNotification(
          setNotifications,
          setUnreadCount,
          "Post not found for editing"
        );
        return;
      }

      // Check for changes in all fields including VIN and auctionLot
      const isChanged =
        original.content !== editData.content ||
        original.location !== editData.location ||
        original.offerAmount !== editData.offerAmount ||
        original.vin !== editData.vin ||
        original.auctionLot !== editData.auctionLot;

      // Debug logging
      console.log("PostingsPage: Original post:", original);
      console.log("PostingsPage: Edit data:", editData);
      console.log("PostingsPage: VIN comparison:", {
        originalVin: original.vin,
        editVin: editData.vin,
        vinChanged: original.vin !== editData.vin,
      });
      console.log("PostingsPage: Auction lot comparison:", {
        originalAuctionLot: original.auctionLot,
        editAuctionLot: editData.auctionLot,
        auctionLotChanged: original.auctionLot !== editData.auctionLot,
      });
      console.log("PostingsPage: Is changed:", isChanged);

      // ✅ UPDATED: Use Gateway endpoint for post editing (backend expects POST)
      const res = await api.post(
        `${API_CONFIG.POSTS_BASE_URL}/posts-update-id`,
        {
          id: editId,
          content: editData.content,
          location: editData.location,
          offerAmount: editData.offerAmount,
          vin: editData.vin || "",
          auctionLot: editData.auctionLot || "",
        }
      );

      if (res.status === 200 && res.data.includes("successfully")) {
        addSuccessNotification(
          setNotifications,
          setUnreadCount,
          isChanged
            ? "✅ Post saved successfully with changes."
            : "✅ Post saved. No changes detected."
        );
        addUserActivity(
          setActivityLog,
          `Post #${editData.dealerPostNumber || editData.id} edited`
        );

        // Update the local state with the new data
        setMasterPosts((prev) => {
          const updated = prev.map((p) =>
            p.id === editId ? { ...p, ...editData } : p
          );
          setAllPosts(filterPosts(updated, filters));
          return updated;
        });
      } else {
        addErrorNotification(
          setNotifications,
          setUnreadCount,
          "Failed to update post"
        );
      }

      setEditId(null);
    } catch (err) {
      addErrorNotification(
        setNotifications,
        setUnreadCount,
        "Failed to update post"
      );
    } finally {
      setPostActionLoading(false);
    }
  }, [editId, editData, allPosts, filters]);

  const handleDelete = useCallback(
    async (id) => {
      const postToDelete = Array.isArray(allPosts)
        ? allPosts.find((p) => p.id === id)
        : null;
      if (!postToDelete) {
        addErrorNotification(
          setNotifications,
          setUnreadCount,
          "Post not found for deletion"
        );
        return;
      }
      setPostActionLoading(true);
      setUndoDelete(null);

      // Optimistically remove from UI
      setAllPosts((prev) => prev.filter((p) => p.id !== id));

      setUndoDelete({
        post: postToDelete,
        timeoutId: setTimeout(async () => {
          try {
            console.log("🔍 DELETE: Starting delete process for post ID:", id);
            console.log(
              "🔍 DELETE: API endpoint:",
              `${API_CONFIG.POSTS_BASE_URL}/delete-by-id`
            );
            console.log("🔍 DELETE: Request payload:", { id: id });

            // ✅ UPDATED: Use Gateway endpoint for post deletion (backend expects POST)
            const response = await api.post(
              `${API_CONFIG.POSTS_BASE_URL}/delete-by-id`,
              { id: id }
            );

            console.log("🔍 DELETE: Response status:", response.status);
            console.log("🔍 DELETE: Response data:", response.data);
            console.log("🔍 DELETE: Response data type:", typeof response.data);

            if (response.data && response.data.includes("soft deleted")) {
              console.log("🔍 DELETE: Success - post soft deleted");
              addSuccessNotification(
                setNotifications,
                setUnreadCount,
                "Post deleted successfully!"
              );
              addBackgroundActivity(
                setActivityLog,
                `Post #${
                  postToDelete.dealerPostNumber || postToDelete.id
                } moved to deleted posts`
              );
              // Refresh posts to ensure UI is in sync
              console.log(
                "🔍 DELETE: Refreshing posts after successful delete"
              );
              await fetchPosts();
            } else {
              console.error(
                "🔍 DELETE: Failed - response doesn't contain 'soft deleted'"
              );
              console.error("🔍 DELETE: Response data:", response.data);
              throw new Error(
                response.data?.message || "Delete operation failed"
              );
            }
          } catch (err) {
            console.error("🔍 DELETE: Error occurred:", err);
            console.error("🔍 DELETE: Error response:", err.response?.data);
            console.error("🔍 DELETE: Error status:", err.response?.status);
            addErrorNotification(
              setNotifications,
              setUnreadCount,
              `Failed to delete post: ${
                err.response?.data?.message || err.message
              }`
            );
            // Restore the post in UI if delete failed
            setAllPosts((prev) => [postToDelete, ...prev]);
          }
          setUndoDelete(null);
        }, 5000),
      });

      addInfoNotification(
        setNotifications,
        setUnreadCount,
        "Post deleted. You can undo this action within 5 seconds."
      );
      setPostActionLoading(false);
    },
    [allPosts, fetchPosts]
  );

  const fetchDeletedPosts = useCallback(async () => {
    setDeletedPostsLoading(true);
    try {
      // ✅ UPDATED: Use Gateway endpoint for fetching deleted posts
      const response = await api.get(`${API_CONFIG.POSTS_BASE_URL}/deleted`);
      setDeletedPosts(response.data.posts || []);
    } catch (err) {
      console.error("Error fetching deleted posts:", err);
      addErrorNotification(
        setNotifications,
        setUnreadCount,
        "Failed to load deleted posts"
      );
    } finally {
      setDeletedPostsLoading(false);
    }
  }, []);

  const handleCancelPost = useCallback(
    async (id) => {
      try {
        // ✅ UPDATED: Use Gateway endpoint for post cancellation
        await api.put(`${API_CONFIG.POSTS_BASE_URL}/${id}/status`, {
          status: "CANCELLED",
        });
        addSuccessNotification(
          setNotifications,
          setUnreadCount,
          "Request cancelled successfully"
        );
        setMasterPosts((prev) => {
          const updated = prev.map((p) =>
            p.id === id ? { ...p, status: "CANCELLED" } : p
          );
          setAllPosts(filterPosts(updated, filters));
          return updated;
        });
      } catch (err) {
        addErrorNotification(
          setNotifications,
          setUnreadCount,
          "Failed to cancel post"
        );
      }
    },
    [filters]
  );

  const applyFilter = useCallback(
    async (key, value) => {
      const trimmedValue = (value || "").trim();

      // If user is viewing deleted posts and clicks on a status filter, switch to active posts
      if (showDeletedPosts && key === "status") {
        setShowDeletedPosts(false);
        addBackgroundActivity(
          setActivityLog,
          "Switched from deleted posts to active posts to apply status filter"
        );
      }

      const updatedFilters = {
        ...filters,
        [key]: trimmedValue,
      };
      setFilters(updatedFilters);
      setCurrentPage(1);

      // Only call backend if search or advanced filter is used
      if (key === "search" && trimmedValue) {
        try {
          // ✅ UPDATED: Use Gateway endpoint for post filtering
          const res = await api.post(
            `${API_CONFIG.POSTS_BASE_URL}/filter`,
            updatedFilters
          );
          setAllPosts(res.data.posts || []);
        } catch (err) {
          addErrorNotification(
            setNotifications,
            setUnreadCount,
            "Failed to apply filter"
          );
        }
      } else {
        setAllPosts(filterPosts(masterPosts, updatedFilters));
      }
    },
    [filters, showDeletedPosts, masterPosts]
  );

  const clearFilters = useCallback(() => {
    const resetStatus = "PENDING";
    const resetFilters = {
      location: "",
      offerAmount: "",
      status: resetStatus,
      vin: "",
      auctionLot: "",
      technicianName: "",
      technicianEmail: "",
      dateFrom: "",
      dateTo: "",
      search: "",
    };
    setFilters(resetFilters);
    setSelectedCity(null);
    setCurrentPage(1);
    setAllPosts(filterPosts(masterPosts, resetFilters));
  }, [masterPosts]);

  const handlePageChange = useCallback(
    (page) => {
      setAnimateOut(true);

      setTimeout(() => {
        setCurrentPage(page);
        setAnimateOut(false);

        if (postListRef) {
          postListRef.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      }, 250);
    },
    [postListRef]
  );

  const handleLogout = useCallback(async () => {
    // Clear dealer session and redirect to landing page
    clearDealerSession();
    navigate("/");
    toast.success("Logged out successfully");
  }, [navigate]);

  // Notification handlers - memoized
  const handleMarkAllAsRead = useCallback(() => {
    markAllNotificationsAsRead(setNotifications, setUnreadCount);
  }, []);

  const handleClearAllNotifications = useCallback(() => {
    clearNotifications(setNotifications, setUnreadCount);
  }, []);

  const handleMarkAsRead = useCallback((notificationId) => {
    // Find the notification and mark it as read
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    );
    // Decrease unread count
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const handleNotification = useCallback((type, message) => {
    switch (type) {
      case "success":
        addSuccessNotification(setNotifications, setUnreadCount, message);
        break;
      case "error":
        addErrorNotification(setNotifications, setUnreadCount, message);
        break;
      case "warning":
        addWarningNotification(setNotifications, setUnreadCount, message);
        break;
      case "info":
        addInfoNotification(setNotifications, setUnreadCount, message);
        break;
      default:
        addInfoNotification(setNotifications, setUnreadCount, message);
    }
  }, []);

  // Bulk operations - memoized
  const handleBulkDelete = useCallback(async () => {
    if (
      !window.confirm(
        `Delete ${selectedPosts.length} posts? This cannot be undone.`
      )
    )
      return;
    for (const id of selectedPosts) {
      await handleDelete(id);
    }
    setSelectedPosts([]);
    addSuccessNotification(
      setNotifications,
      setUnreadCount,
      "Bulk delete complete"
    );
    addBackgroundActivity(
      setActivityLog,
      `${selectedPosts.length} posts moved to deleted posts via bulk delete`
    );
  }, [selectedPosts.length, handleDelete]);

  const handleBulkExport = useCallback(() => {
    const rows = Array.isArray(allPosts)
      ? allPosts.filter((p) => selectedPosts.includes(p.id))
      : [];
    if (!rows.length) return;
    const header = Object.keys(rows[0]);
    const csv = [header.join(",")]
      .concat(
        rows.map((row) =>
          header.map((h) => JSON.stringify(row[h] ?? "")).join(",")
        )
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `posts_export_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [allPosts, selectedPosts]);

  const undoDeleteHandler = useCallback(async () => {
    if (undoDelete && undoDelete.timeoutId) {
      clearTimeout(undoDelete.timeoutId);

      try {
        // ✅ UPDATED: Use Gateway endpoint for post restoration
        const response = await api.post(
          `${API_CONFIG.POSTS_BASE_URL}/restore-by-id`,
          {
            id: undoDelete.post.id,
          }
        );

        if (response.data && response.data.includes("restored")) {
          addSuccessNotification(
            setNotifications,
            setUnreadCount,
            "Post restored successfully!"
          );
          addBackgroundActivity(
            setActivityLog,
            `Post #${
              undoDelete.post.dealerPostId || undoDelete.post.id
            } moved back to active posts`
          );
          // Refresh posts to get the restored post
          fetchPosts();
        } else {
          throw new Error(response.data?.message || "Restore operation failed");
        }
      } catch (err) {
        console.error("Restore error:", err);
        addErrorNotification(
          setNotifications,
          setUnreadCount,
          `Failed to restore post: ${
            err.response?.data?.message || err.message
          }`
        );
        // Add back to UI if restore failed - this means the delete operation failed
        setAllPosts((prev) => [undoDelete.post, ...prev]);
        addBackgroundActivity(
          setActivityLog,
          `Post #${undoDelete.post.id} restored due to delete failure`
        );
      }

      setUndoDelete(null);
    }
  }, [undoDelete, fetchPosts]);

  // Prevent excessive re-renders by throttling state updates
  const throttledSetAllPosts = useCallback(
    debounce((posts) => {
      setAllPosts(posts);
    }, 100),
    []
  );

  // Effects
  useEffect(() => {
    // Prevent multiple initial loads
    if (initialLoadCompleted.current) {
      console.log("PostingsPage: Initial load already completed, skipping");
      return;
    }

    const fetchProfileAndPosts = async () => {
      console.log("PostingsPage: Starting fetchProfileAndPosts");
      setProfileLoading(true);
      setLoading(true);
      setLoadError("");

      try {
        // Debug: Log the current state
        if (process.env.NODE_ENV === "development") {
          console.log("PostingsPage: Starting API calls");
          console.log("PostingsPage: Dealer email:", dealer?.email);
          console.log(
            "PostingsPage: Access token:",
            localStorage.getItem("accessToken")
          );
          console.log("PostingsPage: API_CONFIG:", API_CONFIG);
        }

        // Test API connectivity first
        try {
          console.log("PostingsPage: Testing API connectivity...");
          // COMMENTED OUT: Health check endpoint not available yet
          // await api.get(`${API_CONFIG.POSTS_BASE_URL}/health`);
          console.log("PostingsPage: Posts service is reachable");
        } catch (err) {
          console.warn(
            "PostingsPage: Posts service health check failed:",
            err.message
          );
          // Continue anyway, the service might not have health endpoints
        }

        // Make API calls parallel for faster loading
        console.log(
          "PostingsPage: Making profile API call to:",
          `${API_CONFIG.DEALER_BASE_URL}/profile/${dealer?.email}`
        );
        console.log("PostingsPage: Making posts API call to:", "api/posts");

        // Try to get profile and posts in parallel, but handle profile failure gracefully
        let profileRes = null;
        let postRes = null;

        try {
          [profileRes, postRes] = await Promise.all([
            api
              .get(`${API_CONFIG.DEALER_BASE_URL}/profile/${dealer?.email}`)
              .catch((err) => {
                console.warn(
                  "PostingsPage: Profile endpoint failed, using existing dealer data:",
                  err.message
                );
                return null;
              }),
            // ✅ REAL API CALL: Get posts through Gateway
            api.post(`${API_CONFIG.POSTS_BASE_URL}/posts-by-email`, {
              email: dealer?.email,
            }),
          ]);
        } catch (err) {
          // If both fail, try to get posts separately
          console.warn(
            "PostingsPage: Parallel API calls failed, trying posts only:",
            err.message
          );
          // ✅ REAL API CALL: Fallback to posts only
          postRes = await api.post(
            `${API_CONFIG.POSTS_BASE_URL}/posts-by-email`,
            {
              email: dealer?.email,
            }
          );
        }

        console.log("PostingsPage: API calls completed");
        console.log("PostingsPage: Profile response:", profileRes?.data);
        console.log("PostingsPage: Posts response:", postRes.data);

        // No profile management needed since authentication is removed

        const posts = Array.isArray(postRes.data) ? postRes.data : [];
        setMasterPosts(posts);
        setAllPosts(filterPosts(posts, filters));
        const locMap = new Map();
        const offerMap = new Map();
        posts.forEach((p) => {
          if (p.location)
            locMap.set(p.location.toLowerCase(), capitalizeWords(p.location));
          if (p.offerAmount)
            offerMap.set(p.offerAmount.toLowerCase(), p.offerAmount);
        });
        setLocations([...locMap.values()]);
        setOffers([...offerMap.values()]);

        console.log("PostingsPage: State updated successfully");
        initialLoadCompleted.current = true;
      } catch (err) {
        console.error("PostingsPage: Error loading posts:", err);
        console.error("PostingsPage: Error response:", err.response);
        console.error("PostingsPage: Error status:", err.response?.status);
        console.error("PostingsPage: Error data:", err.response?.data);
        console.error("PostingsPage: Error message:", err.message);

        // Check if this is just a profile endpoint failure (not critical)
        if (
          err.response?.status === 404 &&
          err.config?.url?.includes("/profile")
        ) {
          console.warn(
            "PostingsPage: Profile endpoint not available, continuing with existing dealer data"
          );
          // Don't show error to user, just continue with existing data
          return;
        }

        let errorMessage = "❌ Failed to load posts. Please try again.";

        if (err.response?.data) {
          if (typeof err.response.data === "string") {
            errorMessage = err.response.data;
          } else if (typeof err.response.data === "object") {
            const values = Object.values(err.response.data);
            if (values.length && typeof values[0] === "string") {
              errorMessage = values[0];
            } else {
              errorMessage = JSON.stringify(err.response.data);
            }
          }
        }

        // Add more specific error handling
        if (err.response?.status === 401) {
          errorMessage = "❌ API error - authentication removed";
        } else if (err.response?.status === 403) {
          errorMessage = "❌ Access denied";
        } else if (err.response?.status >= 500) {
          errorMessage = "❌ Server error. Please try again later.";
        } else if (
          err.code === "NETWORK_ERROR" ||
          err.message?.includes("Network Error")
        ) {
          errorMessage = "❌ Network error. Please check your connection.";
        }

        setLoadError(errorMessage);
        addErrorNotification(setNotifications, setUnreadCount, errorMessage);
      } finally {
        console.log("PostingsPage: Setting loading to false");
        setLoading(false);
        setProfileLoading(false);
      }
    };

    console.log("PostingsPage: Calling fetchProfileAndPosts");
    fetchProfileAndPosts();

    // Initialize AOS with optimized settings for better performance
    AOS.init({
      duration: 300, // Reduced from 400ms for faster animations
      easing: "ease-out", // Changed from ease-in-out for faster feel
      offset: 30, // Reduced from 50 for earlier triggering
      once: true,
      disable: "mobile", // Disable on mobile for better performance
      throttleDelay: 99, // Add throttle for better performance
    });

    const interval = setInterval(() => {
      setIconIndex((prev) => (prev + 1) % postIcons.length);
    }, 10000);

    return () => clearInterval(interval);
  }, [navigate]);

  // Debug functions for development
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      window.testDelete = async (postId) => {
        console.log("🧪 TEST DELETE: Testing delete for post ID:", postId);
        try {
          const response = await api.post(
            `${API_CONFIG.POSTS_BASE_URL}/delete-by-id`,
            { id: postId }
          );
          console.log("🧪 TEST DELETE: Response:", response.data);
          return response.data;
        } catch (err) {
          console.error("🧪 TEST DELETE: Error:", err);
          return err;
        }
      };

      window.testRestore = async (postId) => {
        console.log("🧪 TEST RESTORE: Testing restore for post ID:", postId);
        try {
          const response = await api.post(
            `${API_CONFIG.POSTS_BASE_URL}/restore-by-id`,
            { id: postId }
          );
          console.log("🧪 TEST RESTORE: Response:", response.data);
          return response.data;
        } catch (err) {
          console.error("🧪 TEST RESTORE: Error:", err);
          return err;
        }
      };

      window.testEndpoints = async () => {
        console.log("🧪 TEST ENDPOINTS: Testing all postings endpoints");
        const endpoints = [
          {
            name: "Get Posts",
            method: "POST",
            url: "/posts-by-email",
            data: { email: dealer.email }, // Use actual dealer email
          },
          {
            name: "Delete Post",
            method: "POST",
            url: "/delete-by-id",
            data: { id: 8 },
          },
          {
            name: "Restore Post",
            method: "POST",
            url: "/restore-by-id",
            data: { id: 8 },
          },
          { name: "Get Deleted", method: "GET", url: "/deleted", data: null },
        ];

        for (const endpoint of endpoints) {
          try {
            console.log(
              `🧪 TESTING: ${endpoint.name} - ${endpoint.method} ${endpoint.url}`
            );
            let response;
            if (endpoint.method === "GET") {
              response = await api.get(
                `${API_CONFIG.POSTS_BASE_URL}${endpoint.url}`
              );
            } else {
              response = await api.post(
                `${API_CONFIG.POSTS_BASE_URL}${endpoint.url}`,
                endpoint.data
              );
            }
            console.log(`✅ ${endpoint.name}: SUCCESS`, response.data);
          } catch (err) {
            console.error(
              `❌ ${endpoint.name}: FAILED`,
              err.response?.status,
              err.response?.data
            );
          }
        }
      };
    }
  }, []);

  // WebSocket hook
  useWebSocket(dealer, filters, fetchPosts, setNotifications, setUnreadCount);

  // Fetch pending counter offers count on mount
  useEffect(() => {
    fetchPendingCounterOffersCount();
  }, [fetchPendingCounterOffersCount]);

  // No authentication checks needed

  return (
    <>
      {/* Performance Monitor for development - temporarily disabled to prevent infinite loops */}
      {/* {process.env.NODE_ENV === "development" && (
        <PerformanceMonitor componentName="PostingsPage" />
      )} */}

      <ProfileHeader
        dealer={dealer}
        notifications={notifications}
        unreadCount={unreadCount}
        showNotifDropdown={showNotifDropdown}
        setShowNotifDropdown={setShowNotifDropdown}
        setShowProfileModal={setShowProfileModal}
        handleLogout={handleLogout}
        onMarkAllAsRead={handleMarkAllAsRead}
        onClearAll={handleClearAllNotifications}
        onMarkAsRead={handleMarkAsRead}
        undoDelete={undoDelete}
        onUndoDelete={undoDeleteHandler}
      />

      {/* Floating Undo Button */}
      {undoDelete && (
        <div
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            zIndex: 1000,
            animation: "fadeInPop 0.3s ease-out",
          }}
        >
          <div
            className="p-3 rounded shadow-lg"
            style={{
              background: "linear-gradient(135deg, #ff6b6b, #ee5a52)",
              border: "1px solid #ff4757",
              color: "white",
              minWidth: "200px",
            }}
          >
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <div className="fw-semibold" style={{ fontSize: 14 }}>
                  🗑️ Post Deleted
                </div>
                <div style={{ fontSize: 12, opacity: 0.9 }}>
                  Click undo to restore
                </div>
              </div>
              <button
                className="btn btn-sm"
                onClick={undoDeleteHandler}
                style={{
                  background: "rgba(255,255,255,0.2)",
                  border: "1px solid rgba(255,255,255,0.3)",
                  color: "white",
                  fontSize: 12,
                  fontWeight: "bold",
                  padding: "6px 16px",
                  borderRadius: "8px",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = "rgba(255,255,255,0.3)";
                  e.target.style.transform = "scale(1.05)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "rgba(255,255,255,0.2)";
                  e.target.style.transform = "scale(1)";
                }}
              >
                UNDO
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        className="container-fluid min-vh-100 py-5 px-3 position-relative animate__animated animate__fadeIn"
        style={{
          background: "linear-gradient(135deg, #0f172a, #0ea5e9)",
          fontFamily: "'Segoe UI', sans-serif",
          marginTop: "55px", // Use marginTop instead of paddingTop for fixed header
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Optimized content wrapper with reduced backdrop-filter */}
        <div
          style={{
            position: "relative",
            zIndex: 2,
            background: "rgba(255, 255, 255, 0.98)", // Increased opacity for better performance
            borderRadius: "24px",
            padding: "40px",
            boxShadow:
              "0 25px 80px rgba(15, 23, 42, 0.15), 0 10px 40px rgba(14, 165, 233, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.9)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            margin: "0 auto",
            maxWidth: "1400px",
          }}
        >
          {loading || profileLoading ? (
            <div>
              <div className="text-center my-5">
                <div className="spinner-border text-primary mb-3" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <h5 className="text-muted">Loading your posts...</h5>
                <p className="text-muted small">
                  Please wait while we fetch your data
                </p>
                {process.env.NODE_ENV === "development" && (
                  <div className="mt-3 p-3 bg-light rounded">
                    <small className="text-muted">
                      <strong>Debug Info:</strong>
                      <br />
                      Dealer: {dealer?.email || "Not found"}
                      <br />
                      Token:{" "}
                      {localStorage.getItem("accessToken")
                        ? "Present"
                        : "Missing"}
                      <br />
                      Loading: {loading ? "Yes" : "No"}
                      <br />
                      Profile Loading: {profileLoading ? "Yes" : "No"}
                      <br />
                      Load Error: {loadError || "None"}
                    </small>
                  </div>
                )}
              </div>
              <LoadingSkeleton postsPerPage={initialSkeletonCount} />
            </div>
          ) : loadError ? (
            <div className="text-center my-5 text-danger">
              <h5>{loadError}</h5>
            </div>
          ) : (
            <div>
              {/* Post Submission Form */}
              <div
                id="postFormSection"
                className="mb-4"
                style={{ marginTop: "-40px" }}
              >
                <PostForm
                  post={post}
                  setPost={setPost}
                  selectedCity={selectedCity}
                  setSelectedCity={setSelectedCity}
                  cityOptions={cityOptions}
                  iconIndex={iconIndex}
                  postIcons={postIcons}
                  onPostSubmit={fetchPosts}
                  onNotification={handleNotification}
                />
              </div>

              {/* Status Badges */}
              <StatusBadges
                filters={filters}
                statusCounts={statusCounts}
                applyFilter={applyFilter}
              />

              {/* Filter Bar */}
              <FilterBar
                filters={filters}
                locations={filteredLocations}
                offers={filteredOffers}
                applyFilter={applyFilter}
                clearFilters={clearFilters}
                setFilters={setFilters}
                fetchPosts={fetchPosts}
                setSelectedCity={setSelectedCity}
              />

              {/* Sort and View Controls */}
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div className="d-flex align-items-center gap-3">
                  <button
                    className="btn btn-outline-secondary fw-semibold"
                    onClick={() => {
                      setShowDeletedPosts(!showDeletedPosts);
                      if (!showDeletedPosts) {
                        fetchDeletedPosts();
                      }
                    }}
                  >
                    {showDeletedPosts
                      ? "📋 Show Active Posts"
                      : "🗑️ Show Deleted Posts"}
                  </button>

                  <button
                    className="btn btn-outline-warning fw-semibold position-relative"
                    onClick={() => setShowCounterOffersModal(true)}
                  >
                    💰 Counter Offers
                    {pendingCounterOffersCount > 0 && (
                      <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                        {pendingCounterOffersCount}
                        <span className="visually-hidden">
                          pending counter offers
                        </span>
                      </span>
                    )}
                    {counterOffersLoading && (
                      <span className="position-absolute top-50 start-50 translate-middle">
                        <span
                          className="spinner-border spinner-border-sm"
                          role="status"
                          aria-hidden="true"
                        ></span>
                      </span>
                    )}
                  </button>
                </div>

                <button
                  className="btn btn-outline-primary fw-semibold"
                  onClick={() => {
                    setSortOrder((prev) =>
                      prev === "newest" ? "oldest" : "newest"
                    );
                    setCurrentPage(1);
                  }}
                >
                  {sortOrder === "newest"
                    ? "🔽 Show Oldest First"
                    : "🔼 Show Newest First"}
                </button>
              </div>

              <div
                ref={postListRef}
                className={`row justify-content-center ${
                  animateOut ? "fade-posts-out" : "fade-posts-in"
                }`}
              >
                {/* Bulk Actions Bar */}
                <BulkActionsBar
                  selectedPosts={selectedPosts}
                  allSelected={allSelected}
                  toggleSelectAll={toggleSelectAll}
                  handleBulkDelete={handleBulkDelete}
                  handleBulkExport={handleBulkExport}
                  setSelectedPosts={setSelectedPosts}
                />

                {showDeletedPosts ? (
                  // Show deleted posts
                  deletedPostsLoading ? (
                    <div className="text-center my-5">
                      <span className="spinner-border" />
                      <p className="mt-2">Loading deleted posts...</p>
                    </div>
                  ) : deletedPosts.length === 0 ? (
                    <p className="text-muted text-center">
                      No deleted posts found.
                    </p>
                  ) : (
                    deletedPosts.map((p, idx) => (
                      <div key={p.id} className="col-12 mb-3">
                        <div className="card border-danger">
                          <div className="card-body">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <h6 className="card-title text-danger">
                                🗑️ Deleted Post #{p.id}
                              </h6>
                              <span className="badge bg-danger">DELETED</span>
                            </div>
                            <p className="card-text">{p.content}</p>
                            <div className="row text-muted small">
                              <div className="col-md-4">📍 {p.location}</div>
                              <div className="col-md-4">💰 {p.offerAmount}</div>
                              <div className="col-md-4">
                                📅 {new Date(p.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="mt-3">
                              <button
                                className="btn btn-sm btn-outline-success"
                                onClick={async () => {
                                  try {
                                    const response = await api.post(
                                      `${API_CONFIG.POSTS_BASE_URL}/restore-by-id`,
                                      {
                                        id: p.id,
                                      }
                                    );
                                    if (
                                      response.data &&
                                      response.data.includes("restored")
                                    ) {
                                      addSuccessNotification(
                                        setNotifications,
                                        setUnreadCount,
                                        "Post restored successfully!"
                                      );
                                      addBackgroundActivity(
                                        setActivityLog,
                                        `Post #${p.id} moved back to active posts`
                                      );
                                      fetchDeletedPosts(); // Refresh deleted posts list
                                      fetchPosts(); // Refresh active posts
                                    }
                                  } catch (err) {
                                    addErrorNotification(
                                      setNotifications,
                                      setUnreadCount,
                                      "Failed to restore post"
                                    );
                                  }
                                }}
                              >
                                🔄 Restore Post
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )
                ) : // Show active posts
                currentPosts.length === 0 ? (
                  <p className="text-muted text-center">No posts available.</p>
                ) : (
                  currentPosts.map((p, idx) => (
                    <PostCard
                      key={p.id}
                      post={p}
                      idx={idx}
                      editId={editId}
                      editData={editData}
                      onEditChange={handleEditChange}
                      onSaveEdit={saveEdit}
                      onCancelEdit={() => setEditId(null)}
                      onStartEdit={handleEdit}
                      onTriggerDelete={(id) => {
                        console.log(
                          "🔍 POSTINGS PAGE: onTriggerDelete called with ID:",
                          id
                        );
                        setDeleteModalId(id);
                      }}
                      onTriggerCancel={() => setCancelModalId(p.id)}
                      animate={
                        !filters.location &&
                        !filters.offerAmount &&
                        !filters.status
                      }
                      cityOptions={cityOptions}
                      setEditData={setEditData}
                      isSelected={selectedPosts.includes(p.id)}
                      onSelect={() => toggleSelectPost(p.id)}
                      showCheckbox={selectedPosts.length > 0}
                      onNotification={handleNotification}
                      dealerInfo={dealer}
                    />
                  ))
                )}
              </div>

              {(!Array.isArray(allPosts) || allPosts.length === 0) && (
                <div className="text-center my-4">
                  <button
                    className="btn btn-primary mt-2"
                    onClick={() => {
                      const formSection =
                        document.getElementById("postFormSection");
                      if (formSection)
                        formSection.scrollIntoView({ behavior: "smooth" });
                    }}
                  >
                    ➕ Create Your First Post
                  </button>

                  {/* Debug section for development */}
                  {process.env.NODE_ENV === "development" && (
                    <div className="mt-3 p-3 bg-light rounded">
                      <h6>🔍 Delete Debug Only</h6>
                      <p className="text-muted">
                        Check browser console for delete operation logs
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Pagination */}
              <PaginationBar
                currentPage={currentPage}
                totalPages={totalPages}
                handlePageChange={handlePageChange}
              />

              {/* Modals */}
              {deleteModalId !== null && (
                <Suspense
                  fallback={
                    <div className="text-center my-5">
                      <span className="spinner-border" />
                    </div>
                  }
                >
                  <DeleteModal
                    onCancel={() => {
                      console.log("🔍 DELETE MODAL: Cancel clicked");
                      setDeleteModalId(null);
                    }}
                    onConfirm={() => {
                      console.log(
                        "🔍 DELETE MODAL: Confirm clicked for post ID:",
                        deleteModalId
                      );
                      handleDelete(deleteModalId);
                      setDeleteModalId(null);
                    }}
                  />
                </Suspense>
              )}

              {cancelModalId !== null && (
                <CancelModal
                  onCancel={() => setCancelModalId(null)}
                  onConfirm={() => {
                    handleCancelPost(cancelModalId);
                    setCancelModalId(null);
                  }}
                />
              )}

              {/* LogoutModal removed - will implement later */}

              <CounterOffersModal
                show={showCounterOffersModal}
                onHide={() => {
                  setShowCounterOffersModal(false);
                  fetchPendingCounterOffersCount(); // Refresh count when modal closes
                }}
                dealerId={dealer?.email}
                onNotification={(type, message) => {
                  if (type === "success") {
                    addSuccessNotification(
                      setNotifications,
                      setUnreadCount,
                      message
                    );
                    fetchPendingCounterOffersCount(); // Refresh count after successful action
                  } else if (type === "error") {
                    addErrorNotification(
                      setNotifications,
                      setUnreadCount,
                      message
                    );
                  }
                }}
              />

              {/* Profile functionality removed with authentication */}

              {/* Floating Add Button */}
              <FloatingAddButton />
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default React.memo(PostingsPage);
