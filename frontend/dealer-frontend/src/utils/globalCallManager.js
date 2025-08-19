// Simple Global Call Manager
import socketManager from "./socketManager";
import WebRTCService from "./webrtcService";

class GlobalCallManager {
  constructor() {
    this.socket = null;
    this.currentUser = null;
    this.activeCall = null;
    this.notificationCallbacks = [];
    this.isInitialized = false;
    this.webrtcService = new WebRTCService();
    this._isHandlingEnd = false; // Prevent recursion
  }

  // Initialize the global call manager (called once when app starts)
  initialize() {
    if (this.isInitialized) return;

    // Get user info, PREFER TECHNICIAN if active in this tab/window
    let userEmail = null;
    let userType = null;

    // 1) Prefer technician session stored in sessionStorage (tab-scoped)
    const technicianSessionId = sessionStorage.getItem(
      "currentTechnicianSession"
    );
    if (technicianSessionId) {
      const technicianKey = `technicianInfo_${technicianSessionId}`;
      const technicianData = sessionStorage.getItem(technicianKey);
      if (technicianData) {
        try {
          const parsed = JSON.parse(technicianData);
          if (parsed.email) {
            userEmail = parsed.email;
            userType = "TECHNICIAN";
          }
        } catch (error) {
          console.error("Error parsing technician info:", error);
        }
      }
    }

    // 2) Fallback to dealer from localStorage (app-wide)
    if (!userEmail) {
      const dealerInfo = localStorage.getItem("dealerInfo");
      if (dealerInfo) {
        try {
          const parsed = JSON.parse(dealerInfo);
          if (parsed.email) {
            userEmail = parsed.email;
            userType = "DEALER";
          }
        } catch (error) {
          console.error("Error parsing dealer info:", error);
        }
      }
    }

    if (!userEmail) {
      console.log("📞 No user logged in, skipping call manager initialization");
      return;
    }

    this.currentUser = { email: userEmail, type: userType };

    console.log(
      "📞 Initializing GlobalCallManager for:",
      userEmail,
      "as",
      userType
    );

    // Use socket manager for global call socket
    this.socket = socketManager.getGlobalSocket();

    if (this.socket.connected) {
      console.log("🌐 Using existing global call socket connection");
      this.setupSocketConnection(userEmail, userType);
    } else {
      this.socket.on("connect", () => {
        console.log("🌐 Global call socket connected");
        this.setupSocketConnection(userEmail, userType);
      });

      this.socket.on("disconnect", () => {
        console.log("🌐 Global call socket disconnected");
      });
    }

    // Handle incoming calls globally
    this.socket.on("incoming_call", (data) => {
      console.log("📞 [GLOBAL] Incoming call received:", data);
      this.handleIncomingCall(data);
    });

    // Handle call events
    this.socket.on("call_accepted", (data) => {
      console.log("✅ [GLOBAL] Call accepted:", data);
      this.handleCallAccepted(data);
    });

    this.socket.on("call_rejected", (data) => {
      console.log("❌ [GLOBAL] Call rejected received from server:", data);
      console.log("❌ [GLOBAL] Current active call:", this.activeCall);
      this.handleCallRejected(data);
    });

    this.socket.on("call_ended", (data) => {
      console.log("📴 [GLOBAL] Call ended:", data);
      // Attach server-reported duration if provided
      if (this.activeCall && data?.durationSeconds != null) {
        this.activeCall.durationSeconds = data.durationSeconds;
      }
      this.handleCallEnded(data);
    });

    this.socket.on("call_initiated", (data) => {
      console.log("📞 [GLOBAL] Call initiated confirmed:", data);
      if (this.activeCall && !this.activeCall.isIncoming) {
        this.activeCall.callId = data.callId;
        this.notifyComponents("call_initiated", this.activeCall);
      }
    });

    this.socket.on("call_failed", (data) => {
      console.log("💥 [GLOBAL] Call failed:", data);
      this.activeCall = null;
      this.notifyComponents("call_failed", data);
    });

    this.isInitialized = true;
  }

  // Setup socket connection and event listeners
  setupSocketConnection(userEmail, userType) {
    // Register for global notifications
    this.socket.emit("register_for_notifications", {
      userEmail,
      userType: userType?.toUpperCase(),
    });

    // Re-initialize WebRTC service with the connected socket
    this.webrtcService.initialize(this.socket, null);
    this.setupWebRTCCallbacks();
  }

  // Register callback for notifications
  registerNotificationCallback(callback) {
    this.notificationCallbacks.push(callback);
    return () => {
      this.notificationCallbacks = this.notificationCallbacks.filter(
        (cb) => cb !== callback
      );
    };
  }

