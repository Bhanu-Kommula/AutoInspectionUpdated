import React, { useRef, useEffect, useState } from "react";
import { FaBell } from "react-icons/fa";
import { API_CONFIG } from "../../api";
import ChatNotificationBell from "../chat/ChatNotificationBell";

const getNotificationBorderColor = (type) => {
  switch (type) {
    case "success":
      return "#28a745";
    case "error":
      return "#dc3545";
    case "warning":
      return "#ffc107";
    case "info":
      return "#17a2b8";
    default:
      return "#6c757d";
  }
};

const ProfileHeader = ({
  dealer,
  notifications,
  unreadCount,
  showNotifDropdown,
  setShowNotifDropdown,
  setShowProfileModal,
  handleLogout,
  onMarkAllAsRead,
  onClearAll,
  onMarkAsRead,
  undoDelete,
  onUndoDelete,
}) => {
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setShowNotifDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setShowNotifDropdown]);

  return (
    <div
      className="position-fixed w-100"
      style={{
        top: 0,
        zIndex: 1050,
        background: "linear-gradient(to right, #0f172a, #0ea5e9)",
        borderBottom: "1px solid rgba(255,255,255,0.15)",
        boxShadow: "0 4px 25px rgba(0, 0, 0, 0.15)",
      }}
    >
      {/* Modern Header - Full Width Layout */}
      <div
        className="d-flex align-items-center justify-content-between w-100"
        style={{ minWidth: 800, paddingTop: 30, paddingBottom: 30 }}
      >
        {/* Left Section - Company/App Name */}
        <div className="d-flex align-items-center" style={{ paddingLeft: 30 }}>
          <div
            className="fw-bold"
            style={{
              fontSize: 20,
              letterSpacing: "0.05em",
              color: "white",
              textShadow: "0 2px 4px rgba(0,0,0,0.3)",
            }}
          >
            🛠️ AllState Auto Independent Inspection
          </div>
        </div>

        {/* Center Section - User Info */}
        <div className="d-flex flex-column align-items-center text-center">
          <div
            className="fw-bold mb-1"
            style={{
              fontSize: 16,
              lineHeight: 1.2,
              color: "white",
              textShadow: "0 1px 2px rgba(0,0,0,0.3)",
            }}
          >
            {dealer?.name || "Dealer"}
          </div>
          <div
            style={{
              fontSize: 12,
              lineHeight: 1.2,
              color: "white",
              textShadow: "0 1px 2px rgba(0,0,0,0.3)",
            }}
          >
            {dealer?.email || ""}
          </div>
        </div>

        {/* Right Section - Actions */}
        <div
          className="d-flex align-items-center gap-3"
          style={{ paddingRight: 20 }}
        >
          {/* Chat Notification Bell */}
          <ChatNotificationBell userEmail={dealer?.email} userType="DEALER" />

          <button
            ref={buttonRef}
            className="btn position-relative d-flex align-items-center justify-content-center"
            onClick={() => {
              const newState = !showNotifDropdown;
              setShowNotifDropdown(newState);
              // Auto mark all as read when opening the dropdown
              if (newState && unreadCount > 0) {
                onMarkAllAsRead();
              }
            }}
            aria-label="Notifications"
            style={{
              width: 44,
              height: 44,
              borderRadius: "14px",
              background: "rgba(255,255,255,0.9)",
              border: "1px solid rgba(0,0,0,0.1)",
              color: "#1e293b",
              backdropFilter: "blur(16px)",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              boxShadow:
                "0 4px 12px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.8)",
            }}
            onMouseEnter={(e) => {
              e.target.style.background = "rgba(255,255,255,1)";
              e.target.style.transform = "translateY(-2px) scale(1.02)";
              e.target.style.boxShadow =
                "0 8px 20px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.9)";
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "rgba(255,255,255,0.9)";
              e.target.style.transform = "translateY(0) scale(1)";
              e.target.style.boxShadow =
                "0 4px 12px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.8)";
            }}
          >
            <FaBell size={18} />
            {unreadCount > 0 && (
              <span
                className="position-absolute d-flex align-items-center justify-content-center"
                style={{
                  top: -5,
                  right: -5,
                  width: 22,
                  height: 22,
                  fontSize: 10,
                  fontWeight: 800,
                  color: "white",
                  background:
                    "linear-gradient(135deg, #ff4757 0%, #ff3838 50%, #ff2929 100%)",
                  borderRadius: "50%",
                  border: "2px solid rgba(255,255,255,0.9)",
                  boxShadow: "0 2px 8px rgba(255,71,87,0.4)",
                  animation: unreadCount > 0 ? "pulse 2s infinite" : "none",
                }}
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {showNotifDropdown && (
            <div
              ref={dropdownRef}
              style={{
                position: "absolute",
                right: 0,
                top: 52,
                width: 320,
                background: "#fff",
                border: "1px solid #eee",
                borderRadius: 8,
                boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
                zIndex: 9999,
                padding: 12,
              }}
            >
              <div className="d-flex justify-content-between align-items-center mb-2">
                <div className="fw-semibold">Notifications</div>
                {notifications.length > 0 && (
                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={onMarkAllAsRead}
                      style={{ fontSize: 10 }}
                    >
                      Read All
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={onClearAll}
                      style={{ fontSize: 10 }}
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>

              {/* Undo Delete Button */}
              {undoDelete && (
                <div
                  className="mb-3 p-3 rounded"
                  style={{
                    background: "linear-gradient(135deg, #ff6b6b, #ee5a52)",
                    border: "1px solid #ff4757",
                    color: "white",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <div className="fw-semibold" style={{ fontSize: 13 }}>
                        🗑️ Post Deleted
                      </div>
                      <div style={{ fontSize: 11, opacity: 0.9 }}>
                        Click undo to restore within 5 seconds
                      </div>
                    </div>
                    <button
                      className="btn btn-sm"
                      onClick={onUndoDelete}
                      style={{
                        background: "rgba(255,255,255,0.2)",
                        border: "1px solid rgba(255,255,255,0.3)",
                        color: "white",
                        fontSize: 11,
                        fontWeight: "bold",
                        padding: "4px 12px",
                        borderRadius: "6px",
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
                  {/* Progress bar */}
                  <div
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      height: "2px",
                      background: "rgba(255,255,255,0.3)",
                      width: "100%",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        background: "rgba(255,255,255,0.8)",
                        width: "100%",
                        animation: "shrink 5s linear forwards",
                      }}
                    ></div>
                  </div>
                </div>
              )}
              {notifications.length === 0 ? (
                <div className="text-muted">No new notifications</div>
              ) : (
                notifications.slice(0, 8).map((n) => (
                  <div
                    key={n.id}
                    className="mb-2 p-2 rounded"
                    style={{
                      border: `1px solid ${getNotificationBorderColor(n.type)}`,
                      borderLeft: `4px solid ${getNotificationBorderColor(
                        n.type
                      )}`,
                      backgroundColor: n.read ? "#f8f9fa" : "#fff",
                      cursor: "pointer",
                    }}
                    onClick={() => !n.read && onMarkAsRead(n.id)}
                  >
                    <div
                      className="fw-semibold"
                      style={{ fontSize: 14, opacity: n.read ? 0.7 : 1 }}
                    >
                      {n.message}
                    </div>
                    <div
                      className="text-muted"
                      style={{ fontSize: 11, marginTop: 2 }}
                    >
                      {n.timestamp}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          <button
            className="btn d-flex align-items-center gap-2 fw-semibold"
            style={{
              background: "rgba(255,255,255,0.9)",
              border: "1px solid rgba(0,0,0,0.1)",
              borderRadius: "12px",
              color: "#1e293b",
              fontSize: 13,
              padding: "10px 18px",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              height: 40,
              backdropFilter: "blur(16px)",
              boxShadow:
                "0 4px 12px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.8)",
              letterSpacing: "0.025em",
            }}
            onClick={() => setShowProfileModal(true)}
            onMouseEnter={(e) => {
              e.target.style.background = "rgba(255,255,255,1)";
              e.target.style.transform = "translateY(-2px) scale(1.02)";
              e.target.style.boxShadow =
                "0 8px 20px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.9)";
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "rgba(255,255,255,0.9)";
              e.target.style.transform = "translateY(0) scale(1)";
              e.target.style.boxShadow =
                "0 4px 12px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.8)";
            }}
          >
            {dealer?.profileImagePath ? (
              <img
                src={`${API_CONFIG.DEALER_BASE_URL}${dealer.profileImagePath}`}
                alt="Profile"
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "2px solid rgba(0,0,0,0.1)",
                }}
                onError={(e) => {
                  console.error("Profile image failed to load:", e.target.src);
                  e.target.style.display = "none";
                }}
                onLoad={() => {
                  console.log(
                    "Profile image loaded successfully:",
                    `${API_CONFIG.DEALER_BASE_URL}${dealer?.profileImagePath}`
                  );
                }}
              />
            ) : (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            )}
            Profile
          </button>

          <button
            className="btn d-flex align-items-center gap-2 fw-bold"
            style={{
              background:
                "linear-gradient(135deg, #dc3545 0%, #c82333 50%, #bd2130 100%)",
              border: "1px solid rgba(220,53,69,0.3)",
              borderRadius: "12px",
              color: "white",
              fontSize: 13,
              padding: "10px 18px",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              height: 40,
              boxShadow:
                "0 4px 12px rgba(220,53,69,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
              letterSpacing: "0.025em",
            }}
            onClick={handleLogout}
            onMouseEnter={(e) => {
              e.target.style.background =
                "linear-gradient(135deg, #e74c3c 0%, #dc3545 50%, #c82333 100%)";
              e.target.style.transform = "translateY(-2px) scale(1.02)";
              e.target.style.boxShadow =
                "0 8px 20px rgba(220,53,69,0.4), inset 0 1px 0 rgba(255,255,255,0.3)";
            }}
            onMouseLeave={(e) => {
              e.target.style.background =
                "linear-gradient(135deg, #dc3545 0%, #c82333 50%, #bd2130 100%)";
              e.target.style.transform = "translateY(0) scale(1)";
              e.target.style.boxShadow =
                "0 4px 12px rgba(220,53,69,0.3), inset 0 1px 0 rgba(255,255,255,0.2)";
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.59L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
            </svg>
            Logout
          </button>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%,
          100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.8;
          }
        }
      `}</style>
    </div>
  );
};

export default ProfileHeader;
