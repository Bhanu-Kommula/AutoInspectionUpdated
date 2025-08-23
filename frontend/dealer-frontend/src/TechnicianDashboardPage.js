import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { Spinner, Modal, Button, Badge, Card, Row, Col } from "react-bootstrap";
import TechnicianHeader from "./components/TechnicianHeader";
import ChatButton from "./components/chat/ChatButton";
import InspectionInterface from "./components/InspectionInterface";
import InspectionReportViewer from "./components/InspectionReportViewer";
import { toast } from "react-toastify";
import {
  FaMapMarkerAlt,
  FaClock,
  FaDollarSign,
  FaUser,
  FaCar,
  FaSync,
  FaClipboardCheck,
  FaFileAlt,
  FaPlay,
  FaCheck,
  FaSignOutAlt,
  FaCheckCircle,
  FaHourglassHalf,
  FaListAlt,
  FaTools,
  FaUpload,
  FaEye,
} from "react-icons/fa";
import { API_CONFIG } from "./api";
import api from "./api";
import {
  getTechnicianData,
  clearTechnicianData,
  getCurrentSessionId,
} from "./utils/sessionManager";
import "./technician.css";

// Modern professional styles
const modernStyles = `
  :root {
    /* Professional, modern palette */
    --total-gradient: linear-gradient(135deg, #1e293b 0%, #334155 100%);
    --available-gradient: linear-gradient(135deg, #2563eb 0%, #60a5fa 100%);   /* Blue */
    --accepted-gradient: linear-gradient(135deg, #0891b2 0%, #67e8f9 100%);  /* Cyan (swapped) */
    --inprogress-gradient: linear-gradient(135deg, #f59e0b 0%, #fcd34d 100%); /* Amber */
    --completed-gradient: linear-gradient(135deg, #16a34a 0%, #86efac 100%);   /* Emerald (swapped) */
    --card-shadow: 0 2px 20px rgba(0,0,0,0.08);
    --card-hover-shadow: 0 8px 30px rgba(0,0,0,0.12);
    --border-radius: 12px;
    --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    --text-strong: #111827; /* near-black for excellent contrast */
  }

  .modern-dashboard {
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    min-height: 100vh;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    padding-top: 1rem;
  }

  .modern-card {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: var(--border-radius);
    box-shadow: var(--card-shadow);
    transition: var(--transition);
    overflow: hidden;
  }

  .modern-card:hover {
    transform: translateY(-4px);
    box-shadow: var(--card-hover-shadow);
  }

  .gradient-card {
    background: var(--total-gradient);
    color: white;
    border: none;
    position: relative;
    overflow: hidden;
    text-shadow: 0 1px 3px rgba(0,0,0,0.3);
  }

  .gradient-card.available { background: var(--available-gradient); }

  .gradient-card.accepted {
    background: var(--accepted-gradient);
  }

  .gradient-card.inprogress {
    background: var(--inprogress-gradient);
  }

  .gradient-card.completed {
    background: var(--completed-gradient);
  }

  .gradient-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--card-hover-shadow);
  }

  .gradient-card.available:hover { background: linear-gradient(135deg, #1d4ed8 0%, #60a5fa 100%); }

  .gradient-card.accepted:hover { background: linear-gradient(135deg, #0e7490 0%, #67e8f9 100%); }

  .gradient-card.inprogress:hover { background: linear-gradient(135deg, #d97706 0%, #fde68a 100%); }

  .gradient-card.completed:hover { background: linear-gradient(135deg, #15803d 0%, #86efac 100%); }

  .active-filter {
    transform: translateY(-4px);
    box-shadow: 0 8px 30px rgba(0,0,0,0.15);
    border: 2px solid rgba(255,255,255,0.3);
  }

  .active-filter::before {
    content: '✓';
    position: absolute;
    top: 10px;
    right: 10px;
    background: rgba(255,255,255,0.9);
    color: #333;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 12px;
  }

  .stat-card {
    position: relative;
    overflow: hidden;
  }

  .stat-card::before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 100px;
    height: 100px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    transform: translate(30px, -30px);
  }

  .post-card {
    position: relative;
    background: white;
    border-radius: var(--border-radius);
    box-shadow: var(--card-shadow);
    transition: var(--transition);
    border: 1px solid rgba(0,0,0,0.05);
    overflow: hidden;
  }

  .post-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
  }

  .post-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--card-hover-shadow);
    border-color: rgba(102, 126, 234, 0.3);
  }

  /* Status-driven professional accents */
  /* Accepted → light blue */
  .post-card.status-accepted {
    border-color: rgba(37, 99, 235, 0.32); /* #2563eb */
    background-image: linear-gradient(180deg, rgba(37, 99, 235, 0.06), rgba(37, 99, 235, 0.02));
  }
  .post-card.status-accepted::before {
    background: linear-gradient(180deg, #00b09b 0%, #96c93d 100%);
  }

  .post-card.status-inprogress {
    border-color: rgba(255, 193, 7, 0.32);
    background-image: linear-gradient(180deg, rgba(255, 193, 7, 0.06), rgba(255, 193, 7, 0.02));
  }
  .post-card.status-inprogress::before {
    background: linear-gradient(180deg, #f7971e 0%, #ffd200 100%);
  }

  /* Completed → light green */
  .post-card.status-completed {
    border-color: rgba(22, 163, 74, 0.32); /* #16a34a */
    background-image: linear-gradient(180deg, rgba(22, 163, 74, 0.06), rgba(22, 163, 74, 0.02));
  }
  .post-card.status-completed::before {
    background: linear-gradient(180deg, #4facfe 0%, #00f2fe 100%);
  }

  .post-card.status-unknown {
    border-color: rgba(108, 117, 125, 0.25);
    background-image: linear-gradient(180deg, rgba(108, 117, 125, 0.06), rgba(108, 117, 125, 0.02));
  }
  .post-card.status-unknown::before {
    background: linear-gradient(180deg, #adb5bd 0%, #6c757d 100%);
  }

  /* Modern enhancements */
  .post-card-header {
    gap: 0.75rem;
  }

  .price-chip {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    color: white;
    border-radius: 999px;
    padding: 6px 12px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    box-shadow: 0 6px 16px rgba(79, 172, 254, 0.25);
    font-weight: 700;
  }

  .meta-chip {
    background: #f6f8ff;
    border: 1px solid rgba(102, 126, 234, 0.18);
    color: #5a6fd8;
    border-radius: 999px;
    padding: 6px 10px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 0.8rem;
    font-weight: 600;
  }

  .post-actions .btn {
    border-radius: 10px;
    border-width: 2px;
  }

  .post-actions .btn-outline-primary {
    border-color: rgba(102, 126, 234, 0.45);
  }

  .post-actions .btn-outline-success {
    border-color: rgba(25, 135, 84, 0.45);
  }

  .post-actions .btn-outline-info {
    border-color: rgba(13, 202, 240, 0.45);
  }

  .post-actions .btn-outline-secondary {
    border-color: rgba(108, 117, 125, 0.45);
  }

  .post-card.accepted::before {
    background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
  }

  .post-card.accepted {
    border-left: 4px solid #667eea;
  }

  .post-card.accepted:hover {
    border-left-color: #5a6fd8;
  }

  .modern-badge {
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border: none;
  }

  .price-display {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    font-weight: 700;
    font-size: 1.1rem;
  }

  .section-header {
    background: white;
    border-radius: var(--border-radius);
    box-shadow: var(--card-shadow);
    padding: 1.5rem;
    margin-top: 3rem;
    margin-bottom: 1.5rem;
    border-left: 4px solid #667eea;
  }

  .info-row {
    display: flex;
    align-items: center;
    margin-bottom: 0.5rem;
    padding: 0.25rem 0;
  }

  .info-icon {
    width: 16px;
    height: 16px;
    margin-right: 8px;
    color: #667eea;
  }

  .modern-modal .modal-content {
    border: none;
    border-radius: var(--border-radius);
    box-shadow: 0 20px 60px rgba(0,0,0,0.15);
    overflow: hidden;
  }

  .modern-modal .modal-header {
    background: var(--primary-gradient);
    color: white;
    border: none;
    padding: 1.5rem;
  }

  .modern-modal .modal-body {
    padding: 2rem;
  }

  .description-box {
    background: linear-gradient(135deg, #f8f9ff 0%, #e8f2ff 100%);
    border: 1px solid rgba(102, 126, 234, 0.1);
    border-radius: var(--border-radius);
    padding: 1rem;
    margin-top: 1rem;
  }

  .quick-actions {
    background: white;
    border-radius: var(--border-radius);
    box-shadow: var(--card-shadow);
    padding: 1.5rem;
  }

  .action-btn {
    border-radius: 12px;
    padding: 0.75rem 1.2rem;
    font-weight: 700;
    transition: var(--transition);
    border: none;
    text-transform: none;
    box-shadow: 0 6px 16px rgba(102, 126, 234, 0.12);
  }

  .action-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 10px 22px rgba(102, 126, 234, 0.18);
  }

  .empty-state {
    text-align: center;
    padding: 3rem 1rem;
    background: white;
    border-radius: var(--border-radius);
    box-shadow: var(--card-shadow);
  }

  /* Modern button style for post actions */
  .btn-modern {
    border-radius: 12px;
    border-width: 2px;
    font-weight: 600;
    padding: 0.6rem 1rem;
    transition: var(--transition);
  }
  .btn-modern:hover, .btn-modern:focus {
    transform: translateY(-1px);
    box-shadow: 0 10px 24px rgba(0,0,0,0.12);
  }
  /* Dark hover fills with high-contrast text */
  .btn-outline-primary.btn-modern:hover { color: #ffffff; background: #0d6efd; border-color: #0a58ca; }
  .btn-outline-success.btn-modern:hover { color: #ffffff; background: #198754; border-color: #146c43; }
  .btn-outline-info.btn-modern:hover { color: #ffffff; background: #0aa2c0; border-color: #0a8ca8; }
  .btn-outline-secondary.btn-modern:hover { color: #ffffff; background: #495057; border-color: #3f464b; }
  .btn-outline-danger.btn-modern:hover { color: #ffffff; background: #dc3545; border-color: #b02a37; }

  /* Organized two-column actions for in-progress */
  .two-col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
  }
  .span-2 { grid-column: 1 / -1; }

  .empty-state-icon {
    width: 64px;
    height: 64px;
    margin: 0 auto 1rem;
    opacity: 0.5;
  }

  @media (max-width: 768px) {
    .modern-card {
      margin-bottom: 1rem;
    }
    
    .stat-card {
      margin-bottom: 1rem;
    }
  }
`;

