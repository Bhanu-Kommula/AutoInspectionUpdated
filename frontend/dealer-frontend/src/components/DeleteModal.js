// components/DeleteModal.js
import React from "react";
import { createPortal } from "react-dom";

function DeleteModal({ onCancel, onConfirm }) {
  const modalContent = (
    <div
      className="custom-modal-overlay"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        height: "100vh",
        width: "100vw",
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "20px",
        boxSizing: "border-box",
      }}
    >
      <div
        className="custom-modal-box"
        style={{
          background: "#fff",
          borderRadius: "16px",
          padding: "30px",
          width: "90%",
          maxWidth: "420px",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
          animation: "fadeInPop 0.35s ease-in-out",
          position: "relative",
          transform: "translateZ(0)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <div
            style={{
              fontSize: "48px",
              color: "#dc3545",
              marginBottom: "10px",
            }}
          >
            ⚠️
          </div>
          <h4
            style={{
              fontWeight: "bold",
              marginBottom: "10px",
              color: "#333",
            }}
          >
            Delete This Post?
          </h4>
          <p style={{ color: "#666", fontSize: "14px" }}>
            This action <strong>cannot be undone</strong>. Are you sure you want
            to permanently delete this post?
          </p>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "12px",
          }}
        >
          <button
            style={{
              padding: "10px 20px",
              backgroundColor: "#f1f1f1",
              color: "#333",
              border: "none",
              borderRadius: "8px",
              fontWeight: "bold",
              cursor: "pointer",
              transition: "all 0.3s ease",
              boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "#e2e2e2";
              e.target.style.transform = "translateY(-2px)";
              e.target.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.2)";
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "#f1f1f1";
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 2px 5px rgba(0, 0, 0, 0.1)";
            }}
            onClick={onCancel}
          >
            Cancel
          </button>

          <button
            style={{
              padding: "10px 20px",
              background: "linear-gradient(to right, #d53369, #daae51)",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontWeight: "bold",
              cursor: "pointer",
              transition: "all 0.3s ease",
              boxShadow: "0 2px 6px rgba(213, 51, 105, 0.4)",
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = "translateY(-2px) scale(1.05)";
              e.target.style.boxShadow = "0 6px 15px rgba(213, 51, 105, 0.6)";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0) scale(1)";
              e.target.style.boxShadow = "0 2px 6px rgba(213, 51, 105, 0.4)";
            }}
            onClick={onConfirm}
          >
            Yes, Delete
          </button>
        </div>
      </div>
    </div>
  );

  // Use React Portal to render the modal directly in the document body
  return createPortal(modalContent, document.body);
}

export default DeleteModal;
