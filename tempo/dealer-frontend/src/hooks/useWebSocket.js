import { useEffect, useCallback, useRef } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { API_CONFIG } from "../api";
// Security config import removed as requested

const useWebSocket = (
  dealer,
  filters,
  fetchPosts,
  setNotifications,
  setUnreadCount
) => {
  const clientRef = useRef(null);
  const lastNotificationIdRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const isConnectingRef = useRef(false);

  // Debounced fetch function to prevent excessive API calls
  const debouncedFetch = useCallback(() => {
    if (fetchPosts && typeof fetchPosts === "function") {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = setTimeout(() => {
        fetchPosts();
      }, 500); // 500ms debounce
    }
  }, [fetchPosts]);

  useEffect(() => {
    // WebSocket connections disabled (per request)
    console.log("🔌 WebSocket: connections disabled");
    return;

    // Performance: Prevent multiple concurrent connections
    if (isConnectingRef.current || clientRef.current?.connected) {
      console.log("🔄 WebSocket: Connection already exists or in progress");
      return;
    }

    let postingsClient = null;

    // Security: Get and validate authentication token (skip when security is disabled)
    let accessToken = null;

    try {
      isConnectingRef.current = true;

      // WebSocket connection with security disabled support
      let wsUrl = `${API_CONFIG.WEBSOCKET_BASE_URL}/ws`;

      const postingsSocket = new SockJS(wsUrl);

      postingsClient = new Client({
        webSocketFactory: () => postingsSocket,
        debug:
          process.env.NODE_ENV === "development"
            ? (str) => console.log("[Postings WS]", str)
            : undefined,
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        maxReconnectAttempts: 10, // Performance: Limit reconnection attempts
        onConnect: () => {
          console.log(
            "🟢 Connected to Postings WebSocket for Real-time Updates"
          );
          console.log("🔐 WebSocket authenticated successfully");
          isConnectingRef.current = false;

          // Performance: Subscribe to location-specific topic for technicians
          const technicianTopic = `/topic/technician/${dealer.id}`;
          const locationTopic = `/topic/location/${encodeURIComponent(
            dealer.location
          )}`;

          // Listen for technician-specific updates
          postingsClient.subscribe(technicianTopic, async (message) => {
            try {
              const updatedData = JSON.parse(message.body);
              console.log("📬 [Technician] Received update:", updatedData);

              // Security: Validate message structure
              if (!updatedData || typeof updatedData !== "object") {
                console.warn("🔒 Invalid message format received");
                return;
              }

              // Performance: Use debounced fetch to prevent excessive API calls
              debouncedFetch();

              // Add relevant notification
              if (
                updatedData.type === "COUNTER_OFFER_UPDATE" &&
                setNotifications
              ) {
                setNotifications((prev) => [
                  {
                    id: Date.now(),
                    message: `🔄 Counter offer status updated`,
                    type: "info",
                    timestamp: new Date().toLocaleTimeString(),
                    read: false,
                  },
                  ...prev.slice(0, 19), // Performance: Limit notifications to 20
                ]);
                setUnreadCount((c) => Math.min(c + 1, 99)); // Cap at 99
              }
            } catch (error) {
              console.error("Error processing technician message:", error);
            }
          });

          // Listen for location-based post updates
          postingsClient.subscribe(locationTopic, async (message) => {
            try {
              const updatedPost = JSON.parse(message.body);
              console.log("📬 [Location] Received post update:", updatedPost);

              // Security: Validate post data
              if (!updatedPost?.id || !updatedPost?.status) {
                console.warn("🔒 Invalid post update format");
                return;
              }

              // Performance: Prevent duplicate notifications using ref
              const notificationId = `${updatedPost.id}-${updatedPost.status}`;
              if (lastNotificationIdRef.current === notificationId) {
                console.log("🚫 Duplicate notification prevented");
                return;
              }
              lastNotificationIdRef.current = notificationId;

              // Performance: Use debounced fetch
              debouncedFetch();

              // Security: Sanitize notification data
              const sanitizedMessage =
                updatedPost.technicianName?.replace(/[<>]/g, "") || "Unknown";

              // Add notification based on post status
              if (
                updatedPost.status === "ACCEPTED" &&
                updatedPost.technicianName &&
                setNotifications
              ) {
                setNotifications((prev) => [
                  {
                    id: Date.now(),
                    message: `✅ Post accepted by ${sanitizedMessage}!`,
                    type: "success",
                    timestamp: new Date().toLocaleTimeString(),
                    read: false,
                  },
                  ...prev.slice(0, 19), // Performance: Limit notifications
                ]);
                setUnreadCount((c) => Math.min(c + 1, 99));
              } else if (updatedPost.status === "NEW" && setNotifications) {
                setNotifications((prev) => [
                  {
                    id: Date.now(),
                    message: `📋 New post available in ${dealer.location}`,
                    type: "info",
                    timestamp: new Date().toLocaleTimeString(),
                    read: false,
                  },
                  ...prev.slice(0, 19),
                ]);
                setUnreadCount((c) => Math.min(c + 1, 99));
              }
            } catch (error) {
              console.error("Error processing location message:", error);
            }
          });

          // Legacy support: Listen for general post updates
          postingsClient.subscribe("/topic/new-post", async (message) => {
            try {
              const updatedPost = JSON.parse(message.body);
              console.log("📬 [General] Received post update:", updatedPost);

              // Security: Basic validation
              if (!updatedPost?.id) return;

              // Performance: Use debounced fetch
              debouncedFetch();
            } catch (error) {
              console.error("Error parsing general post message:", error);
            }
          });

          // Listen for post update notifications - SECONDARY (silent refresh)
          postingsClient.subscribe("/topic/post-update", async (message) => {
            try {
              const updatedPost = JSON.parse(message.body);
              console.log(
                "📬 [PostUpdate] Received specific update (silent):",
                updatedPost
              );

              // Security: Validate data
              if (!updatedPost?.id) return;

              // Performance: Use debounced fetch instead of direct call
              debouncedFetch();
            } catch (error) {
              console.error("Error parsing post update message:", error);
            }
          });
        },
        onStompError: (frame) => {
          console.error(
            "❌ Postings STOMP Error",
            frame.headers?.["message"] || "Unknown error"
          );
          console.error("🔍 Error details:", frame);
          isConnectingRef.current = false;

          // Security: Clear token on authentication errors (skip when security disabled)
          if (!true) {
            if (
              frame.headers?.["message"]?.includes("401") ||
              frame.headers?.["message"]?.includes("403")
            ) {
              console.error("🔒 Authentication failed - clearing token");
              localStorage.removeItem("accessToken");
            }
          } else {
            // Ignore authentication errors
          }
        },
        onWebSocketError: (error) => {
          console.error("❌ Postings WebSocket Error", error);
          isConnectingRef.current = false;

          // Security: Handle authentication errors (skip when security disabled)
          if (!true) {
            if (
              error.message?.includes("401") ||
              error.message?.includes("403")
            ) {
              console.error(
                "🔒 WebSocket authentication failed - token may be invalid"
              );
              localStorage.removeItem("accessToken");
            }
          } else {
            // Ignore authentication errors
          }
        },
        onDisconnect: () => {
          console.log("🔌 WebSocket disconnected");
          isConnectingRef.current = false;
        },
      });

      // Store client reference for cleanup
      clientRef.current = postingsClient;

      // Performance: Activate WebSocket connection
      postingsClient.activate();
    } catch (error) {
      console.error("❌ Failed to create WebSocket connection:", error);
      isConnectingRef.current = false;
    }

    // Cleanup function with enhanced memory leak prevention
    return () => {
      console.log("🔌 Cleaning up WebSocket connections");

      // Clear timeouts
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      // Disconnect client
      if (clientRef.current?.connected) {
        try {
          clientRef.current.deactivate();
        } catch (error) {
          console.warn("Error during WebSocket cleanup:", error);
        }
      }

      // Reset refs
      clientRef.current = null;
      isConnectingRef.current = false;
      lastNotificationIdRef.current = null;
    };
  }, [
    dealer?.id,
    dealer?.email,
    dealer?.location,
    filters,
    debouncedFetch,
    setNotifications,
    setUnreadCount,
  ]);
};

export default useWebSocket;
