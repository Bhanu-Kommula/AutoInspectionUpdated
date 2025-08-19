import axios from "axios";
// Security and authentication completely removed

// API Configuration
// =====================================
// ✅ UPDATED API CONFIG FOR GATEWAY ROUTING
// All endpoints now use standardized Gateway routing pattern
// =====================================

// Environment variables configuration

const API_CONFIG = {
  // API Gateway connection (with proper routing)
  API_GATEWAY_URL:
    process.env.REACT_APP_API_GATEWAY_URL || "http://localhost:8088",
  BASE_URL: process.env.REACT_APP_API_GATEWAY_URL || "http://localhost:8088",

  // Service endpoints through gateway routing
  DEALER_BASE_URL:
    process.env.REACT_APP_DEALER_BASE_URL ||
    "http://localhost:8088/dealer/api/dealers",
  TECHNICIAN_BASE_URL:
    process.env.REACT_APP_TECHNICIAN_BASE_URL ||
    "http://localhost:8088/technician",
  POSTS_BASE_URL:
    process.env.REACT_APP_POSTS_BASE_URL || "http://localhost:8088/postings",
  TECH_DASHBOARD_BASE_URL:
    process.env.REACT_APP_TECH_DASHBOARD_BASE_URL ||
    "http://localhost:8085/api/v1",

  // Admin and User endpoints directly
  ADMIN_BASE_URL:
    process.env.REACT_APP_ADMIN_BASE_URL || "http://localhost:8084/api/admin",
  USER_BASE_URL:
    process.env.REACT_APP_USER_BASE_URL || "http://localhost:8084/api/users",
  AUTH_BASE_URL:
    process.env.REACT_APP_AUTH_BASE_URL ||
    "http://localhost:8084/api/users/auth",

  // WebSocket
  WEBSOCKET_BASE_URL:
    process.env.REACT_APP_WEBSOCKET_BASE_URL ||
    "http://localhost:8088/tech-dashboard",
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
