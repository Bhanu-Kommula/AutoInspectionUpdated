import React, { useState, useEffect } from "react";
import {
  getRemainingSessionTime,
  isUserActive,
} from "../utils/sessionTimeoutManager";

/**
 * Test component to verify session timeout functionality
 * This can be used to test the session timeout features
 */
const SessionTimeoutTest = () => {
  const [remainingTime, setRemainingTime] = useState(0);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setRemainingTime(getRemainingSessionTime());
      setIsActive(isUserActive());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        top: "10px",
        left: "10px",
        background: "rgba(0, 0, 0, 0.8)",
        color: "white",
        padding: "10px",
        borderRadius: "5px",
        fontSize: "12px",
        zIndex: 10000,
        fontFamily: "monospace",
      }}
    >
      <div>Session Timeout Test</div>
      <div>Active: {isActive ? "✅" : "❌"}</div>
      <div>Remaining: {remainingTime}m</div>
    </div>
  );
};

export default SessionTimeoutTest;
