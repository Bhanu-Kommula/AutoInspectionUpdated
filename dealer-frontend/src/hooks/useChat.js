import { useState, useEffect, useCallback, useRef } from "react";
import socketManager from "../utils/socketManager";
// Do not modify chat API endpoints here

const useChat = (dealerEmail, technicianEmail, userType, postId = null) => {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [roomId, setRoomId] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Create room ID
  const createRoomId = useCallback(() => {
    if (dealerEmail && technicianEmail) {
      if (postId) {
        return `${dealerEmail}:${technicianEmail}:POST_${postId}`;
      }
      return `${dealerEmail}:${technicianEmail}`;
    }
    return null;
  }, [dealerEmail, technicianEmail, postId]);

  // Initialize socket connection
  useEffect(() => {
    if (!dealerEmail || !technicianEmail || !userType) {
      console.log("Missing required parameters:", {
        dealerEmail,
        technicianEmail,
        userType,
      });
      return;
    }

    // Use socket manager to prevent multiple connections
    const newSocket = socketManager.getChatSocket();

    if (!newSocket) {
      console.log("⚠️ Socket connection in progress, will retry...");
      // Retry after a short delay
      setTimeout(() => {
        const retrySocket = socketManager.getChatSocket();
        if (retrySocket) {
          setupSocketConnection(retrySocket);
        }
      }, 1000);
      return;
    }

    setupSocketConnection(newSocket);
  }, [dealerEmail, technicianEmail, userType, postId, createRoomId]);

  // Setup socket connection and event listeners
  const setupSocketConnection = (newSocket) => {
    socketRef.current = newSocket;
    setSocket(newSocket);

    const generatedRoomId = createRoomId();
    setRoomId(generatedRoomId);

    console.log("🔧 Setting up socket connection for room:", generatedRoomId);

    // Set up event listeners first
    setupSocketEventListeners(newSocket, generatedRoomId);

    // Register for global notifications early so first messages are delivered
    const currentUserEmail =
      userType === "DEALER" ? dealerEmail : technicianEmail;
    if (currentUserEmail) {
      if (newSocket.connected) {
        newSocket.emit("register_for_notifications", {
          userEmail: currentUserEmail,
          userType,
        });
      } else {
        newSocket.once("connect", () => {
          newSocket.emit("register_for_notifications", {
            userEmail: currentUserEmail,
            userType,
          });
        });
      }
    }

    // Join the room when socket is connected
    const joinRoom = () => {
      console.log("🏠 Joining room:", generatedRoomId);
      newSocket.emit("join_room", {
        dealerEmail,
        technicianEmail,
        userType,
        postId,
      });
    };

    if (newSocket.connected) {
      console.log("🟢 Using existing chat server connection");
      setIsConnected(true);
      joinRoom();
    } else {
      // Ensure we join once the transport connects
      newSocket.once("connect", () => {
        console.log("🟢 Connected to chat server");
        setIsConnected(true);
        joinRoom();
      });
    }
  };

  // Setup all socket event listeners
  const setupSocketEventListeners = useCallback(
    (newSocket, generatedRoomId) => {
      // Clean up any existing listeners
      newSocket.off("disconnect");
      newSocket.off("new_message");
      newSocket.off("chat_notification");
      newSocket.off("user_typing");
      newSocket.off("user_joined");
      newSocket.off("user_left");
      newSocket.off("error");

      newSocket.on("disconnect", () => {
        console.log("🔴 Disconnected from chat server");
        setIsConnected(false);
      });

      newSocket.on("new_message", (messageData) => {
        console.log("💬 Received new_message:", messageData);
        setMessages((prev) => {
          // Remove any temporary messages with same content
          const filteredPrev = prev.filter(
            (msg) =>
              !msg.id.toString().startsWith("temp_") ||
              msg.message_content !== messageData.message_content
          );

          // Check if this message already exists (avoid duplicates)
          const exists = filteredPrev.some((msg) => msg.id === messageData.id);
          if (!exists) {
            const updated = [...filteredPrev, messageData];
            console.log("💬 Updated messages state:", updated.length);
            return updated;
          }
          return filteredPrev;
        });

        // Increment unread count if message is not from current user
        const currentUserEmail =
          userType === "DEALER" ? dealerEmail : technicianEmail;
        if (messageData.sender_email !== currentUserEmail) {
          setUnreadCount((prev) => prev + 1);
        }
      });

      // Also listen for chat_notification as backup
      newSocket.on("chat_notification", (messageData) => {
        console.log("🔔 Received chat_notification:", messageData);

        // Only add if this message is for our current room
        const currentRoomId = createRoomId();
        console.log(
          "🔔 Current room:",
          currentRoomId,
          "Message room:",
          messageData.roomId
        );

        if (messageData.roomId === currentRoomId) {
          console.log("🔔 Message is for current room, adding to UI");
          setMessages((prev) => {
            // Check if message already exists
            const exists = prev.some((msg) => msg.id === messageData.id);
            if (!exists) {
              console.log("🔔 Adding new message to state");
              return [...prev, messageData];
            }
            console.log("🔔 Message already exists, skipping");
            return prev;
          });

          // Increment unread count if message is not from current user
          const currentUserEmail =
            userType === "DEALER" ? dealerEmail : technicianEmail;
          if (messageData.sender_email !== currentUserEmail) {
            setUnreadCount((prev) => prev + 1);
          }
        } else {
          console.log("🔔 Message not for current room, ignoring");
        }
      });

      newSocket.on("user_typing", (data) => {
        const currentUserEmail =
          userType === "DEALER" ? dealerEmail : technicianEmail;
        if (data.userEmail !== currentUserEmail) {
          setIsTyping(data.isTyping);

          if (data.isTyping) {
            // Clear typing indicator after 3 seconds
            if (typingTimeoutRef.current) {
              clearTimeout(typingTimeoutRef.current);
            }
            typingTimeoutRef.current = setTimeout(() => {
              setIsTyping(false);
            }, 3000);
          }
        }
      });

      newSocket.on("user_joined", (data) => {
        console.log(`👤 ${data.userType} joined the room`);
      });

      newSocket.on("user_left", (data) => {
        console.log(`👋 ${data.userType} left the room`);
      });

      newSocket.on("error", (error) => {
        console.error("Socket error:", error);
        console.error("Error details:", JSON.stringify(error, null, 2));
        console.error("Room ID:", generatedRoomId);
        console.error("User details:", {
          dealerEmail,
          technicianEmail,
          userType,
        });
      });
    },
    [userType, dealerEmail, technicianEmail]
  );

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      // Don't disconnect socket here as it's managed by socketManager
    };
  }, []);

  // Load chat history
  const loadChatHistory = useCallback(async () => {
    if (!dealerEmail || !technicianEmail) return;

    try {
      const url = new URL("http://localhost:8089/api/chat/messages");
      url.searchParams.append("dealerEmail", dealerEmail);
      url.searchParams.append("technicianEmail", technicianEmail);
      if (postId) {
        url.searchParams.append("postId", postId);
      }

      console.log("🔍 Loading chat history from:", url.toString());
      const response = await fetch(url);
      if (response.ok) {
        const history = await response.json();
        console.log("📜 Chat history loaded:", history.length, "messages");
        console.log("📜 Messages:", history);
        setMessages(history);
      } else {
        console.error(
          "Failed to load chat history - response not ok:",
          response.status
        );
      }
    } catch (error) {
      console.error("Failed to load chat history:", error);
    }
  }, [dealerEmail, technicianEmail, postId]);

  // Send message
  const sendMessage = useCallback(
    (message) => {
      if (!socket || !isConnected || !message.trim() || !roomId) return;

      console.log("📤 Sending message:", {
        roomId,
        message: message.trim(),
        senderType: userType,
      });

      // Add message optimistically to UI (will be confirmed by server)
      const tempMessage = {
        id: `temp_${Date.now()}`,
        room_id: roomId,
        sender_email: userType === "DEALER" ? dealerEmail : technicianEmail,
        sender_type: userType,
        message_content: message.trim(),
        sent_at: new Date().toISOString(),
        read_status: false,
      };

      setMessages((prev) => [...prev, tempMessage]);

      socket.emit("send_message", {
        roomId,
        message: message.trim(),
        senderType: userType,
      });
    },
    [socket, isConnected, roomId, userType, dealerEmail, technicianEmail]
  );

  // Send typing indicator
  const sendTypingIndicator = useCallback(
    (isTypingNow) => {
      if (!socket || !isConnected) return;

      socket.emit("typing", { isTyping: isTypingNow });
    },
    [socket, isConnected]
  );

  // Mark messages as read
  const markAsRead = useCallback(() => {
    setUnreadCount(0);

    // Also mark all messages in this room as read on the server
    if (socket && isConnected && roomId) {
      socket.emit("mark_room_read", { roomId });
    }
  }, [socket, isConnected, roomId]);

  // Global function to check unread count for notifications
  const getUnreadCount = useCallback(async (userEmail) => {
    if (!userEmail) return 0;

    try {
      const response = await fetch(
        `http://localhost:8089/api/chat/unread-count/${encodeURIComponent(
          userEmail
        )}`
      );
      if (response.ok) {
        const data = await response.json();
        return data.unreadCount;
      }
    } catch (error) {
      console.error("Failed to get unread count:", error);
    }
    return 0;
  }, []);

  // Get other user info
  const getOtherUserInfo = useCallback(() => {
    if (userType === "DEALER") {
      return {
        email: technicianEmail,
        type: "TECHNICIAN",
        name: technicianEmail.split("@")[0], // Simple name extraction
      };
    } else {
      return {
        email: dealerEmail,
        type: "DEALER",
        name: dealerEmail.split("@")[0], // Simple name extraction
      };
    }
  }, [dealerEmail, technicianEmail, userType]);

  return {
    messages,
    isConnected,
    isTyping,
    unreadCount,
    sendMessage,
    sendTypingIndicator,
    markAsRead,
    loadChatHistory,
    otherUser: getOtherUserInfo(),
    roomId,
    getUnreadCount,
    socket,
  };
};

export default useChat;
