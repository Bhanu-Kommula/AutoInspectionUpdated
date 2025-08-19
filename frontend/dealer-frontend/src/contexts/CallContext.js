import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import io from "socket.io-client";
// Note: Using direct socket connection for this context
// Note: Now using GlobalCallInterface instead of individual call components

const CallContext = createContext();

export const useCallContext = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error("useCallContext must be used within a CallProvider");
  }
  return context;
};

export const CallProvider = ({ children }) => {
  const [globalSocket, setGlobalSocket] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [previousLocation, setPreviousLocation] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();

  // Initialize global socket for call notifications
  useEffect(() => {
    // Determine user identity for call sockets. Prefer TECHNICIAN (tab-scoped session)
    // before DEALER (app-wide localStorage) to ensure technician dashboard registers correctly.
    let userEmail = null;
    let userType = null;

    // Prefer technician session (sessionStorage is tab/window scoped)
    const technicianSessionId = sessionStorage.getItem(
      "currentTechnicianSession"
    );
    if (technicianSessionId) {
      const technicianKey = `technicianInfo_${technicianSessionId}`;
      const technicianData = sessionStorage.getItem(technicianKey);
      if (technicianData) {
        try {
          const parsed = JSON.parse(technicianData);
          if (parsed.email) {
            userEmail = parsed.email;
            userType = "TECHNICIAN";
          }
        } catch (error) {
          console.error("Error parsing technician info:", error);
        }
      }
    }

    // Fallback to dealer info (localStorage is shared across tabs)
    if (!userEmail) {
      const dealerInfo = localStorage.getItem("dealerInfo");
      if (dealerInfo) {
        try {
          const parsed = JSON.parse(dealerInfo);
          if (parsed.email) {
            userEmail = parsed.email;
            userType = "DEALER";
          }
        } catch (error) {
          console.error("Error parsing dealer info:", error);
        }
      }
    }

    console.log("🔧 [CallContext] Checking user credentials:", {
      userEmail,
      userType,
    });

    if (userEmail && userType) {
      setCurrentUser({ email: userEmail, type: userType });

      console.log("🔧 [CallContext] User found, setting up call context:", {
        userEmail,
        userType,
      });

      // Create global socket connection for call notifications
      const socket = io("http://localhost:8089", {
        transports: ["websocket", "polling"],
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        timeout: 5000,
      });

      socket.on("connect", () => {
        console.log("🌐 Global call socket connected for:", userEmail);
        // Register for global notifications
        socket.emit("register_for_notifications", {
          userEmail,
          userType: userType.toUpperCase(),
        });
      });

      socket.on("disconnect", (reason) => {
        console.log("🔌 Global call socket disconnected:", reason);
      });

      socket.on("connect_error", (error) => {
        console.error("❌ Global call socket connection error:", error);
      });

      setGlobalSocket(socket);

      return () => {
        console.log("🧹 Cleaning up global call socket");
        socket.disconnect();
      };
    }
  }, []);

  // Note: Using GlobalCallInterface instead of useCall hook

  // Debug logging for call context
  useEffect(() => {
    console.log("🔧 CallContext Debug:", {
      globalSocket: !!globalSocket,
      socketConnected: globalSocket?.connected,
      currentUser,
    });
  }, [globalSocket, currentUser]);

  const value = {
    globalSocket,
    currentUser,
  };

  return (
    <CallContext.Provider value={value}>
      {children}

      {/* Note: Call interfaces are now handled by GlobalCallInterface in App.js */}
    </CallContext.Provider>
  );
};

export default CallContext;
