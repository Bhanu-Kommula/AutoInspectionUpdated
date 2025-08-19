// src/components/CancelModal.jsx

import React from "react";

function CancelModal({ show, onConfirm, onCancel }) {
  if (!show) return null;

  return (
    <div
      className="modal-backdrop"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 1050,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        className="modal-content shadow-lg"
        style={{
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "24px",
          minWidth: "320px",
          maxWidth: "480px",
          zIndex: 1060,
          animation: "fadeIn 0.3s ease",
        }}
      >
        <div
          className="modal-header bg-danger text-white d-flex justify-content-between align-items-center"
          style={{ borderTopLeftRadius: "12px", borderTopRightRadius: "12px" }}
        >
          <h5 className="modal-title mb-0">⚠️ Confirm Cancellation</h5>
          <button
            className="btn-close"
            onClick={onCancel}
            style={{ backgroundColor: "white", border: "none" }}
          />
        </div>

        <div className="modal-body text-center mt-3">
          <p className="fs-5">
            Are you sure you want to cancel this service request?
          </p>
        </div>

        <div className="modal-footer d-flex justify-content-center gap-3 mt-2">
          <button className="btn btn-danger" onClick={onConfirm}>
            Yes, Cancel
          </button>
          <button className="btn btn-secondary" onClick={onCancel}>
            No, Go Back
          </button>
        </div>
      </div>
    </div>
  );
}

export default CancelModal;
