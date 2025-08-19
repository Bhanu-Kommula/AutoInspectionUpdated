import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  initializeSessionTimeout,
  cleanupSessionTimeout,
} from "../utils/sessionTimeoutManager";
import {
  isTechnicianLoggedIn,
  isDealerLoggedIn,
} from "../utils/sessionManager";

/**
 * Hook to handle session timeout for protected pages
 * Automatically initializes session monitoring and redirects if not logged in
 */
export const useSessionTimeout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in (either technician or dealer)
    const isLoggedIn = isTechnicianLoggedIn() || isDealerLoggedIn();

    if (!isLoggedIn) {
      console.log("🔐 No active session found, redirecting to landing page");
      navigate("/");
      return;
    }

    // Initialize session timeout monitoring
    console.log("🔐 Initializing session timeout for protected page");
    initializeSessionTimeout();

    // Cleanup on unmount
    return () => {
      console.log("🔐 Cleaning up session timeout");
      cleanupSessionTimeout();
    };
  }, [navigate]);
};
