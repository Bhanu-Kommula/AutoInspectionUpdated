import React, { useState, useEffect, useRef, useCallback } from "react";
import { Modal, Button } from "react-bootstrap";
import {
  FiMic,
  FiMicOff,
  FiVideo,
  FiVideoOff,
  FiPhone,
  FiPhoneCall,
} from "react-icons/fi";
import { FaUser } from "react-icons/fa";
import globalCallManager from "../utils/globalCallManager";
// import CallTimeoutModal from "./CallTimeoutModal";
// import CallConnectionIndicator from "./CallConnectionIndicator";

const GlobalCallInterface = () => {
  const [callState, setCallState] = useState(null); // incoming, outgoing, connected, ended
  const [callData, setCallData] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [showModal, setShowModal] = useState(false);
  // const [showTimeoutModal, setShowTimeoutModal] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [finalDuration, setFinalDuration] = useState(0);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const durationIntervalRef = useRef(null);
  const closeTimeoutRef = useRef(null);

  // Start call timer
  const startCallTimer = () => {
    const startTime = Date.now();
    durationIntervalRef.current = setInterval(() => {
      setCallDuration(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
  };

  // Stop call timer
  const stopCallTimer = () => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
  };

  // Format call duration
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Cleanup media
  const cleanup = useCallback(() => {
    try {
      stopCallTimer();

      // Clear any timeouts
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      }

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }

      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
    } catch (error) {
      console.error("Error in cleanup:", error);
    }
  }, []);

  // Register with global call manager
  useEffect(() => {
    // Initialize global call manager if not already done
    if (!globalCallManager.isInitialized) {
      console.log(
        "🔧 [GlobalCallInterface] Initializing global call manager..."
      );
      globalCallManager.initialize();
    }

    const unregister = globalCallManager.registerNotificationCallback(
      (type, data) => {
        console.log(
          "📞 [GlobalCallInterface] Received notification:",
          type,
          data
        );

        switch (type) {
          case "incoming_call":
            setCallData(data);
            setCallState("incoming");
            setShowModal(true);
            break;

          case "call_initiated":
            setCallData(data);
            setCallState("outgoing");
            setShowModal(true);
            break;

          case "call_accepting":
            setCallState("connecting");
            break;

          case "call_accepted":
            setCallState("connected");
            startCallTimer();
            break;

          case "local_stream":
            if (localVideoRef.current && data) {
              localVideoRef.current.srcObject = data;
              localStreamRef.current = data;
            }
            break;

          case "remote_stream":
            if (remoteVideoRef.current && data) {
              remoteVideoRef.current.srcObject = data;
              setCallState("connected");
              // Fallback: start timer on first remote media if not already started
              if (!durationIntervalRef.current) {
                startCallTimer();
              }
            }
            break;

          case "call_rejected":
            // For rejected calls, check if it's a timeout
            console.log(
              "🔴 [GlobalCallInterface] Processing call rejection, current callData:",
              callData
            );

            // Check if this is a timeout scenario (no answer)
            // Temporarily disabled timeout modal
            // if (
            //   data?.reason?.includes("timeout") ||
            //   data?.reason?.includes("No answer")
            // ) {
            //   setShowModal(false);
            //   setShowTimeoutModal(true);
            // } else {
            setCallState("rejected");
            // Auto-close after 2 seconds for rejected calls
            closeTimeoutRef.current = setTimeout(() => {
              console.log(
                "🔄 [GlobalCallInterface] Auto-closing rejected call modal"
              );
              setShowModal(false);
              setCallData(null);
              setCallState(null);
            }, 2000);
            // }
            cleanup();
            break;

          case "call_ended":
          case "call_failed":
            // Prefer server duration when available
            if (data?.durationSeconds != null) {
              setFinalDuration(data.durationSeconds);
            } else {
              // Snapshot UI timer if server duration missing
              setFinalDuration((prev) =>
                callDuration > 0 ? callDuration : prev
              );
            }
            setCallState("ended");
            cleanup();
            // Auto-close after 3 seconds, but user can close manually too
            closeTimeoutRef.current = setTimeout(() => {
              setShowModal(false);
              setCallData(null);
              setCallState(null);
              setCallDuration(0);
              setFinalDuration(0);
            }, 3000);
            break;

          case "call_error":
            console.error("Call error:", data);
            setCallState("ended");
            cleanup();
            break;

          default:
            break;
        }
      }
    );

    return () => {
      unregister();
      cleanup();
    };
  }, [cleanup]);

  // Media is now handled by the WebRTC service through global call manager

  // Handle accept call
  const handleAccept = () => {
    globalCallManager.acceptCall();
  };

  // Handle reject/decline call
  const handleReject = () => {
    console.log("🔴 Rejecting call");
    globalCallManager.rejectCall();
    // Close immediately on reject
    setTimeout(() => {
      setShowModal(false);
      setCallData(null);
      setCallState(null);
    }, 500);
  };

  // Handle end call
  const handleEndCall = () => {
    console.log("🔴 Ending call");
    globalCallManager.endCall();
  };

  // Handle manual close
  const handleManualClose = () => {
    console.log("🔄 Manually closing call interface");

    // Clear auto-close timeout
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }

    setShowModal(false);
    setCallData(null);
    setCallState(null);
  };

  // Toggle mute
  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  // Toggle video
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  // Handle timeout modal - Temporarily disabled
  // const handleTimeoutRetry = () => {
  //   setShowTimeoutModal(false);
  //   if (callData) {
  //     // Retry the same call
  //     globalCallManager.initiateCall(
  //       callData.targetEmail || callData.callerEmail,
  //       callData.callType
  //     );
  //   }
  // };

  // const handleTimeoutClose = () => {
  //   setShowTimeoutModal(false);
  //   setCallData(null);
  //   setCallState(null);
  // };

  // Don't render if no call
  if (!showModal || !callData) return null;

  const isVideo = callData.callType?.toLowerCase() === "video";
  const callerName = callData.isIncoming
    ? callData.callerEmail?.split("@")[0]
    : callData.targetEmail?.split("@")[0] || "Unknown";

  return (
    <React.Fragment>
      <Modal
        show={showModal}
        backdrop={callState === "ended" ? true : "static"}
        keyboard={callState === "ended"}
        centered
        size={isVideo && callState === "connected" ? "lg" : "md"}
        className="global-call-interface"
        onHide={callState === "ended" ? handleManualClose : undefined}
      >
        <Modal.Body className="p-0">
          {/* Incoming Call Screen */}
          {callState === "incoming" && (
            <div
              className="text-center p-4"
              style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
              }}
            >
              <div
                style={{
                  background: "rgba(255,255,255,0.2)",
                  borderRadius: "50%",
                  width: "100px",
                  height: "100px",
                  margin: "0 auto 20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "40px",
                }}
              >
                <FaUser />
              </div>

              <h3 className="mb-2">
                Incoming {isVideo ? "Video" : "Audio"} Call
              </h3>
              <p className="mb-4">
                <strong>{callerName}</strong> is calling you
              </p>

              <div className="d-flex gap-4 justify-content-center">
                <Button
                  variant="danger"
                  size="lg"
                  onClick={handleReject}
                  style={{
                    borderRadius: "50%",
                    width: "70px",
                    height: "70px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <FiPhone size={28} />
                </Button>

                <Button
                  variant="success"
                  size="lg"
                  onClick={handleAccept}
                  style={{
                    borderRadius: "50%",
                    width: "70px",
                    height: "70px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <FiPhoneCall size={28} />
                </Button>
              </div>
            </div>
          )}

          {/* Connecting Screen */}
          {callState === "connecting" && (
            <div
              className="text-center p-4"
              style={{
                background: "linear-gradient(135deg, #ffeaa7 0%, #fab1a0 100%)",
                color: "white",
                height: "400px",
                position: "relative",
              }}
            >
              <div className="text-center">
                <div className="spinner-border text-white mb-3" role="status">
                  <span className="visually-hidden">Connecting...</span>
                </div>
                <h3 className="mb-2">Connecting...</h3>
                <p className="mb-4">Setting up the call</p>
              </div>
            </div>
          )}

          {/* Outgoing Call Screen */}
          {callState === "outgoing" && (
            <div
              className="text-center p-4"
              style={{
                background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                color: "white",
                height: "400px",
                position: "relative",
              }}
            >
              <div className="text-center">
                <div
                  style={{
                    background: "rgba(255,255,255,0.2)",
                    borderRadius: "50%",
                    width: "100px",
                    height: "100px",
                    margin: "0 auto 20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "40px",
                  }}
                >
                  <FaUser />
                </div>
                <h3 className="mb-2">Calling {callerName}...</h3>
                <p className="mb-4">{isVideo ? "Video" : "Audio"} Call</p>
              </div>

              <Button
                variant="danger"
                size="lg"
                onClick={handleReject}
                style={{
                  borderRadius: "50%",
                  width: "70px",
                  height: "70px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FiPhone size={28} />
              </Button>
            </div>
          )}

          {/* Connected Call Screen */}
          {callState === "connected" && (
            <div
              style={{
                background: "#000",
                position: "relative",
                minHeight: isVideo ? "400px" : "200px",
              }}
            >
              {/* Video Area */}
              {isVideo && (
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    height: "400px",
                  }}
                >
                  {/* Remote Video */}
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      background: "#333",
                    }}
                  />

                  {/* Local Video */}
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{
                      position: "absolute",
                      top: "20px",
                      right: "20px",
                      width: "150px",
                      height: "100px",
                      objectFit: "cover",
                      borderRadius: "10px",
                      border: "2px solid white",
                      background: "#666",
                    }}
                  />
                </div>
              )}

              {/* Call Info */}
              <div
                style={{
                  position: "absolute",
                  top: "20px",
                  left: "20px",
                  color: "white",
                  background: "rgba(0,0,0,0.5)",
                  padding: "10px 15px",
                  borderRadius: "20px",
                }}
              >
                <div style={{ fontWeight: "bold" }}>{callerName}</div>
                <div style={{ fontSize: "14px" }}>
                  {formatDuration(callDuration)}
                </div>
              </div>

              {/* Call Controls */}
              <div
                style={{
                  position: "absolute",
                  bottom: "20px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  display: "flex",
                  gap: "15px",
                  alignItems: "center",
                }}
              >
                {/* Mute Button */}
                <Button
                  variant={isMuted ? "danger" : "secondary"}
                  size="lg"
                  onClick={toggleMute}
                  style={{
                    borderRadius: "50%",
                    width: "60px",
                    height: "60px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {isMuted ? <FiMicOff size={24} /> : <FiMic size={24} />}
                </Button>

                {/* Video Toggle (only for video calls) */}
                {isVideo && (
                  <Button
                    variant={isVideoEnabled ? "secondary" : "danger"}
                    size="lg"
                    onClick={toggleVideo}
                    style={{
                      borderRadius: "50%",
                      width: "60px",
                      height: "60px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {isVideoEnabled ? (
                      <FiVideo size={24} />
                    ) : (
                      <FiVideoOff size={24} />
                    )}
                  </Button>
                )}

                {/* End Call Button */}
                <Button
                  variant="danger"
                  size="lg"
                  onClick={handleEndCall}
                  style={{
                    borderRadius: "50%",
                    width: "70px",
                    height: "70px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <FiPhone size={28} />
                </Button>
              </div>
            </div>
          )}

          {/* Call Rejected Screen */}
          {callState === "rejected" && (
            <div className="text-center p-4" style={{ background: "#f8f9fa" }}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>📱❌</div>
              <h4 className="mb-3 text-danger">Call Declined</h4>
              <p className="text-muted mb-3">
                {callData?.isIncoming
                  ? "You declined the call"
                  : `${
                      callData?.targetEmail?.split("@")[0] || "User"
                    } declined your call`}
              </p>
              <p className="text-muted small mb-3">Closing automatically...</p>
              <Button
                variant="secondary"
                onClick={handleManualClose}
                style={{
                  borderRadius: "25px",
                  padding: "8px 24px",
                  fontWeight: "bold",
                }}
              >
                Close
              </Button>
            </div>
          )}

          {/* Call Ended Screen */}
          {callState === "ended" && (
            <div className="text-center p-4" style={{ background: "#f8f9fa" }}>
              <h4 className="mb-3">Call Ended</h4>
              <p className="text-muted mb-3">
                Duration: {formatDuration(finalDuration || callDuration)}
              </p>
              <p className="text-muted small mb-3">
                Automatically closing in a few seconds...
              </p>
              <Button
                variant="primary"
                onClick={handleManualClose}
                style={{
                  borderRadius: "25px",
                  padding: "8px 24px",
                  fontWeight: "bold",
                }}
              >
                Close
              </Button>
            </div>
          )}
        </Modal.Body>
      </Modal>

      {/* Call Timeout Modal - Temporarily disabled */}
      {/* <CallTimeoutModal
          show={showTimeoutModal}
          onHide={handleTimeoutClose}
          onRetry={handleTimeoutRetry}
          targetUser={callerName}
          callType={isVideo ? "video" : "audio"}
        /> */}
    </React.Fragment>
  );
};

export default GlobalCallInterface;
