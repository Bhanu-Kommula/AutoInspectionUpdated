import React, { useEffect, useState } from "react";
import { Button, Badge } from "react-bootstrap";
import { FaComments, FaComment } from "react-icons/fa";
import ChatWindow from "./ChatWindow";
import "./ChatButton.css";

const ChatButton = ({
  dealerEmail,
  technicianEmail,
  userType = "DEALER",
  variant = "primary",
  size = "sm",
  className = "",
  showText = true,
  postId = null,
  postTitle = null,
}) => {
  const [showChat, setShowChat] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Lightweight unread count fetch without opening sockets
    const currentUserEmail =
      userType === "DEALER" ? dealerEmail : technicianEmail;
    let isCancelled = false;

    async function fetchUnread() {
      if (!currentUserEmail) return;
      try {
        const res = await fetch(
          `http://localhost:8089/api/chat/unread-count/${encodeURIComponent(
            currentUserEmail
          )}`
        );
        if (!isCancelled && res.ok) {
          const data = await res.json();
          setUnreadCount(data.unreadCount || 0);
        }
      } catch {}
    }

    fetchUnread();
    const id = setInterval(fetchUnread, 30000);
    return () => {
      isCancelled = true;
      clearInterval(id);
    };
  }, [dealerEmail, technicianEmail, userType]);

  const handleChatOpen = () => {
    setShowChat(true);
  };

  const handleChatClose = () => {
    setShowChat(false);
  };

  // Don't render if missing required props
  if (!dealerEmail || !technicianEmail) {
    return null;
  }

  const getOtherUserName = () => {
    const email = userType === "DEALER" ? technicianEmail : dealerEmail;
    return email.split("@")[0]; // Simple name extraction
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleChatOpen}
        className={`chat-button ${className}`}
        title={`Chat with ${getOtherUserName()}`}
      >
        <div className="d-flex align-items-center">
          {showText ? <FaComments className="me-1" /> : <FaComment />}
          {showText && <span className="chat-button-text">Chat</span>}
          {unreadCount > 0 && (
            <Badge bg="danger" pill className="ms-1 unread-badge">
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </div>
      </Button>

      {showChat && (
        <ChatWindow
          show={showChat}
          onHide={handleChatClose}
          dealerEmail={dealerEmail}
          technicianEmail={technicianEmail}
          userType={userType}
          postId={postId}
          postTitle={postTitle}
        />
      )}
    </>
  );
};

export default ChatButton;
