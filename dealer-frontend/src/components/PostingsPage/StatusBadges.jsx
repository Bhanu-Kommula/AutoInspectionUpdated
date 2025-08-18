import React from "react";

const StatusBadges = ({ filters, statusCounts, applyFilter }) => {
  const statusConfig = [
    {
      key: "PENDING",
      label: "Pending",
      icon: "🟡",
      gradient: "linear-gradient(135deg, #ffc107 0%, #ffb300 100%)",
      shadowColor: "rgba(255, 193, 7, 0.3)",
      textColor: "#212529",
    },
    {
      key: "ACCEPTED",
      label: "Accepted",
      icon: "🔵",
      gradient: "linear-gradient(135deg, #007bff 0%, #0056b3 100%)",
      shadowColor: "rgba(0, 123, 255, 0.3)",
      textColor: "#ffffff",
    },
    {
      key: "INPROGRESS",
      label: "In Progress",
      icon: "🟠",
      gradient: "linear-gradient(135deg, #17a2b8 0%, #138496 100%)",
      shadowColor: "rgba(23, 162, 184, 0.3)",
      textColor: "#ffffff",
    },
    {
      key: "CANCELLED",
      label: "Cancelled",
      icon: "🔴",
      gradient: "linear-gradient(135deg, #dc3545 0%, #c82333 100%)",
      shadowColor: "rgba(220, 53, 69, 0.3)",
      textColor: "#ffffff",
    },
    {
      key: "COMPLETED",
      label: "Completed",
      icon: "🟢",
      gradient: "linear-gradient(135deg, #28a745 0%, #1e7e34 100%)",
      shadowColor: "rgba(40, 167, 69, 0.3)",
      textColor: "#ffffff",
    },
  ];

  return (
    <div className="w-100 mb-4">
      {/* Status Badges Container */}
      <div
        className="d-flex justify-content-center flex-wrap gap-3"
        style={{
          padding: "16px",
          background: "rgba(248, 249, 250, 0.5)",
          borderRadius: "16px",
          border: "1px solid rgba(0, 0, 0, 0.05)",
          backdropFilter: "blur(10px)",
        }}
      >
        {statusConfig.map(
          ({ key, label, icon, gradient, shadowColor, textColor }) => {
            const isActive = filters.status === key;
            const count = statusCounts[key] || 0;

            return (
              <button
                key={key}
                className="btn position-relative d-flex align-items-center gap-2 fw-semibold border-0"
                onClick={() => applyFilter("status", key)}
                style={{
                  background: isActive
                    ? "linear-gradient(135deg, #2c3e50 0%, #34495e 100%)"
                    : gradient,
                  color: isActive ? "#ffffff" : textColor,
                  borderRadius: "12px",
                  padding: "10px 16px",
                  fontSize: 13,
                  minWidth: "130px",
                  height: "44px",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  boxShadow: isActive
                    ? "0 6px 20px rgba(44, 62, 80, 0.4), inset 0 1px 0 rgba(255,255,255,0.1)"
                    : `0 4px 12px ${shadowColor}, inset 0 1px 0 rgba(255,255,255,0.2)`,
                  letterSpacing: "0.025em",
                  transform: isActive
                    ? "translateY(-1px) scale(1.02)"
                    : "translateY(0) scale(1)",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.target.style.transform = "translateY(-2px) scale(1.03)";
                    e.target.style.boxShadow = `0 8px 24px ${shadowColor}, inset 0 1px 0 rgba(255,255,255,0.3)`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.target.style.transform = "translateY(0) scale(1)";
                    e.target.style.boxShadow = `0 4px 12px ${shadowColor}, inset 0 1px 0 rgba(255,255,255,0.2)`;
                  }
                }}
              >
                {/* Circle Icon */}
                <span
                  style={{
                    fontSize: 14,
                    filter: isActive ? "brightness(1.2)" : "brightness(1)",
                  }}
                >
                  {icon}
                </span>

                {/* Label and Count */}
                <div className="d-flex align-items-center gap-2">
                  <span style={{ fontSize: 13, fontWeight: "600" }}>
                    {label}
                  </span>
                  <span
                    className="badge"
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      background: isActive
                        ? "rgba(255,255,255,0.2)"
                        : "rgba(0,0,0,0.15)",
                      color: isActive ? "#ffffff" : textColor,
                      borderRadius: "8px",
                      padding: "2px 6px",
                      minWidth: "20px",
                    }}
                  >
                    {count}
                  </span>
                </div>

                {/* Active Indicator */}
                {isActive && (
                  <div
                    className="position-absolute"
                    style={{
                      top: -2,
                      right: -2,
                      width: 8,
                      height: 8,
                      background: "linear-gradient(135deg, #00d4ff, #007bff)",
                      borderRadius: "50%",
                      border: "2px solid white",
                      boxShadow: "0 2px 8px rgba(0, 212, 255, 0.4)",
                    }}
                  />
                )}
              </button>
            );
          }
        )}
      </div>
    </div>
  );
};

export default StatusBadges;
