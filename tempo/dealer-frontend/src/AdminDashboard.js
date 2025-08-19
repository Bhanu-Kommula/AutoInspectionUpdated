import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminAuth } from "./contexts/AdminAuthContext";
import {
  FaUsers,
  FaClipboardList,
  FaSearch,
  FaTrash,
  FaEye,
  FaBan,
  FaCheck,
  FaTimes,
  FaUserShield,
  FaHistory,
  FaCheckCircle,
  FaClock,
  FaBuilding,
  FaTools,
  FaDownload,
  FaChartBar,
  FaFileAlt,
  FaHandshake,
  FaExclamationTriangle,
  FaUndo,
  FaFilter,
  FaSort,
  FaCalendarAlt,
  FaChartLine,
  FaTable,
  FaList,
  FaColumns,
  FaSync,
  FaCog,
  FaBell,
  FaShieldAlt,
  FaEdit,
} from "react-icons/fa";
import {
  HiOutlineStatusOnline,
  HiOutlineStatusOffline,
  HiOutlineDocumentText,
  HiOutlineChartPie,
  HiOutlineRefresh,
  HiOutlineCog,
  HiOutlineLogout,
  HiOutlineHome,
  HiOutlineMenu,
  HiOutlineX,
  HiOutlineLocationMarker,
  HiOutlinePhone,
  HiOutlineCalendar,
  HiOutlineClock,
  HiOutlineCurrencyDollar,
  HiOutlineUser,
  HiOutlineMail,
  HiOutlineTag,
  HiOutlineEye,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineCheck,
  HiOutlineXCircle,
  HiOutlineExclamation,
  HiOutlineInformationCircle,
} from "react-icons/hi";
import {
  Modal,
  Button,
  Badge,
  Spinner,
  Alert,
  Form,
  Row,
  Col,
  Tabs,
  Tab,
  Card,
  ProgressBar,
  Tooltip,
  OverlayTrigger,
} from "react-bootstrap";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import api, { API_CONFIG } from "./api";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./AdminDashboard.css";
import TechDashboardAdmin from "./components/TechDashboardAdmin/TechDashboardAdmin";

