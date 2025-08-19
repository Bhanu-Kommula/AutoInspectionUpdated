import React, { useState } from "react";
import globalCallService from "../services/globalCallService";
import "./GlobalCallDemo.css";

const GlobalCallDemo = () => {
  const [userName, setUserName] = useState("");
  const [targetUser, setTargetUser] = useState("");
  const [roomId, setRoomId] = useState("");
  const [callStatus, setCallStatus] = useState("idle");

  const initializeCallService = async () => {
    if (!userName.trim()) {
      alert("Please enter a user name");
      return;
    }

    try {
      await globalCallService.initialize(userName, roomId || "demo-room");
      setCallStatus("ready");
      alert(`Global call service initialized for ${userName}`);
    } catch (error) {
      console.error("Failed to initialize:", error);
      alert("Failed to initialize call service: " + error.message);
    }
  };

  const startCall = async () => {
    if (!targetUser.trim()) {
      alert("Please enter a target user name");
      return;
    }

    try {
      setCallStatus("calling");
      await globalCallService.startCall(targetUser, roomId || "demo-room", "video");
      setCallStatus("connected");
    } catch (error) {
      console.error("Failed to start call:", error);
      setCallStatus("error");
      alert("Failed to start call: " + error.message);
    }
  };

  const endCall = () => {
    globalCallService.endCall();
    setCallStatus("ready");
  };

  return (
    <div className="global-call-demo">
      <h3>🌐 Global Call System Demo</h3>
      
      <div className="demo-section">
        <h4>1. Initialize Call Service</h4>
        <input
          type="text"
          placeholder="Enter your user name"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          className="demo-input"
        />
        <input
          type="text"
          placeholder="Enter room ID (optional)"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          className="demo-input"
        />
        <button 
          onClick={initializeCallService}
          disabled={!userName.trim()}
          className="demo-btn init-btn"
        >
          Initialize Call Service
        </button>
      </div>

      {callStatus === "ready" && (
        <div className="demo-section">
          <h4>2. Start a Call</h4>
          <input
            type="text"
            placeholder="Enter target user name"
            value={targetUser}
            onChange={(e) => setTargetUser(e.target.value)}
            className="demo-input"
          />
          <button 
            onClick={startCall}
            disabled={!targetUser.trim()}
            className="demo-btn call-btn"
          >
            📞 Start Video Call
          </button>
        </div>
      )}

      {callStatus === "connected" && (
        <div className="demo-section">
          <h4>3. Call in Progress</h4>
          <p>✅ Call connected to {targetUser}</p>
          <button onClick={endCall} className="demo-btn end-btn">
            📞 End Call
          </button>
        </div>
      )}

      {callStatus === "error" && (
        <div className="demo-section error">
          <h4>❌ Error</h4>
          <p>Failed to start call. Please try again.</p>
          <button onClick={() => setCallStatus("ready")} className="demo-btn">
            Reset
          </button>
        </div>
      )}

      <div className="demo-info">
        <h4>ℹ️ How it works:</h4>
        <ul>
          <li>Initialize the call service with your user name</li>
          <li>Start a call to any other user (they don't need to be in the same room)</li>
          <li>Calls work globally across the entire application</li>
          <li>Users receive call notifications anywhere in the app</li>
        </ul>
      </div>
    </div>
  );
};

export default GlobalCallDemo;
