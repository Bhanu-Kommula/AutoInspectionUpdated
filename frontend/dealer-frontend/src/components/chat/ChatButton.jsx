import React, { useEffect, useState } from "react";
import { Button, Badge } from "react-bootstrap";
import { FaComments, FaComment } from "react-icons/fa";
import ChatWindow from "./ChatWindow";
import "./ChatButton.css";

const ChatButton = ({
  dealerEmail,
  technicianEmail,
  userType = "DEALER",
  variant = "outline-primary",
  size = "sm",
  className = "",
  showText = true,
  postId = null,
  postTitle = null,
  shape = "pill", // pill | square
}) => {
  const [showChat, setShowChat] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const currentUserEmail =
      userType === "DEALER" ? dealerEmail : technicianEmail;
    let isCancelled = false;

    async function fetchUnread() {
      if (!currentUserEmail) return;
      try {
        const { CHAT_BASE_URL } = await import("../../utils/socketManager");
        const res = await fetch(
          `${CHAT_BASE_URL}/api/chat/unread-count/${encodeURIComponent(
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

  const handleChatOpen = () => setShowChat(true);
  const handleChatClose = () => setShowChat(false);

  if (!dealerEmail || !technicianEmail) return null;

  const getOtherUserName = () => {
    const email = userType === "DEALER" ? technicianEmail : dealerEmail;
    return email.split("@")[0];
  };

  const btnClasses = [
    "chat-button-modern",
    shape === "pill" ? "rounded-pill" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleChatOpen}
        className={btnClasses}
        title={`Chat with ${getOtherUserName()}`}
      >
        <div className="d-flex align-items-center justify-content-center position-relative w-100 text-center">
          {showText ? <FaComments className="me-2" /> : <FaComment />}
          {showText && <span className="fw-semibold">Chat</span>}
          {unreadCount > 0 && (
            <Badge
              bg="danger"
              pill
              className="position-absolute top-0 start-100 translate-middle p-1 px-2"
            >
              <span style={{ fontSize: "0.65rem" }}>
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
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
