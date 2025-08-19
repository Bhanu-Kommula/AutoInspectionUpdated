import React, { useState, useEffect, useRef } from "react";
import { FaBell, FaTimes, FaCheck, FaTrash } from "react-icons/fa";
import { API_CONFIG } from "../api";

/**
 * General Notification Bell Component for Technicians
 * Shows all types of notifications (not just chat) like the dealer system
 */
const TechnicianNotificationBell = ({ technicianInfo }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  // Load notifications from API
  useEffect(() => {
    if (technicianInfo?.id) {
      loadNotifications();
    }
  }, [technicianInfo?.id]);

  // Handle click outside to close dropdown
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
  }, []);

  // Load notifications from backend
  const loadNotifications = async () => {
    try {
      // Try to get notifications from technician service
      const response = await fetch(
        `${API_CONFIG.API_GATEWAY_URL}/technician/api/technicians/${technicianInfo.id}/notifications`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      } else {
        // On failure, show empty state (no dummy data)
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Error loading notifications:", error);
      // On error, show empty state
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  // Clear all notifications
  const handleClearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  // Mark single notification as read
  const handleMarkAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  // Get notification border color based on type
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

  if (!technicianInfo) return null;

  return (
    <div className="position-relative d-inline-block">
      {/* Notification Bell Button */}
      <button
        ref={buttonRef}
        className="btn position-relative d-flex align-items-center justify-content-center"
        onClick={() => {
          const newState = !showNotifDropdown;
          setShowNotifDropdown(newState);
          // Auto mark all as read when opening the dropdown
          if (newState && unreadCount > 0) {
            handleMarkAllAsRead();
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
                  onClick={handleMarkAllAsRead}
                  style={{ fontSize: 10 }}
                >
                  Read All
                </button>
                <button
                  className="btn btn-sm btn-outline-danger"
                  onClick={handleClearAll}
                  style={{ fontSize: 10 }}
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="text-muted">No new notifications</div>
          ) : (
            notifications.slice(0, 8).map((n) => (
              <div
                key={n.id}
                className="mb-2 p-2 rounded"
                style={{
                  border: `1px solid ${getNotificationBorderColor(n.type)}`,
                  borderLeft: `4px solid ${getNotificationBorderColor(n.type)}`,
                  backgroundColor: n.read ? "#f8f9fa" : "#fff",
                  cursor: "pointer",
                }}
                onClick={() => !n.read && handleMarkAsRead(n.id)}
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

          {/* Refresh Button */}
          <div className="text-center mt-2">
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={loadNotifications}
              style={{ fontSize: 10 }}
            >
              Refresh
            </button>
          </div>
        </div>
      )}

      {/* CSS Animation for pulse effect */}
      <style>{`
        @keyframes pulse {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default TechnicianNotificationBell;
