import React, { useState, useEffect, useRef } from "react";
import { Modal, Button, Card, Alert, Spinner } from "react-bootstrap";
import {
  FiMic,
  FiMicOff,
  FiVideo,
  FiVideoOff,
  FiPhone,
  FiPhoneCall,
} from "react-icons/fi";
import { FaExpand, FaCompress, FaUser } from "react-icons/fa";
import WebRTCService from "../utils/webrtcService";
// import CallConnectionIndicator from "./CallConnectionIndicator";
import "./VideoCall.css";

const VideoCall = ({
  show,
  onHide,
  socket,
  roomId,
  targetEmail,
  callType = "video",
  isIncoming = false,
  incomingCallData = null,
  userEmail,
  userType,
  onCallEnd = null,
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(callType === "video");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState(null);
  const [callStatus, setCallStatus] = useState(
    isIncoming ? "incoming" : "initiating"
  );
  const [callDuration, setCallDuration] = useState(0);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const webrtcServiceRef = useRef(null);
  const callStartTimeRef = useRef(null);
  const durationIntervalRef = useRef(null);

  useEffect(() => {
    if (show && socket && roomId) {
      initializeCall();
    }

    return () => {
      cleanup();
    };
  }, [show, socket, roomId]);

  useEffect(() => {
    if (callStatus === "connected" && !callStartTimeRef.current) {
      callStartTimeRef.current = Date.now();
      startDurationTimer();
    }
  }, [callStatus]);

  // Auto-close modal when call ends
  useEffect(() => {
    if (callStatus === "ended") {
      const timer = setTimeout(() => {
        console.log("🔄 Auto-closing call modal (useEffect)");
        onHide();
      }, 2000); // Increased to 2 seconds for better UX

      return () => clearTimeout(timer);
    }
  }, [callStatus, onHide]);

  const initializeCall = async () => {
    try {
      setError(null);

      // Check WebRTC support
      if (!WebRTCService.isSupported()) {
        setError(
          "Your browser does not support video calls. Please use a modern browser."
        );
        return;
      }

      // Initialize WebRTC service
      webrtcServiceRef.current = new WebRTCService();
      webrtcServiceRef.current.initialize(socket, roomId);

      // Set up callbacks
      webrtcServiceRef.current.onLocalStream = (stream) => {
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      };

      webrtcServiceRef.current.onRemoteStream = (stream) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
        }
        setIsConnected(true);
        setIsConnecting(false);
        setCallStatus("connected");
      };

      webrtcServiceRef.current.onCallEnded = () => {
        handleCallEnd();
      };

      webrtcServiceRef.current.onError = (errorMessage) => {
        setError(errorMessage);
        setIsConnecting(false);
      };

      // Set up call listeners
      socket.on("call_accepted", (data) => {
        if (data.callId === incomingCallData?.callId) {
          setCallStatus("connecting");
          setIsConnecting(true);
        }
      });

      socket.on("call_rejected", () => {
        setError("Call was rejected");
        setTimeout(() => onHide(), 2000);
      });

      socket.on("call_ended", () => {
        handleCallEnd();
      });

      if (isIncoming && incomingCallData) {
        // For incoming calls, just show the incoming call UI
        setCallStatus("incoming");
      } else {
        // For outgoing calls, start the call immediately
        await startOutgoingCall();
      }
    } catch (error) {
      console.error("Error initializing call:", error);
      setError("Failed to initialize call: " + error.message);
    }
  };

  const startOutgoingCall = async () => {
    try {
      setIsConnecting(true);
      setCallStatus("calling");

      // Initiate call through socket
      socket.emit("call_initiate", {
        roomId,
        callType,
        targetEmail,
      });

      // Start WebRTC call
      const success = await webrtcServiceRef.current.startCall(
        callType,
        targetEmail
      );
      if (!success) {
        setError("Failed to start call");
        setIsConnecting(false);
      }
    } catch (error) {
      console.error("Error starting call:", error);
      setError("Failed to start call");
      setIsConnecting(false);
    }
  };

  const acceptCall = async () => {
    try {
      setIsConnecting(true);
      setCallStatus("connecting");

      // Accept call through socket
      socket.emit("call_accept", {
        callId: incomingCallData.callId,
        roomId,
      });

      // Answer the call with WebRTC
      const success = await webrtcServiceRef.current.answerCall(callType);
      if (success) {
        // Complete the WebRTC answer process
        await webrtcServiceRef.current.completeAnswer();
      } else {
        setError("Failed to answer call");
        setIsConnecting(false);
      }
    } catch (error) {
      console.error("Error accepting call:", error);
      setError("Failed to accept call");
      setIsConnecting(false);
    }
  };

  const rejectCall = () => {
    if (incomingCallData) {
      socket.emit("call_reject", {
        callId: incomingCallData.callId,
        roomId,
      });
    }

    // Call the onCallEnd callback for location restoration
    if (onCallEnd) {
      onCallEnd();
    }

    onHide();
  };

  const endCall = () => {
    // Handle both incoming and outgoing calls
    const activeCall = incomingCallData || (roomId && targetEmail);

    if (activeCall) {
      if (incomingCallData?.callId) {
        socket.emit("call_end", {
          callId: incomingCallData.callId,
          roomId,
        });
      } else {
        // For outgoing calls without callId yet, just emit end with room info
        socket.emit("call_end", {
          roomId,
          targetEmail,
        });
      }
    }
    handleCallEnd();
  };

  const handleCallEnd = () => {
    setIsConnected(false);
    setIsConnecting(false);
    setCallStatus("ended");
    stopDurationTimer();
    cleanup();

    // Call the onCallEnd callback if provided (for location restoration)
    if (onCallEnd) {
      onCallEnd();
    }

    // Auto-close after showing "Call Ended" for 2 seconds
    setTimeout(() => {
      console.log("🔄 Auto-closing call modal after call end");
      onHide();
    }, 2000);
  };

  const toggleMute = () => {
    if (webrtcServiceRef.current) {
      const isAudioEnabled = webrtcServiceRef.current.toggleAudio();
      setIsMuted(!isAudioEnabled);
    }
  };

  const toggleVideo = () => {
    if (webrtcServiceRef.current && callType === "video") {
      const isVideoOn = webrtcServiceRef.current.toggleVideo();
      setIsVideoEnabled(isVideoOn);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const startDurationTimer = () => {
    durationIntervalRef.current = setInterval(() => {
      if (callStartTimeRef.current) {
        const duration = Math.floor(
          (Date.now() - callStartTimeRef.current) / 1000
        );
        setCallDuration(duration);
      }
    }, 1000);
  };

  const stopDurationTimer = () => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const cleanup = () => {
    if (webrtcServiceRef.current) {
      webrtcServiceRef.current.cleanup();
      webrtcServiceRef.current = null;
    }
    stopDurationTimer();

    // Clean up socket listeners
    if (socket) {
      socket.off("call_accepted");
      socket.off("call_rejected");
      socket.off("call_ended");
    }
  };

  const renderIncomingCall = () => (
    <div className="incoming-call-container">
      <div className="caller-info">
        <div className="caller-avatar">
          <FaUser size={48} />
        </div>
        <h4>{incomingCallData?.callerEmail?.split("@")[0] || "Unknown"}</h4>
        <p>Incoming {callType} call</p>
      </div>

      <div className="call-actions">
        <Button
          variant="success"
          size="lg"
          className="accept-btn"
          onClick={acceptCall}
          disabled={isConnecting}
        >
          {isConnecting ? <Spinner size="sm" /> : <FiPhoneCall />}
          {isConnecting ? "Connecting..." : "Accept"}
        </Button>

        <Button
          variant="danger"
          size="lg"
          className="reject-btn"
          onClick={rejectCall}
        >
          <FiPhone />
          Reject
        </Button>
      </div>
    </div>
  );

  const renderVideoCall = () => (
    <div className={`video-call-container ${isFullscreen ? "fullscreen" : ""}`}>
      {/* Remote video */}
      <div className="remote-video-container">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="remote-video"
        />
        {!isConnected && (
          <div className="video-placeholder">
            <FaUser size={64} />
            <p>Waiting for {targetEmail?.split("@")[0]}...</p>
          </div>
        )}
      </div>

      {/* Local video */}
      {callType === "video" && (
        <div className="local-video-container">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className={`local-video ${!isVideoEnabled ? "video-disabled" : ""}`}
          />
          {!isVideoEnabled && (
            <div className="video-disabled-overlay">
              <FaUser size={24} />
            </div>
          )}
        </div>
      )}

      {/* Call controls */}
      <div className="call-controls">
        {isConnected && (
          <div className="call-duration">{formatDuration(callDuration)}</div>
        )}

        <div className="control-buttons">
          <Button
            variant={isMuted ? "danger" : "secondary"}
            className="control-btn"
            onClick={toggleMute}
          >
            {isMuted ? <FiMicOff /> : <FiMic />}
          </Button>

          {callType === "video" && (
            <Button
              variant={isVideoEnabled ? "secondary" : "danger"}
              className="control-btn"
              onClick={toggleVideo}
            >
              {isVideoEnabled ? <FiVideo /> : <FiVideoOff />}
            </Button>
          )}

          {callType === "video" && (
            <Button
              variant="secondary"
              className="control-btn"
              onClick={toggleFullscreen}
            >
              {isFullscreen ? <FaCompress /> : <FaExpand />}
            </Button>
          )}

          <Button
            variant="danger"
            className="control-btn end-call-btn"
            onClick={endCall}
          >
            <FiPhone />
          </Button>
        </div>
      </div>
    </div>
  );

  const renderCallStatus = () => {
    if (callStatus === "calling") {
      return (
        <div className="call-status-container">
          <div className="text-center">
            <div className="spinner-border" />
            <h4>Calling {targetEmail?.split("@")[0]}...</h4>
            <p>Waiting for answer</p>
          </div>
          <div className="call-actions mt-3">
            <Button variant="danger" onClick={endCall} size="lg">
              <FiPhone />
              Cancel
            </Button>
          </div>
        </div>
      );
    }

    if (callStatus === "connecting") {
      return (
        <div className="call-status-container">
          <div className="text-center">
            <div className="spinner-border" />
            <h4>Connecting...</h4>
            <p>Establishing connection</p>
          </div>
        </div>
      );
    }

    if (callStatus === "ended") {
      return (
        <div className="call-status-container">
          <h4>Call Ended</h4>
          <p>Duration: {formatDuration(callDuration)}</p>
          <p className="text-muted small">Returning to previous page...</p>
          <Button variant="primary" size="sm" onClick={onHide} className="mt-2">
            Close
          </Button>
        </div>
      );
    }

    return null;
  };

  return (
    <Modal
      show={show}
      onHide={() => {
        // Allow closing for ended calls, otherwise call endCall
        if (callStatus === "ended") {
          onHide();
        } else {
          endCall();
        }
      }}
      size={isFullscreen ? "xl" : "lg"}
      centered
      className={`video-call-modal ${isFullscreen ? "fullscreen-modal" : ""}`}
      backdrop={callStatus === "ended" ? true : "static"}
      keyboard={callStatus === "ended"}
    >
      <Modal.Body className="p-0">
        {error && (
          <Alert variant="danger" className="m-3">
            {error}
          </Alert>
        )}

        {callStatus === "incoming" && renderIncomingCall()}
        {(callStatus === "calling" ||
          callStatus === "connecting" ||
          callStatus === "ended") &&
          renderCallStatus()}
        {callStatus === "connected" && renderVideoCall()}
      </Modal.Body>
    </Modal>
  );
};

export default VideoCall;
