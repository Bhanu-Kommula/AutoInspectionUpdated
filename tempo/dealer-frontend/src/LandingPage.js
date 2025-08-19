import React from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

function LandingPage() {
  const navigate = useNavigate();

  return (
    <div
      className="min-vh-100 d-flex flex-column justify-content-center align-items-center px-3 text-center position-relative"
      style={{
        background:
          "linear-gradient(135deg, #e0f7fa 0%, #f3e5f5 50%, #fffde7 100%)",
        fontFamily: "'Poppins', sans-serif",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div className="mb-4 text-center animate__animated animate__fadeInDown">
        <h1 className="display-4 fw-bold text-flare mb-2">
          🚘 All State Independent Inspection
        </h1>
        <h2 className="h3 text-primary mb-3">
          Your hands and eyes on every site
        </h2>
        <p className="lead text-muted fst-italic">
          Connecting Dealers & Technicians with Ease
        </p>
      </div>

      {/* Separator */}
      <div
        className="my-4"
        style={{
          height: "2px",
          width: "80px",
          background: "linear-gradient(to right, #0d6efd, #6610f2)",
          borderRadius: "50px",
        }}
      />

      {/* Role Cards */}
      <div className="d-flex flex-column gap-4 animate__animated animate__fadeInUp">
        {/* Top Row - Dealer and Technician */}
        <div
          className="glass-container d-flex flex-column flex-md-row gap-4 p-5 rounded-5 shadow-xl"
          style={{ width: "100%", maxWidth: "950px" }}
        >
          {/* Dealer Card */}
          <div className="role-card p-4 flex-fill text-center rounded-4">
            <h4 className="fw-bold mb-3 text-primary">👤 Dealer Portal</h4>
            <p className="text-muted mb-4">
              Create and manage car service requests with ease.
            </p>
            <div className="d-flex justify-content-center gap-3 flex-wrap">
              <button
                className="btn btn-primary px-4 py-2 rounded-pill fw-semibold glow-btn"
                onClick={() => navigate("/dealer-login")}
              >
                Login
              </button>
              <button
                className="btn btn-outline-primary px-4 py-2 rounded-pill fw-semibold"
                onClick={() => navigate("/dealer-register")}
              >
                Register
              </button>
            </div>
          </div>

          {/* Technician Card */}
          <div className="role-card p-4 flex-fill text-center rounded-4">
            <h4 className="fw-bold mb-3 text-success">🛠️ Technician Portal</h4>
            <p className="text-muted mb-4">
              Accept inspection jobs and grow your business.
            </p>
            <div className="d-flex justify-content-center gap-3 flex-wrap">
              <button
                className="btn btn-success px-4 py-2 rounded-pill fw-semibold glow-btn"
                onClick={() => navigate("/technician-login")}
              >
                Login
              </button>
              <button
                className="btn btn-outline-success px-4 py-2 rounded-pill fw-semibold"
                onClick={() => navigate("/technician-register")}
              >
                Register
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Row - Admin (Centered) */}
        <div
          className="glass-container d-flex justify-content-center p-5 rounded-5 shadow-xl"
          style={{ width: "100%", maxWidth: "500px", margin: "0 auto" }}
        >
          {/* Admin Card */}
          <div
            className="role-card p-4 text-center rounded-4"
            style={{ width: "100%" }}
          >
            <h4 className="fw-bold mb-3 text-warning">⚙️ Admin Portal</h4>
            <p className="text-muted mb-4">
              Manage system operations and user accounts.
            </p>
            <div className="d-flex justify-content-center gap-3 flex-wrap">
              <button
                className="btn btn-warning px-4 py-2 rounded-pill fw-semibold glow-btn"
                onClick={() => navigate("/admin-dashboard")}
              >
                Access Admin Portal
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-5 text-muted small text-center">
        &copy; {new Date().getFullYear()} All State Independent Inspection. All
        rights reserved.
      </footer>

      {/* Styles */}
      <style>{`
        .glass-container {
          background: rgba(255, 255, 255, 0.45);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border-radius: 32px;
          border: 1px solid rgba(255, 255, 255, 0.25);
          box-shadow: 0 18px 60px rgba(0, 0, 0, 0.07);
        }

        .role-card {
          background: rgba(255, 255, 255, 0.88);
          box-shadow: 0 6px 28px rgba(0, 0, 0, 0.06);
          transition: all 0.35s ease-in-out;
        }

        .role-card:hover {
          transform: translateY(-5px) scale(1.015);
          box-shadow: 0 14px 36px rgba(0, 0, 0, 0.12);
        }

        .text-flare {
          background: linear-gradient(90deg, #0d6efd, #6610f2);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          text-shadow: 0px 2px 12px rgba(102, 16, 242, 0.1);
        }

        .btn {
          transition: all 0.25s ease-in-out;
        }

        .glow-btn:hover {
          transform: scale(1.06);
          box-shadow: 0 0 12px rgba(13, 110, 253, 0.2);
        }

        @media (max-width: 576px) {
          .btn {
            width: 100%;
          }

          .glass-container {
            padding: 2rem 1.5rem !important;
          }
        }
      `}</style>
    </div>
  );
}

export default LandingPage;
