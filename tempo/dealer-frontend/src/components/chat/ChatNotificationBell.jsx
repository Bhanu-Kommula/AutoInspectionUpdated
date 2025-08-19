import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button, Badge, Dropdown, ListGroup, Modal } from "react-bootstrap";
import {
  FaComments,
  FaComment,
  FaTimes,
  FaCheck,
  FaCircle,
} from "react-icons/fa";
import ChatWindow from "./ChatWindow";
import io from "socket.io-client";
import "./ChatNotificationBell.css";

const ChatNotificationBell = ({ userEmail, userType = "DEALER" }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [chatRooms, setChatRooms] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const [showChatWindow, setShowChatWindow] = useState(false);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  const socketRef = useRef(null);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const showDropdownRef = useRef(false);

  // Fetch just the unread count (lightweight)
  const fetchUnreadCount = useCallback(async () => {
    if (!userEmail) return;

    try {
      const response = await fetch(
        `http://localhost:8089/api/chat/unread-count/${encodeURIComponent(
          userEmail
        )}`
      );
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  }, [userEmail]);

  // Fetch chat rooms and unread count
  const fetchChatRooms = useCallback(async () => {
    if (!userEmail) return;

    try {
      const response = await fetch(
        `http://localhost:8089/api/chat/rooms/${encodeURIComponent(userEmail)}`
      );
      if (response.ok) {
        const rooms = await response.json();
        setChatRooms(rooms);

        // Calculate total unread count
        const totalUnread = rooms.reduce(
          (sum, room) => sum + (room.unread_count || 0),
          0
        );
        setUnreadCount(totalUnread);
      }
    } catch (error) {
      console.error("Failed to fetch chat rooms:", error);
    }
  }, [userEmail]);

  // Initialize socket connection for real-time notifications
  useEffect(() => {
    if (!userEmail) return;

    const newSocket = io("http://localhost:8089", {
      transports: ["websocket"],
      forceNew: false,
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 1000,
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("🟢 Connected to chat notification service");
      setIsConnected(true);

      // Register this socket for global notifications
      newSocket.emit("register_for_notifications", {
        userEmail: userEmail,
        userType: userType,
      });
    });

    newSocket.on("disconnect", () => {
      console.log("🔴 Disconnected from chat notification service");
      setIsConnected(false);
    });

    // Listen for new messages globally
    newSocket.on("new_message", (messageData) => {
      // Check if this message is for this user
      if (messageData.sender_email !== userEmail) {
        // Update count immediately for responsiveness
        setUnreadCount((prev) => prev + 1);
        // Also fetch accurate count from server
        setTimeout(() => fetchUnreadCount(), 100);
        if (showDropdownRef.current) {
          fetchChatRooms();
        }
      }
    });

    // Listen for chat notifications (global notifications for this user)
    newSocket.on("chat_notification", (notificationData) => {
      console.log("Received chat notification:", notificationData);
      // Update unread count from server to ensure accuracy
      fetchUnreadCount();
      if (showDropdownRef.current) {
        fetchChatRooms();
      }
    });

    // Listen for room marked as read events
    newSocket.on("room_marked_read", (data) => {
      console.log("Room marked as read:", data.roomId);
      // Refresh unread count when rooms are marked as read
      fetchUnreadCount();
    });

    return () => {
      newSocket.disconnect();
    };
  }, [userEmail, fetchChatRooms, fetchUnreadCount]);

  // Initial load and periodic refresh
  useEffect(() => {
    if (userEmail) {
      // Load unread count immediately (lightweight)
      fetchUnreadCount();

      // Also periodically refresh unread count every 15 seconds
      const countInterval = setInterval(() => {
        fetchUnreadCount();
      }, 15000);

      return () => clearInterval(countInterval);
    }
  }, [fetchUnreadCount, userEmail]);

  // Handle chat selection
  const handleChatSelect = (room) => {
    const otherUserEmail =
      userType === "DEALER" ? room.technician_email : room.dealer_email;

    // Mark this room as read immediately when selecting it
    if (socket && isConnected && room.unread_count > 0) {
      socket.emit("mark_room_read", { roomId: room.room_id });
    }

    // Extract postId if this is a post-based chat room
    const extractedPostId =
      room.post_id ||
      (typeof room.room_id === "string" && room.room_id.includes(":POST_")
        ? parseInt(room.room_id.split(":POST_")[1], 10)
        : null);

    setSelectedChat({
      dealerEmail: room.dealer_email,
      technicianEmail: room.technician_email,
      otherUserEmail,
      roomId: room.room_id,
      postId: Number.isFinite(extractedPostId) ? extractedPostId : null,
    });
    setShowChatWindow(true);
    setShowDropdown(false);
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    if (!socket || !isConnected) return;

    // Mark all rooms with unread messages as read
    const roomsWithUnread = chatRooms.filter((room) => room.unread_count > 0);

    roomsWithUnread.forEach((room) => {
      socket.emit("mark_room_read", { roomId: room.room_id });
    });

    // Optimistically update the UI
    setUnreadCount(0);
    setChatRooms((prev) => prev.map((room) => ({ ...room, unread_count: 0 })));
  };

  // Clear all chats
  const handleClearAll = () => {
    setChatRooms([]);
    setUnreadCount(0);
  };

  // Format time
  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else {
      return date.toLocaleDateString();
    }
  };

  // Get other user name
  const getOtherUserName = (room) => {
    const email =
      userType === "DEALER" ? room.technician_email : room.dealer_email;
    return email.split("@")[0];
  };

  // Build display label with post number if available
  const getRoomDisplayLabel = (room) => {
    const name = getOtherUserName(room);
    const postId =
      room.post_id ||
      (typeof room.room_id === "string" && room.room_id.includes(":POST_")
        ? parseInt(room.room_id.split(":POST_")[1], 10)
        : null);
    return Number.isFinite(postId) ? `${name} • Post #${postId}` : name;
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!userEmail) return null;

  return (
    <>
      {/* Chat Notification Bell */}
      <div className="position-relative chat-notification-bell">
        <button
          ref={buttonRef}
          className="btn position-relative d-flex align-items-center justify-content-center"
          onClick={() => {
            const newShowState = !showDropdown;
            setShowDropdown(newShowState);
            showDropdownRef.current = newShowState;
            if (newShowState) {
              fetchChatRooms(); // Refresh chat rooms when opening dropdown
            }
          }}
          aria-label="Chat Notifications"
          style={{
            width: 44,
            height: 44,
            borderRadius: "14px",
            background: "rgba(255,255,255,0.9)",
            border: "1px solid rgba(0,0,0,0.1)",
            color: "#1e293b",
            backdropFilter: "blur(16px)",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            boxShadow:
              "0 4px 12px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.8)",
          }}
          onMouseEnter={(e) => {
            e.target.style.background = "rgba(255,255,255,1)";
            e.target.style.transform = "translateY(-2px) scale(1.02)";
            e.target.style.boxShadow =
              "0 8px 20px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.9)";
          }}
          onMouseLeave={(e) => {
            e.target.style.background = "rgba(255,255,255,0.9)";
            e.target.style.transform = "translateY(0) scale(1)";
            e.target.style.boxShadow =
              "0 4px 12px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.8)";
          }}
        >
          <FaComments size={18} />

          {/* Connection indicator */}
          <div
            style={{
              position: "absolute",
              top: -2,
              left: -2,
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: isConnected ? "#10b981" : "#ef4444",
              border: "2px solid white",
              boxShadow: "0 0 0 1px rgba(0,0,0,0.1)",
            }}
          />

          {/* Unread count badge */}
          {unreadCount > 0 && (
            <Badge
              bg="danger"
              pill
              style={{
                position: "absolute",
                top: -8,
                right: -8,
                fontSize: "0.7rem",
                minWidth: "18px",
                height: "18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "2px solid white",
                boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
              }}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </button>

        {/* Dropdown */}
        {showDropdown && (
          <div
            ref={dropdownRef}
            className="notification-dropdown"
            style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              right: 0,
              zIndex: 1060,
              background: "white",
              borderRadius: "16px",
              boxShadow:
                "0 20px 60px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.2)",
              minWidth: "320px",
              maxWidth: "400px",
              maxHeight: "500px",
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid rgba(0,0,0,0.06)",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
              }}
            >
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h6 className="mb-0 fw-bold">Unread Messages</h6>
                  <small style={{ opacity: 0.9 }}>
                    {chatRooms.filter((r) => (r.unread_count || 0) > 0).length}{" "}
                    conversation
                    {chatRooms.filter((r) => (r.unread_count || 0) > 0)
                      .length !== 1
                      ? "s"
                      : ""}
                  </small>
                </div>
                <div className="d-flex gap-2">
                  {unreadCount > 0 && (
                    <button
                      className="btn btn-sm"
                      onClick={handleMarkAllAsRead}
                      style={{
                        background: "rgba(255,255,255,0.2)",
                        border: "1px solid rgba(255,255,255,0.3)",
                        color: "white",
                        borderRadius: "8px",
                        fontSize: "0.75rem",
                        padding: "4px 8px",
                      }}
                      title="Mark all as read"
                    >
                      <FaCheck size={12} />
                    </button>
                  )}
                  <button
                    className="btn btn-sm"
                    onClick={() => setShowDropdown(false)}
                    style={{
                      background: "rgba(255,255,255,0.2)",
                      border: "1px solid rgba(255,255,255,0.3)",
                      color: "white",
                      borderRadius: "8px",
                      fontSize: "0.75rem",
                      padding: "4px 8px",
                    }}
                  >
                    <FaTimes size={12} />
                  </button>
                </div>
              </div>
            </div>

            {/* Chat List */}
            <div style={{ maxHeight: "400px", overflowY: "auto" }}>
              {chatRooms.filter((r) => (r.unread_count || 0) > 0).length ===
              0 ? (
                <div className="text-center p-4">
                  <FaComment size={32} className="text-muted mb-2" />
                  <p className="text-muted mb-0">No unread messages</p>
                  <small className="text-muted">You're all caught up</small>
                </div>
              ) : (
                chatRooms
                  .filter((room) => (room.unread_count || 0) > 0)
                  .map((room) => {
                    const otherUserName = getOtherUserName(room);
                    const displayLabel = getRoomDisplayLabel(room);
                    const hasUnread = room.unread_count > 0;

                    return (
                      <div
                        key={room.room_id}
                        className="border-bottom"
                        style={{
                          cursor: "pointer",
                          padding: "12px 20px",
                          transition: "background 0.2s ease",
                          background: hasUnread
                            ? "rgba(59, 130, 246, 0.05)"
                            : "transparent",
                          borderLeft: hasUnread
                            ? "3px solid #3b82f6"
                            : "3px solid transparent",
                        }}
                        onClick={() => handleChatSelect(room)}
                        onMouseEnter={(e) => {
                          e.target.style.background = "rgba(0,0,0,0.02)";
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = hasUnread
                            ? "rgba(59, 130, 246, 0.05)"
                            : "transparent";
                        }}
                      >
                        <div className="d-flex align-items-start justify-content-between">
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="d-flex align-items-center gap-2 mb-1">
                              <h6
                                className={`mb-0 ${
                                  hasUnread ? "fw-bold" : "fw-semibold"
                                }`}
                                style={{
                                  fontSize: "0.9rem",
                                  color: hasUnread ? "#1e293b" : "#64748b",
                                }}
                              >
                                {displayLabel}
                              </h6>
                              {hasUnread && (
                                <FaCircle
                                  size={6}
                                  style={{ color: "#3b82f6" }}
                                />
                              )}
                            </div>
                            {room.last_message && (
                              <p
                                className={`mb-0 ${
                                  hasUnread ? "fw-medium" : ""
                                }`}
                                style={{
                                  fontSize: "0.8rem",
                                  color: hasUnread ? "#475569" : "#94a3b8",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                  maxWidth: "200px",
                                }}
                              >
                                {room.last_message_sender === userEmail
                                  ? "You: "
                                  : ""}
                                {room.last_message}
                              </p>
                            )}
                          </div>
                          <div className="text-end">
                            {room.last_message_time && (
                              <small
                                style={{
                                  fontSize: "0.7rem",
                                  color: hasUnread ? "#64748b" : "#94a3b8",
                                  fontWeight: hasUnread ? "600" : "normal",
                                }}
                              >
                                {formatTime(room.last_message_time)}
                              </small>
                            )}
                            {hasUnread && (
                              <Badge
                                bg="primary"
                                pill
                                style={{
                                  fontSize: "0.6rem",
                                  marginTop: "2px",
                                  display: "block",
                                  width: "fit-content",
                                  marginLeft: "auto",
                                }}
                              >
                                {room.unread_count}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Chat Window Modal */}
      {selectedChat && (
        <ChatWindow
          show={showChatWindow}
          onHide={() => {
            setShowChatWindow(false);
            setSelectedChat(null);
            // Refresh chat rooms when closing
            fetchChatRooms();
          }}
          dealerEmail={selectedChat.dealerEmail}
          technicianEmail={selectedChat.technicianEmail}
          userType={userType}
          postId={selectedChat.postId}
        />
      )}
    </>
  );
};

export default ChatNotificationBell;
