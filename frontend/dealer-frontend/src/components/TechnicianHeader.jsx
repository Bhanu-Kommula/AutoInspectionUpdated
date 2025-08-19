import React, { useState, useEffect } from "react";
import { FaUser, FaSignOutAlt, FaTachometerAlt, FaList } from "react-icons/fa";

import TechnicianNotificationBell from "./TechnicianNotificationBell";
import ChatNotificationBell from "./chat/ChatNotificationBell";

import { useNavigate } from "react-router-dom";

const TechnicianHeader = ({
  technician,
  notifications = [],
  unreadCount = 0,
  showNotifDropdown = false,
  setShowNotifDropdown,
  setShowProfileModal,
  handleLogout,
  onMarkAllAsRead,
  onClearAll,
  onMarkAsRead,
  currentPage = "dashboard", // "dashboard" or "feeds"
}) => {
  const navigate = useNavigate();

  return (
    <div
      className="position-fixed w-100"
      style={{
        top: 0,
        zIndex: 1050,
        background: "linear-gradient(to right, #0f172a, #0ea5e9)",
        borderBottom: "1px solid rgba(255,255,255,0.15)",
        boxShadow: "0 4px 25px rgba(0, 0, 0, 0.15)",
        padding: "20px 0",
      }}
    >
      <div
        className="d-flex align-items-center justify-content-between w-100"
        style={{ minWidth: 800, padding: "0 30px" }}
      >
        {/* Left Section - Company/App Name */}
        <div className="d-flex align-items-center">
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

        {/* Center Section - Technician Info */}
        <div className="d-flex flex-column align-items-center text-center">
          <div
            className="fw-bold mb-1"
            style={{
              fontSize: 18,
              lineHeight: 1.2,
              color: "white",
              textShadow: "0 1px 2px rgba(0,0,0,0.3)",
            }}
          >
            {technician?.technician_name ||
              technician?.username ||
              technician?.name ||
              "Technician"}
          </div>
          <div
            style={{
              fontSize: 13,
              lineHeight: 1.2,
              color: "rgba(255,255,255,0.9)",
              textShadow: "0 1px 2px rgba(0,0,0,0.3)",
            }}
          >
            {technician?.email || ""}
          </div>
          {technician?.location && (
            <div
              style={{
                fontSize: 11,
                lineHeight: 1.2,
                color: "rgba(255,255,255,0.7)",
                textShadow: "0 1px 2px rgba(0,0,0,0.3)",
              }}
            >
              📍 {technician.location}
            </div>
          )}
        </div>

        {/* Right Section - Actions */}
        <div className="d-flex align-items-center gap-3">
          {/* Dashboard/Feeds Button */}
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
            onClick={() =>
              navigate(
                currentPage === "dashboard"
                  ? "/tech-feeds"
                  : "/technician-dashboard"
              )
            }
          >
            {currentPage === "dashboard" ? (
              <>
                <FaList size={14} />
                Feeds
              </>
            ) : (
              <>
                <FaTachometerAlt size={14} />
                Dashboard
              </>
            )}
          </button>

          {/* Chat Notification Bell */}
          <ChatNotificationBell
            userEmail={technician?.email}
            userType="TECHNICIAN"
          />

          {/* General Notifications Bell */}
          <TechnicianNotificationBell technicianInfo={technician} />

          {/* Profile Button */}
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
            onClick={() => setShowProfileModal && setShowProfileModal(true)}
          >
            <FaUser size={14} />
            Profile
          </button>

          {/* Logout Button */}
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
          >
            <FaSignOutAlt size={14} />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default TechnicianHeader;
