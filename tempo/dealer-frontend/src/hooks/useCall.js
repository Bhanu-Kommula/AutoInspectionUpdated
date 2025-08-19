import { useState, useEffect, useCallback, useRef } from "react";

const useCall = (socket, userEmail, userType) => {
  const [incomingCall, setIncomingCall] = useState(null);
  const [currentCall, setCurrentCall] = useState(null);
  const [callHistory, setCallHistory] = useState([]);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);

  const incomingCallTimeoutRef = useRef(null);

  // Handle incoming call
  useEffect(() => {
    if (!socket) return;

    const handleIncomingCall = (data) => {
      console.log("📞 [useCall] Incoming call received:", data);

      setIncomingCall({
        callId: data.callId,
        roomId: data.roomId,
        callerEmail: data.callerEmail,
        callerType: data.callerType,
        callType: data.callType.toLowerCase(),
        timestamp: data.timestamp,
      });

      console.log(
        "📞 [useCall] IncomingCall notification should now be visible"
      );

      // Auto-reject after 30 seconds if not answered
      incomingCallTimeoutRef.current = setTimeout(() => {
        console.log("⏰ [useCall] Auto-rejecting call after 30 seconds");
        rejectCall();
      }, 30000);
    };

    const handleCallInitiated = (data) => {
      console.log("📞 Call initiated:", data);
      // The call modal should already be open for outgoing calls
    };

    const handleCallAccepted = (data) => {
      console.log("✅ Call accepted:", data);
      if (incomingCallTimeoutRef.current) {
        clearTimeout(incomingCallTimeoutRef.current);
        incomingCallTimeoutRef.current = null;
      }
    };

    const handleCallRejected = (data) => {
      console.log("❌ Call rejected:", data);
      setIncomingCall(null);
      setCurrentCall(null);
      setIsCallModalOpen(false);

      if (incomingCallTimeoutRef.current) {
        clearTimeout(incomingCallTimeoutRef.current);
        incomingCallTimeoutRef.current = null;
      }
    };

    const handleCallEnded = (data) => {
      console.log("📴 Call ended:", data);
      setIncomingCall(null);
      setCurrentCall(null);
      setIsCallModalOpen(false);

      if (incomingCallTimeoutRef.current) {
        clearTimeout(incomingCallTimeoutRef.current);
        incomingCallTimeoutRef.current = null;
      }
    };

    const handleCallFailed = (data) => {
      console.log("💥 Call failed:", data);
      setIncomingCall(null);
      setCurrentCall(null);
      setIsCallModalOpen(false);

      if (incomingCallTimeoutRef.current) {
        clearTimeout(incomingCallTimeoutRef.current);
        incomingCallTimeoutRef.current = null;
      }
    };

    // Register socket listeners
    socket.on("incoming_call", handleIncomingCall);
    socket.on("call_initiated", handleCallInitiated);
    socket.on("call_accepted", handleCallAccepted);
    socket.on("call_rejected", handleCallRejected);
    socket.on("call_ended", handleCallEnded);
    socket.on("call_failed", handleCallFailed);

    return () => {
      socket.off("incoming_call", handleIncomingCall);
      socket.off("call_initiated", handleCallInitiated);
      socket.off("call_accepted", handleCallAccepted);
      socket.off("call_rejected", handleCallRejected);
      socket.off("call_ended", handleCallEnded);
      socket.off("call_failed", handleCallFailed);

      if (incomingCallTimeoutRef.current) {
        clearTimeout(incomingCallTimeoutRef.current);
      }
    };
  }, [socket]);

  // Initiate a call
  const initiateCall = useCallback(
    (roomId, targetEmail, callType = "video") => {
      if (!socket || !roomId || !targetEmail) {
        console.error("❌ Missing required parameters for call initiation:", {
          socket: !!socket,
          socketConnected: socket?.connected,
          roomId,
          targetEmail,
        });
        return false;
      }

      if (!socket.connected) {
        console.error("❌ Socket not connected, cannot initiate call");
        return false;
      }

      if (incomingCall || currentCall || isCallModalOpen) {
        console.warn("⚠️ Call already active, cannot initiate new call");
        return false;
      }

      console.log(
        `📞 Initiating ${callType} call to ${targetEmail} in room ${roomId}`
      );

      setCurrentCall({
        roomId,
        targetEmail,
        callType,
        isIncoming: false,
        userEmail,
        userType,
        timestamp: new Date().toISOString(),
      });

      setIsCallModalOpen(true);
      return true;
    },
    [socket, userEmail, userType, incomingCall, currentCall, isCallModalOpen]
  );

  // Accept incoming call
  const acceptCall = useCallback(() => {
    if (!incomingCall) return false;

    console.log("✅ Accepting call:", incomingCall.callId);

    // Emit socket event to accept the call
    socket.emit("call_accept", {
      callId: incomingCall.callId,
      roomId: incomingCall.roomId,
    });

    setCurrentCall({
      ...incomingCall,
      isIncoming: true,
      userEmail,
      userType,
    });

    // Clear incoming call but keep for video call modal
    setIncomingCall(null);

    // Now open the call modal for the actual call
    setIsCallModalOpen(true);

    if (incomingCallTimeoutRef.current) {
      clearTimeout(incomingCallTimeoutRef.current);
      incomingCallTimeoutRef.current = null;
    }

    return true;
  }, [socket, incomingCall, userEmail, userType]);

  // Reject incoming call
  const rejectCall = useCallback(() => {
    if (!incomingCall) return false;

    console.log("❌ Rejecting call:", incomingCall.callId);

    socket.emit("call_reject", {
      callId: incomingCall.callId,
      roomId: incomingCall.roomId,
    });

    setIncomingCall(null);
    setIsCallModalOpen(false);

    if (incomingCallTimeoutRef.current) {
      clearTimeout(incomingCallTimeoutRef.current);
      incomingCallTimeoutRef.current = null;
    }

    return true;
  }, [socket, incomingCall]);

  // End current call
  const endCall = useCallback(() => {
    const callToEnd = currentCall || incomingCall;
    if (!callToEnd) return false;

    console.log("📴 Ending call");

    if (callToEnd.callId) {
      socket.emit("call_end", {
        callId: callToEnd.callId,
        roomId: callToEnd.roomId,
      });
    }

    setIncomingCall(null);
    setCurrentCall(null);
    setIsCallModalOpen(false);

    if (incomingCallTimeoutRef.current) {
      clearTimeout(incomingCallTimeoutRef.current);
      incomingCallTimeoutRef.current = null;
    }

    return true;
  }, [socket, currentCall, incomingCall]);

  // Close call modal
  const closeCallModal = useCallback(() => {
    // Allow closing the modal and end any active calls
    console.log("🔄 Closing call modal");

    // End any active calls
    if (currentCall || incomingCall) {
      const callToEnd = currentCall || incomingCall;
      if (callToEnd.callId) {
        socket.emit("call_end", {
          callId: callToEnd.callId,
          roomId: callToEnd.roomId,
        });
      }
    }

    setIncomingCall(null);
    setCurrentCall(null);
    setIsCallModalOpen(false);

    if (incomingCallTimeoutRef.current) {
      clearTimeout(incomingCallTimeoutRef.current);
      incomingCallTimeoutRef.current = null;
    }
  }, [socket, incomingCall, currentCall]);

  // Get current call data for the modal
  const getCallData = useCallback(() => {
    if (incomingCall) {
      return {
        ...incomingCall,
        isIncoming: true,
        show: isCallModalOpen,
      };
    }

    if (currentCall) {
      return {
        ...currentCall,
        show: isCallModalOpen,
      };
    }

    return null;
  }, [incomingCall, currentCall, isCallModalOpen]);

  return {
    // State
    incomingCall,
    currentCall,
    callHistory,
    isCallModalOpen,

    // Actions
    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
    closeCallModal,

    // Helpers
    getCallData,
    hasActiveCall: !!(incomingCall || currentCall || isCallModalOpen),
  };
};

export default useCall;
