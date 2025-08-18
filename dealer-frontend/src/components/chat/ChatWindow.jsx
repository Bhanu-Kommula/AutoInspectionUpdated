import React, { useState, useEffect, useRef } from "react";
import {
  Modal,
  Button,
  Form,
  ListGroup,
  Spinner,
  Badge,
} from "react-bootstrap";
import { FaPaperPlane, FaUser } from "react-icons/fa";
import useChat from "../../hooks/useChat";
import CallButton from "../CallButton";
import globalCallManager from "../../utils/globalCallManager";
import "./ChatWindow.css";

const ChatWindow = ({
  show,
  onHide,
  dealerEmail,
  technicianEmail,
  userType = "DEALER",
  postId = null,
  postTitle = null,
}) => {
  const [newMessage, setNewMessage] = useState("");
  const [isTypingMessage, setIsTypingMessage] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const {
    messages,
    isConnected,
    isTyping,
    sendMessage,
    sendTypingIndicator,
    markAsRead,
    loadChatHistory,
    otherUser,
  } = useChat(dealerEmail, technicianEmail, userType, postId);

  // Get current user email
  const getCurrentUserEmail = () => {
    return userType === "DEALER" ? dealerEmail : technicianEmail;
  };

  const currentUserEmail = getCurrentUserEmail();

  // Sanitize post title to avoid showing "undefined undefined"
  const displayPostTitle = (() => {
    if (!postTitle || typeof postTitle !== "string") return null;
    const cleaned = postTitle
      .replace(/\b(undefined|null)\b/gi, "")
      .replace(/\s+/g, " ")
      .trim();
    return cleaned && cleaned.length > 0 ? cleaned : null;
  })();

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load history when chat opens
  useEffect(() => {
    if (show && dealerEmail && technicianEmail) {
      // Load fresh history each time chat opens
      loadChatHistory();
      markAsRead();
    }
  }, [show, dealerEmail, technicianEmail, postId, loadChatHistory, markAsRead]);

  // Handle message input
  const handleInputChange = (e) => {
    const value = e.target.value;
    setNewMessage(value);

    // Handle typing indicator
    if (value.trim() && !isTypingMessage) {
      setIsTypingMessage(true);
      sendTypingIndicator(true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTypingMessage(false);
      sendTypingIndicator(false);
    }, 1000);
  };

  // Send message
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() && isConnected) {
      sendMessage(newMessage);
      setNewMessage("");

      // Stop typing indicator immediately
      setIsTypingMessage(false);
      sendTypingIndicator(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Handle call initiation
  const handleStartCall = (callType) => {
    console.log("🎯 Starting call:", {
      callType,
      userType,
      dealerEmail,
      technicianEmail,
    });

    const targetEmail = userType === "DEALER" ? technicianEmail : dealerEmail;
    const roomId = `${dealerEmail}:${technicianEmail}`;

    console.log("🎯 Call details:", { targetEmail, callType, roomId });

    try {
      // Check if user is logged in and has required info
      if (!dealerEmail || !technicianEmail) {
        console.error("❌ Missing email information for call");
        return;
      }

      // Initialize global call manager if not already done
      if (!globalCallManager.isInitialized) {
        console.log("🔧 Initializing global call manager...");
        globalCallManager.initialize();
      }

      // Use global call manager for calling
      const result = globalCallManager.initiateCall(targetEmail, callType);
      console.log("📞 Call initiation result:", result);

      if (result) {
        console.log("✅ Call initiated successfully");
      } else {
        console.error("❌ Failed to initiate call");
      }
    } catch (error) {
      console.error("❌ Error initiating call:", error);
    }
  };

  return (
    <Modal
      show={show}
      onHide={onHide}
      size="lg"
      centered
      className="chat-modal"
    >
      <Modal.Header closeButton className="chat-header">
        <Modal.Title className="d-flex align-items-center justify-content-between w-100">
          <div className="d-flex align-items-center">
            <FaUser className="me-2" />
            <div>
              <div>Chat with {otherUser.name}</div>
              {postId && (
                <div className="mt-1">
                  <Badge bg="info" text="dark">
                    🚗 Request #{postId}
                    {displayPostTitle
                      ? ` - ${displayPostTitle}`
                      : " - Vehicle Inspection"}
                  </Badge>
                </div>
              )}
            </div>
            <div className="ms-2 d-flex align-items-center">
              <Badge bg={isConnected ? "success" : "warning"}>
                {isConnected ? "Connected" : "Connecting..."}
              </Badge>
            </div>
          </div>

          {/* Call buttons */}
          <div className="d-flex gap-2">
            <CallButton
              type="audio"
              size="small"
              variant="outline"
              onClick={() => handleStartCall("audio")}
              disabled={!isConnected || globalCallManager.hasActiveCall()}
              title={
                globalCallManager.hasActiveCall()
                  ? "Call in progress"
                  : "Start audio call"
              }
            />
            <CallButton
              type="video"
              size="small"
              variant="outline"
              onClick={() => handleStartCall("video")}
              disabled={!isConnected || globalCallManager.hasActiveCall()}
              title={
                globalCallManager.hasActiveCall()
                  ? "Call in progress"
                  : "Start video call"
              }
            />
            {globalCallManager.hasActiveCall() && (
              <small className="text-muted align-self-center ms-2">
                📞 Call active
              </small>
            )}
          </div>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="chat-body p-0">
        <div className="messages-container">
          {messages.length === 0 ? (
            <div className="text-center text-muted p-4">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            <ListGroup variant="flush">
              {messages.map((message) => (
                <ListGroup.Item
                  key={message.id}
                  className={`message-item ${
                    message.sender_email === currentUserEmail
                      ? "message-sent"
                      : "message-received"
                  }`}
                >
                  <div className="message-content">
                    <div className="message-text">
                      {message.message_content}
                    </div>
                    <div className="message-meta">
                      <small className="text-muted">
                        {message.sender_email === currentUserEmail
                          ? "You"
                          : otherUser.name}
                        {" • "}
                        {formatTime(message.sent_at)}
                      </small>
                    </div>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}

          {isTyping && (
            <div className="typing-indicator">
              <div className="typing-dots">
                <span>{otherUser.name} is typing</span>
                <div className="dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </Modal.Body>

      <Modal.Footer className="chat-footer">
        <Form onSubmit={handleSendMessage} className="w-100">
          <div className="d-flex">
            <Form.Control
              type="text"
              placeholder={
                isConnected ? "Type your message..." : "Connecting..."
              }
              value={newMessage}
              onChange={handleInputChange}
              disabled={!isConnected}
              className="message-input"
            />
            <Button
              type="submit"
              variant="primary"
              disabled={!newMessage.trim() || !isConnected}
              className="ms-2 send-button"
            >
              {!isConnected ? (
                <Spinner animation="border" size="sm" />
              ) : (
                <FaPaperPlane />
              )}
            </Button>
          </div>
        </Form>
      </Modal.Footer>
    </Modal>
  );
};

export default ChatWindow;
