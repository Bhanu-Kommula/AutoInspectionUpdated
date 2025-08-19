import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import api, { API_CONFIG } from "../api";
import SearchableLocationDropdown from "./SearchableLocationDropdown";
import "bootstrap/dist/css/bootstrap.min.css";

function TechnicianRegister() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    delearshipName: "", // Note: Backend has typo "delearshipName" - keeping it to match exactly
    email: "",
    phone: "",
    password: "",
    location: "",
    zipcode: "",
    yearsOfExperience: "",
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
      // Use API_CONFIG for gateway access
      const fullUrl = `${API_CONFIG.TECHNICIAN_BASE_URL}/register`;
      console.log(
        "API_CONFIG.TECHNICIAN_BASE_URL:",
        API_CONFIG.TECHNICIAN_BASE_URL
      );
      console.log("Using gateway URL:", fullUrl);
      console.log("Technician Register - Request data:", formData);

      const response = await axios.post(fullUrl, formData, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("Technician Register - Response:", response.data);

      if (response.status === 201) {
        console.log("Technician Register - Success, navigating to login");
        navigate("/technician-login", {
          state: { message: "Registration successful! Please login." },
        });
      } else {
        setError("Registration failed");
      }
    } catch (err) {
      console.error("Technician Register - Error:", err);
      if (err.response?.status === 400) {
        // Try to get specific error message from backend
        const errorMsg = err.response?.data?.message || 
                        err.response?.data?.error || 
                        "Invalid data. Please check all fields.";
        setError(errorMsg);
      } else if (err.response?.status === 409) {
        setError("Email already exists");
      } else {
        setError("Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center px-3 py-4"
      style={{
        background:
          "linear-gradient(135deg, #e8f5e8 0%, #f0f8f0 50%, #e8ffe8 100%)",
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      <div
        className="card shadow-lg border-0"
        style={{
          maxWidth: "600px",
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
          <h3 className="mb-0 fw-bold">🛠️ Technician Registration</h3>
          <p className="mb-0 mt-2" style={{ opacity: 0.9 }}>
            Create your technician account
          </p>
        </div>

        <div className="card-body p-4">
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label htmlFor="name" className="form-label fw-semibold">
                  Technician Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Enter your name"
                  style={{
                    borderRadius: "10px",
                    border: "2px solid #e3e6ea",
                    padding: "10px 14px",
                  }}
                />
              </div>

              <div className="col-md-6 mb-3">
                <label
                  htmlFor="delearshipName"
                  className="form-label fw-semibold"
                >
                  Dealership Name <span className="text-muted">(Optional)</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="delearshipName"
                  name="delearshipName"
                  value={formData.delearshipName}
                  onChange={handleChange}
                  placeholder="Enter dealership name"
                  style={{
                    borderRadius: "10px",
                    border: "2px solid #e3e6ea",
                    padding: "10px 14px",
                  }}
                />
              </div>
            </div>

            <div className="mb-3">
              <label htmlFor="email" className="form-label fw-semibold">
                Email Address <span className="text-danger">*</span>
              </label>
              <input
                type="email"
                className="form-control"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="Enter your email"
                style={{
                  borderRadius: "10px",
                  border: "2px solid #e3e6ea",
                  padding: "10px 14px",
                }}
              />
            </div>

            <div className="mb-3">
              <label htmlFor="phone" className="form-label fw-semibold">
                Phone Number <span className="text-danger">*</span>
              </label>
              <input
                type="tel"
                className="form-control"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                placeholder="Enter your phone number (e.g., +1234567890)"
                pattern="^[\+]?[1-9]?[0-9]{7,15}$"
                title="Please provide a valid phone number (7-15 digits, optional + prefix)"
                style={{
                  borderRadius: "10px",
                  border: "2px solid #e3e6ea",
                  padding: "10px 14px",
                }}
              />
              <small className="text-muted">Include country code if international (e.g., +1 for US)</small>
            </div>

            <div className="mb-3">
              <label htmlFor="password" className="form-label fw-semibold">
                Password <span className="text-danger">*</span>
              </label>
              <input
                type="password"
                className="form-control"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength="8"
                placeholder="Enter password (min 8 characters)"
                autoComplete="new-password"
                style={{
                  borderRadius: "10px",
                  border: "2px solid #e3e6ea",
                  padding: "10px 14px",
                }}
              />
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label htmlFor="location" className="form-label fw-semibold">
                  Location <span className="text-danger">*</span>
                </label>
                <SearchableLocationDropdown
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Search for your city..."
                  required
                />
              </div>

              <div className="col-md-6 mb-3">
                <label htmlFor="zipcode" className="form-label fw-semibold">
                  Zipcode <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="zipcode"
                  name="zipcode"
                  value={formData.zipcode}
                  onChange={handleChange}
                  required
                  placeholder="Enter zipcode"
                  style={{
                    borderRadius: "10px",
                    border: "2px solid #e3e6ea",
                    padding: "10px 14px",
                  }}
                />
              </div>
            </div>

            <div className="mb-4">
              <label
                htmlFor="yearsOfExperience"
                className="form-label fw-semibold"
              >
                Years of Experience <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                className="form-control"
                id="yearsOfExperience"
                name="yearsOfExperience"
                value={formData.yearsOfExperience}
                onChange={handleChange}
                required
                placeholder="Enter years of experience"
                style={{
                  borderRadius: "10px",
                  border: "2px solid #e3e6ea",
                  padding: "10px 14px",
                }}
              />
              <small className="text-muted">E.g., "5 years" or "2"</small>
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
                  Creating Account...
                </>
              ) : (
                "Create Technician Account"
              )}
            </button>
          </form>

          <div className="text-center mt-4">
            <p className="text-muted">
              Already have an account?{" "}
              <button
                className="btn btn-link p-0 fw-semibold"
                onClick={() => navigate("/technician-login")}
              >
                Login here
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

export default TechnicianRegister;
