import React, { useState, useEffect } from "react";
import {
  FiPhone,
  FiPhoneOff,
  FiVideo,
  FiVideoOff,
  FiMic,
  FiMicOff,
} from "react-icons/fi";
import globalCallService from "../services/globalCallService";
import { debugUserIdentification } from "../utils/userIdentificationDebug";
import "./GlobalCallNotification.css";

const GlobalCallNotification = ({ currentUser, currentRoomId }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [callState, setCallState] = useState("idle");
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);

  // Add notification function
  const addNotification = (message, type = "info") => {
    // This will be handled by the parent component's notification system
    console.log(`📞 [GlobalCall] ${type.toUpperCase()}: ${message}`);
  };

  useEffect(() => {
    if (!currentUser) return;

    // Initialize global call service
    const initializeGlobalCalls = async () => {
      try {
        console.log(
          "🔍 [GlobalCallNotification] Debug user identification before initialization:"
        );
        debugUserIdentification();
        console.log(
          "🔍 [GlobalCallNotification] Using currentUser:",
          currentUser
        );

        await globalCallService.initialize(currentUser, currentRoomId);

        // Set up event handlers
        globalCallService.onIncomingCall = (call) => {
          console.log(
            "📞 [GlobalCallNotification] Incoming call received:",
            call
          );
          setIncomingCall(call);
          setCallState("incoming");
          setIsVisible(true);

          // Show notification in bell instead of toast
          addNotification(`Incoming ${call.callType} call from ${call.from}`, "info");
        };

        globalCallService.onCallEnd = (reason) => {
          console.log("📞 [GlobalCallNotification] Call ended:", reason);
          setCallState("idle");
          setIncomingCall(null);
          setIsVisible(false);

                           addNotification("Call ended", "info");
        };

        globalCallService.onCallStateChange = (state) => {
          console.log("📞 [GlobalCallNotification] Call state changed:", state);
          setCallState(state);

          if (state === "idle") {
            setIsVisible(false);
          }
        };

        console.log(
          "✅ [GlobalCallNotification] Global call service initialized"
        );
      } catch (error) {
        console.error(
          "❌ [GlobalCallNotification] Failed to initialize:",
          error
        );
      }
    };

    initializeGlobalCalls();

    // Cleanup on unmount
    return () => {
      globalCallService.cleanup();
    };
  }, [currentUser]);

  // Update room when it changes
  useEffect(() => {
    if (currentUser && currentRoomId) {
      globalCallService.updateCurrentRoom(currentRoomId);
    }
  }, [currentUser, currentRoomId]);

  const handleAnswerCall = async () => {
    try {
      console.log("📞 [GlobalCallNotification] Answering call");
      await globalCallService.answerCall({
        video: isVideoEnabled,
        audio: isAudioEnabled,
      });

      setCallState("connected");
                   addNotification("Call connected!", "success");
    } catch (error) {
      console.error(
        "❌ [GlobalCallNotification] Failed to answer call:",
        error
      );
                   addNotification("Failed to answer call: " + error.message, "error");
    }
  };

  const handleRejectCall = () => {
    console.log("❌ [GlobalCallNotification] Rejecting call");
    globalCallService.rejectCall();
    setIsVisible(false);
               addNotification("Call rejected", "info");
  };

  const handleEndCall = () => {
    console.log("📞 [GlobalCallNotification] Ending call");
    globalCallService.endCall();
  };

  const toggleVideo = () => {
    setIsVideoEnabled(!isVideoEnabled);
    // Note: This would need to be implemented in the WebRTC service
  };

  const toggleAudio = () => {
    setIsAudioEnabled(!isAudioEnabled);
    // Note: This would need to be implemented in the WebRTC service
  };

  // Don't show if no incoming call or not visible
  if (!isVisible || !incomingCall) {
    return null;
  }

  return (
    <div className="global-call-notification">
      <div className="call-notification-header">
        <div className="call-info">
          <h4>📞 Incoming {incomingCall.callType} Call</h4>
          <p>From: {incomingCall.from}</p>
          <p>Room: {incomingCall.roomId}</p>
        </div>
      </div>

      <div className="call-notification-actions">
        {callState === "incoming" && (
          <>
            <button
              className="call-btn answer-btn"
              onClick={handleAnswerCall}
              title="Answer Call"
            >
              <FiPhone />
              Answer
            </button>
            <button
              className="call-btn reject-btn"
              onClick={handleRejectCall}
              title="Reject Call"
            >
              <FiPhoneOff />
              Reject
            </button>
          </>
        )}

        {callState === "connected" && (
          <>
            <button
              className="call-btn toggle-btn"
              onClick={toggleVideo}
              title={isVideoEnabled ? "Disable Video" : "Enable Video"}
            >
              {isVideoEnabled ? <FiVideo /> : <FiVideoOff />}
              {isVideoEnabled ? "Video On" : "Video Off"}
            </button>
            <button
              className="call-btn toggle-btn"
              onClick={toggleAudio}
              title={isAudioEnabled ? "Disable Audio" : "Enable Audio"}
            >
              {isAudioEnabled ? <FiMic /> : <FiMicOff />}
              {isAudioEnabled ? "Audio On" : "Audio Off"}
            </button>
            <button
              className="call-btn end-btn"
              onClick={handleEndCall}
              title="End Call"
            >
              <FiPhoneOff />
              End Call
            </button>
          </>
        )}
      </div>

      {callState === "connected" && (
        <div className="call-status">
          <p>✅ Call in progress...</p>
        </div>
      )}
    </div>
  );
};

export default GlobalCallNotification;
