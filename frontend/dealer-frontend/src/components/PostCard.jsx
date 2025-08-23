import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
  memo,
} from "react";
import Select from "react-select";
// Toast import removed - using notifications instead
import axios from "axios";
import { API_CONFIG } from "../api";
import CancelModal from "./CancelModal";
import { Modal, Button } from "react-bootstrap";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import InspectionReportViewer from "./InspectionReportViewer";
import ChatButton from "./chat/ChatButton";
import RatingModal from "./RatingModal";
import TechnicianRatingDisplay from "./TechnicianRatingDisplay";

// Performance: Memoized utility functions
const capitalize = (str) => {
  if (!str || typeof str !== "string") return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const capitalizeWords = (str) => {
  if (!str) return "";
  return str
    .split(" ")
    .map((word) => capitalize(word))
    .join(" ");
};

// Performance: Memoized date formatting
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid Date";
    return date.toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch (error) {
    return "N/A";
  }
};

const calculateExpectedDate = (acceptedAt) => {
  if (!acceptedAt) return "N/A";
  try {
    const date = new Date(acceptedAt);
    if (isNaN(date.getTime())) return "Invalid Date";
    date.setDate(date.getDate() + 7);
    return date.toLocaleDateString("en-US", {
      dateStyle: "medium",
    });
  } catch (error) {
    return "N/A";
  }
};

// Security: Enhanced token handling
const getAccessToken = () => {
  const token = localStorage.getItem("accessToken");
  if (!token || token.split(".").length !== 3) {
    return null;
  }
  return token;
};

const api = axios.create({
  timeout: 10000, // Performance: Set timeout
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers["Authorization"] = `Bearer ${token}`;
  return config;
});

// Replace VITE_ env usage with REACT_APP_ for Create React App
// Use the centralized API config for consistency
const API_POSTINGS_URL = API_CONFIG.POSTS_BASE_URL;

// Utility to format file size
function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

// Add a Preview All Attachments button if there are attachments
function getAttachmentType(filename) {
  if (/\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(filename)) return "image";
  if (/\.(mp3|wav|ogg|aac|m4a)$/i.test(filename)) return "audio";
  if (/\.(mp4|webm|ogg|mov|avi|mkv)$/i.test(filename)) return "video";
  return "other";
}