  // Notify all registered components
  notifyComponents(type, data) {
    this.notificationCallbacks.forEach((callback) => {
      try {
        callback(type, data);
      } catch (error) {
        console.error("Error in notification callback:", error);
      }
    });
  }

  // Setup WebRTC callbacks
  setupWebRTCCallbacks() {
    this.webrtcService.onLocalStream = (stream) => {
      this.notifyComponents("local_stream", stream);
    };

    this.webrtcService.onRemoteStream = (stream) => {
      this.notifyComponents("remote_stream", stream);
    };

    this.webrtcService.onCallEnded = () => {
      this.handleCallEnded();
    };

    this.webrtcService.onError = (error) => {
      console.error("❌ WebRTC Error:", error);
      this.notifyComponents("call_error", error);
    };
  }

  // Handle incoming call
  handleIncomingCall(data) {
    this.activeCall = {
      ...data,
      isIncoming: true,
      status: "incoming",
      callType: data.callType.toLowerCase(),
    };
    this.notifyComponents("incoming_call", this.activeCall);
  }

  // Handle call accepted
  handleCallAccepted(data) {
    if (this.activeCall) {
      console.log(
        "✅ [GLOBAL] Call accepted, transitioning to connected state"
      );

      // Clear any timeout when call is accepted
      if (this.callTimeout) {
        clearTimeout(this.callTimeout);
        this.callTimeout = null;
      }

      this.activeCall.status = "connected";
      this.notifyComponents("call_accepted", this.activeCall);

      // Start WebRTC for the accepter (incoming call scenario)
      if (this.activeCall.isIncoming) {
        console.log(
          "📞 [GLOBAL] Starting WebRTC answer process for incoming call"
        );
        this.webrtcService.roomId = this.activeCall.roomId; // Use existing room ID
        this.webrtcService
          .answerCall(this.activeCall.callType)
          .then(() => {
            // Complete the WebRTC answer process after a short delay
            setTimeout(() => {
              console.log("🔄 [GLOBAL] Triggering answer completion");
              this.webrtcService.triggerAnswerCompletion();
            }, 200);
          })
          .catch((error) => {
            console.error("❌ [GLOBAL] Error in answer call process:", error);
            this.notifyComponents("call_error", { message: error.message });
          });
      }
    }
  }

  // Handle call rejected
  handleCallRejected(data) {
    console.log("❌ [GLOBAL] Call was rejected:", data);
    console.log("❌ [GLOBAL] Notifying components about rejection...");

    // Clear any timeout
    if (this.callTimeout) {
      clearTimeout(this.callTimeout);
      this.callTimeout = null;
    }

    this.webrtcService.endCall();
    this.activeCall = null;
    this.notifyComponents("call_rejected", data);
    console.log("❌ [GLOBAL] Call rejection handling complete");
  }

  // Handle call ended
  handleCallEnded(data) {
    // Prevent recursion
    if (this._isHandlingEnd) return;
    this._isHandlingEnd = true;

    try {
      // Clear any timeout
      if (this.callTimeout) {
        clearTimeout(this.callTimeout);
        this.callTimeout = null;
      }

      this.webrtcService.endCall();
      this.activeCall = null;
      this.notifyComponents("call_ended", data);
    } finally {
      this._isHandlingEnd = false;
    }
  }

  // Create room ID (consistent with chat system)
  createRoomId(email1, email2) {
    // Get proper user info from localStorage
    let dealerEmail = null;
    let technicianEmail = null;

    // Check for dealer info
    const dealerInfo = localStorage.getItem("dealerInfo");
    if (dealerInfo) {
      try {
        const parsed = JSON.parse(dealerInfo);
        if (parsed.email) {
          dealerEmail = parsed.email;
        }
      } catch (error) {
        console.error("Error parsing dealer info:", error);
      }
    }

    // Check for technician info
    const technicianSessionId = sessionStorage.getItem(
      "currentTechnicianSession"
    );
    if (technicianSessionId) {
      const technicianKey = `technicianInfo_${technicianSessionId}`;
      const technicianData = sessionStorage.getItem(technicianKey);
      if (technicianData) {
        try {
          const parsed = JSON.parse(technicianData);
          if (parsed.email) {
            technicianEmail = parsed.email;
          }
        } catch (error) {
          console.error("Error parsing technician info:", error);
        }
      }
    }

    if (dealerEmail && (email1 === dealerEmail || email2 === dealerEmail)) {
      // Use dealer:technician format
      const otherEmail = email1 === dealerEmail ? email2 : email1;
      return `${dealerEmail}:${otherEmail}`;
    } else if (
      technicianEmail &&
      (email1 === technicianEmail || email2 === technicianEmail)
    ) {
      // Use dealer:technician format
      const otherEmail = email1 === technicianEmail ? email2 : email1;
      return `${otherEmail}:${technicianEmail}`;
    }

    // Fallback to sorted format
    const emails = [email1, email2].sort();
    return `${emails[0]}:${emails[1]}`;
  }

