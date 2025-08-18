/**
 * Session Manager for Technician Data
 * Handles browser session isolation to prevent cross-browser data sharing
 */

// Import session timeout manager
import {
  initializeSessionTimeout,
  cleanupSessionTimeout,
} from "./sessionTimeoutManager";

// Generate a unique session ID for this browser session
const generateSessionId = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Get or create session ID
const getSessionId = () => {
  let sessionId = sessionStorage.getItem("technicianSessionId");
  if (!sessionId) {
    sessionId = generateSessionId();
    sessionStorage.setItem("technicianSessionId", sessionId);
  }
  return sessionId;
};

// Store technician data with session isolation
export const storeTechnicianData = (technicianData) => {
  const sessionId = getSessionId();
  const key = `technicianInfo_${sessionId}`;
  sessionStorage.setItem(key, JSON.stringify(technicianData));
  sessionStorage.setItem("currentTechnicianSession", sessionId);

  // Initialize session timeout monitoring
  initializeSessionTimeout();

  console.log(`🔐 Stored technician data for session: ${sessionId}`);
};

// Get technician data for current session
export const getTechnicianData = () => {
  const sessionId = sessionStorage.getItem("currentTechnicianSession");
  if (!sessionId) {
    return null;
  }

  const key = `technicianInfo_${sessionId}`;
  const data = sessionStorage.getItem(key);

  if (data) {
    try {
      return JSON.parse(data);
    } catch (error) {
      console.error("Error parsing technician data:", error);
      return null;
    }
  }

  return null;
};

// Clear technician data for current session
export const clearTechnicianData = () => {
  const sessionId = sessionStorage.getItem("currentTechnicianSession");
  if (sessionId) {
    const key = `technicianInfo_${sessionId}`;
    sessionStorage.removeItem(key);
    sessionStorage.removeItem("currentTechnicianSession");
    console.log(`🔐 Cleared technician data for session: ${sessionId}`);
  }

  // Also clear any legacy localStorage data
  localStorage.removeItem("technicianInfo");
  localStorage.removeItem("dealerInfo");

  // Clean up session timeout monitoring
  cleanupSessionTimeout();
};

// Check if technician is logged in for current session
export const isTechnicianLoggedIn = () => {
  return getTechnicianData() !== null;
};

// Get current session ID for debugging
export const getCurrentSessionId = () => {
  return sessionStorage.getItem("currentTechnicianSession");
};

// Initialize session for dealer login
export const initializeDealerSession = (dealerData) => {
  // Store dealer info
  localStorage.setItem("dealerInfo", JSON.stringify(dealerData));

  // Initialize session timeout monitoring
  initializeSessionTimeout();

  console.log("🔐 Initialized dealer session");
};

// Clear dealer session
export const clearDealerSession = () => {
  localStorage.removeItem("dealerInfo");
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");

  // Clean up session timeout monitoring
  cleanupSessionTimeout();

  console.log("🔐 Cleared dealer session");
};

// Check if dealer is logged in
export const isDealerLoggedIn = () => {
  const dealerInfo = localStorage.getItem("dealerInfo");
  return dealerInfo !== null;
};
