/**
 * Session Timeout Manager
 * Handles automatic logout when sessions expire for dealers and technicians
 */

// Import session manager functions
import { clearTechnicianData } from "./sessionManager";

// Session timeout configuration (in milliseconds)
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const WARNING_TIMEOUT = 5 * 60 * 1000; // 5 minutes before expiry

// Activity tracking
let lastActivityTime = Date.now();
let sessionTimeoutId = null;
let warningTimeoutId = null;
let isWarningShown = false;

// Event listeners for user activity
const activityEvents = [
  "mousedown",
  "mousemove",
  "keypress",
  "scroll",
  "touchstart",
  "click",
];

/**
 * Initialize session timeout monitoring
 */
export const initializeSessionTimeout = () => {
  console.log("🔐 Initializing session timeout monitoring");

  // Set initial activity time
  lastActivityTime = Date.now();

  // Start monitoring user activity
  startActivityMonitoring();

  // Set up initial timeout
  resetSessionTimeout();

  // Set up page visibility change handler
  document.addEventListener("visibilitychange", handleVisibilityChange);

  // Set up beforeunload handler
  window.addEventListener("beforeunload", handleBeforeUnload);
};

/**
 * Start monitoring user activity
 */
const startActivityMonitoring = () => {
  activityEvents.forEach((event) => {
    document.addEventListener(event, updateActivityTime, { passive: true });
  });
};

/**
 * Update last activity time
 */
const updateActivityTime = () => {
  lastActivityTime = Date.now();

  // Reset timeout if warning was shown
  if (isWarningShown) {
    isWarningShown = false;
    resetSessionTimeout();
  }
};

/**
 * Reset session timeout
 */
const resetSessionTimeout = () => {
  // Clear existing timeouts
  if (sessionTimeoutId) {
    clearTimeout(sessionTimeoutId);
  }
  if (warningTimeoutId) {
    clearTimeout(warningTimeoutId);
  }

  // Set warning timeout
  warningTimeoutId = setTimeout(() => {
    showSessionWarning();
  }, SESSION_TIMEOUT - WARNING_TIMEOUT);

  // Set session timeout
  sessionTimeoutId = setTimeout(() => {
    handleSessionExpiry();
  }, SESSION_TIMEOUT);

  console.log(
    "🔐 Session timeout reset - expires in",
    SESSION_TIMEOUT / 1000 / 60,
    "minutes"
  );
};

/**
 * Show session warning
 */
const showSessionWarning = () => {
  isWarningShown = true;

  // Create warning modal
  const warningModal = document.createElement("div");
  warningModal.id = "session-warning-modal";
  warningModal.innerHTML = `
    <div style="
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
    ">
      <div style="
        background: white;
        padding: 30px;
        border-radius: 10px;
        text-align: center;
        max-width: 400px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      ">
        <h4 style="color: #dc3545; margin-bottom: 15px;">⚠️ Session Expiring Soon</h4>
        <p style="margin-bottom: 20px; color: #666;">
          Your session will expire in ${
            WARNING_TIMEOUT / 1000 / 60
          } minutes due to inactivity.
          Click anywhere to extend your session.
        </p>
        <button onclick="document.getElementById('session-warning-modal').remove()" 
                style="
                  background: #007bff;
                  color: white;
                  border: none;
                  padding: 10px 20px;
                  border-radius: 5px;
                  cursor: pointer;
                ">
          Continue Session
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(warningModal);

  // Auto-remove warning after 10 seconds if not dismissed
  setTimeout(() => {
    if (document.getElementById("session-warning-modal")) {
      document.getElementById("session-warning-modal").remove();
    }
  }, 10000);
};

/**
 * Handle session expiry
 */
const handleSessionExpiry = () => {
  console.log("🔐 Session expired - logging out user");

  // Clear all session data
  clearAllSessionData();

  // Show expiry notification
  showSessionExpiryNotification();

  // Redirect to landing page
  setTimeout(() => {
    window.location.href = "/";
  }, 2000);
};

/**
 * Clear all session data
 */
const clearAllSessionData = () => {
  // Clear technician session data
  clearTechnicianData();

  // Clear dealer data
  localStorage.removeItem("dealerInfo");
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");

  // Clear any other session data
  sessionStorage.clear();

  console.log("🔐 All session data cleared");
};

/**
 * Show session expiry notification
 */
const showSessionExpiryNotification = () => {
  // Create expiry notification
  const expiryNotification = document.createElement("div");
  expiryNotification.id = "session-expiry-notification";
  expiryNotification.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      right: 20px;
      background: #dc3545;
      color: white;
      padding: 15px 20px;
      border-radius: 5px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      z-index: 10000;
      max-width: 300px;
    ">
      <div style="font-weight: bold; margin-bottom: 5px;">Session Expired</div>
      <div style="font-size: 14px;">You have been logged out due to inactivity.</div>
    </div>
  `;

  document.body.appendChild(expiryNotification);

  // Auto-remove notification after 5 seconds
  setTimeout(() => {
    if (document.getElementById("session-expiry-notification")) {
      document.getElementById("session-expiry-notification").remove();
    }
  }, 5000);
};

/**
 * Handle page visibility change
 */
const handleVisibilityChange = () => {
  if (document.hidden) {
    console.log("🔐 Page hidden - pausing session monitoring");
  } else {
    console.log("🔐 Page visible - resuming session monitoring");
    updateActivityTime();
  }
};

/**
 * Handle beforeunload event
 */
const handleBeforeUnload = () => {
  // Clean up timeouts
  if (sessionTimeoutId) {
    clearTimeout(sessionTimeoutId);
  }
  if (warningTimeoutId) {
    clearTimeout(warningTimeoutId);
  }
};

/**
 * Clean up session timeout monitoring
 */
export const cleanupSessionTimeout = () => {
  console.log("🔐 Cleaning up session timeout monitoring");

  // Remove event listeners
  activityEvents.forEach((event) => {
    document.removeEventListener(event, updateActivityTime);
  });

  // Clear timeouts
  if (sessionTimeoutId) {
    clearTimeout(sessionTimeoutId);
  }
  if (warningTimeoutId) {
    clearTimeout(warningTimeoutId);
  }

  // Remove page event listeners
  document.removeEventListener("visibilitychange", handleVisibilityChange);
  window.removeEventListener("beforeunload", handleBeforeUnload);

  // Remove any existing modals
  if (document.getElementById("session-warning-modal")) {
    document.getElementById("session-warning-modal").remove();
  }
  if (document.getElementById("session-expiry-notification")) {
    document.getElementById("session-expiry-notification").remove();
  }
};

/**
 * Extend session manually (for API calls)
 */
export const extendSession = () => {
  console.log("🔐 Extending session due to API activity");
  updateActivityTime();
  resetSessionTimeout();
};

/**
 * Check if user is currently active
 */
export const isUserActive = () => {
  const timeSinceLastActivity = Date.now() - lastActivityTime;
  return timeSinceLastActivity < SESSION_TIMEOUT;
};

/**
 * Get remaining session time in minutes
 */
export const getRemainingSessionTime = () => {
  const timeSinceLastActivity = Date.now() - lastActivityTime;
  const remainingTime = SESSION_TIMEOUT - timeSinceLastActivity;
  return Math.max(0, Math.floor(remainingTime / 1000 / 60));
};
