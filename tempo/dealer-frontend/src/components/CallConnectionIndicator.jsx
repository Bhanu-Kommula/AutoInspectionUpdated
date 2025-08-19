import React from "react";
import { Spinner } from "react-bootstrap";

const CallConnectionIndicator = ({ status, targetUser, callType }) => {
  const getStatusDisplay = () => {
    switch (status) {
      case "calling":
        return {
          text: `Calling ${targetUser}...`,
          icon: (
            <div className="calling-animation">
              <div className="call-wave"></div>
              <div className="call-wave"></div>
              <div className="call-wave"></div>
            </div>
          ),
          description: "Please wait while we connect you",
        };
      case "connecting":
        return {
          text: "Connecting...",
          icon: <Spinner animation="border" variant="primary" />,
          description: "Setting up the connection",
        };
      case "connected":
        return {
          text: "Connected",
          icon: <div className="connected-indicator">✓</div>,
          description: "Call in progress",
        };
      default:
        return {
          text: "Initializing...",
          icon: <Spinner animation="border" variant="secondary" size="sm" />,
          description: "Getting ready",
        };
    }
  };

  const statusDisplay = getStatusDisplay();

  return (
    <div className="call-connection-indicator">
      <div className="connection-status">
        <div className="status-icon mb-3">{statusDisplay.icon}</div>
        <h4 className="status-text mb-2">{statusDisplay.text}</h4>
        <p className="status-description text-muted">
          {statusDisplay.description}
        </p>
        {callType && (
          <small className="call-type-badge">
            {callType.toUpperCase()} CALL
          </small>
        )}
      </div>
    </div>
  );
};

export default CallConnectionIndicator;
