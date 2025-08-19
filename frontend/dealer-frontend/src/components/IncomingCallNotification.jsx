import React from "react";
import { Toast, Button } from "react-bootstrap";
import { FiPhone, FiPhoneCall, FiVideo } from "react-icons/fi";
import { FaUser } from "react-icons/fa";
import "./IncomingCallNotification.css";

const IncomingCallNotification = ({
  show,
  callData,
  onAccept,
  onReject,
  className = "",
}) => {
  if (!show || !callData) return null;

  const callerName = callData.callerEmail?.split("@")[0] || "Unknown";
  const isVideo = callData.callType === "video";

  return (
    <div
      className="call-notification-backdrop"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Toast
        show={show}
        className={`incoming-call-toast ${className}`}
        style={{
          position: "relative",
          minWidth: "400px",
          maxWidth: "500px",
          backgroundColor: "white",
          borderRadius: "16px",
          animation: "globalPulse 2s infinite",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)",
        }}
      >
        <Toast.Header closeButton={false} className="border-0 pb-0">
          <div className="d-flex align-items-center w-100">
            <div className="call-type-icon me-2">
              {isVideo ? <FiVideo size={18} /> : <FiPhone size={18} />}
            </div>
            <strong className="me-auto">
              Incoming {isVideo ? "video" : "audio"} call
            </strong>
          </div>
        </Toast.Header>
        <Toast.Body className="pt-1">
          <div className="d-flex align-items-center mb-3">
            <div className="caller-avatar me-3">
              <FaUser size={24} />
            </div>
            <div>
              <div className="caller-name">{callerName}</div>
              <small className="text-muted">is calling you...</small>
            </div>
          </div>

          <div className="d-flex gap-3 justify-content-center">
            <Button
              variant="danger"
              size="lg"
              onClick={onReject}
              className="reject-btn px-4 py-2"
              style={{
                borderRadius: "50px",
                fontWeight: "bold",
                minWidth: "120px",
              }}
            >
              <FiPhone size={20} className="me-2" />
              Decline
            </Button>
            <Button
              variant="success"
              size="lg"
              onClick={onAccept}
              className="accept-btn px-4 py-2"
              style={{
                borderRadius: "50px",
                fontWeight: "bold",
                minWidth: "120px",
              }}
            >
              <FiPhoneCall size={20} className="me-2" />
              Answer
            </Button>
          </div>
        </Toast.Body>
      </Toast>
    </div>
  );
};

export default IncomingCallNotification;
