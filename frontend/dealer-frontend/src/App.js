// App.js - Simple routing without authentication
import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  Suspense,
} from "react";
import { AdminAuthProvider } from "./contexts/AdminAuthContext";
import { CallProvider } from "./contexts/CallContext";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useLocation,
} from "react-router-dom";
import { FaMoon, FaSun } from "react-icons/fa";
import { optimizeAnimations } from "./utils/performanceUtils";
import globalCallManager from "./utils/globalCallManager";
import socketManager from "./utils/socketManager";
import { backgroundWarmup } from "./utils/serviceWarmup";
import GlobalCallInterface from "./components/GlobalCallInterface";

// Lazy load components for better performance
const LandingPage = React.lazy(() => import("./LandingPage"));
const PostingsPage = React.lazy(() =>
  import("./components/PostingsPage/PostingsPage")
);
const TechnicianFeedsPage = React.lazy(() => import("./TechnicianFeedApp"));
const TechnicianDashboardPage = React.lazy(() =>
  import("./TechnicianDashboardPage")
);
const AdminDashboard = React.lazy(() => import("./AdminDashboard"));

// Authentication components
const DealerLogin = React.lazy(() => import("./components/DealerLogin"));
const DealerRegister = React.lazy(() => import("./components/DealerRegister"));
const TechnicianLogin = React.lazy(() =>
  import("./components/TechnicianLogin")
);
const TechnicianRegister = React.lazy(() =>
  import("./components/TechnicianRegister")
);
const AdminLogin = React.lazy(() => import("./components/AdminLogin"));
const ProtectedAdminRoute = React.lazy(() => import("./components/ProtectedAdminRoute"));

// Loading component for lazy loaded routes
const LoadingSpinner = () => (
  <div
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      fontSize: "18px",
      color: "#666",
    }}
  >
    <div style={{ textAlign: "center" }}>
      <div className="spinner-border text-primary mb-3" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
      <div>Loading...</div>
    </div>
  </div>
);

function AppWrapper() {
  return (
    <Router>
      <AdminAuthProvider>
        <CallProvider>
          <App />
        </CallProvider>
      </AdminAuthProvider>
    </Router>
  );
}

function App() {
  const location = useLocation();

  // Memoized dark mode state to prevent unnecessary re-renders
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    return saved === "true";
  });

  // Optimize dark mode toggle with useCallback
  const toggleDarkMode = useCallback(() => {
    setDarkMode((prev) => !prev);
  }, []);

  // Apply dark mode effect
  useEffect(() => {
    document.body.className = darkMode ? "dark-mode" : "";
    localStorage.setItem("darkMode", darkMode.toString());
  }, [darkMode]);

  // Initialize performance optimizations and global call manager
  useEffect(() => {
    optimizeAnimations();
    // Initialize global call manager for the entire app
    globalCallManager.initialize();
    
    // Warm up services in background to reduce cold start delays
    backgroundWarmup();

    // Cleanup on app unmount
    return () => {
      console.log("🧹 Cleaning up global call socket");
      socketManager.disconnectAll();
      globalCallManager.disconnect();
    };
  }, []);

  // Memoized route configurations for better performance
  const hideNavRoutes = useMemo(
    () => [
      "/",
      "/home",
      "/postings",
      "/tech-feeds",
      "/technician-dashboard",
      "/admin-dashboard",
      "/dealer-login",
      "/dealer-register",
      "/technician-login",
      "/technician-register",
      "/admin-login",
    ],
    []
  );

  const shouldShowNavbar = useMemo(
    () => !hideNavRoutes.includes(location.pathname),
    [location.pathname, hideNavRoutes]
  );

  // Memoized navbar styles
  const navbarStyles = useMemo(
    () => ({
      backgroundColor: "#343a40",
      padding: "12px 20px",
      display: "flex",
      justifyContent: "center",
      gap: "20px",
    }),
    []
  );

  const linkStyles = useMemo(
    () => ({
      color: "#ffffff",
      textDecoration: "none",
      fontWeight: "bold",
      fontSize: "16px",
    }),
    []
  );

  const darkModeButtonStyles = useMemo(
    () => ({
      background: "none",
      border: "none",
      color: darkMode ? "#ffd700" : "#333",
      fontSize: 22,
      marginLeft: 16,
      cursor: "pointer",
      verticalAlign: "middle",
      transition: "color 0.2s ease",
    }),
    [darkMode]
  );

  return (
    <>
      {shouldShowNavbar && (
        <div style={navbarStyles}>
          <Link to="/home" style={linkStyles}>
            Home
          </Link>
          <Link to="/postings" style={linkStyles}>
            Dealer Portal
          </Link>
          <Link to="/tech-feeds" style={linkStyles}>
            Technician Portal
          </Link>
          <Link to="/admin-dashboard" style={linkStyles}>
            Admin Portal
          </Link>

          <button
            onClick={toggleDarkMode}
            style={darkModeButtonStyles}
            aria-label="Toggle dark mode"
            title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? <FaSun /> : <FaMoon />}
          </button>
        </div>
      )}

      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/home" element={<LandingPage />} />

          {/* Authentication Routes */}
          <Route path="/dealer-login" element={<DealerLogin />} />
          <Route path="/dealer-register" element={<DealerRegister />} />
          <Route path="/technician-login" element={<TechnicianLogin />} />
          <Route path="/technician-register" element={<TechnicianRegister />} />
          <Route path="/admin-login" element={<AdminLogin />} />

          {/* Dashboard Routes */}
          <Route path="/postings" element={<PostingsPage />} />
          <Route path="/tech-feeds" element={<TechnicianFeedsPage />} />
          <Route
            path="/technician-dashboard"
            element={<TechnicianDashboardPage />}
          />
          <Route 
            path="/admin-dashboard" 
            element={
              <ProtectedAdminRoute>
                <AdminDashboard />
              </ProtectedAdminRoute>
            } 
          />
        </Routes>

        {/* Global Call Interface */}
        <GlobalCallInterface />
      </Suspense>
    </>
  );
}

export default React.memo(AppWrapper);
