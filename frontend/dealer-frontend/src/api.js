import axios from "axios";
// Security and authentication completely removed

// API Configuration
// =====================================
// ✅ UPDATED API CONFIG FOR GATEWAY ROUTING
// All endpoints now use standardized Gateway routing pattern
// =====================================

// Environment variables configuration
export const API_BASE = process.env.REACT_APP_API_BASE || "https://api-gateway.onrender.com";

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

// Create axios instance without authentication
const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: 30000, // 30 second timeout
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

// Response interceptor - simplified without authentication
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    return Promise.reject(error);
  }
);

export { API_CONFIG };
export default api;
