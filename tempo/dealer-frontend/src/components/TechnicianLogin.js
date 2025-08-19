import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import api, { API_CONFIG } from "../api";
import { storeTechnicianData } from "../utils/sessionManager";
import "bootstrap/dist/css/bootstrap.min.css";

function TechnicianLogin() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "", // Note: Backend currently doesn't validate password, but keeping for UI consistency
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
      // Use the correct technician service endpoint through gateway
      const fullUrl = `${API_CONFIG.TECHNICIAN_BASE_URL}/login`;
      console.log(
        "API_CONFIG.TECHNICIAN_BASE_URL:",
        API_CONFIG.TECHNICIAN_BASE_URL
      );
      console.log("Using technician service URL:", fullUrl);
      console.log("Technician Login - Request data:", formData);
      console.log("Full URL being called:", fullUrl);

      const response = await axios.post(fullUrl, formData, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("Technician Login - Response:", response.data);

      if (response.data && !response.data.error) {
        // Store technician info using session manager (isolated per browser session)
        // This will automatically initialize session timeout monitoring
        storeTechnicianData(response.data);
        console.log("Technician Login - Success, navigating to tech feeds");
        navigate("/tech-feeds");
      } else {
        setError(response.data?.error || "Login failed");
      }
    } catch (err) {
      console.error("Technician Login - Error:", err);
      console.error("Error response:", err.response?.data);
      console.error("Error status:", err.response?.status);

      if (err.response?.status === 401) {
        setError("Invalid email or technician not found");
      } else if (err.response?.status === 404) {
        setError(
          "Technician service not found. Please check if the backend is running."
        );
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
          "linear-gradient(135deg, #e8f5e8 0%, #f0f8f0 50%, #e8ffe8 100%)",
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
            background: "linear-gradient(90deg, #198754 0%, #20c997 100%)",
            borderTopLeftRadius: "20px",
            borderTopRightRadius: "20px",
            padding: "2rem",
          }}
        >
          <h3 className="mb-0 fw-bold">🛠️ Technician Login</h3>
          <p className="mb-0 mt-2" style={{ opacity: 0.9 }}>
            Access your technician dashboard
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
              <small className="text-muted">
                Note: Currently validating by email only for testing
              </small>
            </div>

            <button
              type="submit"
              className="btn btn-success btn-lg w-100 fw-bold"
              disabled={loading}
              style={{
                borderRadius: "12px",
                background: "linear-gradient(90deg, #198754 0%, #20c997 100%)",
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
                onClick={() => navigate("/technician-register")}
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

export default TechnicianLogin;
