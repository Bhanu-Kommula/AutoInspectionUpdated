// Real WebRTC Call Testing Utility
// This creates a real technician that uses actual WebRTC infrastructure

import io from "socket.io-client";
import WebRTCService from "./webrtcService";

export class CallTester {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.webrtcService = new WebRTCService();
    this.technicianEmail = "kommula@gmail.com";
  }

  // Create a real technician that uses actual WebRTC
  async simulateTechnicianOnline(technicianEmail = "kommula@gmail.com") {
    try {
      this.technicianEmail = technicianEmail;
      console.log("🧪 Creating real technician online:", technicianEmail);

      // Connect as technician to the real chat service
      this.socket = io(process.env.REACT_APP_CHAT_BASE_URL || "https://chat-service.onrender.com", {
        transports: ["websocket", "polling"],
        forceNew: true,
      });

      this.socket.on("connect", () => {
        console.log("🧪 Test technician connected");
        this.isConnected = true;

        // Register for notifications like a real technician
        this.socket.emit("register_for_notifications", {
          userEmail: technicianEmail,
          userType: "TECHNICIAN",
        });

        // Initialize real WebRTC service for this technician
        this.webrtcService.initialize(this.socket, null);
        this.setupWebRTCCallbacks();
      });

      // Listen for incoming calls (real call handling)
      this.socket.on("incoming_call", (data) => {
        console.log("🧪 Technician received incoming call:", data);

        // Auto-accept after 2 seconds for testing
        setTimeout(() => {
          console.log("🧪 Auto-accepting call for testing");
          this.socket.emit("call_accept", {
            callId: data.callId,
            roomId: data.roomId,
          });

          // Set room ID for WebRTC and prepare to answer
          this.webrtcService.roomId = data.roomId;

          // Start WebRTC answer process for audio call
          this.webrtcService
            .answerCall("audio")
            .then(() => {
              console.log("🧪 Test technician ready to answer WebRTC call");

              // Complete the answer process after a brief delay
              setTimeout(() => {
                console.log("🧪 Test technician completing WebRTC answer");
                this.webrtcService.triggerAnswerCompletion();
              }, 500);
            })
            .catch((error) => {
              console.error("🧪 Test technician WebRTC answer failed:", error);
            });
        }, 2000);
      });

      // Handle call accepted (when this technician is starting a call)
      this.socket.on("call_accepted", (data) => {
        console.log("🧪 Technician's call was accepted:", data);
        // If this technician was making a call, start WebRTC
      });

      return true;
    } catch (error) {
      console.error("❌ Failed to simulate technician:", error);
      return false;
    }
  }

  // Setup real WebRTC callbacks for the test technician
  setupWebRTCCallbacks() {
    this.webrtcService.onLocalStream = (stream) => {
      console.log("🧪 Test technician got local stream:", stream);
    };

    this.webrtcService.onRemoteStream = (stream) => {
      console.log("🧪 Test technician got remote stream:", stream);
    };

    this.webrtcService.onCallEnded = () => {
      console.log("🧪 Test technician call ended");
    };

    this.webrtcService.onError = (error) => {
      console.error("🧪 Test technician WebRTC error:", error);
    };
  }

  // Disconnect the test technician
  disconnect() {
    if (this.socket) {
      console.log("🧪 Disconnecting test technician");
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Check if technician is online
  isOnline() {
    return this.isConnected;
  }
}

// Export singleton instance
export default new CallTester();