const PostCard = ({
  post,
  idx,
  editId,
  editData,
  onEditChange,
  onSaveEdit,
  onCancelEdit,
  onStartEdit,
  onTriggerDelete,
  animate,
  cityOptions,
  setEditData,
  // Bulk selection
  isSelected,
  onSelect,
  showCheckbox,
  onNotification,
  // Dealer info
  dealerInfo,
}) => {
  const [showCancelModal, setShowCancelModal] = useState(false);

  const isEditing = editId === post.id;
  const cardRef = useRef(null);
  const [editError, setEditError] = useState("");
  const [showAttachments, setShowAttachments] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showInspectionReport, setShowInspectionReport] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);

  // Memoized values for better performance
  const borderColor = useMemo(() => {
    return post.status === "COMPLETED"
      ? "#28a745"
      : post.status === "ACCEPTED"
      ? "#007bff"
      : post.status === "CANCELLED"
      ? "#dc3545"
      : "#ffc107";
  }, [post.status]);

  const cardStyle = useMemo(
    () => ({
      background:
        isSelected && showCheckbox && !isEditing
          ? "rgba(14, 165, 233, 0.1)"
          : "rgba(255, 255, 255, 0.95)",
      borderRadius: "20px",
      borderLeft: `6px solid ${borderColor}`,
      border:
        isSelected && !isEditing
          ? "2px solid #0ea5e9"
          : "1px solid rgba(255, 255, 255, 0.2)",
      boxShadow:
        isSelected && !isEditing
          ? "0 15px 40px rgba(14, 165, 233, 0.2), 0 8px 25px rgba(15, 23, 42, 0.1)"
          : "0 15px 40px rgba(15, 23, 42, 0.1), 0 8px 25px rgba(14, 165, 233, 0.05)",
      transition:
        "transform 0.2s ease, box-shadow 0.2s ease, background 0.15s ease, border 0.15s ease",
      cursor: showCheckbox && !isEditing ? "pointer" : "default",
    }),
    [isSelected, showCheckbox, isEditing, borderColor]
  );

  const checkboxStyle = useMemo(
    () => ({
      left: 8,
      top: 8,
      zIndex: 2,
      width: 12,
      height: 12,
      boxShadow: isSelected
        ? "0 1px 3px rgba(0, 123, 255, 0.3), 0 1px 2px rgba(0, 123, 255, 0.2)"
        : "0 1px 2px rgba(0, 0, 0, 0.15), 0 1px 1px rgba(0, 0, 0, 0.1)",
      border: isSelected ? "1px solid #007bff" : "1px solid #ccc",
      borderRadius: "2px",
      backgroundColor: isSelected ? "#007bff" : "#fff",
      transition: "all 0.15s ease",
    }),
    [isSelected]
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isEditing &&
        cardRef.current &&
        !cardRef.current.contains(event.target)
      ) {
        onCancelEdit();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isEditing, onCancelEdit]);

  useEffect(() => {
    // Temporarily disable attachment fetching until backend is implemented
    // TODO: Re-enable when attachment endpoints are available
    setAttachments([]);
  }, [post.id]);

  const handleSaveEdit = useCallback(async () => {
    // VIN validation: if provided, must be exactly 16 characters with valid format
    if (
      isEditing &&
      editData.vin &&
      editData.vin.trim() !== "" &&
      !/^[A-Za-z0-9]{16}$/.test(editData.vin)
    ) {
      setEditError(
        "VIN must contain only letters (A-Z, a-z) and numbers (0-9), no spaces or special characters."
      );
      return;
    }

    setEditError("");
    setSaving(true);
    try {
      await onSaveEdit();
      // Notification is handled in the parent component (PostingsPage)
    } catch (err) {
      if (onNotification) {
        onNotification("error", "Failed to save post.");
      }
    } finally {
      setSaving(false);
    }
  }, [isEditing, editData.vin, onSaveEdit, onNotification]);

  const fetchAttachments = useCallback(async () => {
    // Temporarily disable attachment fetching until backend is implemented
    // TODO: Re-enable when attachment endpoints are available
    setLoadingAttachments(false);
    setAttachments([]);
  }, [post.id]);

  const handleViewAttachments = useCallback(async () => {
    await fetchAttachments();
    setShowAttachments(true);
  }, [fetchAttachments]);

  const handleCardClick = useCallback(
    (e) => {
      // Only handle click-to-select if not editing, onSelect is provided, and bulk mode is active
      if (!isEditing && onSelect && showCheckbox) {
        // Prevent triggering if clicking on interactive elements
        const target = e.target;
        const isInteractive =
          target.tagName === "BUTTON" ||
          target.tagName === "INPUT" ||
          target.tagName === "A" ||
          target.closest("button") ||
          target.closest("input") ||
          target.closest("a") ||
          target.closest(".dropdown") ||
          target.closest(".modal");

        if (!isInteractive) {
          onSelect();
        }
      }
    },
    [isEditing, onSelect, showCheckbox]
  );

  const handleMouseEnter = useCallback(
    (e) => {
      if (!isEditing) {
        e.currentTarget.style.transform = "scale(1.02)";
        if (isSelected) {
          e.currentTarget.style.boxShadow =
            "0 20px 50px rgba(14, 165, 233, 0.25), 0 10px 30px rgba(15, 23, 42, 0.15)";
        } else {
          e.currentTarget.style.boxShadow =
            "0 20px 50px rgba(15, 23, 42, 0.15), 0 10px 30px rgba(14, 165, 233, 0.1)";
        }
      }
    },
    [isEditing, isSelected]
  );

  const handleMouseLeave = useCallback(
    (e) => {
      if (!isEditing) {
        e.currentTarget.style.transform = "scale(1)";
        if (isSelected) {
          e.currentTarget.style.boxShadow =
            "0 15px 40px rgba(14, 165, 233, 0.2), 0 8px 25px rgba(15, 23, 42, 0.1)";
        } else {
          e.currentTarget.style.boxShadow =
            "0 15px 40px rgba(15, 23, 42, 0.1), 0 8px 25px rgba(14, 165, 233, 0.05)";
        }
      }
    },
    [isEditing, isSelected]
  );

  const handleEditButtonClick = useCallback(() => {
    onStartEdit(post);
  }, [onStartEdit, post]);

  const handleCancelButtonClick = useCallback(() => {
    setShowCancelModal(true);
  }, []);

  const handleDeleteButtonClick = useCallback(() => {
    console.log("🔍 POSTCARD: Delete button clicked for post ID:", post.id);
    onTriggerDelete(post.id);
  }, [onTriggerDelete, post.id]);

  const handlePreviewAttachments = useCallback(() => {
    // Temporarily disabled attachment functionality until backend is implemented
    // TODO: Re-enable when attachment endpoints are available
    console.log("Attachment preview disabled - backend not implemented yet");
  }, []);

  const handleEditButtonMouseEnter = useCallback(
    (e) => {
      if (post.status !== "COMPLETED") {
        e.currentTarget.style.transform = "scale(1.05)";
        e.currentTarget.style.boxShadow = "0 4px 10px rgba(0, 123, 255, 0.2)";
      }
    },
    [post.status]
  );

  const handleEditButtonMouseLeave = useCallback((e) => {
    e.currentTarget.style.transform = "scale(1)";
    e.currentTarget.style.boxShadow = "none";
  }, []);

  const handleActionButtonMouseEnter = useCallback((e) => {
    e.currentTarget.style.transform = "scale(1.05)";
    e.currentTarget.style.boxShadow = "0 4px 10px rgba(220, 53, 69, 0.2)";
  }, []);

  const handleActionButtonMouseLeave = useCallback((e) => {
    e.currentTarget.style.transform = "scale(1)";
    e.currentTarget.style.boxShadow = "none";
  }, []);

  return (
    <div
      className={`col-md-6 mb-4 ${
        !isEditing ? "animate__animated animate__fadeInUp" : ""
      }`}
      {...(animate && !isEditing
        ? {
            "data-aos": "fade-up",
            "data-aos-delay": idx * 30, // Reduced delay for faster animation
            "data-aos-duration": "300", // Reduced duration
          }
        : {})}
    >
      <div
        ref={cardRef}
        className={`p-4 rounded position-relative ${
          !isEditing ? "hover-effect-card" : ""
        }`}
        style={cardStyle}
        onClick={handleCardClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Per-user Post ID */}
        <div className="mb-2 text-primary fw-bold" style={{ fontSize: 18 }}>
          {(() => {
            // Priority: displayId > dealerPostNumber > fallback to id
            let displayId;
            if (post.displayId) {
              displayId = post.displayId;
            } else if (post.dealerPostNumber) {
              displayId = `Post #${post.dealerPostNumber}`;
            } else {
              displayId = `Post #${post.id}`;
            }

            console.log(
              `PostCard: Post ID ${post.id} -> Display: ${displayId} (dealerPostNumber: ${post.dealerPostNumber}, displayId: ${post.displayId})`
            );
            return displayId;
          })()}
          {showCheckbox && !isEditing && (
            <span
              className="ms-2 text-muted"
              style={{ fontSize: 12, fontWeight: 400 }}
              title="Click anywhere on this card to select/deselect"
            >
              {isSelected ? "✅ Selected" : "💡 Click to select"}
            </span>
          )}
        </div>
        {/* Bulk selection checkbox */}
        {!isEditing && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onSelect}
            className="form-check-input position-absolute"
            style={checkboxStyle}
            title="Select post"
          />
        )}
        {saving ? (
          <Skeleton height={120} />
        ) : !isEditing ? (
          <>
            {/* Description full width */}
            <div className="mb-2">
              <label className="fw-semibold text-muted mb-0">
                📝 Description
              </label>
              <div className="mb-1">{post.content}</div>
            </div>
            {/* 2x2 grid for Location, Offer, VIN, Lot */}
            <div className="row g-3 mb-2">
              <div className="col-12 col-md-6">
                <label className="fw-semibold text-muted mb-0">
                  📍 Location
                </label>
                <div className="mb-1">{capitalizeWords(post.location)}</div>
              </div>
              <div className="col-12 col-md-6">
                <label className="fw-semibold text-muted mb-0">
                  💰 Offer Amount
                </label>
                <div className="mb-1">
                  <strong>
                    {post.offerAmount?.trim()
                      ? isNaN(post.offerAmount)
                        ? post.offerAmount
                        : `$${post.offerAmount}`
                      : "N/A"}
                  </strong>
                </div>
              </div>
              <div className="col-12 col-md-6">
                <label className="fw-semibold text-muted mb-0">🚗 VIN</label>
                <div className="mb-1">
                  {post.vin?.trim() ? post.vin : "N/A"}
                </div>
              </div>
              <div className="col-12 col-md-6">
                <label className="fw-semibold text-muted mb-0">
                  🏷️ Auction Lot
                </label>
                <div className="mb-1">
                  {post.auctionLot?.trim() ? post.auctionLot : "N/A"}
                </div>
              </div>
            </div>
            <hr
              style={{
                margin: "10px 0 16px 0",
                borderTop: "1px solid #e3e6ea",
              }}
            />
            <div className="mb-2">
              <label className="fw-semibold text-muted mb-0">Status</label>
              <div className="d-flex align-items-center gap-2">
                <span
                  className={`badge ${
                    post.status === "COMPLETED"
                      ? "bg-success"
                      : post.status === "ACCEPTED"
                      ? "bg-primary"
                      : post.status === "CANCELLED"
                      ? "bg-danger"
                      : "bg-warning text-dark"
                  }`}
                  style={{
                    boxShadow:
                      post.status === "ACCEPTED"
                        ? "0 0 10px rgba(0, 123, 255, 0.4)"
                        : post.status === "COMPLETED"
                        ? "0 0 10px rgba(40, 167, 69, 0.4)"
                        : post.status === "CANCELLED"
                        ? "0 0 10px rgba(220, 53, 69, 0.4)"
                        : "0 0 10px rgba(255, 193, 7, 0.4)",
                  }}
                >
                  {capitalize(post.status)}
                </span>
                <small className="text-muted">
                  {post.updatedAt ? "Updated:" : "Created:"}{" "}
                  {new Date(
                    post.updatedAt || post.createdAt
                  ).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })}{" "}
                  •{" "}
                  {new Date(
                    post.updatedAt || post.createdAt
                  ).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </small>
              </div>
              {/* Attachments Button at bottom left, only if attachments exist */}
              {/* Temporarily disabled attachment functionality until backend is implemented */}
              {/* {attachments.length > 0 && !isEditing && post.id && (
                <div className="mt-2 d-flex flex-row gap-2">
                  <button
                    className="btn btn-outline-info btn-sm"
                    style={{ fontWeight: 500, borderRadius: 8 }}
                    onClick={handlePreviewAttachments}
                  >
                    👁️ Preview All Attachments
                  </button>
                  <a
                    href={`${API_POSTINGS_URL}/post/${post.id}/attachments/download-all`}
                    className="btn btn-outline-secondary btn-sm"
                    style={{ fontWeight: 500, borderRadius: 8 }}
                  >
                    ⬇️ Download All Attachments
                  </a>
                </div>
              )} */}
            </div>
            <hr
              style={{
                margin: "10px 0 16px 0",
                borderTop: "1px solid #e3e6ea",
              }}
            />

            {post.status?.toUpperCase() === "ACCEPTED" && (
              <div
                className="mt-3 p-3 rounded shadow-sm"
                style={{
                  background: "linear-gradient(135deg, #e7f1ff, #f0f8ff)",
                  borderLeft: "5px solid #007bff",
                }}
              >
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div className="d-flex align-items-center">
                    <span className="me-2 fs-5">👨‍🔧</span>
                    <div>
                      <div className="fw-semibold">Technician Assigned</div>
                      <div className="text-muted small">
                        {post.assignedTechnicianName ||
                          post.technicianName ||
                          "Unknown Technician"}{" "}
                        (
                        {post.assignedTechnicianEmail ||
                          post.technicianEmail ||
                          "N/A"}
                        )
                      </div>
                      {post.technicianPhone && (
                        <div className="text-muted small">
                          📞 {post.technicianPhone}
                        </div>
                      )}
                      {/* Technician Rating Display */}
                      {(post.technicianEmail ||
                        post.assignedTechnicianEmail) && (
                        <div className="mt-2">
                          <TechnicianRatingDisplay
                            technicianEmail={
                              post.technicianEmail ||
                              post.assignedTechnicianEmail
                            }
                            showDetailed={false}
                            className="small"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Communication Buttons */}
                  {(post.assignedTechnicianEmail || post.technicianEmail) && (
                    <div className="d-flex gap-1">
                      <ChatButton
                        dealerEmail={post.email}
                        technicianEmail={
                          post.assignedTechnicianEmail || post.technicianEmail
                        }
                        userType="DEALER"
                        size="sm"
                        variant="outline-primary"
                        postId={post.id}
                        postTitle={`${post.carMake} ${post.carModel} Inspection`}
                      />
                    </div>
                  )}
                </div>

                <div className="d-flex align-items-center mb-2">
                  <span className="me-2 fs-5">⏰</span>
                  <div>
                    <div className="fw-semibold">Accepted At</div>
                    <div className="text-muted small">
                      {formatDate(
                        post.acceptedAt ||
                          (post.status === "ACCEPTED" ? post.updatedAt : null)
                      )}
                    </div>
                  </div>
                </div>

                <div className="d-flex align-items-center">
                  <span className="me-2 fs-5">📅</span>
                  <div>
                    <div className="fw-semibold">Expected Completion By</div>
                    <div className="text-muted small">
                      {calculateExpectedDate(
                        post.acceptedAt ||
                          (post.status === "ACCEPTED" ? post.updatedAt : null)
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Attachments Button at bottom, only if attachments exist */}
            {/* This block is now moved to the top of the status section */}

            <div className="position-absolute bottom-0 end-0 p-2 d-flex gap-2">
              {/* Chat Button for all non-pending, non-accepted statuses (to avoid duplicate in accepted section) */}
              {post.status?.toUpperCase() !== "PENDING" &&
                post.status?.toUpperCase() !== "ACCEPTED" &&
                (post.assignedTechnicianEmail || post.technicianEmail) && (
                  <ChatButton
                    dealerEmail={dealerInfo?.email}
                    technicianEmail={
                      post.assignedTechnicianEmail || post.technicianEmail
                    }
                    userType="DEALER"
                    size="sm"
                    variant="outline-primary"
                    postId={post.id}
                    postTitle={`${post.carMake} ${post.carModel} Inspection`}
                  />
                )}
              {/* View Report Button - Only for completed posts */}
              {post.status === "COMPLETED" && (
                <button
                  className="btn btn-sm btn-outline-success fw-semibold"
                  style={{
                    transition: "all 0.15s ease-in-out",
                  }}
                  onClick={() => setShowInspectionReport(true)}
                  title="View inspection report"
                >
                  📋 View Report
                </button>
              )}

              {/* Rate Technician Button - Only for completed posts */}
              {post.status === "COMPLETED" && post.technicianEmail && (
                <button
                  className="btn btn-sm btn-outline-warning fw-semibold"
                  style={{
                    transition: "all 0.15s ease-in-out",
                  }}
                  onClick={() => setShowRatingModal(true)}
                  title="Rate technician's work"
                >
                  ⭐ Rate Work
                </button>
              )}

              {/* Edit Button */}
              <button
                className={`btn btn-sm fw-semibold ${
                  post.status === "COMPLETED"
                    ? "btn-outline-secondary"
                    : "btn-outline-primary edit-button"
                }`}
                style={{
                  cursor:
                    post.status === "COMPLETED" ? "not-allowed" : "pointer",
                  opacity: post.status === "COMPLETED" ? 0.6 : 1,
                  transition: "all 0.15s ease-in-out",
                }}
                onClick={handleEditButtonClick}
                title={
                  post.status === "COMPLETED"
                    ? "Completed posts cannot be edited"
                    : "Edit post"
                }
                onMouseEnter={handleEditButtonMouseEnter}
                onMouseLeave={handleEditButtonMouseLeave}
              >
                {post.status === "COMPLETED" ? "🚫 Edit" : "✏️ Edit"}
              </button>

              {/* Cancel or Remove Button */}
              {post.status === "ACCEPTED" ? (
                <button
                  className="btn btn-sm btn-outline-danger fw-semibold"
                  style={{
                    transition: "all 0.15s ease-in-out",
                  }}
                  onClick={handleCancelButtonClick}
                  onMouseEnter={handleActionButtonMouseEnter}
                  onMouseLeave={handleActionButtonMouseLeave}
                >
                  ❌ Cancel
                </button>
              ) : (
                post.status !== "COMPLETED" &&
                post.status !== "CANCELLED" && (
                  <button
                    className="btn btn-sm btn-outline-danger fw-semibold"
                    style={{
                      transition: "all 0.15s ease-in-out",
                    }}
                    onClick={handleDeleteButtonClick}
                    onMouseEnter={handleActionButtonMouseEnter}
                    onMouseLeave={handleActionButtonMouseLeave}
                  >
                    🗑️ Remove
                  </button>
                )
              )}
            </div>
          </>
        ) : (
          <>
            {/* Editing Form */}
            <label className="fw-semibold">Description</label>
            <input
              name="content"
              value={editData.content}
              onChange={onEditChange}
              onKeyDown={(e) => e.key === "Enter" && handleSaveEdit()}
              className="form-control mb-2"
            />

            <label className="fw-semibold">Location</label>
            <Select
              options={cityOptions}
              value={
                editData.location
                  ? cityOptions.find((c) => c.value === editData.location)
                  : null
              }
              onChange={(selected) =>
                setEditData((prev) => ({
                  ...prev,
                  location: selected?.value || "",
                }))
              }
              placeholder="📍 Choose City & State"
              isSearchable
              className="mb-2"
              styles={{
                control: (base) => ({
                  ...base,
                  borderRadius: "10px",
                  fontSize: "14px",
                  border: "1px solid #ced4da",
                  boxShadow: "inset 0 1px 3px rgba(0,0,0,0.04)",
                }),
                menu: (base) => ({ ...base, zIndex: 9999 }),
              }}
              onKeyDown={(e) => e.key === "Enter" && handleSaveEdit()}
            />

            <label className="fw-semibold">Offer</label>
            <input
              name="offerAmount"
              value={editData.offerAmount}
              onChange={onEditChange}
              onKeyDown={(e) => e.key === "Enter" && handleSaveEdit()}
              className="form-control mb-3"
            />

            <label className="fw-semibold">VIN</label>
            <input
              name="vin"
              value={editData.vin || ""}
              onChange={onEditChange}
              onKeyDown={(e) => e.key === "Enter" && handleSaveEdit()}
              className="form-control mb-3"
              placeholder="Enter VIN (16 characters)"
              maxLength={16}
              style={{
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                fontFamily: "monospace",
              }}
            />

            <label className="fw-semibold">Auction Lot</label>
            <input
              name="auctionLot"
              value={editData.auctionLot || ""}
              onChange={onEditChange}
              onKeyDown={(e) => e.key === "Enter" && handleSaveEdit()}
              className="form-control mb-3"
              placeholder="Enter Auction Lot (optional)"
            />
            {editError && (
              <div
                className="alert alert-danger py-2 mb-2"
                style={{ fontSize: 14 }}
              >
                {editError}
              </div>
            )}
            <button
              className="btn btn-success me-2 animate__animated animate__pulse animate__faster"
              onClick={handleSaveEdit}
              disabled={saving}
            >
              {saving ? <Skeleton width={60} /> : "Save"}
            </button>
            <button
              className="btn btn-secondary"
              onClick={onCancelEdit}
              disabled={saving}
            >
              Cancel
            </button>
          </>
        )}

        {showCancelModal && (
          <CancelModal
            onConfirm={async () => {
              setShowCancelModal(false);
              try {
                // ✅ REAL API CALL: Update post status to CANCELLED through Gateway
                await api.post(`${API_POSTINGS_URL}/posts-update-id`, {
                  id: post.id,
                  status: "CANCELLED",
                });
                if (onNotification) {
                  onNotification("success", "Request cancelled successfully");
                }
                // Refresh the page to show updated status
                window.location.reload();
              } catch (err) {
                console.error("Error cancelling post:", err);
                if (onNotification) {
                  onNotification("error", "Failed to cancel post");
                }
              }
            }}
            onCancel={() => setShowCancelModal(false)}
          />
        )}
      </div>

      {/* Attachments Modal */}
      <Modal
        show={!!previewAttachment}
        onHide={() => setPreviewAttachment(null)}
        centered
        size="lg"
        backdrop="static"
        contentClassName="border-0 rounded-4 shadow-lg"
      >
        <Modal.Header
          closeButton
          style={{
            borderBottom: "none",
            background: "#f8f9fa",
            borderRadius: "2rem 2rem 0 0",
          }}
        >
          <Modal.Title className="fw-bold">
            Preview: {previewAttachment?.filename}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body
          className="text-center"
          style={{ background: "#f8f9fa", borderRadius: "0 0 2rem 2rem" }}
        >
          {previewAttachment?.type === "image" && (
            <img
              src={previewAttachment.url}
              alt={previewAttachment.filename}
              style={{
                maxWidth: "100%",
                maxHeight: "70vh",
                borderRadius: 12,
                boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
              }}
            />
          )}
          {previewAttachment?.type === "audio" && (
            <audio controls style={{ width: "100%" }}>
              <source src={previewAttachment.url} />
              Your browser does not support the audio tag.
            </audio>
          )}
          {previewAttachment?.type === "video" && (
            <video
              controls
              style={{
                width: "100%",
                maxHeight: "70vh",
                borderRadius: 12,
                background: "#000",
              }}
            >
              <source src={previewAttachment.url} />
              Your browser does not support the video tag.
            </video>
          )}
          {/* Navigation buttons for multiple attachments */}
          {previewAttachment?.attachments &&
            previewAttachment.attachments.length > 1 && (
              <div className="d-flex justify-content-between align-items-center mt-3">
                <button
                  className="btn btn-outline-secondary btn-sm"
                  disabled={previewAttachment.index === 0}
                  onClick={() => {
                    const prevIdx = previewAttachment.index - 1;
                    const prevAtt = previewAttachment.attachments[prevIdx];
                    setPreviewAttachment({
                      ...prevAtt,
                      index: prevIdx,
                      attachments: previewAttachment.attachments,
                    });
                  }}
                >
                  ◀ Prev
                </button>
                <span style={{ fontSize: 13 }}>
                  {previewAttachment.index + 1} /{" "}
                  {previewAttachment.attachments.length}
                </span>
                <button
                  className="btn btn-outline-secondary btn-sm"
                  disabled={
                    previewAttachment.index ===
                    previewAttachment.attachments.length - 1
                  }
                  onClick={() => {
                    const nextIdx = previewAttachment.index + 1;
                    const nextAtt = previewAttachment.attachments[nextIdx];
                    setPreviewAttachment({
                      ...nextAtt,
                      index: nextIdx,
                      attachments: previewAttachment.attachments,
                    });
                  }}
                >
                  Next ▶
                </button>
              </div>
            )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setPreviewAttachment(null)}
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Inspection Report Viewer Modal */}
      <InspectionReportViewer
        show={showInspectionReport}
        onHide={() => setShowInspectionReport(false)}
        postId={post.id}
        post={post}
      />

      {/* Rating Modal */}
      <RatingModal
        show={showRatingModal}
        onHide={() => setShowRatingModal(false)}
        post={post}
        dealerEmail={dealerInfo?.email}
        onRatingSubmitted={(rating) => {
          // Optionally refresh post data or show success message
          console.log("Rating submitted:", rating);
        }}
      />
    </div>
  );
};

export default React.memo(PostCard);
