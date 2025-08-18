import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import api, { API_CONFIG } from "../api";
import { initializeDealerSession } from "../utils/sessionManager";
import "bootstrap/dist/css/bootstrap.min.css";

function DealerLogin() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Use hardcoded URL to bypass any axios instance issues
      const fullUrl = "http://localhost:8088/dealer/api/dealers/login";
      console.log("API_CONFIG.DEALER_BASE_URL:", API_CONFIG.DEALER_BASE_URL);
      console.log("Using hardcoded URL:", fullUrl);
      console.log("Dealer Login - Request data:", formData);

      const response = await axios.post(fullUrl, formData, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("Dealer Login - Response:", response.data);

      if (response.data && response.data.success) {
        // Initialize dealer session with timeout monitoring
        initializeDealerSession(response.data.data);
        console.log("Dealer Login - Success, navigating to postings");
        navigate("/postings");
      } else {
        setError(response.data?.message || "Login failed");
      }
    } catch (err) {
      console.error("Dealer Login - Error:", err);
      if (err.response?.status === 401) {
        setError("Invalid email or password");
      } else if (err.response?.status === 404) {
        setError("Dealer not found");
      } else {
        setError("Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center px-3"
      style={{
        background:
          "linear-gradient(135deg, #e0f7fa 0%, #f3e5f5 50%, #fffde7 100%)",
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      <div
        className="card shadow-lg border-0"
        style={{
          maxWidth: "450px",
          width: "100%",
          borderRadius: "20px",
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(20px)",
        }}
      >
        <div
          className="card-header text-center text-white"
          style={{
            background: "linear-gradient(90deg, #0d6efd 0%, #6610f2 100%)",
            borderTopLeftRadius: "20px",
            borderTopRightRadius: "20px",
            padding: "2rem",
          }}
        >
          <h3 className="mb-0 fw-bold">👤 Dealer Login</h3>
          <p className="mb-0 mt-2" style={{ opacity: 0.9 }}>
            Access your dealer dashboard
          </p>
        </div>

        <div className="card-body p-4">
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="email" className="form-label fw-semibold">
                Email Address <span className="text-danger">*</span>
              </label>
              <input
                type="email"
                className="form-control form-control-lg"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="Enter your email"
                autoComplete="email"
                style={{
                  borderRadius: "12px",
                  border: "2px solid #e3e6ea",
                  padding: "12px 16px",
                }}
              />
            </div>

            <div className="mb-4">
              <label htmlFor="password" className="form-label fw-semibold">
                Password <span className="text-danger">*</span>
              </label>
              <input
                type="password"
                className="form-control form-control-lg"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Enter your password"
                autoComplete="current-password"
                style={{
                  borderRadius: "12px",
                  border: "2px solid #e3e6ea",
                  padding: "12px 16px",
                }}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg w-100 fw-bold"
              disabled={loading}
              style={{
                borderRadius: "12px",
                background: "linear-gradient(90deg, #0d6efd 0%, #6610f2 100%)",
                border: "none",
                padding: "14px",
              }}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" />
                  Logging in...
                </>
              ) : (
                "Login to Dashboard"
              )}
            </button>
          </form>

          <div className="text-center mt-4">
            <p className="text-muted">
              Don't have an account?{" "}
              <button
                className="btn btn-link p-0 fw-semibold"
                onClick={() => navigate("/dealer-register")}
              >
                Register here
              </button>
            </p>
            <button
              className="btn btn-outline-secondary mt-2"
              onClick={() => navigate("/")}
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DealerLogin;