  // Initiate a call
  initiateCall(targetEmail, callType = "video") {
    if (!this.socket || !this.socket.connected) {
      console.error("❌ Socket not connected");
      return false;
    }

    if (!targetEmail) {
      console.error("❌ Target email required");
      return false;
    }

    if (this.activeCall) {
      console.warn("⚠️ Call already active");
      return false;
    }

    // Create room ID
    const roomId = this.createRoomId(this.currentUser.email, targetEmail);

    console.log(`📞 [GLOBAL] Initiating ${callType} call to ${targetEmail}`);

    // Set up WebRTC room
    this.webrtcService.roomId = roomId;

    // Emit call initiation
    this.socket.emit("call_initiate", {
      roomId,
      callType: callType.toUpperCase(),
      targetEmail,
    });

    this.activeCall = {
      roomId,
      targetEmail,
      callType: callType.toLowerCase(),
      isIncoming: false,
      status: "calling",
      timestamp: new Date().toISOString(),
    };

    this.notifyComponents("call_initiated", this.activeCall);

    // Start WebRTC call after a brief delay to ensure socket event is sent
    setTimeout(() => {
      // If server already failed the call (target offline) or call was cancelled, abort
      if (!this.activeCall || this.activeCall.status !== "calling") {
        console.log(
          "⛔ Skipping WebRTC start: call no longer active or not in calling state"
        );
        return;
      }
      console.log("🔄 Starting WebRTC call...");
      this.webrtcService
        .startCall(callType.toLowerCase(), targetEmail)
        .then((success) => {
          console.log("📞 WebRTC call start result:", success);
        })
        .catch((error) => {
          console.error("❌ WebRTC call start failed:", error);
          this.notifyComponents("call_failed", { reason: error.message });
        });
    }, 500);

    // Auto-timeout after 30 seconds if no answer (like real phones)
    this.callTimeout = setTimeout(() => {
      if (this.activeCall && this.activeCall.status === "calling") {
        console.log("⏰ Call timeout - no answer after 30 seconds");
        this.handleCallRejected({
          reason: "No answer - call timed out",
          isTimeout: true,
          targetEmail: this.activeCall.targetEmail,
        });
      }
    }, 30000);

    return true;
  }

  // Accept incoming call
  acceptCall() {
    if (!this.activeCall || !this.activeCall.isIncoming) {
      console.error("❌ No incoming call to accept");
      return false;
    }

    console.log("✅ Accepting call:", this.activeCall.callId);

    this.socket.emit("call_accept", {
      callId: this.activeCall.callId,
      roomId: this.activeCall.roomId,
    });

    this.activeCall.status = "connecting";
    this.notifyComponents("call_accepting", this.activeCall);
    return true;
  }

  // Reject incoming call
  rejectCall() {
    if (!this.activeCall) {
      console.error("❌ No call to reject");
      return false;
    }

    console.log("❌ Rejecting call");

    if (this.activeCall.isIncoming && this.activeCall.callId) {
      this.socket.emit("call_reject", {
        callId: this.activeCall.callId,
        roomId: this.activeCall.roomId,
      });
    } else if (this.activeCall.callId) {
      this.socket.emit("call_end", {
        callId: this.activeCall.callId,
        roomId: this.activeCall.roomId,
      });
    }

    this.webrtcService.endCall();
    this.activeCall = null;
    this.notifyComponents("call_rejected", null);
    return true;
  }

  // End active call
  endCall() {
    if (!this.activeCall) {
      console.error("❌ No active call to end");
      return false;
    }

    console.log("📴 Ending call");

    if (this.activeCall.callId) {
      this.socket.emit("call_end", {
        callId: this.activeCall.callId,
        roomId: this.activeCall.roomId,
      });
    }

    this.webrtcService.endCall();
    this.activeCall = null;
    this.notifyComponents("call_ended", null);
    return true;
  }

  // Get current call status
  getCallStatus() {
    return this.activeCall;
  }

  // Check if there's an active call
  hasActiveCall() {
    return !!this.activeCall;
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser;
  }

  // Cleanup
  disconnect() {
    // Clear any active timeout
    if (this.callTimeout) {
      clearTimeout(this.callTimeout);
      this.callTimeout = null;
    }

    // Don't disconnect socket directly, let socketManager handle it
    this.socket = null;
    this.activeCall = null;
    this.currentUser = null;
    this.isInitialized = false;
    this.notificationCallbacks = [];
  }
}

// Export singleton instance
export default new GlobalCallManager();