// Inject modern styles
if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = modernStyles;
  document.head.appendChild(styleSheet);
}

const TechnicianDashboardPage = () => {
  const navigate = useNavigate();
  const [technician, setTechnician] = useState(null);
  const [acceptedPosts, setAcceptedPosts] = useState([]);
  const [assignedPosts, setAssignedPosts] = useState([]);
  const [availablePostsCount, setAvailablePostsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [acceptedPostsLoading, setAcceptedPostsLoading] = useState(false);
  const [assignedPostsLoading, setAssignedPostsLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState("accepted"); // Default filter
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedPost, setSelectedPost] = useState(null);
  const [showPostModal, setShowPostModal] = useState(false);
  const [showInspectionInterface, setShowInspectionInterface] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [inspectionInterfaceTab, setInspectionInterfaceTab] = useState("files");
  const [showReportViewer, setShowReportViewer] = useState(false);
  const [reportViewerPost, setReportViewerPost] = useState(null);

  // Notification state
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Add notification function
  const addNotification = (message, type = "info") => {
    const newNotification = {
      id: Date.now() + Math.random(),
      message,
      type,
      timestamp: new Date().toLocaleString(),
      read: false,
    };
    setNotifications((prev) => [newNotification, ...prev.slice(0, 19)]);
    setUnreadCount((prev) => Math.min(prev + 1, 99));
  };

  useEffect(() => {
    // Check if technician data exists using session manager
    const storedTechnician = getTechnicianData();
    if (!storedTechnician) {
      console.log("No technician data found, redirecting to login");
      navigate("/technician-login");
      return;
    }

    console.log(
      "🔍 TechnicianDashboardPage - Session ID:",
      getCurrentSessionId()
    );
    fetchTechnicianData();
  }, [navigate]);

  const fetchTechnicianData = async () => {
    try {
      setLoading(true);
      setError("");

      // Get technician data from session manager (set during login)
      const storedTechnician = getTechnicianData();
      if (storedTechnician) {
        setTechnician({
          id: storedTechnician.id,
          email: storedTechnician.email,
          username: storedTechnician.name,
          name: storedTechnician.name,
          userType: "TECHNICIAN",
          location: storedTechnician.location,
        });

        // Fetch accepted posts and available posts count
        await Promise.all([
          fetchAcceptedPosts(storedTechnician.email),
          fetchAvailablePostsCount(storedTechnician.email),
        ]);
      } else {
        setError("No technician data found. Please log in.");
        navigate("/technician-login");
        return;
      }
    } catch (err) {
      console.error("Error fetching technician data:", err);
      setError("Failed to load dashboard data. Please try again.");
      addNotification("Failed to load dashboard data.", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchAcceptedPosts = async (email = null) => {
    try {
      setAcceptedPostsLoading(true);
      console.log("=== FETCHING ALL TECHNICIAN POSTS WITH PHONE NUMBERS ===");

      const technicianEmail = email || technician?.email;
      if (!technicianEmail) {
        console.error("No technician email available");
        return;
      }

      // Step 1: Get accepted post IDs
      const response = await api.post(
        `${API_CONFIG.TECHNICIAN_BASE_URL}/get-accepted-posts-by-email`,
        {
          email: technicianEmail,
        }
      );

      if (response.data && Array.isArray(response.data)) {
        console.log("✅ Technician post IDs loaded:", response.data);

        // Step 2: Fetch full details for each post with real status (now includes phone numbers)
        if (response.data.length > 0) {
          console.log("🔍 Fetching full details for technician posts...");
          addNotification(
            `Loading details for ${response.data.length} posts...`,
            "info"
          );

          const postDetailsPromises = response.data.map(async (postId) => {
            try {
              const postResponse = await api.get(
                `${API_CONFIG.POSTS_BASE_URL}/post/${postId}`
              );
              return {
                ...postResponse.data,
                id: postId,
                // Use the actual status from the database, not hardcoded
                status: postResponse.data.status
                  ? postResponse.data.status.toLowerCase()
                  : "accepted",
                acceptedAt:
                  postResponse.data.acceptedAt || new Date().toISOString(),
                // Phone number should now be included from the postings service
                technicianPhone: postResponse.data.technicianPhone,
              };
            } catch (error) {
              console.error(
                `Error fetching details for post ${postId}:`,
                error
              );
              // Return basic info if detailed fetch fails
              return {
                id: postId,
                status: "unknown", // Don't hardcode, mark as unknown if fetch fails
                name: `Post ${postId}`,
                location: technician?.location || "Unknown Location",
                acceptedAt: new Date().toISOString(),
                content: "Details unavailable",
                price: "N/A",
              };
            }
          });

          const acceptedPostsWithDetails = await Promise.all(
            postDetailsPromises
          );

          console.log(
            "✅ Full technician posts details loaded:",
            acceptedPostsWithDetails
          );
          setAcceptedPosts(acceptedPostsWithDetails);
          addNotification(
            `Loaded ${acceptedPostsWithDetails.length} posts with phone numbers`,
            "success"
          );
        } else {
          setAcceptedPosts([]);
          addNotification("No posts found", "info");
        }
      } else {
        setAcceptedPosts([]);
        addNotification("No posts found", "info");
      }
    } catch (err) {
      console.error("Error fetching technician posts:", err);
      addNotification("Failed to load posts", "error");
      setAcceptedPosts([]);
    } finally {
      setAcceptedPostsLoading(false);
    }
  };

  const fetchAvailablePostsCount = async (technicianEmail) => {
    try {
      console.log("=== FETCHING AVAILABLE POSTS COUNT ===");
      console.log("Using technician email:", technicianEmail);

      // Only proceed if technician email is available
      if (!technicianEmail) {
        console.log(
          "⚠️ No technician email provided, skipping available posts count"
        );
        setAvailablePostsCount(0);
        return;
      }

      const response = await api.post(
        `${API_CONFIG.TECHNICIAN_BASE_URL}/technician-posts-by-techloc`,
        { email: technicianEmail }
      );

      if (response.data && Array.isArray(response.data)) {
        console.log("📊 Raw posts data:", response.data);

        // Filter for available/open posts
        const availablePosts = response.data.filter((post) => {
          const status = post.status?.toLowerCase();
          return (
            status === "available" || status === "open" || status === "pending"
          );
        });

        const availableCount = availablePosts.length;
        console.log("📈 Available posts:", availablePosts);
        console.log("✅ Available posts count:", availableCount);

        setAvailablePostsCount(availableCount);
      } else {
        console.log("⚠️ No posts data received or data is not an array");
        setAvailablePostsCount(0);
      }
    } catch (error) {
      console.error("Error fetching available posts count:", error);
      console.error("Error details:", error.response?.data);
      setAvailablePostsCount(0);
    }
  };

  const fetchAssignedPosts = async (email = null) => {
    try {
      setAssignedPostsLoading(true);
      console.log("=== FETCHING ASSIGNED POSTS ===");

      const technicianEmail = email || technician?.email;
      if (!technicianEmail) {
        console.error("No technician email available");
        return;
      }

      // Use the correct endpoint that exists
      const response = await api.post(
        `${API_CONFIG.TECHNICIAN_BASE_URL}/technician-posts-by-techloc`,
        {
          email: technicianEmail,
        }
      );

      if (response.data && Array.isArray(response.data)) {
        setAssignedPosts(response.data);
        addNotification(
          `Loaded ${response.data.length} available posts`,
          "success"
        );
      } else {
        setAssignedPosts([]);
        addNotification("No available posts found", "info");
      }
    } catch (err) {
      console.error("Error fetching assigned posts:", err);
      addNotification("Failed to load available posts", "error");
      setAssignedPosts([]);
    } finally {
      setAssignedPostsLoading(false);
    }
  };

  const handleLogout = () => {
    clearTechnicianData();
    addNotification("Logged out successfully", "success");
    navigate("/technician-login");
  };

  const handleRefresh = () => {
    fetchTechnicianData();
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      accepted: "success",
      pending: "warning",
      completed: "info",
      in_progress: "primary",
    };
    return (
      <Badge bg={statusColors[status] || "secondary"}>
        {status?.toUpperCase() || "UNKNOWN"}
      </Badge>
    );
  };

  const viewPostDetails = (post) => {
    setSelectedPost(post);
    setShowPostModal(true);
  };

  const handleStartInspection = async () => {
    try {
      if (!selectedPost) return;

      console.log("=== STARTING INSPECTION ===");
      console.log("Post ID:", selectedPost.id);

      // Update post status to in_progress using the correct endpoint
      const updatePayload = {
        id: selectedPost.id,
        status: "INPROGRESS",
        technicianName: technician?.name,
        technicianEmail: technician?.email,
      };

      // Only include existing data if it exists to avoid null values
      if (selectedPost.content) updatePayload.content = selectedPost.content;
      if (selectedPost.location) updatePayload.location = selectedPost.location;
      if (selectedPost.price || selectedPost.offerAmount) {
        updatePayload.offerAmount =
          selectedPost.price || selectedPost.offerAmount;
      }

      console.log("Update payload:", updatePayload);

      const response = await api.post(
        `${API_CONFIG.POSTS_BASE_URL}/posts-update-id`,
        updatePayload
      );

      if (response.status === 200) {
        console.log("✅ Post status updated to INPROGRESS");
        addNotification("Inspection started successfully!", "success");

        // Update the post in the local state
        setAcceptedPosts((prevPosts) =>
          prevPosts.map((post) =>
            post.id === selectedPost.id
              ? { ...post, status: "INPROGRESS" }
              : post
          )
        );

        // Update the selected post for the modal
        setSelectedPost((prev) => ({ ...prev, status: "INPROGRESS" }));

        // Close the modal
        setShowPostModal(false);

        // Switch to the inprogress filter to show the updated post
        console.log(
          "🚀 Switching to inprogress filter for post:",
          selectedPost.id
        );
        setActiveFilter("inprogress");
      }
    } catch (error) {
      console.error("Error starting inspection:", error);
      console.error("Error details:", error.response?.data);
      console.error("Request payload:", {
        id: selectedPost.id,
        status: "IN_PROGRESS",
        technicianName: technician?.name,
        technicianEmail: technician?.email,
        content: selectedPost.content,
        location: selectedPost.location,
        offerAmount: selectedPost.price || selectedPost.offerAmount,
      });
      addNotification("Failed to start inspection. Please try again.", "error");
    }
  };

  const handleOpenInspectionInterface = (post, tab = "files") => {
    setSelectedPost(post);
    setInspectionInterfaceTab(tab);
    setShowInspectionInterface(true);
  };

  const handleOpenCompletionModal = (post) => {
    setSelectedPost(post);
    setShowCompletionModal(true);
  };

  const handleOpenMyReports = () => {
    // Prefer completed posts; if none, guide user
    const completed = acceptedPosts.filter((p) => p.status === "completed");
    if (completed.length === 0) {
      toast.info(
        "No completed reports yet. Complete an inspection to view reports."
      );
      setActiveFilter("completed");
      return;
    }
    // Open the latest completed post in the report viewer
    const latest = [...completed].sort(
      (a, b) =>
        new Date(b.updatedAt || b.acceptedAt || 0) -
        new Date(a.updatedAt || a.acceptedAt || 0)
    )[0];
    setReportViewerPost(latest);
    setShowReportViewer(true);
  };

  const handleViewReport = (post) => {
    console.log("Opening report view for post:", post);
    setSelectedPost(post);
    setInspectionInterfaceTab("checklist");
    setShowInspectionInterface(true);
  };

  const handleCompleteInspection = async (inspectionData) => {
    try {
      console.log("=== COMPLETING INSPECTION ===");
      console.log("Inspection data:", inspectionData);

      // Extract postId from inspection data
      const postId = inspectionData.postId || inspectionData;

      // Update post status to completed
      const updatePayload = {
        id: postId,
        status: "COMPLETED",
        technicianName: technician?.name,
        technicianEmail: technician?.email,
        finalRemarks: inspectionData.finalRemarks || "",
      };

      const response = await api.post(
        `${API_CONFIG.POSTS_BASE_URL}/posts-update-id`,
        updatePayload
      );

      if (response.status === 200) {
        console.log("✅ Post status updated to COMPLETED");
        addNotification("Inspection completed successfully!", "success");

        // Update the post in the local state
        setAcceptedPosts((prevPosts) => {
          const updatedPosts = prevPosts.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  status: "completed",
                  finalRemarks: inspectionData.finalRemarks || "",
                }
              : post
          );
          console.log(
            "✅ Updated local posts state:",
            updatedPosts.find((p) => p.id === postId)
          );
          return updatedPosts;
        });

        // Close the inspection interface and clear selected post
        setShowInspectionInterface(false);
        setSelectedPost(null);

        // Wait a moment for backend to update, then refresh the dashboard data
        setTimeout(() => {
          fetchTechnicianData();
        }, 1000);
      }
    } catch (error) {
      console.error("Error completing inspection:", error);
      addNotification(
        "Failed to complete inspection. Please try again.",
        "error"
      );
    }
  };

  const handleConfirmCompletion = async () => {
    try {
      if (!selectedPost) return;

      console.log("=== CONFIRMING INSPECTION COMPLETION ===");
      console.log("Post ID:", selectedPost.id);

      // Update post status to completed
      const updatePayload = {
        id: selectedPost.id,
        status: "COMPLETED",
        technicianName: technician?.name,
        technicianEmail: technician?.email,
      };

      const response = await api.post(
        `${API_CONFIG.POSTS_BASE_URL}/posts-update-id`,
        updatePayload
      );

      if (response.status === 200) {
        console.log("✅ Post status updated to COMPLETED");
        addNotification("Inspection marked as completed!", "success");

        // Update the post in the local state
        setAcceptedPosts((prevPosts) =>
          prevPosts.map((post) =>
            post.id === selectedPost.id
              ? { ...post, status: "completed" }
              : post
          )
        );

        // Close the modal and refresh data
        setShowCompletionModal(false);
        fetchTechnicianData();
      }
    } catch (error) {
      console.error("Error confirming completion:", error);
      addNotification(
        "Failed to mark inspection as complete. Please try again.",
        "error"
      );
    }
  };

  const handleMarkCompleteFromList = async (post) => {
    try {
      console.log("=== MARKING POST COMPLETE FROM LIST ===");
      console.log("Post ID:", post.id);

      // Update post status to completed
      const updatePayload = {
        id: post.id,
        status: "COMPLETED",
        technicianName: technician?.name,
        technicianEmail: technician?.email,
      };

      const response = await api.post(
        `${API_CONFIG.POSTS_BASE_URL}/posts-update-id`,
        updatePayload
      );

      if (response.status === 200) {
        console.log("✅ Post status updated to COMPLETED");
        addNotification("Inspection marked as completed!", "success");

        // Update the post in the local state
        setAcceptedPosts((prevPosts) =>
          prevPosts.map((p) =>
            p.id === post.id ? { ...p, status: "completed" } : p
          )
        );

        // Refresh the dashboard data
        fetchTechnicianData();
      }
    } catch (error) {
      console.error("Error marking post complete:", error);
      addNotification(
        "Failed to mark inspection as complete. Please try again.",
        "error"
      );
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="text-center">
          <Spinner animation="border" role="status" size="lg">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-3">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger" role="alert">
          <h4 className="alert-heading">Error!</h4>
          <p>{error}</p>
          <hr />
          <div className="d-flex gap-2">
            <Button
              variant="danger"
              onClick={() => navigate("/technician-login")}
            >
              Back to Login
            </Button>
            <Button variant="outline-danger" onClick={handleRefresh}>
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const stats = {
    acceptedPostsCount: acceptedPosts.filter((p) => p.status === "accepted")
      .length,
    completedPosts: acceptedPosts.filter((p) => p.status === "completed")
      .length,
    pendingPosts: acceptedPosts.filter(
      (p) =>
        p.status === "inprogress" ||
        p.status === "in_progress" ||
        p.status === "in-progress"
    ).length,
    availablePostsCount: availablePostsCount,
  };

  // Filter posts based on active filter
  const getFilteredPosts = () => {
    switch (activeFilter) {
      case "accepted":
        return acceptedPosts.filter((p) => p.status === "accepted");
      case "inprogress":
        return acceptedPosts.filter(
          (p) =>
            p.status === "inprogress" ||
            p.status === "in_progress" ||
            p.status === "in-progress"
        );
      case "completed":
        return acceptedPosts.filter((p) => p.status === "completed");
      default:
        return acceptedPosts.filter((p) => p.status === "accepted");
    }
  };

  const filteredPosts = getFilteredPosts();

  return (
    <div className="modern-dashboard">
      <TechnicianHeader
        technician={technician}
        notifications={notifications}
        unreadCount={unreadCount}
        showNotifDropdown={false}
        setShowNotifDropdown={() => {}}
        setShowProfileModal={() => {}}
        handleLogout={handleLogout}
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
        currentPage="dashboard"
      />

      <div className="container-fluid py-4">
        {/* Welcome Section */}
        <div className="section-header">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="h2 mb-2 fw-bold">
                Welcome back, {technician?.name}!
              </h1>
              <div className="info-row">
                <FaMapMarkerAlt className="info-icon" />
                <span className="text-muted">{technician?.location}</span>
              </div>
            </div>
            <Button
              variant="outline-primary"
              className="action-btn btn-modern"
              onClick={handleRefresh}
            >
              <FaSync className="me-2" />
              Refresh Dashboard
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <Row className="mb-5">
          <Col lg={3} md={6} className="mb-4">
            <Card
              className="modern-card gradient-card available stat-card"
              style={{ cursor: "pointer" }}
              onClick={() => navigate("/tech-feeds")}
            >
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <p className="mb-2 opacity-75 fw-medium">Available Posts</p>
                    <h2 className="mb-0 fw-bold display-6">
                      {stats.availablePostsCount || 0}
                    </h2>
                  </div>
                  <div className="text-end">
                    <FaListAlt size={32} className="opacity-75" />
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={3} md={6} className="mb-4">
            <Card
              className={`modern-card gradient-card accepted stat-card ${
                activeFilter === "accepted" ? "active-filter" : ""
              }`}
              style={{ cursor: "pointer" }}
              onClick={() => setActiveFilter("accepted")}
            >
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <p className="mb-2 opacity-75 fw-medium">Accepted Posts</p>
                    <h2 className="mb-0 fw-bold display-6">
                      {stats.acceptedPostsCount}
                    </h2>
                  </div>
                  <div className="text-end">
                    <FaCheckCircle size={32} className="opacity-75" />
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={3} md={6} className="mb-4">
            <Card
              className={`modern-card gradient-card inprogress stat-card ${
                activeFilter === "inprogress" ? "active-filter" : ""
              }`}
              style={{ cursor: "pointer" }}
              onClick={() => setActiveFilter("inprogress")}
            >
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <p className="mb-2 opacity-75 fw-medium">In Progress</p>
                    <h2 className="mb-0 fw-bold display-6">
                      {stats.pendingPosts}
                    </h2>
                  </div>
                  <div className="text-end">
                    <FaClock size={32} className="opacity-75" />
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={3} md={6} className="mb-4">
            <Card
              className={`modern-card gradient-card completed stat-card ${
                activeFilter === "completed" ? "active-filter" : ""
              }`}
              style={{ cursor: "pointer" }}
              onClick={() => setActiveFilter("completed")}
            >
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <p className="mb-2 opacity-75 fw-medium">Completed</p>
                    <h2 className="mb-0 fw-bold display-6">
                      {stats.completedPosts}
                    </h2>
                  </div>
                  <div className="text-end">
                    <FaCheck size={32} className="opacity-75" />
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Main Content - Accepted Posts Only */}
        <Row>
          <Col lg={8} className="mx-auto">
            <Card className="modern-card">
              <Card.Header className="bg-transparent border-0 p-4 pb-0">
                <div className="d-flex align-items-center">
                  <div className="me-3">
                    <div className="rounded-circle bg-primary bg-opacity-10 p-2">
                      <FaCheckCircle className="text-primary" size={20} />
                    </div>
                  </div>
                  <div className="flex-grow-1">
                    <h5 className="mb-1 fw-bold">
                      {activeFilter === "accepted" && "My Accepted Posts"}
                      {activeFilter === "inprogress" && "In Progress Posts"}
                      {activeFilter === "completed" && "Completed Posts"}
                    </h5>
                    <p className="text-muted mb-0 small">
                      {activeFilter === "accepted" &&
                        "Posts you've accepted and are working on"}
                      {activeFilter === "inprogress" &&
                        "Posts currently being inspected"}
                      {activeFilter === "completed" &&
                        "Successfully completed inspections"}
                    </p>
                  </div>
                  {acceptedPostsLoading && (
                    <Spinner
                      animation="border"
                      size="sm"
                      className="text-primary"
                    />
                  )}
                </div>
              </Card.Header>
              <Card.Body className="p-4">
                {acceptedPostsLoading ? (
                  <div className="text-center py-5">
                    <Spinner
                      animation="border"
                      size="lg"
                      className="text-primary mb-3"
                    />
                    <p className="text-muted">Loading your accepted posts...</p>
                  </div>
                ) : filteredPosts.length > 0 ? (
                  <div
                    className={`row g-4 ${
                      filteredPosts.length === 1 ? "justify-content-center" : ""
                    }`}
                  >
                    {filteredPosts.map((post, index) => (
                      <div
                        key={post.id || index}
                        className={`${
                          filteredPosts.length === 1
                            ? "col-md-8 col-lg-6"
                            : "col-md-6"
                        }`}
                      >
                        <div
                          className={`post-card h-100 ${
                            post.status === "accepted"
                              ? "status-accepted"
                              : post.status === "completed"
                              ? "status-completed"
                              : post.status === "inprogress" ||
                                post.status === "in_progress" ||
                                post.status === "in-progress"
                              ? "status-inprogress"
                              : "status-unknown"
                          }`}
                        >
                          <div className="p-4 d-flex flex-column h-100">
                            <div className="d-flex justify-content-between align-items-start mb-3">
                              <div className="flex-grow-1">
                                <h6 className="fw-bold mb-2 text-primary">
                                  {post.name ||
                                    post.content ||
                                    `Auto Inspection ${post.id}`}
                                </h6>
                                <Badge className="modern-badge bg-primary">
                                  {post.status.toUpperCase()}
                                </Badge>
                              </div>
                              <div className="text-end">
                                {post.price && (
                                  <div className="price-chip">
                                    <FaDollarSign />
                                    {post.price}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="row g-3">
                              <div className="col-md-6">
                                <div className="info-row">
                                  <FaMapMarkerAlt className="info-icon" />
                                  <small className="text-muted">
                                    <strong>Location:</strong>{" "}
                                    {post.location || "Not specified"}
                                  </small>
                                </div>
                                {post.acceptedAt && (
                                  <div className="info-row">
                                    <span className="meta-chip">
                                      <FaClock />
                                      Accepted {formatDate(post.acceptedAt)}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="col-md-6">
                                {post.technicianName && (
                                  <div className="info-row">
                                    <span className="meta-chip">
                                      <FaUser />
                                      {post.technicianName}
                                    </span>
                                  </div>
                                )}
                                {post.technicianEmail && (
                                  <div className="info-row">
                                    <small className="text-muted">
                                      <strong>Email:</strong>{" "}
                                      {post.technicianEmail}
                                    </small>
                                  </div>
                                )}
                                {post.dealerPhone && (
                                  <div className="info-row">
                                    <small className="text-muted">
                                      <strong>Dealer Phone:</strong>{" "}
                                      {post.dealerPhone}
                                    </small>
                                  </div>
                                )}
                              </div>
                            </div>

                            {post.content &&
                              post.content !== `Post ${post.id}` && (
                                <div className="description-box mt-3">
                                  <small className="text-muted">
                                    <strong>Description:</strong>{" "}
                                    {post.content.substring(0, 150)}
                                    {post.content.length > 150 && "..."}
                                  </small>
                                </div>
                              )}

                            {/* Action Buttons Based on Status */}
                            <div className="mt-3 post-actions">
                              {/* Status-specific buttons */}
                              {post.status === "accepted" && (
                                <div className="mb-2">
                                  <Button
                                    variant="outline-success"
                                    size="sm"
                                    className="btn-modern"
                                    onClick={() => {
                                      setSelectedPost(post);
                                      handleStartInspection();
                                    }}
                                  >
                                    <FaPlay className="me-1" />
                                    Start Inspection
                                  </Button>
                                </div>
                              )}

                              {/* Show View Details for non-accepted and non-completed posts */}
                              {post.status !== "accepted" &&
                                post.status !== "completed" && (
                                  <div className="mb-2">
                                    <Button
                                      variant="outline-primary"
                                      size="sm"
                                      className="btn-modern"
                                      onClick={() => viewPostDetails(post)}
                                    >
                                      <FaFileAlt className="me-1" />
                                      View Details
                                    </Button>
                                  </div>
                                )}

                              {/* Show View Report for completed posts */}
                              {post.status === "completed" && (
                                <div className="mb-2">
                                  <Button
                                    variant="outline-info"
                                    size="sm"
                                    className="btn-modern"
                                    onClick={() => handleViewReport(post)}
                                  >
                                    <FaFileAlt className="me-1" />
                                    View Report
                                  </Button>
                                </div>
                              )}

                              {/* In-Progress posts show 4 organized buttons */}
                              {(post.status === "inprogress" ||
                                post.status === "in_progress" ||
                                post.status === "in-progress") && (
                                <>
                                  <div className="two-col">
                                    <div>
                                      <Button
                                        variant="outline-warning"
                                        size="sm"
                                        className="btn-modern btn-upload"
                                        onClick={() =>
                                          handleOpenInspectionInterface(
                                            post,
                                            "files"
                                          )
                                        }
                                        className="w-100 btn-modern"
                                      >
                                        <FaUpload className="me-1" />
                                        Upload Files
                                      </Button>
                                    </div>
                                    <div>
                                      <Button
                                        variant="outline-info"
                                        size="sm"
                                        className="btn-modern"
                                        onClick={() =>
                                          handleOpenInspectionInterface(
                                            post,
                                            "checklist"
                                          )
                                        }
                                        className="w-100 btn-modern"
                                      >
                                        <FaClipboardCheck className="me-1" />
                                        Inspection
                                      </Button>
                                    </div>
                                    <div className="span-2">
                                      <Button
                                        variant="outline-secondary"
                                        size="sm"
                                        className="btn-modern"
                                        onClick={() =>
                                          handleOpenInspectionInterface(
                                            post,
                                            "remarks"
                                          )
                                        }
                                        className="w-100 btn-modern"
                                      >
                                        <FaFileAlt className="me-1" />
                                        Remarks
                                      </Button>
                                    </div>
                                  </div>
                                </>
                              )}

                              {post.status === "completed" && (
                                <div className="text-center">
                                  <Badge
                                    bg="success"
                                    className="px-3 py-2 fs-6"
                                  >
                                    <FaCheckCircle className="me-1" />
                                    Inspection Complete
                                  </Badge>
                                </div>
                              )}

                              {/* Communication Buttons - Show if dealer email exists */}
                              {(post.dealerEmail || post.email) && (
                                <div className="mt-2">
                                  <div className="d-flex gap-2">
                                    <ChatButton
                                      dealerEmail={
                                        post.dealerEmail || post.email
                                      }
                                      technicianEmail={technician?.email}
                                      userType="TECHNICIAN"
                                      variant="outline-primary"
                                      size="sm"
                                      className="flex-fill"
                                      showText={true}
                                      postId={post.id}
                                      postTitle={`${
                                        post.carMake || "Vehicle"
                                      } ${post.carModel || "Inspection"}`}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <FaCheckCircle className="empty-state-icon" />
                    <h6 className="text-muted mb-3">
                      {activeFilter === "accepted" && "No accepted posts yet"}
                      {activeFilter === "inprogress" && "No in-progress posts"}
                      {activeFilter === "completed" && "No completed posts"}
                    </h6>
                    <p className="text-muted mb-4">
                      {activeFilter === "accepted" &&
                        "Start by browsing and accepting available posts in your area"}
                      {activeFilter === "inprogress" &&
                        "Start inspections on your accepted posts to see them here"}
                      {activeFilter === "completed" &&
                        "Complete your inspections to see them here"}
                    </p>
                    <Button
                      variant="primary"
                      className="action-btn"
                      onClick={() => navigate("/tech-feeds")}
                    >
                      Browse Available Posts
                    </Button>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Quick Actions removed per request */}
      </div>

      {/* Post Details Modal */}
      <Modal
        show={showPostModal}
        onHide={() => setShowPostModal(false)}
        size="lg"
        className="modern-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">
            {selectedPost && selectedPost.status === "accepted" ? (
              <>
                <FaPlay className="me-2" />
                Start Inspection Confirmation
              </>
            ) : (
              <>
                <FaFileAlt className="me-2" />
                Post Details
              </>
            )}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedPost && (
            <div>
              {/* Show confirmation message for accepted posts */}
              {selectedPost.status === "accepted" && (
                <div className="alert alert-warning mb-4">
                  <h6 className="alert-heading mb-2">
                    <FaPlay className="me-2" />
                    Ready to Start Inspection?
                  </h6>
                  <p className="mb-0">
                    You are about to begin the inspection process for this
                    vehicle. Please review the details below and confirm to
                    proceed.
                  </p>
                </div>
              )}

              <div className="d-flex justify-content-between align-items-start mb-3">
                <h5 className="mb-0">
                  {selectedPost.name ||
                    selectedPost.content ||
                    `Auto Inspection ${selectedPost.id}`}
                </h5>
                {getStatusBadge(selectedPost.status)}
              </div>

              <div className="row mb-3">
                <div className="col-md-6">
                  <div className="mb-2">
                    <strong>
                      <FaMapMarkerAlt className="me-1" />
                      Location:
                    </strong>
                    <span className="ms-2">
                      {selectedPost.location || "Not specified"}
                    </span>
                  </div>

                  {selectedPost.acceptedAt && (
                    <div className="mb-2">
                      <strong>
                        <FaClock className="me-1" />
                        Accepted:
                      </strong>
                      <span className="ms-2">
                        {formatDate(selectedPost.acceptedAt)}
                      </span>
                    </div>
                  )}

                  {selectedPost.expectedCompletionBy && (
                    <div className="mb-2">
                      <strong>Expected Completion:</strong>
                      <span className="ms-2">
                        {formatDate(selectedPost.expectedCompletionBy)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="col-md-6">
                  {selectedPost.price && (
                    <div className="mb-2">
                      <strong>
                        <FaDollarSign className="me-1" />
                        Offer Amount:
                      </strong>
                      <span className="ms-2 text-success fw-bold fs-5">
                        ${selectedPost.price}
                      </span>
                    </div>
                  )}

                  {selectedPost.technicianName && (
                    <div className="mb-2">
                      <strong>
                        <FaUser className="me-1" />
                        Technician:
                      </strong>
                      <span className="ms-2">
                        {selectedPost.technicianName}
                      </span>
                    </div>
                  )}

                  {selectedPost.technicianEmail && (
                    <div className="mb-2">
                      <strong>Email:</strong>
                      <span className="ms-2">
                        {selectedPost.technicianEmail}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {selectedPost.content &&
                selectedPost.content !== `Post ${selectedPost.id}` && (
                  <div className="mb-3">
                    <strong>Description:</strong>
                    <div className="description-box">
                      {selectedPost.content}
                    </div>
                  </div>
                )}

              {selectedPost.createdAt && (
                <div className="mb-2">
                  <strong>Created:</strong>
                  <span className="ms-2">
                    {formatDate(selectedPost.createdAt)}
                  </span>
                </div>
              )}

              {selectedPost.updatedAt &&
                selectedPost.updatedAt !== selectedPost.createdAt && (
                  <div className="mb-2">
                    <strong>Last Updated:</strong>
                    <span className="ms-2">
                      {formatDate(selectedPost.updatedAt)}
                    </span>
                  </div>
                )}

              <div className="mt-3 p-2 bg-info bg-opacity-10 rounded">
                <small className="text-muted">
                  <strong>Post ID:</strong> {selectedPost.id}
                </small>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0 p-4">
          <Button
            variant="outline-secondary"
            className="action-btn btn-modern me-2"
            onClick={() => setShowPostModal(false)}
          >
            {selectedPost && selectedPost.status === "accepted"
              ? "Cancel"
              : "Close"}
          </Button>
          {selectedPost && selectedPost.status === "accepted" && (
            <Button
              variant="success"
              className="action-btn btn-modern"
              onClick={handleStartInspection}
            >
              <FaPlay className="me-1" />
              Confirm & Start Inspection
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      {/* Inspection Interface Modal */}
      <InspectionInterface
        show={showInspectionInterface}
        onHide={() => setShowInspectionInterface(false)}
        post={selectedPost}
        onComplete={handleCompleteInspection}
        initialTab={inspectionInterfaceTab}
        viewMode={
          selectedPost?.status === "completed" ||
          selectedPost?.status === "SUBMITTED"
        }
      />

      {/* Inspection Report Viewer Modal */}
      <InspectionReportViewer
        show={showReportViewer}
        onHide={() => setShowReportViewer(false)}
        postId={reportViewerPost?.id}
        post={reportViewerPost}
      />

      {/* Completion Confirmation Modal */}
      <Modal
        show={showCompletionModal}
        onHide={() => setShowCompletionModal(false)}
        size="md"
        className="modern-modal"
        centered
      >
        <Modal.Header closeButton className="bg-success text-white">
          <Modal.Title className="fw-bold">
            <FaCheckCircle className="me-2" />
            Complete Inspection
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {selectedPost && (
            <div>
              <div className="alert alert-info mb-4">
                <h6 className="alert-heading mb-2">
                  <FaCheckCircle className="me-2" />
                  Are you complete inspection?
                </h6>
                <p className="mb-0">
                  Please review your inspection report before marking it as
                  complete. You can view the full report to double-check all
                  details.
                </p>
              </div>

              <div className="mb-3">
                <h6 className="fw-bold">Inspection Details:</h6>
                <div className="bg-light p-3 rounded">
                  <div className="mb-2">
                    <strong>Vehicle:</strong>{" "}
                    {selectedPost.name || `Post #${selectedPost.id}`}
                  </div>
                  <div className="mb-2">
                    <strong>Location:</strong>{" "}
                    {selectedPost.location || "Not specified"}
                  </div>
                  {selectedPost.price && (
                    <div className="mb-2">
                      <strong>Offer Amount:</strong> ${selectedPost.price}
                    </div>
                  )}
                  <div className="mb-2">
                    <strong>Technician:</strong> {technician?.name}
                  </div>
                  <div>
                    <strong>Status:</strong>{" "}
                    <Badge bg="warning">In Progress</Badge> →{" "}
                    <Badge bg="success">Completed</Badge>
                  </div>
                </div>
              </div>

              <div className="d-flex justify-content-center mb-3">
                <Button
                  variant="outline-primary"
                  size="sm"
                  className="btn-modern"
                  onClick={() => {
                    setShowCompletionModal(false);
                    // Open in editable mode (not view mode) for in-progress inspections
                    setSelectedPost({ ...selectedPost, forceEditMode: true });
                    handleOpenInspectionInterface(selectedPost, "checklist");
                  }}
                  className="me-2"
                >
                  <FaClipboardCheck className="me-1" />
                  View Full Report
                </Button>
                <Button
                  variant="outline-info"
                  size="sm"
                  className="btn-modern"
                  onClick={() => {
                    setShowCompletionModal(false);
                    // Open in editable mode (not view mode) for in-progress inspections
                    setSelectedPost({ ...selectedPost, forceEditMode: true });
                    handleOpenInspectionInterface(selectedPost, "remarks");
                  }}
                >
                  <FaFileAlt className="me-1" />
                  View Remarks
                </Button>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0 p-4">
          <Button
            variant="outline-secondary"
            className="action-btn btn-modern me-2"
            onClick={() => setShowCompletionModal(false)}
          >
            <FaEye className="me-1" />
            Review First
          </Button>
          <Button
            variant="success"
            className="action-btn btn-modern"
            onClick={handleConfirmCompletion}
          >
            <FaCheckCircle className="me-1" />
            Yes, Complete Inspection
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default TechnicianDashboardPage;