function AdminDashboard() {
  const navigate = useNavigate();
  const { adminUser: admin } = useAdminAuth();

  // State management
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Technician management state
  const [technicians, setTechnicians] = useState([]);
  const [technicianStats, setTechnicianStats] = useState({});
  const [technicianPerformance, setTechnicianPerformance] = useState([]);
  const [technicianCounterOffers, setTechnicianCounterOffers] = useState([]);
  const [technicianAcceptedPosts, setTechnicianAcceptedPosts] = useState([]);
  const [technicianDeclinedPosts, setTechnicianDeclinedPosts] = useState([]);
  const [technicianAuditLogs, setTechnicianAuditLogs] = useState([]);
  const [loadingTechnicians, setLoadingTechnicians] = useState(false);
  const [technicianPagination, setTechnicianPagination] = useState({
    currentPage: 0,
    totalPages: 0,
    totalElements: 0,
    size: 20,
  });

  // Technician UI state
  const [selectedTechnician, setSelectedTechnician] = useState(null);
  const [showTechnicianModal, setShowTechnicianModal] = useState(false);
  const [showTechnicianEditModal, setShowTechnicianEditModal] = useState(false);
  const [technicianStatusFilter, setTechnicianStatusFilter] = useState("");
  const [experienceFilter, setExperienceFilter] = useState("");

  // Data states
  const [systemStats, setSystemStats] = useState({});
  const [dealers, setDealers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [counterOffers, setCounterOffers] = useState([]);
  const [selectedDealer, setSelectedDealer] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedCounterOffer, setSelectedCounterOffer] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Filter states
  const [searchKeyword, setSearchKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [locationFilter, setLocationFilter] = useState("");
  const [dateFrom, setDateFrom] = useState(null);
  const [dateTo, setDateTo] = useState(null);
  const [dealerEmailFilter, setDealerEmailFilter] = useState("");

  // Modal states
  const [showDealerModal, setShowDealerModal] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [showCounterOfferModal, setShowCounterOfferModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showBulkActionModal, setShowBulkActionModal] = useState(false);
  const [showPostBulkActionModal, setShowPostBulkActionModal] = useState(false);
  const [confirmActionData, setConfirmActionData] = useState({
    type: "",
    data: null,
  });

  // Loading states
  const [loadingDealers, setLoadingDealers] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [loadingCounterOffers, setLoadingCounterOffers] = useState(false);

  // Bulk action states
  const [selectedDealers, setSelectedDealers] = useState([]);
  const [selectedPosts, setSelectedPosts] = useState([]);
  const [bulkAction, setBulkAction] = useState("");
  const [bulkReason, setBulkReason] = useState("");

  // Post management states
  const [postViewMode, setPostViewMode] = useState("table"); // table, card, list
  const [postSortBy, setPostSortBy] = useState("createdAt");
  const [postSortOrder, setPostSortOrder] = useState("desc");

  // Initialize dashboard
  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        setLoading(true);

        // Load system stats
        try {
          const statsResponse = await api.get(
            `${API_CONFIG.DEALER_BASE_URL}/statistics`
          );
          if (statsResponse.data && statsResponse.data.success) {
            setSystemStats(statsResponse.data.data);
          }
        } catch (error) {
          console.error("Error loading dealer statistics:", error);
        }

        // Load dealers
        try {
          setLoadingDealers(true);
          const searchDto = {
            page: currentPage,
            size: pageSize,
            name: searchKeyword || undefined,
            status: statusFilter !== "ALL" ? statusFilter : undefined,
            location: locationFilter || undefined,
          };

          const dealersResponse = await api.get(
            `${API_CONFIG.DEALER_BASE_URL}/list`,
            {
              params: searchDto,
            }
          );
          if (dealersResponse.data && dealersResponse.data.success) {
            setDealers(dealersResponse.data.data.content || []);
            setTotalPages(dealersResponse.data.data.totalPages || 0);
            setTotalElements(dealersResponse.data.data.totalElements || 0);
          }
        } catch (error) {
          console.error("Error loading dealers:", error);
          toast.error("Failed to load dealers");
        } finally {
          setLoadingDealers(false);
        }

        // Load posts using admin endpoint
        try {
          setLoadingPosts(true);
          const postsResponse = await api.get(
            `${API_CONFIG.POSTS_BASE_URL}/admin/posts`,
            {
              params: {
                page: 0,
                size: 100, // Load more posts for overview
                status: undefined,
                location: undefined,
                dealerEmail: undefined,
                search: undefined,
              },
            }
          );
          if (postsResponse.data && postsResponse.data.success) {
            setPosts(postsResponse.data.data || []);
          }
        } catch (error) {
          console.error("Error loading posts:", error);
          // Fallback to regular endpoint
          try {
            const fallbackResponse = await api.get(
              `${API_CONFIG.POSTS_BASE_URL}/post`
            );
            setPosts(fallbackResponse.data || []);
          } catch (fallbackError) {
            console.error("Fallback posts loading failed:", fallbackError);
          }
        } finally {
          setLoadingPosts(false);
        }

        // Load counter offers
        try {
          setLoadingCounterOffers(true);
          const counterOffersResponse = await api.get(
            `${API_CONFIG.POSTS_BASE_URL}/admin/counter-offers`,
            {
              params: {
                page: 0,
                size: 50,
                status: undefined,
              },
            }
          );
          if (
            counterOffersResponse.data &&
            counterOffersResponse.data.success
          ) {
            setCounterOffers(counterOffersResponse.data.data || []);
          }
        } catch (error) {
          console.error("Error loading counter offers:", error);
        } finally {
          setLoadingCounterOffers(false);
        }
      } catch (error) {
        console.error("Error loading dashboard data:", error);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    initializeDashboard();
  }, []);

  const loadSystemStats = useCallback(async () => {
    try {
      const response = await api.get(
        `${API_CONFIG.DEALER_BASE_URL}/statistics`
      );
      if (response.data && response.data.success) {
        setSystemStats(response.data.data);
      }
    } catch (error) {
      console.error("Error loading dealer statistics:", error);
    }
  }, []);

  const loadDealers = useCallback(async () => {
    try {
      setLoadingDealers(true);
      const searchDto = {
        page: currentPage,
        size: pageSize,
        name: searchKeyword || undefined,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
        location: locationFilter || undefined,
      };

      const response = await api.get(`${API_CONFIG.DEALER_BASE_URL}/list`, {
        params: searchDto,
      });
      if (response.data && response.data.success) {
        setDealers(response.data.data.content || []);
        setTotalPages(response.data.data.totalPages || 0);
        setTotalElements(response.data.data.totalElements || 0);
      }
    } catch (error) {
      console.error("Error loading dealers:", error);
      toast.error("Failed to load dealers");
    } finally {
      setLoadingDealers(false);
    }
  }, [currentPage, pageSize, searchKeyword, statusFilter, locationFilter]);

  const loadPosts = useCallback(async () => {
    try {
      setLoadingPosts(true);
      const response = await api.get(
        `${API_CONFIG.POSTS_BASE_URL}/admin/posts`,
        {
          params: {
            page: currentPage,
            size: pageSize,
            status: statusFilter !== "ALL" ? statusFilter : undefined,
            location: locationFilter || undefined,
            dealerEmail: dealerEmailFilter || undefined,
            search: searchKeyword || undefined,
          },
        }
      );
      if (response.data && response.data.success) {
        setPosts(response.data.data || []);
        setTotalElements(response.data.pagination?.totalElements || 0);
        setTotalPages(response.data.pagination?.totalPages || 0);
      }
    } catch (error) {
      console.error("Error loading posts:", error);
      // Fallback to regular endpoint
      try {
        const fallbackResponse = await api.get(
          `${API_CONFIG.POSTS_BASE_URL}/post`
        );
        setPosts(fallbackResponse.data || []);
      } catch (fallbackError) {
        console.error("Fallback posts loading failed:", fallbackError);
        toast.error("Failed to load posts");
      }
    } finally {
      setLoadingPosts(false);
    }
  }, [
    currentPage,
    pageSize,
    statusFilter,
    locationFilter,
    dealerEmailFilter,
    searchKeyword,
  ]);

  const loadCounterOffers = useCallback(async () => {
    try {
      setLoadingCounterOffers(true);
      const response = await api.get(
        `${API_CONFIG.POSTS_BASE_URL}/admin/counter-offers`,
        {
          params: {
            page: currentPage,
            size: pageSize,
            status: statusFilter !== "ALL" ? statusFilter : undefined,
          },
        }
      );
      if (response.data && response.data.success) {
        setCounterOffers(response.data.data || []);
        setTotalElements(response.data.pagination?.totalElements || 0);
        setTotalPages(response.data.pagination?.totalPages || 0);
      }
    } catch (error) {
      console.error("Error loading counter offers:", error);
      toast.error("Failed to load counter offers");
    } finally {
      setLoadingCounterOffers(false);
    }
  }, [currentPage, pageSize, statusFilter]);

  // Reload data when filters change
  useEffect(() => {
    if (activeTab === "dealers") {
      loadDealers();
    } else if (activeTab === "posts") {
      loadPosts();
    } else if (activeTab === "counterOffers") {
      loadCounterOffers();
    } else if (activeTab === "technicians") {
      getTechnicians();
      getTechnicianStatistics();
      getTechnicianPerformanceMetrics();
      getCounterOfferStatistics();
      getTechnicianCounterOffers();
      getTechnicianAcceptedPosts();
      getTechnicianDeclinedPosts();
      getTechnicianAuditLogs();
    }
  }, [
    currentPage,
    pageSize,
    searchKeyword,
    statusFilter,
    locationFilter,
    dealerEmailFilter,
    activeTab,
    loadDealers,
    loadPosts,
    loadCounterOffers,
  ]);

  const handleLogout = async () => {
    navigate("/");
  };

  const handleDealerAction = async (action, dealerId, reason = "") => {
    try {
      switch (action) {
        case "delete":
          await api.post(
            `${API_CONFIG.DEALER_BASE_URL}/${dealerId}/delete`,
            null,
            {
              params: { reason, deletedBy: admin.email },
            }
          );
          toast.success("Dealer deleted successfully");
          break;
        case "suspend":
          await api.put(
            `${API_CONFIG.DEALER_BASE_URL}/${dealerId}/status`,
            null,
            {
              params: {
                newStatus: "SUSPENDED",
                reason,
                updatedBy: admin.email,
              },
            }
          );
          toast.success("Dealer suspended successfully");
          break;
        case "activate":
          await api.put(
            `${API_CONFIG.DEALER_BASE_URL}/${dealerId}/status`,
            null,
            {
              params: {
                newStatus: "ACTIVE",
                reason,
                updatedBy: admin.email,
              },
            }
          );
          toast.success("Dealer activated successfully");
          break;
        case "verify":
          await api.put(
            `${API_CONFIG.DEALER_BASE_URL}/${dealerId}/status`,
            null,
            {
              params: {
                newStatus: "ACTIVE",
                reason: "Verified by admin",
                updatedBy: admin.email,
              },
            }
          );
          toast.success("Dealer verified successfully");
          break;
        default:
          break;
      }
      loadDealers(); // Refresh dealer list
    } catch (error) {
      console.error("Error performing dealer action:", error);
      toast.error("Failed to perform action");
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedDealers.length === 0) {
      toast.error("Please select action and dealers");
      return;
    }

    try {
      const bulkActionDto = {
        dealerIds: selectedDealers.map((d) => d.dealerId),
        action: bulkAction,
        reason: bulkReason,
        performedBy: admin.email,
      };

      await api.post(
        `${API_CONFIG.DEALER_BASE_URL}/bulk-action`,
        bulkActionDto
      );
      toast.success(`Bulk ${bulkAction.toLowerCase()} completed successfully`);
      setShowBulkActionModal(false);
      setSelectedDealers([]);
      setBulkAction("");
      setBulkReason("");
      loadDealers();
    } catch (error) {
      console.error("Error performing bulk action:", error);
      toast.error("Failed to perform bulk action");
    }
  };

  // Enhanced posting management functions
  const handlePostAction = async (action, postId, reason = "") => {
    try {
      switch (action) {
        case "delete":
          await api.delete(
            `${API_CONFIG.POSTS_BASE_URL}/admin/posts/${postId}`,
            {
              params: {
                reason: reason || "Deleted by admin",
                adminEmail: admin.email,
              },
            }
          );
          toast.success("Post deleted successfully");
          break;
        case "restore":
          await api.post(
            `${API_CONFIG.POSTS_BASE_URL}/admin/posts/${postId}/restore`,
            null,
            {
              params: { adminEmail: admin.email },
            }
          );
          toast.success("Post restored successfully");
          break;
        case "status":
          // This will be handled by a separate modal
          break;
        default:
          break;
      }
      loadPosts(); // Refresh post list
    } catch (error) {
      console.error("Error performing post action:", error);
      toast.error("Failed to perform action");
    }
  };

  const handleCounterOfferAction = async (
    action,
    counterOfferId,
    reason = ""
  ) => {
    try {
      if (action === "cancel") {
        await api.put(
          `${API_CONFIG.POSTS_BASE_URL}/admin/counter-offers/${counterOfferId}/cancel`,
          null,
          {
            params: {
              reason: reason || "Cancelled by admin",
              adminEmail: admin.email,
            },
          }
        );
        toast.success("Counter offer cancelled successfully");
        loadCounterOffers();
      }
    } catch (error) {
      console.error("Error performing counter offer action:", error);
      toast.error("Failed to perform action");
    }
  };

  // ==================== ADDITIONAL ADMIN ENDPOINTS ====================

  // 1. Get post by ID
  const getPostById = async (postId) => {
    try {
      const response = await api.get(
        `${API_CONFIG.POSTS_BASE_URL}/admin/posts/${postId}`
      );
      if (response.data && response.data.success) {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error("Error getting post by ID:", error);
      toast.error("Failed to get post details");
      return null;
    }
  };

  // 2. Update post status
  const updatePostStatus = async (postId, newStatus, reason) => {
    try {
      const response = await api.put(
        `${API_CONFIG.POSTS_BASE_URL}/admin/posts/${postId}/status`,
        {
          status: newStatus,
          reason: reason,
          adminEmail: admin.email,
        }
      );
      if (response.data && response.data.success) {
        toast.success("Post status updated successfully");
        loadPosts();
        return response.data;
      }
    } catch (error) {
      console.error("Error updating post status:", error);
      toast.error("Failed to update post status");
    }
  };

  // 3. Bulk update post statuses
  const bulkUpdatePostStatuses = async (postIds, newStatus, reason) => {
    try {
      const response = await api.post(
        `${API_CONFIG.POSTS_BASE_URL}/admin/posts/bulk-status-update`,
        {
          postIds,
          status: newStatus,
          reason: reason,
          adminEmail: admin.email,
        }
      );
      if (response.data && response.data.success) {
        toast.success(`Bulk status update completed successfully`);
        loadPosts();
        return response.data;
      }
    } catch (error) {
      console.error("Error in bulk status update:", error);
      toast.error("Failed to perform bulk status update");
    }
  };

  // 4. Get posting statistics
  const getPostingStatistics = async (dateFrom, dateTo) => {
    try {
      const response = await api.get(
        `${API_CONFIG.POSTS_BASE_URL}/admin/posts/statistics`,
        {
          params: { dateFrom, dateTo },
        }
      );
      if (response.data && response.data.success) {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error("Error getting posting statistics:", error);
      toast.error("Failed to get statistics");
      return null;
    }
  };

  // 5. Get posts by date range
  const getPostsByDateRange = async (dateFrom, dateTo, page = 0, size = 20) => {
    try {
      const response = await api.get(
        `${API_CONFIG.POSTS_BASE_URL}/admin/posts/by-date-range`,
        {
          params: { dateFrom, dateTo, page, size },
        }
      );
      if (response.data && response.data.success) {
        return response.data;
      }
      return null;
    } catch (error) {
      console.error("Error getting posts by date range:", error);
      toast.error("Failed to get posts by date range");
      return null;
    }
  };

  // 6. Export posts data
  const exportPostsData = async (format = "csv", status, dateFrom, dateTo) => {
    try {
      const response = await api.get(
        `${API_CONFIG.POSTS_BASE_URL}/admin/posts/export`,
        {
          params: { format, status, dateFrom, dateTo },
        }
      );
      if (response.data && response.data.success) {
        // Handle CSV download
        if (format === "csv" && response.data.data) {
          const blob = new Blob([response.data.data], { type: "text/csv" });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `posts_export_${
            new Date().toISOString().split("T")[0]
          }.csv`;
          a.click();
          window.URL.revokeObjectURL(url);
          toast.success("Posts exported successfully");
        }
        return response.data;
      }
    } catch (error) {
      console.error("Error exporting posts:", error);
      toast.error("Failed to export posts");
    }
  };

  // 7. Get counter offer by ID
  const getCounterOfferById = async (counterOfferId) => {
    try {
      const response = await api.get(
        `${API_CONFIG.POSTS_BASE_URL}/admin/counter-offers/${counterOfferId}`
      );
      if (response.data && response.data.success) {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error("Error getting counter offer by ID:", error);
      toast.error("Failed to get counter offer details");
      return null;
    }
  };

  // 8. Get deleted posts
  const getDeletedPosts = async () => {
    try {
      const response = await api.get(`${API_CONFIG.POSTS_BASE_URL}/deleted`);
      if (response.data && response.data.posts) {
        return response.data.posts;
      }
      return [];
    } catch (error) {
      console.error("Error getting deleted posts:", error);
      toast.error("Failed to get deleted posts");
      return [];
    }
  };

  // 9. Get posts by filter
  const getPostsByFilter = async (filters) => {
    try {
      const response = await api.post(
        `${API_CONFIG.POSTS_BASE_URL}/filters`,
        filters
      );
      if (response.data) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error("Error getting posts by filter:", error);
      toast.error("Failed to get filtered posts");
      return [];
    }
  };

  // 10. Get counter offers for a specific post
  const getCounterOffersByPost = async (postId) => {
    try {
      const response = await api.get(
        `${API_CONFIG.POSTS_BASE_URL}/counter-offers/post/${postId}`
      );
      if (response.data) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error("Error getting counter offers for post:", error);
      toast.error("Failed to get counter offers for post");
      return [];
    }
  };

  // 11. Get counter offers by technician
  const getCounterOffersByTechnician = async (technicianEmail) => {
    try {
      const response = await api.get(
        `${API_CONFIG.POSTS_BASE_URL}/counter-offers/technician/${technicianEmail}`
      );
      if (response.data) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error("Error getting counter offers by technician:", error);
      toast.error("Failed to get counter offers by technician");
      return [];
    }
  };

  // ==================== TECHNICIAN ADMIN API FUNCTIONS ====================

  // Get all technicians with pagination and filtering
  const getTechnicians = async (page = 0, size = 20, filters = {}) => {
    try {
      setLoadingTechnicians(true);
      const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
        ...filters,
      });

      const response = await api.get(
        `${API_CONFIG.TECHNICIAN_BASE_URL}/admin/technicians?${params}`
      );

      setTechnicians(response.data.technicians || []);
      setTechnicianPagination({
        currentPage: response.data.currentPage || 0,
        totalPages: response.data.totalPages || 0,
        totalElements: response.data.totalElements || 0,
        size: response.data.size || 20,
      });

      return response.data;
    } catch (error) {
      console.error("Error fetching technicians:", error);
      toast.error("Failed to fetch technicians");
      return null;
    } finally {
      setLoadingTechnicians(false);
    }
  };

  // Get technician statistics
  const getTechnicianStatistics = async () => {
    try {
      const response = await api.get(
        `${API_CONFIG.TECHNICIAN_BASE_URL}/admin/technicians/statistics`
      );
      setTechnicianStats(response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching technician statistics:", error);
      toast.error("Failed to fetch technician statistics");
      return null;
    }
  };

  // Get technician performance metrics
  const getTechnicianPerformanceMetrics = async (
    page = 0,
    size = 20,
    sortBy = "totalEarnings",
    sortOrder = "desc"
  ) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
        sortBy,
        sortOrder,
      });

      const response = await api.get(
        `${API_CONFIG.TECHNICIAN_BASE_URL}/admin/technicians/performance-metrics?${params}`
      );
      setTechnicianPerformance(response.data.metrics || []);
      return response.data;
    } catch (error) {
      console.error("Error fetching performance metrics:", error);
      toast.error("Failed to fetch performance metrics");
      return null;
    }
  };

  // Get top performers
  const getTopPerformers = async (limit = 10, metric = "totalEarnings") => {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        metric,
      });

      const response = await api.get(
        `${API_CONFIG.TECHNICIAN_BASE_URL}/admin/technicians/performance-metrics/top-performers?${params}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching top performers:", error);
      toast.error("Failed to fetch top performers");
      return null;
    }
  };

  // Get counter offers
  const getTechnicianCounterOffers = async (
    page = 0,
    size = 20,
    filters = {}
  ) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
        ...filters,
      });

      const response = await api.get(
        `${API_CONFIG.TECHNICIAN_BASE_URL}/admin/technicians/counter-offers?${params}`
      );
      setTechnicianCounterOffers(response.data.content || []);
      return response.data;
    } catch (error) {
      console.error("Error fetching counter offers:", error);
      toast.error("Failed to fetch counter offers");
      return null;
    }
  };

  // Get technician accepted posts
  const getTechnicianAcceptedPosts = async (
    page = 0,
    size = 20,
    filters = {}
  ) => {
    try {
      const params = new URLSearchParams();
      params.append("page", page);
      params.append("size", size);

      if (filters.technicianEmail)
        params.append("technicianEmail", filters.technicianEmail);
      if (filters.dateFrom) params.append("dateFrom", filters.dateFrom);
      if (filters.dateTo) params.append("dateTo", filters.dateTo);

      const response = await api.get(
        `${API_CONFIG.TECHNICIAN_BASE_URL}/admin/technicians/accepted-posts?${params}`
      );
      setTechnicianAcceptedPosts(response.data.content || []);
      return response.data;
    } catch (error) {
      console.error("Error fetching technician accepted posts:", error);
      toast.error("Failed to fetch technician accepted posts");
      return null;
    }
  };

  // Get declined posts
  const getTechnicianDeclinedPosts = async (
    page = 0,
    size = 20,
    filters = {}
  ) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
        ...filters,
      });

      const response = await api.get(
        `${API_CONFIG.TECHNICIAN_BASE_URL}/admin/technicians/declined-posts?${params}`
      );
      setTechnicianDeclinedPosts(response.data.content || []);
      return response.data;
    } catch (error) {
      console.error("Error fetching declined posts:", error);
      toast.error("Failed to fetch declined posts");
      return null;
    }
  };

  // Get audit logs
  const getTechnicianAuditLogs = async (page = 0, size = 20, filters = {}) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
        ...filters,
      });

      const response = await api.get(
        `${API_CONFIG.TECHNICIAN_BASE_URL}/admin/technicians/audit-logs?${params}`
      );
      setTechnicianAuditLogs(response.data.content || []);
      return response.data;
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      toast.error("Failed to fetch audit logs");
      return null;
    }
  };

  // Update technician profile
  const updateTechnicianProfile = async (technicianId, updateData) => {
    try {
      const response = await api.put(
        `${API_CONFIG.TECHNICIAN_BASE_URL}/admin/technicians/${technicianId}`
      );
      toast.success("Technician profile updated successfully");
      return response.data;
    } catch (error) {
      console.error("Error updating technician profile:", error);
      toast.error("Failed to update technician profile");
      return null;
    }
  };

  // Delete technician
  const deleteTechnician = async (technicianId) => {
    try {
      const response = await api.delete(
        `${API_CONFIG.TECHNICIAN_BASE_URL}/admin/technicians/${technicianId}`
      );
      toast.success("Technician deleted successfully");
      return null;
    } catch (error) {
      console.error("Error deleting technician:", error);
      toast.error("Failed to delete technician");
      return null;
    }
  };

  // Force expire counter offer
  const forceExpireCounterOffer = async (counterOfferId) => {
    try {
      const response = await api.delete(
        `${API_CONFIG.TECHNICIAN_BASE_URL}/admin/technicians/counter-offers/${counterOfferId}/force-expire`
      );
      toast.success("Counter offer expired successfully");
      return response.data;
    } catch (error) {
      console.error("Error expiring counter offer:", error);
      toast.error("Failed to expire counter offer");
      return null;
    }
  };

  // Get dashboard summary
  const getTechnicianDashboardSummary = async () => {
    try {
      const response = await api.get(
        `${API_CONFIG.TECHNICIAN_BASE_URL}/admin/technicians/dashboard`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching dashboard summary:", error);
      toast.error("Failed to fetch dashboard summary");
      return null;
    }
  };

  // Suspend technician
  const suspendTechnician = async (technicianId) => {
    try {
      const response = await api.put(
        `${API_CONFIG.TECHNICIAN_BASE_URL}/admin/technicians/${technicianId}/suspend`
      );
      toast.success("Technician suspended successfully");
      getTechnicians(); // Refresh the list
      return response.data;
    } catch (error) {
      console.error("Error suspending technician:", error);
      toast.error("Failed to suspend technician");
      return null;
    }
  };

  // Activate technician
  const activateTechnician = async (technicianId) => {
    try {
      const response = await api.put(
        `${API_CONFIG.TECHNICIAN_BASE_URL}/admin/technicians/${technicianId}/activate`
      );
      toast.success("Technician activated successfully");
      getTechnicians(); // Refresh the list
      return response.data;
    } catch (error) {
      console.error("Error activating technician:", error);
      toast.error("Failed to activate technician");
      return null;
    }
  };

  // Restore deleted technician
  const restoreTechnician = async (technicianId) => {
    try {
      const response = await api.put(
        `${API_CONFIG.TECHNICIAN_BASE_URL}/admin/technicians/${technicianId}/restore`
      );
      toast.success("Technician restored successfully");
      getTechnicians(); // Refresh the list
      return response.data;
    } catch (error) {
      console.error("Error restoring technician:", error);
      toast.error("Failed to restore technician");
      return null;
    }
  };

  // Get technicians by status
  const getTechniciansByStatus = async (status, page = 0, size = 20) => {
    try {
      const response = await api.get(
        `${API_CONFIG.TECHNICIAN_BASE_URL}/admin/technicians/status/${status}?page=${page}&size=${size}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching technicians by status:", error);
      toast.error("Failed to fetch technicians by status");
      return null;
    }
  };

  // Get counter offer statistics
  const getCounterOfferStatistics = async () => {
    try {
      const response = await api.get(
        `${API_CONFIG.TECHNICIAN_BASE_URL}/admin/technicians/counter-offers/statistics`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching counter offer statistics:", error);
      toast.error("Failed to fetch counter offer statistics");
      return null;
    }
  };

  // 12. Enhanced bulk post action with status updates
  const handleBulkPostAction = async () => {
    if (!bulkAction || selectedPosts.length === 0) {
      toast.error("Please select action and posts");
      return;
    }

    try {
      const postIds = selectedPosts.map((p) => p.id);

      if (bulkAction === "delete") {
        await api.post(`${API_CONFIG.POSTS_BASE_URL}/admin/posts/bulk-delete`, {
          postIds,
          reason: bulkReason || "Bulk deleted by admin",
          adminEmail: admin.email,
        });
        toast.success(`Bulk delete completed successfully`);
      } else if (bulkAction === "status") {
        // This will be handled by a separate modal
        return;
      }

      setShowPostBulkActionModal(false);
      setSelectedPosts([]);
      setBulkAction("");
      setBulkReason("");
      loadPosts();
    } catch (error) {
      console.error("Error performing bulk post action:", error);
      toast.error("Failed to perform bulk action");
    }
  };

  const confirmAction = (type, data) => {
    setConfirmActionData({ type, data });
    setShowConfirmModal(true);
  };

  // Helper function to confirm post status update
  const confirmPostStatusUpdate = (postId, currentStatus) => {
    setConfirmActionData({
      type: "post_status_update",
      data: { id: postId, currentStatus },
    });
    setShowConfirmModal(true);
  };

  // Helper function to confirm counter offer cancellation
  const confirmCounterOfferCancel = (counterOfferId) => {
    setConfirmActionData({
      type: "counter_offer_cancel",
      data: { id: counterOfferId },
    });
    setShowConfirmModal(true);
  };

  const executeConfirmedAction = () => {
    const { type, data } = confirmActionData;
    if (type === "dealer_delete") {
      handleDealerAction("delete", data.dealerId, "Deleted by admin");
    } else if (type === "dealer_suspend") {
      handleDealerAction("suspend", data.dealerId, "Suspended by admin");
    } else if (type === "dealer_activate") {
      handleDealerAction("activate", data.dealerId, "Activated by admin");
    } else if (type === "post_delete") {
      handlePostAction("delete", data.id);
    } else if (type === "post_restore") {
      handlePostAction("restore", data.id);
    } else if (type === "post_status_update") {
      // This will be handled by a separate modal
      setShowConfirmModal(false);
      // TODO: Show status update modal
      return;
    } else if (type === "counter_offer_cancel") {
      handleCounterOfferAction("cancel", data.id, "Cancelled by admin");
    } else if (type === "technician_delete") {
      deleteTechnician(data.id);
      getTechnicians(); // Refresh the list
    } else if (type === "technician_suspend") {
      suspendTechnician(data.id);
      getTechnicians(); // Refresh the list
    } else if (type === "technician_activate") {
      activateTechnician(data.id);
      getTechnicians(); // Refresh the list
    } else if (type === "technician_restore") {
      restoreTechnician(data.id);
      getTechnicians(); // Refresh the list
    } else if (type === "counter_offer_expire") {
      forceExpireCounterOffer(data.id);
      getTechnicianCounterOffers(); // Refresh the list
    } else if (type === "technician_bulk_suspend") {
      // Bulk suspend technicians
      technicians.forEach((tech) => {
        if (tech.status === "ACTIVE") {
          suspendTechnician(tech.id);
        }
      });
      getTechnicians(); // Refresh the list
    } else if (type === "technician_bulk_activate") {
      // Bulk activate technicians
      technicians.forEach((tech) => {
        if (tech.status === "SUSPENDED") {
          activateTechnician(tech.id);
        }
      });
      getTechnicians(); // Refresh the list
    } else if (type === "technician_bulk_delete") {
      // Bulk delete technicians
      technicians.forEach((tech) => {
        if (tech.status !== "DELETED") {
          deleteTechnician(tech.id);
        }
      });
      getTechnicians(); // Refresh the list
    }
    setShowConfirmModal(false);
  };

  const exportDealers = async () => {
    try {
      const response = await api.get(`${API_CONFIG.DEALER_BASE_URL}/export`, {
        params: {
          status: statusFilter !== "ALL" ? statusFilter : undefined,
          location: locationFilter || undefined,
        },
      });

      if (response.data && response.data.success) {
        // Create CSV content
        const csvContent = [
          "Dealer ID,Name,Email,Location,Zipcode,Phone,Status,Registered At,Last Updated",
          ...response.data.data.map(
            (dealer) =>
              `${dealer.dealerId},"${dealer.name}","${dealer.email}","${dealer.location}","${dealer.zipcode}","${dealer.phone}","${dealer.status}","${dealer.registeredAt}","${dealer.lastUpdatedAt}"`
          ),
        ].join("\n");

        // Download CSV file
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `dealers_export_${
          new Date().toISOString().split("T")[0]
        }.csv`;
        a.click();
        window.URL.revokeObjectURL(url);

        toast.success("Dealers exported successfully");
      }
    } catch (error) {
      console.error("Error exporting dealers:", error);
      toast.error("Failed to export dealers");
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      ACTIVE: { bg: "success", text: "Active" },
      INACTIVE: { bg: "secondary", text: "Inactive" },
      SUSPENDED: { bg: "danger", text: "Suspended" },
      PENDING_VERIFICATION: { bg: "warning", text: "Pending" },
    };

    const config = statusConfig[status] || { bg: "secondary", text: status };
    return <Badge bg={config.bg}>{config.text}</Badge>;
  };

  const getDealerTypeIcon = (status) => {
    switch (status) {
      case "ACTIVE":
        return <HiOutlineStatusOnline className="text-success" />;
      case "SUSPENDED":
        return <HiOutlineStatusOffline className="text-danger" />;
      case "PENDING_VERIFICATION":
        return <FaClock className="text-warning" />;
      default:
        return <FaBuilding className="text-secondary" />;
    }
  };

  const handleDealerSelection = (dealerId, checked) => {
    if (checked) {
      const dealer = dealers.find((d) => d.dealerId === dealerId);
      if (dealer) {
        setSelectedDealers((prev) => [...prev, dealer]);
      }
    } else {
      setSelectedDealers((prev) => prev.filter((d) => d.dealerId !== dealerId));
    }
  };

  const handleSelectAllDealers = (checked) => {
    if (checked) {
      setSelectedDealers([...dealers]);
    } else {
      setSelectedDealers([]);
    }
  };

  return (
    <div className="admin-dashboard">
      <ToastContainer position="top-right" />

      {/* Sidebar */}
      <div className={`admin-sidebar ${sidebarCollapsed ? "collapsed" : ""}`}>
        <div className="sidebar-header">
          <div className="d-flex align-items-center justify-content-between">
            {!sidebarCollapsed && (
              <div className="d-flex align-items-center">
                <FaUserShield className="text-warning me-2" size={24} />
                <h5 className="mb-0 text-white">Admin Panel</h5>
              </div>
            )}
            <button
              className="btn btn-link text-white p-0"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              {sidebarCollapsed ? (
                <HiOutlineMenu size={20} />
              ) : (
                <HiOutlineX size={20} />
              )}
            </button>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
            title="Dashboard overview with statistics and recent activity"
          >
            <HiOutlineChartPie />
            {!sidebarCollapsed && <span>Overview</span>}
          </button>

          <button
            className={`nav-item ${activeTab === "dealers" ? "active" : ""}`}
            onClick={() => setActiveTab("dealers")}
            title="Manage dealer accounts, view details, and perform bulk operations"
          >
            <FaBuilding />
            {!sidebarCollapsed && <span>Dealer Management</span>}
          </button>

          <button
            className={`nav-item ${
              activeTab === "technicians" ? "active" : ""
            }`}
            onClick={() => setActiveTab("technicians")}
            title="Manage technician accounts, monitor performance, and view analytics"
          >
            <FaTools />
            {!sidebarCollapsed && <span>Technician Management</span>}
          </button>

          <button
            className={`nav-item ${activeTab === "posts" ? "active" : ""}`}
            onClick={() => setActiveTab("posts")}
            title="Review and moderate dealer posts, approve or reject content"
          >
            <FaClipboardList />
            {!sidebarCollapsed && <span>Post Management</span>}
          </button>

          <button
            className={`nav-item ${
              activeTab === "counterOffers" ? "active" : ""
            }`}
            onClick={() => setActiveTab("counterOffers")}
            title="Manage counter offers between dealers and technicians"
          >
            <FaHandshake />
            {!sidebarCollapsed && <span>Counter Offers</span>}
          </button>

          <button
            className={`nav-item ${activeTab === "analytics" ? "active" : ""}`}
            onClick={() => setActiveTab("analytics")}
            title="View posting analytics and generate reports"
          >
            <FaChartBar />
            {!sidebarCollapsed && <span>Analytics</span>}
          </button>

          <button
            className={`nav-item ${activeTab === "audit" ? "active" : ""}`}
            onClick={() => setActiveTab("audit")}
            title="View audit trail of all administrative actions performed"
          >
            <FaHistory />
            {!sidebarCollapsed && <span>Audit Trail</span>}
          </button>

          <button
            className={`nav-item ${
              activeTab === "techDashboard" ? "active" : ""
            }`}
            onClick={() => setActiveTab("techDashboard")}
            title="Manage inspection reports, checklists, files, and technician performance"
          >
            <HiOutlineDocumentText />
            {!sidebarCollapsed && <span>Tech Dashboard</span>}
          </button>

          <button
            className={`nav-item ${activeTab === "settings" ? "active" : ""}`}
            onClick={() => setActiveTab("settings")}
            title="Configure system settings and monitor system health"
          >
            <HiOutlineCog />
            {!sidebarCollapsed && <span>Settings</span>}
          </button>
        </nav>

        <div className="sidebar-footer">
          <button
            className="nav-item"
            onClick={handleLogout}
            title="Logout from admin dashboard and return to main application"
          >
            <HiOutlineLogout />
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="admin-main">
        {/* Header */}
        <header className="admin-header">
          <div className="d-flex align-items-center justify-content-between">
            <div>
              <h1 className="h3 mb-0">
                {activeTab === "overview" && "Dashboard Overview"}
                {activeTab === "dealers" && "Dealer Management"}
                {activeTab === "technicians" && "Technician Management"}
                {activeTab === "posts" && "Post Management"}
                {activeTab === "audit" && "Audit Trail"}
                {activeTab === "techDashboard" && "Tech Dashboard Admin"}
                {activeTab === "settings" && "Settings"}
              </h1>
              <p className="text-muted mb-0">
                Administrative controls and monitoring
              </p>
            </div>
            <div className="d-flex align-items-center gap-3">
              <button
                className="btn btn-outline-primary btn-sm"
                onClick={async () => {
                  setLoading(true);
                  try {
                    await Promise.all([
                      loadSystemStats(),
                      loadDealers(),
                      loadPosts(),
                    ]);
                  } catch (error) {
                    console.error("Error refreshing dashboard:", error);
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                title="Reload all dashboard data including statistics, dealer list, and posts"
              >
                <HiOutlineRefresh className={loading ? "spinning" : ""} />
                Refresh Data
              </button>
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={() => navigate("/")}
                title="Return to the main application homepage"
              >
                <HiOutlineHome />
                Back to Home
              </button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="admin-content">
          {error && (
            <Alert variant="danger" dismissible onClose={() => setError("")}>
              {error}
            </Alert>
          )}

          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="overview-tab">
              {/* Stats Cards */}
              <div className="row g-4 mb-4">
                <div className="col-md-3">
                  <div
                    className="stat-card"
                    title="Total number of registered dealers in the system"
                  >
                    <div className="stat-icon bg-primary">
                      <FaUsers />
                    </div>
                    <div className="stat-content">
                      <h3>{systemStats.total || 0}</h3>
                      <p>Total Dealers</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div
                    className="stat-card"
                    title="Number of dealers with active accounts"
                  >
                    <div className="stat-icon bg-success">
                      <FaBuilding />
                    </div>
                    <div className="stat-content">
                      <h3>{systemStats.active || 0}</h3>
                      <p>Active Dealers</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div
                    className="stat-card"
                    title="Dealers waiting for account verification"
                  >
                    <div className="stat-icon bg-warning">
                      <FaClock />
                    </div>
                    <div className="stat-content">
                      <h3>{systemStats.pendingVerification || 0}</h3>
                      <p>Pending Verification</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div
                    className="stat-card"
                    title="Dealers with temporarily suspended accounts"
                  >
                    <div className="stat-icon bg-danger">
                      <FaBan />
                    </div>
                    <div className="stat-content">
                      <h3>{systemStats.suspended || 0}</h3>
                      <p>Suspended Dealers</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="row g-4">
                <div className="col-md-6">
                  <div className="card">
                    <div className="card-header">
                      <h5 className="mb-0">Recent Dealer Activity</h5>
                    </div>
                    <div className="card-body">
                      {loadingDealers ? (
                        <div className="text-center py-3">
                          <Spinner animation="border" size="sm" />
                          <p className="mt-2">Loading recent dealers...</p>
                        </div>
                      ) : (
                        <div className="recent-users">
                          {dealers.slice(0, 5).map((dealer) => (
                            <div key={dealer.dealerId} className="user-item">
                              <div className="user-avatar">
                                {getDealerTypeIcon(dealer.status)}
                              </div>
                              <div className="user-info">
                                <h6 className="mb-0">{dealer.name}</h6>
                                <small className="text-muted">
                                  {dealer.email}
                                </small>
                              </div>
                              <div className="user-status">
                                {getStatusBadge(dealer.status)}
                              </div>
                            </div>
                          ))}
                          {dealers.length === 0 && (
                            <p className="text-muted text-center">
                              No dealers found
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="card">
                    <div className="card-header">
                      <h5 className="mb-0">Recent Post Activity</h5>
                    </div>
                    <div className="card-body">
                      {loadingPosts ? (
                        <div className="text-center py-3">
                          <Spinner animation="border" size="sm" />
                          <p className="mt-2">Loading recent posts...</p>
                        </div>
                      ) : (
                        <div className="recent-posts">
                          {posts.slice(0, 5).map((post) => (
                            <div key={post.id} className="post-item">
                              <div className="post-icon">
                                <HiOutlineDocumentText />
                              </div>
                              <div className="post-info">
                                <h6 className="mb-0">Post #{post.id}</h6>
                                <small className="text-muted">
                                  {post.content?.substring(0, 50)}...
                                </small>
                              </div>
                              <div className="post-status">
                                {getStatusBadge(post.status)}
                              </div>
                            </div>
                          ))}
                          {posts.length === 0 && (
                            <p className="text-muted text-center">
                              No posts found
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Dealers Tab */}
          {activeTab === "dealers" && (
            <div className="dealers-tab">
              {/* Filters */}
              <div className="filters-section mb-4">
                <div className="row g-3">
                  <div className="col-md-3">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search dealers by name, email, or phone..."
                      value={searchKeyword}
                      onChange={(e) => setSearchKeyword(e.target.value)}
                      title="Search dealers by name, email, or phone number"
                    />
                  </div>
                  <div className="col-md-2">
                    <Select
                      value={{ value: statusFilter, label: statusFilter }}
                      onChange={(option) => setStatusFilter(option.value)}
                      options={[
                        { value: "ALL", label: "All Status" },
                        { value: "ACTIVE", label: "Active" },
                        { value: "INACTIVE", label: "Inactive" },
                        { value: "SUSPENDED", label: "Suspended" },
                        {
                          value: "PENDING_VERIFICATION",
                          label: "Pending Verification",
                        },
                      ]}
                      placeholder="Filter by status"
                      title="Filter dealers by their current account status"
                    />
                  </div>
                  <div className="col-md-2">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Filter by location..."
                      value={locationFilter}
                      onChange={(e) => setLocationFilter(e.target.value)}
                      title="Filter dealers by specific location or zipcode"
                    />
                  </div>
                  <div className="col-md-2">
                    <button
                      className="btn btn-primary w-100"
                      onClick={loadDealers}
                      title="Apply current filters and refresh dealer list"
                    >
                      <FaSearch /> Search
                    </button>
                  </div>
                  <div className="col-md-3">
                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => setShowBulkActionModal(true)}
                        disabled={selectedDealers.length === 0}
                        title={`Perform bulk actions on ${selectedDealers.length} selected dealer(s)`}
                      >
                        <FaTools /> Bulk Actions ({selectedDealers.length})
                      </button>
                      <button
                        className="btn btn-info btn-sm"
                        onClick={exportDealers}
                        title="Export dealer data to CSV file. Export respects current filters"
                      >
                        <FaDownload /> Export
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dealers Table */}
              <div className="card">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">
                    Dealer Management ({totalElements} total dealers)
                  </h5>
                  <div className="d-flex align-items-center gap-2">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={
                          selectedDealers.length === dealers.length &&
                          dealers.length > 0
                        }
                        onChange={(e) =>
                          handleSelectAllDealers(e.target.checked)
                        }
                        title="Select or deselect all dealers on this page"
                      />
                      <label className="form-check-label">Select All</label>
                    </div>
                  </div>
                </div>
                <div className="card-body">
                  {loadingDealers ? (
                    <div className="text-center py-4">
                      <Spinner animation="border" />
                      <p className="mt-2">Loading dealers...</p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr>
                            <th title="Select dealers for bulk operations">
                              Select
                            </th>
                            <th title="Unique dealer identifier">Dealer ID</th>
                            <th title="Dealer's business name">
                              Business Name
                            </th>
                            <th title="Dealer's email address">
                              Email Address
                            </th>
                            <th title="Dealer's business location">Location</th>
                            <th title="Dealer's contact phone">Phone Number</th>
                            <th title="Current account status">
                              Account Status
                            </th>
                            <th title="Date dealer registered">
                              Registration Date
                            </th>
                            <th title="Available actions for this dealer">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {dealers.map((dealer) => (
                            <tr key={dealer.dealerId}>
                              <td>
                                <input
                                  type="checkbox"
                                  className="form-check-input"
                                  checked={selectedDealers.some(
                                    (d) => d.dealerId === dealer.dealerId
                                  )}
                                  onChange={(e) =>
                                    handleDealerSelection(
                                      dealer.dealerId,
                                      e.target.checked
                                    )
                                  }
                                  title={`Select ${dealer.name} for bulk operations`}
                                />
                              </td>
                              <td>{dealer.dealerId}</td>
                              <td>
                                <div className="d-flex align-items-center">
                                  {getDealerTypeIcon(dealer.status)}
                                  <span className="ms-2">{dealer.name}</span>
                                </div>
                              </td>
                              <td>{dealer.email}</td>
                              <td>
                                <div className="d-flex align-items-center">
                                  <HiOutlineLocationMarker className="text-muted me-1" />
                                  {dealer.location}
                                </div>
                              </td>
                              <td>
                                <div className="d-flex align-items-center">
                                  <HiOutlinePhone className="text-muted me-1" />
                                  {dealer.phone}
                                </div>
                              </td>
                              <td>{getStatusBadge(dealer.status)}</td>
                              <td>
                                <div className="d-flex align-items-center">
                                  <HiOutlineCalendar className="text-muted me-1" />
                                  {dealer.registeredAt
                                    ? new Date(
                                        dealer.registeredAt
                                      ).toLocaleDateString()
                                    : "N/A"}
                                </div>
                              </td>
                              <td>
                                <div className="btn-group btn-group-sm">
                                  <button
                                    className="btn btn-outline-info"
                                    onClick={() => {
                                      setSelectedDealer(dealer);
                                      setShowDealerModal(true);
                                    }}
                                    title={`View complete details for ${dealer.name}`}
                                  >
                                    <FaEye />
                                  </button>
                                  {dealer.status === "PENDING_VERIFICATION" && (
                                    <button
                                      className="btn btn-outline-success"
                                      onClick={() =>
                                        handleDealerAction(
                                          "verify",
                                          dealer.dealerId
                                        )
                                      }
                                      title={`Verify and activate ${dealer.name}'s account`}
                                    >
                                      <FaCheck />
                                    </button>
                                  )}
                                  {dealer.status === "ACTIVE" && (
                                    <button
                                      className="btn btn-outline-warning"
                                      onClick={() =>
                                        confirmAction("dealer_suspend", dealer)
                                      }
                                      title={`Suspend ${dealer.name}'s account temporarily`}
                                    >
                                      <FaBan />
                                    </button>
                                  )}
                                  {dealer.status === "SUSPENDED" && (
                                    <button
                                      className="btn btn-outline-success"
                                      onClick={() =>
                                        confirmAction("dealer_activate", dealer)
                                      }
                                      title={`Reactivate ${dealer.name}'s suspended account`}
                                    >
                                      <FaCheckCircle />
                                    </button>
                                  )}
                                  <button
                                    className="btn btn-outline-danger"
                                    onClick={() =>
                                      confirmAction("dealer_delete", dealer)
                                    }
                                    title={`Permanently delete ${dealer.name}'s account. This action cannot be undone.`}
                                  >
                                    <FaTrash />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="d-flex justify-content-center mt-4">
                  <nav>
                    <ul className="pagination">
                      <li
                        className={`page-item ${
                          currentPage === 0 ? "disabled" : ""
                        }`}
                      >
                        <button
                          className="page-link"
                          onClick={() => setCurrentPage(currentPage - 1)}
                          disabled={currentPage === 0}
                        >
                          Previous
                        </button>
                      </li>
                      {Array.from(
                        { length: Math.min(5, totalPages) },
                        (_, i) => {
                          const pageNum = i + 1;
                          return (
                            <li
                              key={pageNum}
                              className={`page-item ${
                                currentPage === i ? "active" : ""
                              }`}
                            >
                              <button
                                className="page-link"
                                onClick={() => setCurrentPage(i)}
                              >
                                {pageNum}
                              </button>
                            </li>
                          );
                        }
                      )}
                      <li
                        className={`page-item ${
                          currentPage === totalPages - 1 ? "disabled" : ""
                        }`}
                      >
                        <button
                          className="page-link"
                          onClick={() => setCurrentPage(currentPage + 1)}
                          disabled={currentPage === totalPages - 1}
                        >
                          Next
                        </button>
                      </li>
                    </ul>
                  </nav>
                </div>
              )}
            </div>
          )}

          {/* Technicians Tab */}
          {activeTab === "technicians" && (
            <div className="technicians-tab">
              {/* Technician Statistics */}
              <div className="row g-4 mb-4">
                <div className="col-md-2">
                  <div
                    className="stat-card"
                    title="Total number of registered technicians"
                  >
                    <div className="stat-icon bg-primary">
                      <FaTools />
                    </div>
                    <div className="stat-content">
                      <h3>{technicianStats.totalTechnicians || 0}</h3>
                      <p>Total</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-2">
                  <div
                    className="stat-card"
                    title="Technicians active in the last 30 days"
                  >
                    <div className="stat-icon bg-success">
                      <HiOutlineStatusOnline />
                    </div>
                    <div className="stat-content">
                      <h3>{technicianStats.activeTechnicians || 0}</h3>
                      <p>Active</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-2">
                  <div
                    className="stat-card"
                    title="New technicians registered this month"
                  >
                    <div className="stat-icon bg-info">
                      <HiOutlineUser />
                    </div>
                    <div className="stat-content">
                      <h3>{technicianStats.newTechniciansThisMonth || 0}</h3>
                      <p>New</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-2">
                  <div
                    className="stat-card"
                    title="Technicians with no recent activity"
                  >
                    <div className="stat-icon bg-warning">
                      <HiOutlineStatusOffline />
                    </div>
                    <div className="stat-content">
                      <h3>{technicianStats.inactiveTechnicians || 0}</h3>
                      <p>Inactive</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-2">
                  <div
                    className="stat-card"
                    title="Suspended technician accounts"
                  >
                    <div className="stat-icon bg-danger">
                      <FaBan />
                    </div>
                    <div className="stat-content">
                      <h3>{technicianStats.suspendedTechnicians || 0}</h3>
                      <p>Suspended</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-2">
                  <div
                    className="stat-card"
                    title="Deleted technician accounts"
                  >
                    <div className="stat-icon bg-secondary">
                      <FaTrash />
                    </div>
                    <div className="stat-content">
                      <h3>{technicianStats.deletedTechnicians || 0}</h3>
                      <p>Deleted</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="quick-actions-section mb-4">
                <div className="card">
                  <div className="card-header">
                    <h6 className="mb-0">Quick Actions</h6>
                  </div>
                  <div className="card-body">
                    <div className="row g-2">
                      <div className="col-md-2">
                        <button
                          className="btn btn-outline-primary btn-sm w-100"
                          onClick={() => getTechnicianPerformanceMetrics()}
                          title="View performance metrics for all technicians"
                        >
                          <FaChartBar /> Performance
                        </button>
                      </div>
                      <div className="col-md-2">
                        <button
                          className="btn btn-outline-info btn-sm w-100"
                          onClick={() => getTechnicianDashboardSummary()}
                          title="Get comprehensive dashboard summary"
                        >
                          <FaDownload /> Dashboard
                        </button>
                      </div>
                      <div className="col-md-2">
                        <button
                          className="btn btn-outline-success btn-sm w-100"
                          onClick={() => getCounterOfferStatistics()}
                          title="View counter offer statistics"
                        >
                          <FaHandshake /> Counter Offers
                        </button>
                      </div>
                      <div className="col-md-2">
                        <button
                          className="btn btn-outline-warning btn-sm w-100"
                          onClick={() => getTechnicianAuditLogs()}
                          title="View recent audit logs"
                        >
                          <FaHistory /> Audit Logs
                        </button>
                      </div>
                      <div className="col-md-2">
                        <button
                          className="btn btn-outline-secondary btn-sm w-100"
                          onClick={() => {
                            getTechnicians();
                            getTechnicianStatistics();
                            getTechnicianPerformanceMetrics();
                            getCounterOfferStatistics();
                            getTechnicianCounterOffers();
                            getTechnicianAcceptedPosts();
                            getTechnicianDeclinedPosts();
                            getTechnicianAuditLogs();
                          }}
                          title="Refresh all technician data"
                        >
                          <HiOutlineRefresh /> Refresh All
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div className="filters-section mb-4">
                <div className="row g-3">
                  <div className="col-md-3">
                    <div className="input-group">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Search technicians by name, email, or location..."
                        value={searchKeyword}
                        onChange={(e) => setSearchKeyword(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            getTechnicians(0, 20, {
                              searchTerm: searchKeyword,
                              location: locationFilter,
                              experience: experienceFilter,
                            });
                          }
                        }}
                        title="Search technicians by name, email, or location"
                      />
                      <button
                        className="btn btn-outline-secondary"
                        type="button"
                        onClick={() =>
                          getTechnicians(0, 20, {
                            searchTerm: searchKeyword,
                            location: locationFilter,
                            experience: experienceFilter,
                          })
                        }
                        title="Search technicians"
                      >
                        <FaSearch />
                      </button>
                    </div>
                  </div>
                  <div className="col-md-2">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Filter by location..."
                      value={locationFilter}
                      onChange={(e) => setLocationFilter(e.target.value)}
                      title="Filter technicians by specific location"
                    />
                  </div>
                  <div className="col-md-2">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Filter by experience..."
                      value={experienceFilter}
                      onChange={(e) => setExperienceFilter(e.target.value)}
                      title="Filter technicians by years of experience"
                    />
                  </div>
                  <div className="col-md-2">
                    <button
                      className="btn btn-primary w-100"
                      onClick={() =>
                        getTechnicians(0, 20, {
                          searchTerm: searchKeyword,
                          location: locationFilter,
                          experience: experienceFilter,
                        })
                      }
                      title="Apply current filters and refresh technician list"
                    >
                      <FaSearch /> Search
                    </button>
                  </div>
                  <div className="col-md-3">
                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => {
                          setSearchKeyword("");
                          setLocationFilter("");
                          setExperienceFilter("");
                          getTechnicians();
                        }}
                        title="Clear all filters"
                      >
                        <FaFilter /> Clear Filters
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Technicians Table */}
              <div className="card">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">
                    Technician Management (
                    {technicianPagination.totalElements || 0} total technicians)
                  </h5>
                  <div className="d-flex align-items-center gap-2">
                    <button
                      className="btn btn-outline-primary btn-sm"
                      onClick={() => getTechnicians()}
                      title="Refresh technician list"
                    >
                      <HiOutlineRefresh />
                    </button>
                    <button
                      className="btn btn-outline-warning btn-sm"
                      onClick={() => {
                        if (technicians.length > 0) {
                          setShowBulkActionModal(true);
                          setBulkAction("technician_bulk_suspend");
                        } else {
                          toast.warning(
                            "No technicians selected for bulk action"
                          );
                        }
                      }}
                      title="Bulk suspend technicians"
                    >
                      <FaBan /> Bulk Suspend
                    </button>
                    <button
                      className="btn btn-outline-success btn-sm"
                      onClick={() => {
                        if (technicians.length > 0) {
                          setShowBulkActionModal(true);
                          setBulkAction("technician_bulk_activate");
                        } else {
                          toast.warning(
                            "No technicians selected for bulk action"
                          );
                        }
                      }}
                      title="Bulk activate technicians"
                    >
                      <FaCheck /> Bulk Activate
                    </button>
                  </div>
                </div>
                <div className="card-body">
                  {/* Filter Summary */}
                  {(searchKeyword ||
                    locationFilter ||
                    experienceFilter ||
                    technicianStatusFilter) && (
                    <div className="alert alert-info mb-3">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <strong>Active Filters:</strong>
                          {searchKeyword && (
                            <Badge bg="primary" className="ms-2">
                              Search: {searchKeyword}
                            </Badge>
                          )}
                          {locationFilter && (
                            <Badge bg="info" className="ms-2">
                              Location: {locationFilter}
                            </Badge>
                          )}
                          {experienceFilter && (
                            <Badge bg="warning" className="ms-2">
                              Experience: {experienceFilter}
                            </Badge>
                          )}
                          {technicianStatusFilter && (
                            <Badge bg="secondary" className="ms-2">
                              Status: {technicianStatusFilter}
                            </Badge>
                          )}
                        </div>
                        <button
                          className="btn btn-outline-secondary btn-sm"
                          onClick={() => {
                            setSearchKeyword("");
                            setLocationFilter("");
                            setExperienceFilter("");
                            setTechnicianStatusFilter("");
                            getTechnicians();
                          }}
                        >
                          Clear All Filters
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Enhanced Filters */}
                  <div className="row mb-3">
                    <div className="col-md-2">
                      <select
                        className="form-select"
                        value={technicianStatusFilter || ""}
                        onChange={(e) => {
                          setTechnicianStatusFilter(e.target.value);
                          if (e.target.value) {
                            getTechniciansByStatus(e.target.value);
                          } else {
                            getTechnicians();
                          }
                        }}
                      >
                        <option value="">All Statuses</option>
                        <option value="ACTIVE">Active</option>
                        <option value="SUSPENDED">Suspended</option>
                        <option value="DELETED">Deleted</option>
                      </select>
                    </div>
                    <div className="col-md-2">
                      <select
                        className="form-select"
                        value={experienceFilter || ""}
                        onChange={(e) => {
                          setExperienceFilter(e.target.value);
                          if (e.target.value) {
                            getTechnicians(0, 20, {
                              experience: e.target.value,
                              status: technicianStatusFilter || undefined,
                              searchTerm: searchKeyword || undefined,
                              location: locationFilter || undefined,
                            });
                          } else {
                            getTechnicians(0, 20, {
                              status: technicianStatusFilter || undefined,
                              searchTerm: searchKeyword || undefined,
                              location: locationFilter || undefined,
                            });
                          }
                        }}
                      >
                        <option value="">All Experience</option>
                        <option value="0-2">0-2 years</option>
                        <option value="3-5">3-5 years</option>
                        <option value="6-10">6-10 years</option>
                        <option value="10+">10+ years</option>
                      </select>
                    </div>
                    <div className="col-md-2">
                      <button
                        className="btn btn-outline-secondary btn-sm w-100"
                        onClick={() => {
                          setTechnicianStatusFilter("");
                          setExperienceFilter("");
                          getTechnicians();
                        }}
                      >
                        Clear Filters
                      </button>
                    </div>
                    <div className="col-md-3">
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-outline-info btn-sm"
                          onClick={() =>
                            getTechnicians(0, 20, {
                              status: technicianStatusFilter || undefined,
                              experience: experienceFilter || undefined,
                              searchTerm: searchKeyword || undefined,
                              location: locationFilter || undefined,
                            })
                          }
                          title="Apply current filters"
                        >
                          <FaFilter /> Apply Filters
                        </button>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-outline-success btn-sm"
                          onClick={() => {
                            const csvContent = [
                              "ID,Name,Email,Dealership,Location,Experience,Status,Last Activity",
                              ...technicians.map(
                                (tech) =>
                                  `${tech.id},"${tech.name}","${tech.email}","${
                                    tech.delearshipName || "N/A"
                                  }","${tech.location}","${
                                    tech.yearsOfExperience
                                  } years","${tech.status}","${
                                    tech.lastActivityAt
                                      ? new Date(
                                          tech.lastActivityAt
                                        ).toLocaleDateString()
                                      : "Never"
                                  }"`
                              ),
                            ].join("\n");

                            const blob = new Blob([csvContent], {
                              type: "text/csv",
                            });
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = `technicians_export_${
                              new Date().toISOString().split("T")[0]
                            }.csv`;
                            a.click();
                            window.URL.revokeObjectURL(url);

                            toast.success("Technicians exported successfully");
                          }}
                          title="Export technicians to CSV"
                        >
                          <FaDownload /> Export CSV
                        </button>
                      </div>
                    </div>
                  </div>

                  {loadingTechnicians ? (
                    <div className="text-center py-4">
                      <Spinner animation="border" />
                      <p className="mt-2">Loading technicians...</p>
                    </div>
                  ) : error ? (
                    <div className="text-center py-4">
                      <Alert variant="danger">
                        <FaExclamationTriangle className="me-2" />
                        Error loading technicians: {error}
                      </Alert>
                      <button
                        className="btn btn-outline-primary mt-2"
                        onClick={() => {
                          setError("");
                          getTechnicians();
                        }}
                      >
                        <HiOutlineRefresh /> Retry
                      </button>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Dealership</th>
                            <th>Location</th>
                            <th>Experience</th>
                            <th>Status</th>
                            <th>Last Activity</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {technicians.map((technician) => (
                            <tr key={technician.id}>
                              <td>{technician.id}</td>
                              <td>{technician.name}</td>
                              <td>{technician.email}</td>
                              <td>{technician.delearshipName || "N/A"}</td>
                              <td>{technician.location}</td>
                              <td>{technician.yearsOfExperience} years</td>
                              <td>
                                <Badge
                                  bg={
                                    technician.status === "ACTIVE"
                                      ? "success"
                                      : technician.status === "SUSPENDED"
                                      ? "warning"
                                      : technician.status === "DELETED"
                                      ? "danger"
                                      : "secondary"
                                  }
                                >
                                  {technician.status || "UNKNOWN"}
                                </Badge>
                              </td>
                              <td>
                                {technician.lastActivityAt
                                  ? new Date(
                                      technician.lastActivityAt
                                    ).toLocaleDateString()
                                  : "Never"}
                              </td>
                              <td>
                                <div className="btn-group btn-group-sm">
                                  <button
                                    className="btn btn-outline-info"
                                    onClick={() => {
                                      setSelectedTechnician(technician);
                                      setShowTechnicianModal(true);
                                    }}
                                    title="View technician details"
                                  >
                                    <FaEye />
                                  </button>
                                  <button
                                    className="btn btn-outline-warning"
                                    onClick={() => {
                                      setSelectedTechnician(technician);
                                      setShowTechnicianEditModal(true);
                                    }}
                                    title="Edit technician profile"
                                  >
                                    <FaEdit />
                                  </button>
                                  {technician.status === "ACTIVE" && (
                                    <button
                                      className="btn btn-outline-warning"
                                      onClick={() =>
                                        confirmAction(
                                          "technician_suspend",
                                          technician
                                        )
                                      }
                                      title="Suspend technician"
                                    >
                                      <FaBan />
                                    </button>
                                  )}
                                  {technician.status === "SUSPENDED" && (
                                    <button
                                      className="btn btn-outline-success"
                                      onClick={() =>
                                        confirmAction(
                                          "technician_activate",
                                          technician
                                        )
                                      }
                                      title="Activate technician"
                                    >
                                      <FaCheckCircle />
                                    </button>
                                  )}
                                  {technician.status === "DELETED" && (
                                    <button
                                      className="btn btn-outline-success"
                                      onClick={() =>
                                        confirmAction(
                                          "technician_restore",
                                          technician
                                        )
                                      }
                                      title="Restore technician"
                                    >
                                      <FaUndo />
                                    </button>
                                  )}
                                  {technician.status !== "DELETED" && (
                                    <button
                                      className="btn btn-outline-danger"
                                      onClick={() =>
                                        confirmAction(
                                          "technician_delete",
                                          technician
                                        )
                                      }
                                      title="Delete technician"
                                    >
                                      <HiOutlineTrash />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                          {technicians.length === 0 && (
                            <tr>
                              <td
                                colSpan="9"
                                className="text-center text-muted py-4"
                              >
                                {searchKeyword ||
                                locationFilter ||
                                experienceFilter ||
                                technicianStatusFilter ? (
                                  <div>
                                    <p>
                                      No technicians found matching the current
                                      filters.
                                    </p>
                                    <button
                                      className="btn btn-outline-primary btn-sm"
                                      onClick={() => {
                                        setSearchKeyword("");
                                        setLocationFilter("");
                                        setExperienceFilter("");
                                        setTechnicianStatusFilter("");
                                        getTechnicians();
                                      }}
                                    >
                                      Clear Filters
                                    </button>
                                  </div>
                                ) : (
                                  "No technicians found"
                                )}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Pagination and Summary */}
                  <div className="d-flex justify-content-between align-items-center mt-4">
                    <div className="text-muted">
                      Showing {technicians.length} of{" "}
                      {technicianPagination.totalElements || 0} technicians
                      {technicianPagination.totalPages > 1 && (
                        <span className="ms-2">
                          (Page {technicianPagination.currentPage + 1} of{" "}
                          {technicianPagination.totalPages})
                        </span>
                      )}
                    </div>

                    {technicianPagination.totalPages > 1 && (
                      <nav>
                        <ul className="pagination mb-0">
                          <li
                            className={`page-item ${
                              technicianPagination.currentPage === 0
                                ? "disabled"
                                : ""
                            }`}
                          >
                            <button
                              className="page-link"
                              onClick={() =>
                                getTechnicians(
                                  technicianPagination.currentPage - 1
                                )
                              }
                              disabled={technicianPagination.currentPage === 0}
                            >
                              Previous
                            </button>
                          </li>

                          {/* Page numbers */}
                          {Array.from(
                            {
                              length: Math.min(
                                5,
                                technicianPagination.totalPages
                              ),
                            },
                            (_, i) => (
                              <li
                                key={i}
                                className={`page-item ${
                                  technicianPagination.currentPage === i
                                    ? "active"
                                    : ""
                                }`}
                              >
                                <button
                                  className="page-link"
                                  onClick={() => getTechnicians(i)}
                                >
                                  {i + 1}
                                </button>
                              </li>
                            )
                          )}

                          <li
                            className={`page-item ${
                              technicianPagination.currentPage ===
                              technicianPagination.totalPages - 1
                                ? "disabled"
                                : ""
                            }`}
                          >
                            <button
                              className="page-link"
                              onClick={() =>
                                getTechnicians(
                                  technicianPagination.currentPage + 1
                                )
                              }
                              disabled={
                                technicianPagination.currentPage ===
                                technicianPagination.totalPages - 1
                              }
                            >
                              Next
                            </button>
                          </li>
                        </ul>
                      </nav>
                    )}
                  </div>
                </div>
              </div>

              {/* Dashboard Summary */}
              <div className="card mt-4">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Dashboard Summary</h5>
                  <button
                    className="btn btn-outline-primary btn-sm"
                    onClick={() => getTechnicianDashboardSummary()}
                    title="Refresh dashboard summary"
                  >
                    <HiOutlineRefresh />
                  </button>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <h6>Recent Activity</h6>
                      <div className="list-group">
                        {technicianStats.recentActivity &&
                          technicianStats.recentActivity
                            .slice(0, 5)
                            .map((activity, index) => (
                              <div
                                key={index}
                                className="list-group-item d-flex justify-content-between align-items-center"
                              >
                                <div>
                                  <strong>{activity.action}</strong>
                                  <br />
                                  <small className="text-muted">
                                    {activity.email} - {activity.fieldName}
                                  </small>
                                </div>
                                <small className="text-muted">
                                  {activity.timestamp
                                    ? new Date(
                                        activity.timestamp
                                      ).toLocaleDateString()
                                    : "N/A"}
                                </small>
                              </div>
                            ))}
                        {(!technicianStats.recentActivity ||
                          technicianStats.recentActivity.length === 0) && (
                          <div className="text-center text-muted py-3">
                            No recent activity found
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="col-md-6">
                      <h6>Quick Stats</h6>
                      <div className="row g-2">
                        <div className="col-6">
                          <div className="text-center p-3 border rounded bg-light">
                            <h4 className="text-primary mb-1">
                              {technicianStats.totalTechnicians || 0}
                            </h4>
                            <small>Total Technicians</small>
                          </div>
                        </div>
                        <div className="col-6">
                          <div className="text-center p-3 border rounded bg-light">
                            <h4 className="text-success mb-1">
                              {technicianStats.activeTechnicians || 0}
                            </h4>
                            <small>Active</small>
                          </div>
                        </div>
                        <div className="col-6">
                          <div className="text-center p-3 border rounded bg-light">
                            <h4 className="text-warning mb-1">
                              {technicianStats.suspendedTechnicians || 0}
                            </h4>
                            <small>Suspended</small>
                          </div>
                        </div>
                        <div className="col-6">
                          <div className="text-center p-3 border rounded bg-light">
                            <h4 className="text-danger mb-1">
                              {technicianStats.deletedTechnicians || 0}
                            </h4>
                            <small>Deleted</small>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="card mt-4">
                <div className="card-header">
                  <h5 className="mb-0">Top Performers</h5>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <h6>Top by Earnings</h6>
                      <div className="list-group">
                        {technicianPerformance
                          .slice(0, 5)
                          .map((tech, index) => (
                            <div
                              key={tech.technicianId}
                              className="list-group-item d-flex justify-content-between align-items-center"
                            >
                              <div>
                                <strong>{tech.technicianName}</strong>
                                <br />
                                <small className="text-muted">
                                  {tech.technicianEmail}
                                </small>
                              </div>
                              <Badge bg="success">
                                ${tech.totalEarnings || 0}
                              </Badge>
                            </div>
                          ))}
                      </div>
                    </div>
                    <div className="col-md-6">
                      <h6>Top by Acceptance Rate</h6>
                      <div className="list-group">
                        {technicianPerformance
                          .slice(0, 5)
                          .map((tech, index) => (
                            <div
                              key={tech.technicianId}
                              className="list-group-item d-flex justify-content-between align-items-center"
                            >
                              <div>
                                <strong>{tech.technicianName}</strong>
                                <br />
                                <small className="text-muted">
                                  {tech.technicianEmail}
                                </small>
                              </div>
                              <Badge bg="info">
                                {(tech.successRate * 100).toFixed(1)}%
                              </Badge>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Counter Offers Section */}
              <div className="card mt-4">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Counter Offers</h5>
                  <button
                    className="btn btn-outline-primary btn-sm"
                    onClick={() => getTechnicianCounterOffers()}
                    title="Refresh counter offers"
                  >
                    <HiOutlineRefresh />
                  </button>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table table-sm">
                      <thead>
                        <tr>
                          <th>Technician</th>
                          <th>Post ID</th>
                          <th>Amount</th>
                          <th>Status</th>
                          <th>Created</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {technicianCounterOffers.slice(0, 10).map((offer) => (
                          <tr key={offer.id}>
                            <td>
                              {offer.technicianName || offer.technicianEmail}
                            </td>
                            <td>{offer.postId}</td>
                            <td>${offer.amount || 0}</td>
                            <td>
                              <Badge
                                bg={
                                  offer.status === "PENDING"
                                    ? "warning"
                                    : offer.status === "ACCEPTED"
                                    ? "success"
                                    : "secondary"
                                }
                              >
                                {offer.status}
                              </Badge>
                            </td>
                            <td>
                              {offer.createdAt
                                ? new Date(offer.createdAt).toLocaleDateString()
                                : "N/A"}
                            </td>
                            <td>
                              <button
                                className="btn btn-outline-danger btn-sm"
                                onClick={() =>
                                  confirmAction("counter_offer_expire", offer)
                                }
                                title="Force expire counter offer"
                              >
                                <FaTimes />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {technicianCounterOffers.length === 0 && (
                          <tr>
                            <td
                              colSpan="6"
                              className="text-center text-muted py-3"
                            >
                              No counter offers found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Accepted Posts Section */}
              <div className="card mt-4">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Accepted Posts</h5>
                  <button
                    className="btn btn-outline-primary btn-sm"
                    onClick={() => getTechnicianAcceptedPosts()}
                    title="Refresh accepted posts"
                  >
                    <HiOutlineRefresh />
                  </button>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table table-sm">
                      <thead>
                        <tr>
                          <th>Technician</th>
                          <th>Post ID</th>
                          <th>Accepted Date</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {technicianAcceptedPosts.slice(0, 10).map((post) => (
                          <tr key={post.id}>
                            <td>
                              {post.technicianName || post.technicianEmail}
                            </td>
                            <td>{post.postId}</td>
                            <td>
                              {post.acceptedAt
                                ? new Date(post.acceptedAt).toLocaleDateString()
                                : "N/A"}
                            </td>
                            <td>
                              <Badge bg="success">Accepted</Badge>
                            </td>
                          </tr>
                        ))}
                        {technicianAcceptedPosts.length === 0 && (
                          <tr>
                            <td
                              colSpan="4"
                              className="text-center text-muted py-3"
                            >
                              No accepted posts found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Declined Posts Section */}
              <div className="card mt-4">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Declined Posts</h5>
                  <button
                    className="btn btn-outline-primary btn-sm"
                    onClick={() => getTechnicianDeclinedPosts()}
                    title="Refresh declined posts"
                  >
                    <HiOutlineRefresh />
                  </button>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table table-sm">
                      <thead>
                        <tr>
                          <th>Technician</th>
                          <th>Post ID</th>
                          <th>Declined Date</th>
                          <th>Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {technicianDeclinedPosts.slice(0, 10).map((post) => (
                          <tr key={post.id}>
                            <td>
                              {post.technicianName || post.technicianEmail}
                            </td>
                            <td>{post.postId}</td>
                            <td>
                              {post.createdAt
                                ? new Date(post.createdAt).toLocaleDateString()
                                : "N/A"}
                            </td>
                            <td>{post.reason || "No reason provided"}</td>
                          </tr>
                        ))}
                        {technicianDeclinedPosts.length === 0 && (
                          <tr>
                            <td
                              colSpan="4"
                              className="text-center text-muted py-3"
                            >
                              No declined posts found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Audit Logs Section */}
              <div className="card mt-4">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Audit Logs</h5>
                  <button
                    className="btn btn-outline-primary btn-sm"
                    onClick={() => getTechnicianAuditLogs()}
                    title="Refresh audit logs"
                  >
                    <HiOutlineRefresh />
                  </button>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table table-sm">
                      <thead>
                        <tr>
                          <th>Technician</th>
                          <th>Action</th>
                          <th>Field</th>
                          <th>Old Value</th>
                          <th>New Value</th>
                          <th>Updated By</th>
                          <th>Timestamp</th>
                        </tr>
                      </thead>
                      <tbody>
                        {technicianAuditLogs.slice(0, 10).map((log) => (
                          <tr key={log.id}>
                            <td>{log.email}</td>
                            <td>
                              <Badge bg="info">{log.action}</Badge>
                            </td>
                            <td>{log.fieldName}</td>
                            <td
                              className="text-truncate"
                              style={{ maxWidth: "150px" }}
                              title={log.oldValue}
                            >
                              {log.oldValue}
                            </td>
                            <td
                              className="text-truncate"
                              style={{ maxWidth: "150px" }}
                              title={log.newValue}
                            >
                              {log.newValue}
                            </td>
                            <td>{log.updatedBy}</td>
                            <td>
                              {log.timestamp
                                ? new Date(log.timestamp).toLocaleString()
                                : "N/A"}
                            </td>
                          </tr>
                        ))}
                        {technicianAuditLogs.length === 0 && (
                          <tr>
                            <td
                              colSpan="7"
                              className="text-center text-muted py-3"
                            >
                              No audit logs found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Posts Tab */}
          {activeTab === "posts" && (
            <div className="posts-tab">
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0">
                    Post Management ({posts.length} total posts)
                  </h5>
                </div>
                <div className="card-body">
                  {loadingPosts ? (
                    <div className="text-center py-4">
                      <Spinner animation="border" />
                      <p className="mt-2">Loading posts...</p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr>
                            <th>Post ID</th>
                            <th>Content</th>
                            <th>Dealer</th>
                            <th>Status</th>
                            <th>Created Date</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {posts.map((post) => (
                            <tr key={post.id}>
                              <td>{post.id}</td>
                              <td>
                                <div
                                  className="post-content"
                                  title={post.content}
                                >
                                  {post.content?.substring(0, 100)}
                                  {post.content?.length > 100 && "..."}
                                </div>
                              </td>
                              <td>{post.email || "Unknown"}</td>
                              <td>{getStatusBadge(post.status)}</td>
                              <td>
                                {post.createdAt
                                  ? new Date(
                                      post.createdAt
                                    ).toLocaleDateString()
                                  : "N/A"}
                              </td>
                              <td>
                                <div className="btn-group btn-group-sm">
                                  <button
                                    className="btn btn-outline-info"
                                    onClick={() => {
                                      setSelectedPost(post);
                                      setShowPostModal(true);
                                    }}
                                    title="View post details"
                                  >
                                    <FaEye />
                                  </button>
                                  <button
                                    className="btn btn-outline-danger"
                                    onClick={() =>
                                      confirmAction("post_delete", post)
                                    }
                                    title="Delete post"
                                  >
                                    <FaTrash />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {posts.length === 0 && (
                            <tr>
                              <td
                                colSpan="6"
                                className="text-center text-muted py-4"
                              >
                                No posts found
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Counter Offers Tab */}
          {activeTab === "counterOffers" && (
            <div className="counter-offers-tab">
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0">
                    Counter Offer Management ({counterOffers.length} total
                    offers)
                  </h5>
                </div>
                <div className="card-body">
                  {loadingCounterOffers ? (
                    <div className="text-center py-4">
                      <Spinner animation="border" />
                      <p className="mt-2">Loading counter offers...</p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Post ID</th>
                            <th>Technician</th>
                            <th>Status</th>
                            <th>Requested At</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {counterOffers.map((offer) => (
                            <tr key={offer.id}>
                              <td>{offer.id}</td>
                              <td>{offer.postId}</td>
                              <td>{offer.technicianEmail}</td>
                              <td>{getStatusBadge(offer.status)}</td>
                              <td>
                                {offer.requestedAt
                                  ? new Date(
                                      offer.requestedAt
                                    ).toLocaleDateString()
                                  : "N/A"}
                              </td>
                              <td>
                                <div className="btn-group btn-group-sm">
                                  <button
                                    className="btn btn-outline-info"
                                    onClick={() => {
                                      setSelectedCounterOffer(offer);
                                      setShowCounterOfferModal(true);
                                    }}
                                    title="View counter offer details"
                                  >
                                    <FaEye />
                                  </button>
                                  {offer.status === "PENDING" && (
                                    <button
                                      className="btn btn-outline-warning"
                                      onClick={() =>
                                        confirmCounterOfferCancel(offer.id)
                                      }
                                      title="Cancel counter offer"
                                    >
                                      <FaTimes />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                          {counterOffers.length === 0 && (
                            <tr>
                              <td
                                colSpan="6"
                                className="text-center text-muted py-4"
                              >
                                No counter offers found
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === "analytics" && (
            <div className="analytics-tab">
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0">Posting Analytics & Reports</h5>
                </div>
                <div className="card-body">
                  <div className="row g-4">
                    <div className="col-md-6">
                      <div className="card">
                        <div className="card-header">
                          <h6 className="mb-0">Quick Statistics</h6>
                        </div>
                        <div className="card-body">
                          <button
                            className="btn btn-primary w-100 mb-3"
                            onClick={async () => {
                              const stats = await getPostingStatistics();
                              if (stats) {
                                toast.success("Statistics loaded successfully");
                              }
                            }}
                          >
                            <FaChartBar /> Load Posting Statistics
                          </button>
                          <button
                            className="btn btn-success w-100 mb-3"
                            onClick={async () => {
                              await exportPostsData("csv");
                            }}
                          >
                            <FaDownload /> Export Posts Data
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="card">
                        <div className="card-header">
                          <h6 className="mb-0">Date Range Queries</h6>
                        </div>
                        <div className="card-body">
                          <div className="mb-3">
                            <label className="form-label">From Date</label>
                            <DatePicker
                              selected={dateFrom}
                              onChange={(date) => setDateFrom(date)}
                              className="form-control"
                              placeholderText="Select start date"
                            />
                          </div>
                          <div className="mb-3">
                            <label className="form-label">To Date</label>
                            <DatePicker
                              selected={dateTo}
                              onChange={(date) => setDateTo(date)}
                              className="form-control"
                              placeholderText="Select end date"
                            />
                          </div>
                          <button
                            className="btn btn-info w-100"
                            onClick={async () => {
                              if (dateFrom && dateTo) {
                                const posts = await getPostsByDateRange(
                                  dateFrom.toISOString().split("T")[0],
                                  dateTo.toISOString().split("T")[0]
                                );
                                if (posts) {
                                  toast.success("Date range query completed");
                                }
                              } else {
                                toast.error(
                                  "Please select both start and end dates"
                                );
                              }
                            }}
                          >
                            <FaSearch /> Query Posts by Date Range
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Audit Tab */}
          {activeTab === "audit" && (
            <div className="audit-tab">
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0">Recent Audit Entries</h5>
                </div>
                <div className="card-body">
                  <p>Audit trail data is not currently available.</p>
                </div>
              </div>
            </div>
          )}

          {/* Tech Dashboard Admin Tab */}
          {activeTab === "techDashboard" && (
            <div className="tech-dashboard-admin-tab">
              <TechDashboardAdmin />
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === "settings" && (
            <div className="settings-tab">
              <div className="row g-4">
                <div className="col-md-6">
                  <div className="card">
                    <div className="card-header">
                      <h5 className="mb-0">System Settings</h5>
                    </div>
                    <div className="card-body">
                      <div className="mb-3">
                        <label className="form-label">
                          Session Timeout (minutes)
                        </label>
                        <input
                          type="number"
                          className="form-control"
                          defaultValue={30}
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Max Login Attempts</label>
                        <input
                          type="number"
                          className="form-control"
                          defaultValue={5}
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">
                          Audit Log Retention (days)
                        </label>
                        <input
                          type="number"
                          className="form-control"
                          defaultValue={90}
                        />
                      </div>
                      <button className="btn btn-primary">Save Settings</button>
                    </div>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="card">
                    <div className="card-header">
                      <h5 className="mb-0">System Health</h5>
                    </div>
                    <div className="card-body">
                      <div className="health-item">
                        <div className="health-label">Database</div>
                        <div className="health-status">
                          <Badge bg="success">Healthy</Badge>
                        </div>
                      </div>
                      <div className="health-item">
                        <div className="health-label">Redis Cache</div>
                        <div className="health-status">
                          <Badge bg="success">Connected</Badge>
                        </div>
                      </div>
                      <div className="health-item">
                        <div className="health-label">Email Service</div>
                        <div className="health-status">
                          <Badge bg="warning">Warning</Badge>
                        </div>
                      </div>
                      <div className="health-item">
                        <div className="health-label">File Storage</div>
                        <div className="health-status">
                          <Badge bg="success">Available</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dealer Details Modal */}
      <Modal
        show={showDealerModal}
        onHide={() => setShowDealerModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Dealer Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedDealer && (
            <div className="dealer-details">
              <Row>
                <Col md={6}>
                  <h6>Basic Information</h6>
                  <p>
                    <strong>Name:</strong> {selectedDealer.name}
                  </p>
                  <p>
                    <strong>Email:</strong> {selectedDealer.email}
                  </p>
                  <p>
                    <strong>Phone:</strong> {selectedDealer.phone}
                  </p>
                  <p>
                    <strong>Status:</strong>{" "}
                    {getStatusBadge(selectedDealer.status)}
                  </p>
                </Col>
                <Col md={6}>
                  <h6>Location Information</h6>
                  <p>
                    <strong>Location:</strong> {selectedDealer.location}
                  </p>
                  <p>
                    <strong>Zipcode:</strong> {selectedDealer.zipcode}
                  </p>
                  <p>
                    <strong>Registered:</strong>{" "}
                    {selectedDealer.registeredAt
                      ? new Date(selectedDealer.registeredAt).toLocaleString()
                      : "N/A"}
                  </p>
                  <p>
                    <strong>Last Updated:</strong>{" "}
                    {selectedDealer.lastUpdatedAt
                      ? new Date(selectedDealer.lastUpdatedAt).toLocaleString()
                      : "N/A"}
                  </p>
                </Col>
              </Row>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDealerModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Post Details Modal */}
      <Modal
        show={showPostModal}
        onHide={() => setShowPostModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Post Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedPost && (
            <div className="post-details">
              <div className="row">
                <div className="col-md-8">
                  <h6>Post Information</h6>
                  <p>
                    <strong>ID:</strong> {selectedPost.id}
                  </p>
                  <p>
                    <strong>Content:</strong> {selectedPost.content}
                  </p>
                  <p>
                    <strong>Location:</strong> {selectedPost.location}
                  </p>
                  <p>
                    <strong>Offer Amount:</strong> ${selectedPost.offerAmount}
                  </p>
                  <p>
                    <strong>Status:</strong> {selectedPost.status}
                  </p>
                </div>
                <div className="col-md-4">
                  <h6>Dealer Information</h6>
                  <p>
                    <strong>Name:</strong> {selectedPost.dealerName}
                  </p>
                  <p>
                    <strong>Email:</strong> {selectedPost.email}
                  </p>
                  <p>
                    <strong>Created:</strong>{" "}
                    {new Date(selectedPost.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPostModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Counter Offer Details Modal */}
      <Modal
        show={showCounterOfferModal}
        onHide={() => setShowCounterOfferModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Counter Offer Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedCounterOffer && (
            <div className="counter-offer-details">
              <div className="row">
                <div className="col-md-6">
                  <h6>Counter Offer Information</h6>
                  <p>
                    <strong>ID:</strong> {selectedCounterOffer.id}
                  </p>
                  <p>
                    <strong>Post ID:</strong> {selectedCounterOffer.postId}
                  </p>
                  <p>
                    <strong>Status:</strong> {selectedCounterOffer.status}
                  </p>
                  <p>
                    <strong>Requested At:</strong>{" "}
                    {selectedCounterOffer.requestedAt
                      ? new Date(
                          selectedCounterOffer.requestedAt
                        ).toLocaleString()
                      : "N/A"}
                  </p>
                </div>
                <div className="col-md-6">
                  <h6>Technician Information</h6>
                  <p>
                    <strong>Email:</strong>{" "}
                    {selectedCounterOffer.technicianEmail}
                  </p>
                  <p>
                    <strong>Amount:</strong> ${selectedCounterOffer.amount}
                  </p>
                  <p>
                    <strong>Notes:</strong>{" "}
                    {selectedCounterOffer.notes || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowCounterOfferModal(false)}
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Bulk Action Modal */}
      <Modal
        show={showBulkActionModal}
        onHide={() => setShowBulkActionModal(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {bulkAction && bulkAction.includes("technician")
              ? "Bulk Technician Operations"
              : "Bulk Dealer Operations"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>
                <strong>Select Action</strong>
                <small className="text-muted ms-2">
                  Choose what to do with selected{" "}
                  {bulkAction && bulkAction.includes("technician")
                    ? "technicians"
                    : "dealers"}
                </small>
              </Form.Label>
              <Select
                value={{ value: bulkAction, label: bulkAction }}
                onChange={(option) => setBulkAction(option.value)}
                options={
                  bulkAction && bulkAction.includes("technician")
                    ? [
                        {
                          value: "technician_bulk_activate",
                          label:
                            "Activate Technicians - Enable suspended accounts",
                        },
                        {
                          value: "technician_bulk_suspend",
                          label:
                            "Suspend Technicians - Temporarily disable accounts",
                        },
                        {
                          value: "technician_bulk_delete",
                          label:
                            "Delete Technicians - Permanently remove accounts",
                        },
                      ]
                    : [
                        {
                          value: "ACTIVATE",
                          label: "Activate Dealers - Enable suspended accounts",
                        },
                        {
                          value: "SUSPEND",
                          label:
                            "Suspend Dealers - Temporarily disable accounts",
                        },
                        {
                          value: "DELETE",
                          label: "Delete Dealers - Permanently remove accounts",
                        },
                      ]
                }
                placeholder="Choose an action..."
                title={`Select the bulk action to perform on selected ${
                  bulkAction && bulkAction.includes("technician")
                    ? "technicians"
                    : "dealers"
                }`}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>
                <strong>Reason for Action</strong>
                <small className="text-muted ms-2">
                  (Optional but recommended for audit trail)
                </small>
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={bulkReason}
                onChange={(e) => setBulkReason(e.target.value)}
                placeholder="Enter reason for this bulk action (e.g., 'Account verification completed', 'Policy violation', 'System cleanup')"
                title="Document the reason for this bulk action for compliance and audit purposes"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>
                <strong>
                  Selected{" "}
                  {bulkAction && bulkAction.includes("technician")
                    ? "Technicians"
                    : "Dealers"}
                </strong>
                <small className="text-muted ms-2">
                  (
                  {bulkAction && bulkAction.includes("technician")
                    ? technicians.length
                    : selectedDealers.length}{" "}
                  {bulkAction && bulkAction.includes("technician")
                    ? "technician(s)"
                    : "dealer(s)"}{" "}
                  will be affected)
                </small>
              </Form.Label>
              <div className="selected-dealers-list">
                {bulkAction && bulkAction.includes("technician")
                  ? technicians.map((technician) => (
                      <div key={technician.id} className="selected-dealer-item">
                        <small
                          title={`${technician.name} - ${technician.email} - ${technician.status}`}
                        >
                          {technician.name} ({technician.email})
                        </small>
                      </div>
                    ))
                  : selectedDealers.map((dealer) => (
                      <div
                        key={dealer.dealerId}
                        className="selected-dealer-item"
                      >
                        <small
                          title={`${dealer.name} - ${dealer.email} - ${dealer.status}`}
                        >
                          {dealer.name} ({dealer.email})
                        </small>
                      </div>
                    ))}
                {(bulkAction && bulkAction.includes("technician")
                  ? technicians.length
                  : selectedDealers.length) === 0 && (
                  <p className="text-muted text-center mt-2">
                    No{" "}
                    {bulkAction && bulkAction.includes("technician")
                      ? "technicians"
                      : "dealers"}{" "}
                    selected
                  </p>
                )}
              </div>
            </Form.Group>

            {/* Warning for destructive actions */}
            {(bulkAction === "DELETE" ||
              bulkAction === "technician_bulk_delete") && (
              <Alert variant="danger">
                <strong>⚠️ Warning:</strong> This action will permanently delete{" "}
                {bulkAction && bulkAction.includes("technician")
                  ? technicians.length
                  : selectedDealers.length}{" "}
                {bulkAction && bulkAction.includes("technician")
                  ? "technician"
                  : "dealer"}{" "}
                account(s). This action cannot be undone and all associated data
                will be lost.
              </Alert>
            )}

            {(bulkAction === "SUSPEND" ||
              bulkAction === "technician_bulk_suspend") && (
              <Alert variant="warning">
                <strong>⚠️ Note:</strong> This action will suspend{" "}
                {bulkAction && bulkAction.includes("technician")
                  ? technicians.length
                  : selectedDealers.length}{" "}
                {bulkAction && bulkAction.includes("technician")
                  ? "technician"
                  : "dealer"}{" "}
                account(s). They will not be able to login or perform actions
                until reactivated.
              </Alert>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowBulkActionModal(false)}
          >
            Cancel
          </Button>
          <Button
            variant={bulkAction === "DELETE" ? "danger" : "primary"}
            onClick={handleBulkAction}
            disabled={!bulkAction || selectedDealers.length === 0}
            title={
              !bulkAction
                ? "Please select an action"
                : selectedDealers.length === 0
                ? "Please select dealers"
                : `Execute ${bulkAction.toLowerCase()} on ${
                    selectedDealers.length
                  } dealer(s)`
            }
          >
            {bulkAction === "DELETE" ? "Delete Dealers" : "Execute Action"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Post Bulk Action Modal */}
      <Modal
        show={showPostBulkActionModal}
        onHide={() => setShowPostBulkActionModal(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title>Bulk Post Operations</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>
                <strong>Select Action</strong>
                <small className="text-muted ms-2">
                  Choose what to do with selected posts
                </small>
              </Form.Label>
              <Select
                value={{ value: bulkAction, label: bulkAction }}
                onChange={(option) => setBulkAction(option.value)}
                options={[
                  {
                    value: "delete",
                    label: "Delete Posts - Permanently remove posts",
                  },
                  {
                    value: "status",
                    label: "Update Status - Change status of multiple posts",
                  },
                ]}
                placeholder="Choose an action..."
                title="Select the bulk action to perform on selected posts"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>
                <strong>Reason for Action</strong>
                <small className="text-muted ms-2">
                  (Optional but recommended for audit trail)
                </small>
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={bulkReason}
                onChange={(e) => setBulkReason(e.target.value)}
                placeholder="Enter reason for this bulk action"
                title="Document the reason for this bulk action for compliance and audit purposes"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>
                <strong>Selected Posts</strong>
                <small className="text-muted ms-2">
                  ({selectedPosts.length} post(s) will be affected)
                </small>
              </Form.Label>
              <div className="selected-posts-list">
                {selectedPosts.map((post) => (
                  <div key={post.id} className="selected-post-item">
                    <small
                      title={`Post #${post.id} - ${post.content?.substring(
                        0,
                        50
                      )}...`}
                    >
                      Post #{post.id} - {post.content?.substring(0, 50)}...
                    </small>
                  </div>
                ))}
              </div>
              {selectedPosts.length === 0 && (
                <p className="text-muted text-center mt-2">No posts selected</p>
              )}
            </Form.Group>

            {/* Warning for destructive actions */}
            {bulkAction === "delete" && (
              <Alert variant="danger">
                <strong>⚠️ Warning:</strong> This action will permanently delete{" "}
                {selectedPosts.length} post(s). This action cannot be undone.
              </Alert>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowPostBulkActionModal(false)}
          >
            Cancel
          </Button>
          <Button
            variant={bulkAction === "delete" ? "danger" : "primary"}
            onClick={handleBulkPostAction}
            disabled={!bulkAction || selectedPosts.length === 0}
            title={
              !bulkAction
                ? "Please select an action"
                : selectedPosts.length === 0
                ? "Please select posts"
                : `Execute ${bulkAction.toLowerCase()} on ${
                    selectedPosts.length
                  } post(s)`
            }
          >
            {bulkAction === "delete" ? "Delete Posts" : "Execute Action"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Confirmation Modal */}
      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {confirmActionData.type === "dealer_delete" &&
              "Confirm Dealer Deletion"}
            {confirmActionData.type === "dealer_suspend" &&
              "Confirm Dealer Suspension"}
            {confirmActionData.type === "dealer_activate" &&
              "Confirm Dealer Activation"}
            {confirmActionData.type === "post_delete" &&
              "Confirm Post Deletion"}
            {confirmActionData.type === "post_restore" &&
              "Confirm Post Restoration"}
            {confirmActionData.type === "post_status_update" &&
              "Confirm Post Status Update"}
            {confirmActionData.type === "counter_offer_cancel" &&
              "Confirm Counter Offer Cancellation"}
            {confirmActionData.type === "technician_delete" &&
              "Confirm Technician Deletion"}
            {!confirmActionData.type && "Confirm Action"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {confirmActionData.type === "dealer_delete" && (
            <div>
              <Alert variant="danger">
                <strong>⚠️ Critical Action:</strong> You are about to
                permanently delete a dealer account.
              </Alert>
              <p>
                <strong>Dealer:</strong> {confirmActionData.data?.name} (
                {confirmActionData.data?.email})
              </p>
              <p>
                <strong>Action:</strong> Permanent deletion
              </p>
              <p>
                <strong>Impact:</strong> This action cannot be undone. All
                dealer data, posts, and history will be permanently lost.
              </p>
              <p className="text-danger">
                <strong>Are you absolutely sure you want to proceed?</strong>
              </p>
            </div>
          )}

          {confirmActionData.type === "dealer_suspend" && (
            <div>
              <Alert variant="warning">
                <strong>⚠️ Account Suspension:</strong> You are about to suspend
                a dealer account.
              </Alert>
              <p>
                <strong>Dealer:</strong> {confirmActionData.data?.name} (
                {confirmActionData.data?.email})
              </p>
              <p>
                <strong>Action:</strong> Account suspension
              </p>
              <p>
                <strong>Impact:</strong> The dealer will not be able to login or
                perform actions until reactivated.
              </p>
              <p>
                <strong>Are you sure you want to suspend this dealer?</strong>
              </p>
            </div>
          )}

          {confirmActionData.type === "dealer_activate" && (
            <div>
              <Alert variant="info">
                <strong>ℹ️ Account Activation:</strong> You are about to
                reactivate a suspended dealer account.
              </Alert>
              <p>
                <strong>Dealer:</strong> {confirmActionData.data?.name} (
                {confirmActionData.data?.email})
              </p>
              <p>
                <strong>Action:</strong> Account reactivation
              </p>
              <p>
                <strong>Impact:</strong> The dealer will regain full access to
                all features.
              </p>
              <p>
                <strong>Are you sure you want to activate this dealer?</strong>
              </p>
            </div>
          )}

          {confirmActionData.type === "post_delete" && (
            <div>
              <Alert variant="danger">
                <strong>⚠️ Post Deletion:</strong> You are about to permanently
                delete a post.
              </Alert>
              <p>
                <strong>Post ID:</strong> #{confirmActionData.data?.id}
              </p>
              <p>
                <strong>Action:</strong> Permanent deletion
              </p>
              <p>
                <strong>Impact:</strong> This action cannot be undone. The post
                will be permanently removed from the system.
              </p>
              <p>
                <strong>Are you sure you want to delete this post?</strong>
              </p>
            </div>
          )}

          {confirmActionData.type === "post_restore" && (
            <div>
              <Alert variant="info">
                <strong>ℹ️ Post Restoration:</strong> You are about to restore a
                deleted post.
              </Alert>
              <p>
                <strong>Post ID:</strong> #{confirmActionData.data?.id}
              </p>
              <p>
                <strong>Action:</strong> Post restoration
              </p>
              <p>
                <strong>Impact:</strong> The post will be restored to PENDING
                status and become visible again.
              </p>
              <p>
                <strong>Are you sure you want to restore this post?</strong>
              </p>
            </div>
          )}

          {confirmActionData.type === "post_status_update" && (
            <div>
              <Alert variant="info">
                <strong>ℹ️ Post Status Update:</strong> You are about to update
                the status of a post.
              </Alert>
              <p>
                <strong>Post ID:</strong> #{confirmActionData.data?.id}
              </p>
              <p>
                <strong>Current Status:</strong>{" "}
                {confirmActionData.data?.currentStatus}
              </p>
              <p>
                <strong>Action:</strong> Status update
              </p>
              <p>
                <strong>Note:</strong> This action will change the post's
                visibility and behavior in the system.
              </p>
              <p>
                <strong>
                  Are you sure you want to update this post's status?
                </strong>
              </p>
            </div>
          )}

          {confirmActionData.type === "counter_offer_cancel" && (
            <div>
              <Alert variant="warning">
                <strong>⚠️ Counter Offer Cancellation:</strong> You are about to
                cancel a counter offer.
              </Alert>
              <p>
                <strong>Counter Offer ID:</strong> #{confirmActionData.data?.id}
              </p>
              <p>
                <strong>Action:</strong> Counter offer cancellation
              </p>
              <p>
                <strong>Impact:</strong> The counter offer will be marked as
                cancelled and the technician will be notified.
              </p>
              <p>
                <strong>
                  Are you sure you want to cancel this counter offer?
                </strong>
              </p>
            </div>
          )}

          {confirmActionData.type === "technician_delete" && (
            <div>
              <Alert variant="danger">
                <strong>⚠️ Critical Action:</strong> You are about to
                permanently delete a technician account.
              </Alert>
              <p>
                <strong>Technician:</strong> {confirmActionData.data?.name} (
                {confirmActionData.data?.email})
              </p>
              <p>
                <strong>Action:</strong> Permanent deletion
              </p>
              <p>
                <strong>Impact:</strong> This action cannot be undone. All
                technician data, performance metrics, and history will be
                permanently lost.
              </p>
              <p className="text-danger">
                <strong>Are you absolutely sure you want to proceed?</strong>
              </p>
            </div>
          )}

          {confirmActionData.type === "technician_suspend" && (
            <div>
              <Alert variant="warning">
                <strong>⚠️ Account Suspension:</strong> You are about to suspend
                a technician account.
              </Alert>
              <p>
                <strong>Technician:</strong> {confirmActionData.data?.name} (
                {confirmActionData.data?.email})
              </p>
              <p>
                <strong>Action:</strong> Account suspension
              </p>
              <p>
                <strong>Impact:</strong> The technician will not be able to
                login or perform actions until reactivated.
              </p>
              <p>
                <strong>
                  Are you sure you want to suspend this technician?
                </strong>
              </p>
            </div>
          )}

          {confirmActionData.type === "technician_activate" && (
            <div>
              <Alert variant="info">
                <strong>ℹ️ Account Activation:</strong> You are about to
                reactivate a suspended technician account.
              </Alert>
              <p>
                <strong>Technician:</strong> {confirmActionData.data?.name} (
                {confirmActionData.data?.email})
              </p>
              <p>
                <strong>Action:</strong> Account reactivation
              </p>
              <p>
                <strong>Impact:</strong> The technician will regain full access
                to all features.
              </p>
              <p>
                <strong>
                  Are you sure you want to activate this technician?
                </strong>
              </p>
            </div>
          )}

          {confirmActionData.type === "technician_restore" && (
            <div>
              <Alert variant="info">
                <strong>ℹ️ Account Restoration:</strong> You are about to
                restore a deleted technician account.
              </Alert>
              <p>
                <strong>Technician:</strong> {confirmActionData.data?.name} (
                {confirmActionData.data?.email})
              </p>
              <p>
                <strong>Action:</strong> Account restoration
              </p>
              <p>
                <strong>Impact:</strong> The technician account will be restored
                to ACTIVE status and regain full access.
              </p>
              <p>
                <strong>
                  Are you sure you want to restore this technician?
                </strong>
              </p>
            </div>
          )}

          {confirmActionData.type === "counter_offer_expire" && (
            <div>
              <Alert variant="warning">
                <strong>⚠️ Counter Offer Expiration:</strong> You are about to
                force expire a counter offer.
              </Alert>
              <p>
                <strong>Post ID:</strong> #{confirmActionData.data?.postId}
              </p>
              <p>
                <strong>Technician:</strong>{" "}
                {confirmActionData.data?.technicianName ||
                  confirmActionData.data?.technicianEmail}
              </p>
              <p>
                <strong>Action:</strong> Force expire counter offer
              </p>
              <p>
                <strong>Impact:</strong> This action cannot be undone and will
                immediately expire the counter offer.
              </p>
              <p>
                <strong>
                  Are you sure you want to expire this counter offer?
                </strong>
              </p>
            </div>
          )}

          {!confirmActionData.type && (
            <p>
              Are you sure you want to perform this action? This cannot be
              undone.
            </p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowConfirmModal(false)}
          >
            Cancel
          </Button>
          <Button
            variant={
              confirmActionData.type === "dealer_delete" ||
              confirmActionData.type === "post_delete" ||
              confirmActionData.type === "technician_delete" ||
              confirmActionData.type === "technician_bulk_delete"
                ? "danger"
                : confirmActionData.type === "dealer_suspend" ||
                  confirmActionData.type === "counter_offer_cancel" ||
                  confirmActionData.type === "technician_suspend" ||
                  confirmActionData.type === "counter_offer_expire" ||
                  confirmActionData.type === "technician_bulk_suspend"
                ? "warning"
                : "success"
            }
            onClick={executeConfirmedAction}
            title={
              confirmActionData.type === "dealer_delete"
                ? "Permanently delete this dealer"
                : confirmActionData.type === "dealer_suspend"
                ? "Suspend this dealer's account"
                : confirmActionData.type === "dealer_activate"
                ? "Reactivate this dealer's account"
                : confirmActionData.type === "post_delete"
                ? "Permanently delete this post"
                : confirmActionData.type === "post_restore"
                ? "Restore this post"
                : confirmActionData.type === "post_status_update"
                ? "Update this post's status"
                : confirmActionData.type === "counter_offer_cancel"
                ? "Cancel this counter offer"
                : confirmActionData.type === "technician_delete"
                ? "Permanently delete this technician"
                : confirmActionData.type === "technician_suspend"
                ? "Suspend this technician's account"
                : confirmActionData.type === "technician_activate"
                ? "Reactivate this technician's account"
                : confirmActionData.type === "technician_restore"
                ? "Restore this technician's account"
                : confirmActionData.type === "counter_offer_expire"
                ? "Force expire this counter offer"
                : confirmActionData.type === "technician_bulk_suspend"
                ? "Suspend all selected technicians"
                : confirmActionData.type === "technician_bulk_activate"
                ? "Activate all selected technicians"
                : confirmActionData.type === "technician_bulk_delete"
                ? "Delete all selected technicians"
                : "Execute the confirmed action"
            }
          >
            {confirmActionData.type === "dealer_delete" && "Delete Dealer"}
            {confirmActionData.type === "dealer_suspend" && "Suspend Dealer"}
            {confirmActionData.type === "dealer_activate" && "Activate Dealer"}
            {confirmActionData.type === "post_delete" && "Delete Post"}
            {confirmActionData.type === "post_restore" && "Restore Post"}
            {confirmActionData.type === "post_status_update" && "Update Status"}
            {confirmActionData.type === "counter_offer_cancel" &&
              "Cancel Counter Offer"}
            {confirmActionData.type === "technician_delete" &&
              "Delete Technician"}
            {confirmActionData.type === "technician_suspend" &&
              "Suspend Technician"}
            {confirmActionData.type === "technician_activate" &&
              "Activate Technician"}
            {confirmActionData.type === "technician_restore" &&
              "Restore Technician"}
            {confirmActionData.type === "counter_offer_expire" &&
              "Expire Counter Offer"}
            {confirmActionData.type === "technician_bulk_suspend" &&
              "Suspend All Technicians"}
            {confirmActionData.type === "technician_bulk_activate" &&
              "Activate All Technicians"}
            {confirmActionData.type === "technician_bulk_delete" &&
              "Delete All Technicians"}
            {!confirmActionData.type && "Confirm"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Technician Details Modal */}
      <Modal
        show={showTechnicianModal}
        onHide={() => setShowTechnicianModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Technician Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedTechnician && (
            <div className="row g-3">
              <div className="col-md-6">
                <h6>Personal Information</h6>
                <p>
                  <strong>Name:</strong> {selectedTechnician.name}
                </p>
                <p>
                  <strong>Email:</strong> {selectedTechnician.email}
                </p>
                <p>
                  <strong>Phone:</strong> {selectedTechnician.phone || "N/A"}
                </p>
                <p>
                  <strong>Dealership:</strong>{" "}
                  {selectedTechnician.delearshipName || "N/A"}
                </p>
              </div>
              <div className="col-md-6">
                <h6>Professional Details</h6>
                <p>
                  <strong>Location:</strong> {selectedTechnician.location}
                </p>
                <p>
                  <strong>Zipcode:</strong> {selectedTechnician.zipcode}
                </p>
                <p>
                  <strong>Experience:</strong>{" "}
                  {selectedTechnician.yearsOfExperience} years
                </p>
                <p>
                  <strong>Last Activity:</strong>{" "}
                  {selectedTechnician.lastActivityAt
                    ? new Date(
                        selectedTechnician.lastActivityAt
                      ).toLocaleString()
                    : "Never"}
                </p>
              </div>
              <div className="col-12">
                <h6>Performance Metrics</h6>
                <div className="row g-2">
                  <div className="col-md-3">
                    <div className="text-center p-2 border rounded">
                      <h5 className="text-success mb-0">$0</h5>
                      <small>Total Earnings</small>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="text-center p-2 border rounded">
                      <h5 className="text-info mb-0">0%</h5>
                      <small>Success Rate</small>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="text-center p-2 border rounded">
                      <h5 className="text-warning mb-0">0</h5>
                      <small>Posts Accepted</small>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="text-center p-2 border rounded">
                      <h5 className="text-danger mb-0">0</h5>
                      <small>Posts Declined</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowTechnicianModal(false)}
          >
            Close
          </Button>
          <Button
            variant="warning"
            onClick={() => {
              setShowTechnicianModal(false);
              setShowTechnicianEditModal(true);
            }}
          >
            Edit Profile
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Technician Edit Modal */}
      <Modal
        show={showTechnicianEditModal}
        onHide={() => setShowTechnicianEditModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Edit Technician Profile</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedTechnician && (
            <Form>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Name</Form.Label>
                    <Form.Control
                      type="text"
                      defaultValue={selectedTechnician.name}
                      id="editTechnicianName"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      defaultValue={selectedTechnician.email}
                      id="editTechnicianEmail"
                      disabled
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Dealership</Form.Label>
                    <Form.Control
                      type="text"
                      defaultValue={selectedTechnician.delearshipName || ""}
                      id="editTechnicianDealership"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Location</Form.Label>
                    <Form.Control
                      type="text"
                      defaultValue={selectedTechnician.location}
                      id="editTechnicianLocation"
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Zipcode</Form.Label>
                    <Form.Control
                      type="text"
                      defaultValue={selectedTechnician.zipcode}
                      id="editTechnicianZipcode"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Years of Experience</Form.Label>
                    <Form.Control
                      type="text"
                      defaultValue={selectedTechnician.yearsOfExperience}
                      id="editTechnicianExperience"
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowTechnicianEditModal(false)}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              if (selectedTechnician) {
                const updateData = {
                  name: document.getElementById("editTechnicianName").value,
                  location: document.getElementById("editTechnicianLocation")
                    .value,
                  zipcode: document.getElementById("editTechnicianZipcode")
                    .value,
                  yearsOfExperience: document.getElementById(
                    "editTechnicianExperience"
                  ).value,
                };
                updateTechnicianProfile(selectedTechnician.id, updateData);
                setShowTechnicianEditModal(false);
                getTechnicians(); // Refresh the list
              }
            }}
          >
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default AdminDashboard;
