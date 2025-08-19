import React, { useState, useEffect, useRef } from "react";
// import Select from "react-select"; // Removed - not used
import axios from "axios";
// Toast import removed - using notifications instead
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import SearchableLocationDropdown from "./components/SearchableLocationDropdown";
import { API_CONFIG } from "./api";
// Authentication system completely removed

function capitalize(str) {
  if (!str || typeof str !== "string") return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
function capitalizeWords(str) {
  return str
    .split(" ")
    .map((word) => capitalize(word))
    .join(" ");
}

// VIN validation helper function
function validateVIN(vin) {
  if (!vin || vin.trim() === "") return { isValid: true, message: "" };

  if (vin.length !== 16) {
    return {
      isValid: false,
      message: `VIN must be exactly 16 characters (currently ${vin.length})`,
    };
  }

  if (!/^[A-Za-z0-9]{16}$/.test(vin)) {
    return {
      isValid: false,
      message:
        "VIN must contain only letters (A-Z, a-z) and numbers (0-9), no spaces or special characters",
    };
  }

  return { isValid: true, message: "VIN format is valid" };
}

function PostForm({
  post,
  setPost,
  selectedCity,
  setSelectedCity,
  cityOptions,
  iconIndex,
  postIcons,
  onPostSubmit,
  onNotification,
}) {
  // All authentication code removed as requested
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Special handling for VIN field
    if (name === "vin") {
      // Remove spaces and special characters, convert to uppercase
      const cleanedVin = value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
      // Limit to 16 characters
      const truncatedVin = cleanedVin.slice(0, 16);
      setPost({ ...post, [name]: truncatedVin });
    } else {
      setPost({ ...post, [name]: value });
    }
  };

  const [headingAnimation, setHeadingAnimation] = useState("animate__flipInX");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setHeadingAnimation(""); // remove class to retrigger
      setTimeout(() => setHeadingAnimation("animate__flipInX"), 50); // re-add it shortly after
    }, 10000);

    return () => clearInterval(interval); // clean up
  }, []);

  // const api = axios.create(); // Removed - using API_CONFIG instead

  const [error, setError] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [uploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef();

  // Accept images, audio, video, and docs
  const ACCEPTED_FILE_TYPES =
    "image/*,audio/*,video/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt";
  const MAX_FILE_SIZE_MB = 20;
  const MAX_TOTAL_SIZE_MB = 40;

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    let totalSize = files.reduce((sum, file) => sum + file.size, 0);
    if (files.some((file) => file.size > MAX_FILE_SIZE_MB * 1024 * 1024)) {
      setUploadError(`Each file must be less than ${MAX_FILE_SIZE_MB} MB.`);
      return;
    }
    if (totalSize > MAX_TOTAL_SIZE_MB * 1024 * 1024) {
      setUploadError(`Total upload must be less than ${MAX_TOTAL_SIZE_MB} MB.`);
      return;
    }
    setUploadError("");
    setAttachments(files);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setUploadError("");
    setSubmitting(true);
    // VIN validation: if entered, must be exactly 16 alphanumeric characters
    if (post.vin && post.vin.trim() !== "") {
      const vinValidation = validateVIN(post.vin);
      if (!vinValidation.isValid) {
        setError(vinValidation.message);
        if (onNotification) {
          onNotification("error", vinValidation.message);
        }
        setSubmitting(false);
        return;
      }
    }
    // Validation: all fields required
    if (!post.content.trim()) {
      setError("Description is required.");
      if (onNotification) {
        onNotification("error", "Description is required.");
      }
      setSubmitting(false);
      return;
    }

    if (!post.location.trim()) {
      setError("Location is required.");
      if (onNotification) {
        onNotification("error", "Location is required.");
      }
      setSubmitting(false);
      return;
    }

    if (!post.offerAmount.trim()) {
      setError("Offer amount is required.");
      if (onNotification) {
        onNotification("error", "Offer amount is required.");
      }
      setSubmitting(false);
      return;
    }
    try {
      const processedLocation = post.location
        .split(",")
        .map((part) => capitalizeWords(part.trim()))
        .join(", ");

      // Get dealer info from localStorage (set during login) - NO FALLBACKS
      const dealerInfo = JSON.parse(localStorage.getItem("dealerInfo") || "{}");

      // Validate dealer info exists (no mock data allowed)
      if (!dealerInfo.email) {
        console.error("❌ No dealer email found. Cannot submit post.");
        setError("Please log in first to submit posts.");
        setSubmitting(false);
        return;
      }

      // ✅ BACKEND MAPPING: Matches PostRequestDto exactly - REAL DATA ONLY
      const requestData = {
        email: dealerInfo.email, // Must be real dealer email, no fallbacks
        content: post.content,
        location: processedLocation,
        offerAmount: parseFloat(post.offerAmount) || 0, // Backend expects Double
        vin: post.vin || null,
        auctionLot: post.auctionLot || null,
        // Note: status and id are auto-generated by backend
      };

      console.log("PostForm: Original location:", post.location);
      console.log("PostForm: Processed location:", processedLocation);
      console.log("PostForm: Sending request data:", requestData);
      // Authorization header logging removed as requested

      // ✅ REAL API CALL: Submit to backend through Gateway
      const res = await axios.post(
        `${API_CONFIG.POSTS_BASE_URL}/submit-post`,
        requestData,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      console.log("PostForm: Post submission response:", res.data);
      // const newPostId = res.data?.id; // Get the actual post ID from backend - TODO: Use for attachments
      setPost({
        content: "",
        location: "",
        offerAmount: "",
        vin: "",
        auctionLot: "",
      });
      setSelectedCity(null);
      if (onNotification) {
        onNotification(
          "success",
          "New post added. Nearby technicians have been notified!"
        );
      }
      // Upload attachments if any - TODO: Implement attachment endpoint in backend
      // if (attachments.length && newPostId) {
      //   setUploading(true);
      //   for (const file of attachments) {
      //     const formData = new FormData();
      //     formData.append("file", file);
      //     try {
      //       const uploadRes = await api.post(
      //         `${API_CONFIG.POSTINGS_BASE_URL}/api/v1/posts/${newPostId}/attachment`,
      //         formData,
      //         { headers: { "Content-Type": "multipart/form-data" } }
      //       );
      //     } catch (err) {
      //       let errorMessage = "Upload failed";
      //       if (err?.response?.data) {
      //         if (typeof err.response.data === "string") {
      //           errorMessage = err.response.data;
      //         } else if (err.response.data.error) {
      //           errorMessage = err.response.data.error;
      //         } else if (err.response.data.message) {
      //           errorMessage = err.response.data.message;
      //         } else {
      //           errorMessage = JSON.stringify(err.response.data);
      //         }
      //       } else if (err?.message) {
      //         errorMessage = err.message;
      //       }
      //       setUploadError(`Failed to upload ${file.name}: ${errorMessage}`);
      //     }
      //   }
      //   setUploading(false);
      //   setAttachments([]);
      //   if (fileInputRef.current) fileInputRef.current.value = "";
      // }
      console.log("PostForm: Calling onPostSubmit callback");
      if (onPostSubmit) onPostSubmit();
      console.log("PostForm: onPostSubmit callback completed");
    } catch (err) {
      console.error("PostForm: Error details:", err);
      console.error("PostForm: Response data:", err?.response?.data);
      console.error("PostForm: Response status:", err?.response?.status);

      const errorMessage = err?.response?.data;
      if (
        typeof errorMessage === "string" &&
        errorMessage.includes("duplicate")
      ) {
        if (onNotification) {
          onNotification("warning", "A similar post already exists.");
        }
      } else {
        let errorText = "Failed to submit post";
        if (typeof errorMessage === "string") {
          errorText = errorMessage;
        } else if (err?.response?.data?.message) {
          errorText = err.response.data.message;
        } else if (err?.message) {
          errorText = err.message;
        }

        if (onNotification) {
          onNotification("error", errorText);
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="mx-auto mb-4"
      style={{
        maxWidth: "800px",
        padding: "0",
        borderRadius: "20px",
        background: "#f6f8fa",
        boxShadow: "0 8px 32px rgba(44,62,80,0.12)",
        border: "1px solid #e0e0e0",
        transition: "all 0.3s ease",
      }}
    >
      <div
        style={{
          background: "linear-gradient(90deg, #457b9d 0%, #a8dadc 100%)",
          borderTopLeftRadius: "20px",
          borderTopRightRadius: "20px",
          padding: "24px 32px 12px 32px",
        }}
      >
        <h4
          className={`text-center mb-0 animate__animated ${headingAnimation}`}
          style={{
            fontSize: "24px",
            fontWeight: "700",
            color: "#fff",
            fontFamily: "'Poppins', sans-serif",
            letterSpacing: "0.5px",
          }}
        >
          {postIcons[iconIndex]} Post a Car Service Request
        </h4>
      </div>
      <form onSubmit={handleSubmit} style={{ padding: "24px 32px 24px 32px" }}>
        {submitting && (
          <div className="mb-3">
            <Skeleton height={40} count={2} />
          </div>
        )}
        {error && (
          <div
            className="alert alert-danger mt-3"
            role="alert"
            style={{ fontSize: 15, padding: 12 }}
          >
            {error}
          </div>
        )}
        {/* Vehicle Details Section */}
        <div
          style={{
            background: "#fff",
            borderRadius: "16px",
            boxShadow: "0 2px 8px rgba(44,62,80,0.06)",
            padding: "20px 20px 16px 20px",
            marginBottom: "20px",
            border: "1px solid #e3e6ea",
          }}
        >
          <div className="d-flex flex-row gap-2" style={{ flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <label
                className="fw-semibold mb-2 d-block"
                style={{ fontSize: 16 }}
              >
                Vehicle VIN (16 characters)
              </label>
              <input
                type="text"
                name="vin"
                placeholder="16-character VIN (A-Z, 0-9 only)"
                value={post.vin || ""}
                onChange={handleChange}
                className="form-control"
                style={{
                  borderRadius: "12px",
                  padding: "12px 16px",
                  fontSize: "15px",
                  border:
                    post.vin &&
                    post.vin.length > 0 &&
                    !validateVIN(post.vin).isValid
                      ? "1px solid #dc3545"
                      : "1px solid #ced4da",
                  background: "#f8fafc",
                  height: 48,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  fontFamily: "monospace",
                }}
                maxLength={16}
                pattern="[A-Za-z0-9]{16}"
                title="VIN must be exactly 16 characters (A-Z, a-z, 0-9 only)"
              />
              {post.vin && post.vin.length > 0 && (
                <div
                  className="mt-2"
                  style={{
                    fontSize: "13px",
                    color: validateVIN(post.vin).isValid
                      ? "#28a745"
                      : "#dc3545",
                    fontWeight: "500",
                  }}
                >
                  {post.vin.length}/16 characters
                  {validateVIN(post.vin).isValid &&
                    post.vin.length === 16 &&
                    " ✓ Valid format"}
                  {!validateVIN(post.vin).isValid && " ⚠ Invalid format"}
                </div>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <label
                className="fw-semibold mb-2 d-block"
                style={{ fontSize: 16 }}
              >
                Auction Lot Details
              </label>
              <input
                type="text"
                name="auctionLot"
                placeholder="Auction lot (optional)"
                value={post.auctionLot || ""}
                onChange={handleChange}
                className="form-control"
                style={{
                  borderRadius: "12px",
                  padding: "12px 16px",
                  fontSize: "15px",
                  border: "1px solid #ced4da",
                  background: "#f8fafc",
                  height: 48,
                }}
              />
            </div>
          </div>
        </div>
        {/* Service Request Section */}
        <div
          style={{
            background: "#fff",
            borderRadius: "16px",
            boxShadow: "0 2px 8px rgba(44,62,80,0.06)",
            padding: "20px 20px 16px 20px",
            marginBottom: "16px",
            border: "1px solid #e3e6ea",
          }}
        >
          <label
            htmlFor="post-description"
            className="fw-semibold mb-2 d-block"
            style={{ fontSize: 16 }}
          >
            Description <span style={{ color: "red" }}>*</span>
          </label>
          <textarea
            id="post-description"
            name="content"
            placeholder="🔧 Describe the issue or service you need (e.g., AC not working, oil leak...)"
            value={post.content}
            onChange={handleChange}
            className="form-control mb-3"
            style={{
              borderRadius: "12px",
              padding: "16px",
              fontSize: "15px",
              border: "1px solid #ced4da",
              background: "#f8fafc",
              boxShadow: "inset 0 1px 2px rgba(0,0,0,0.03)",
              minHeight: 80,
              maxHeight: 120,
            }}
            rows="3"
            required
          />
          <div className="d-flex flex-row gap-2" style={{ flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <label
                className="fw-semibold mb-2 d-block"
                style={{ fontSize: 16 }}
              >
                Location <span style={{ color: "red" }}>*</span>
              </label>
              <SearchableLocationDropdown
                name="location"
                value={post.location}
                onChange={(e) => {
                  setPost({ ...post, location: e.target.value });
                  // Update selectedCity for compatibility if needed elsewhere
                  setSelectedCity({
                    value: e.target.value,
                    label: e.target.value,
                  });
                }}
                placeholder="📍 Search for city & state"
                required
                className="w-100"
              />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <label
                className="fw-semibold mb-2 d-block"
                style={{ fontSize: 16 }}
              >
                Offer Amount <span style={{ color: "red" }}>*</span>
              </label>
              <input
                type="text"
                name="offerAmount"
                placeholder="💵 Offer amount"
                value={post.offerAmount}
                onChange={handleChange}
                className="form-control"
                style={{
                  borderRadius: "12px",
                  padding: "12px 16px",
                  fontSize: "15px",
                  border: "1px solid #ced4da",
                  background: "#f8fafc",
                  height: 48,
                }}
                required
              />
            </div>
          </div>
        </div>
        {/* Attachments */}
        <div className="mb-4">
          <label
            className="fw-semibold mb-2 d-flex align-items-center gap-2"
            style={{ fontSize: 16 }}
          >
            <span role="img" aria-label="attachment">
              📎
            </span>
            Upload car images/docs (optional)
          </label>
          <input
            type="file"
            multiple
            onChange={handleFileChange}
            className="form-control"
            style={{
              borderRadius: 12,
              fontSize: 15,
              border: "2px dashed #bfc9d1",
              background: "#f8fafc",
              padding: "12px",
            }}
            accept={ACCEPTED_FILE_TYPES}
            placeholder="Car images, audio, video, PDFs, or docs"
            ref={fileInputRef}
          />
          {attachments.length > 0 && (
            <ul className="small mt-2 mb-0" style={{ paddingLeft: 18 }}>
              {attachments.map((file, idx) => (
                <li key={idx}>{file.name}</li>
              ))}
            </ul>
          )}
          {uploading && (
            <div className="text-info small mt-1">Uploading files...</div>
          )}
          {uploadError && (
            <div className="text-danger small mt-1">{uploadError}</div>
          )}
        </div>
        <button
          type="submit"
          className="w-100"
          style={{
            background: "linear-gradient(90deg, #457b9d 0%, #1d3557 100%)",
            color: "#fff",
            fontWeight: "700",
            fontSize: "18px",
            padding: "16px",
            border: "none",
            borderRadius: "12px",
            boxShadow: "0 4px 16px rgba(69, 123, 157, 0.15)",
            transition: "all 0.2s ease",
            letterSpacing: "0.3px",
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = "translateY(-1px) scale(1.02)";
            e.target.style.boxShadow = "0 6px 16px rgba(69, 123, 157, 0.18)";
            e.target.style.filter = "brightness(1.04)";
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = "translateY(0) scale(1)";
            e.target.style.boxShadow = "0 2px 8px rgba(69, 123, 157, 0.10)";
            e.target.style.filter = "brightness(1)";
          }}
          disabled={submitting}
        >
          {submitting ? <Skeleton width={80} /> : "✨ Submit Post"}
        </button>
      </form>
    </div>
  );
}

export default PostForm;
