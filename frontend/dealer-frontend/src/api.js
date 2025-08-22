import axios from "axios";
// Security and authentication completely removed

// API Configuration
// =====================================
// ✅ UPDATED API CONFIG FOR GATEWAY ROUTING
// All endpoints now use standardized Gateway routing pattern
// =====================================

// Environment variables configuration
export const API_BASE =
  process.env.REACT_APP_API_BASE || "https://api-gateway-rn0i.onrender.com";

// Debug: Log environment variables
console.log("🔧 [API Config] Environment variables loaded:");
console.log("REACT_APP_API_BASE:", process.env.REACT_APP_API_BASE);
console.log(
  "REACT_APP_DEALER_BASE_URL:",
  process.env.REACT_APP_DEALER_BASE_URL
);
console.log("API_BASE resolved to:", API_BASE);

const API_CONFIG = {
  // API Gateway connection (with proper routing)
  API_GATEWAY_URL: API_BASE,
  BASE_URL: API_BASE,

  // Service endpoints through gateway routing
  DEALER_BASE_URL: `${API_BASE}/api/dealers`,
  TECHNICIAN_BASE_URL: `${API_BASE}/api/technicians`,
  POSTS_BASE_URL: `${API_BASE}/api/v1`,
  TECH_DASHBOARD_BASE_URL: `${API_BASE}/api/v1`,

  // Admin and User endpoints through Gateway
  ADMIN_BASE_URL: `${API_BASE}/api/admin`,
  USER_BASE_URL: `${API_BASE}/api/users`,
  AUTH_BASE_URL: `${API_BASE}/api/users/auth`,

  // WebSocket
  WEBSOCKET_BASE_URL:
    process.env.REACT_APP_WEBSOCKET_BASE_URL ||
    "https://chat-service.onrender.com",
};

// Debug: Log final API_CONFIG
console.log("🔧 [API Config] Final configuration:");
console.log("DEALER_BASE_URL:", API_CONFIG.DEALER_BASE_URL);
console.log("ADMIN_BASE_URL:", API_CONFIG.ADMIN_BASE_URL);
console.log("BASE_URL:", API_CONFIG.BASE_URL);

// Create axios instance without authentication
const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: 60000, // 60 second timeout for Render free tier wake-up
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - simplified without authentication
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    console.error("Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor with retry logic for timeouts
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Retry logic for timeout errors (Render wake-up)
    if (error.code === 'ECONNABORTED' && !originalRequest._retry) {
      console.log("🔄 [API] Request timed out, retrying once for service wake-up...");
      originalRequest._retry = true;
      originalRequest.timeout = 90000; // Extend timeout for retry
      
      try {
        return await api(originalRequest);
      } catch (retryError) {
        console.error("🔄 [API] Retry also failed:", retryError.message);
        return Promise.reject(retryError);
      }
    }
    
    return Promise.reject(error);
  }
);

export { API_CONFIG };
export default api;
