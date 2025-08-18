// WebRTC Service for handling audio and video calls
class WebRTCService {
  constructor() {
    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
    this.socket = null;
    this.roomId = null;
    this.callType = "video"; // 'audio' or 'video'
    this._isEnding = false; // Prevent recursion

    // Callbacks
    this.onLocalStream = null;
    this.onRemoteStream = null;
    this.onCallEnded = null;
    this.onError = null;

    // STUN/TURN servers configuration (using free Google STUN servers)
    this.iceServers = {
      iceServers: [
        {
          urls: [
            "stun:stun.l.google.com:19302",
            "stun:stun1.l.google.com:19302",
          ],
        },
      ],
    };
  }

  // Initialize WebRTC service
  initialize(socket, roomId) {
    this.socket = socket;
    this.roomId = roomId;
    if (socket) {
      this.setupSocketListeners();
    }
  }

  // Setup socket event listeners for signaling
  setupSocketListeners() {
    if (!this.socket) return;

    // Handle incoming WebRTC offer
    this.socket.on("webrtc_offer", async (data) => {
      try {
        await this.handleIncomingOffer(data.offer, data.senderEmail);
      } catch (error) {
        console.error("Error handling incoming offer:", error);
        this.onError?.("Failed to handle incoming call");
      }
    });

    // Handle incoming WebRTC answer
    this.socket.on("webrtc_answer", async (data) => {
      try {
        await this.handleIncomingAnswer(data.answer);
      } catch (error) {
        console.error("Error handling incoming answer:", error);
        this.onError?.("Failed to establish connection");
      }
    });

    // Handle incoming ICE candidate
    this.socket.on("ice_candidate", async (data) => {
      try {
        await this.handleIncomingIceCandidate(data.candidate);
      } catch (error) {
        console.error("Error handling ICE candidate:", error);
      }
    });

    // Handle call ended
    this.socket.on("call_ended", () => {
      this.endCall();
    });
  }

  // Start a call (as caller)
  async startCall(callType = "video", targetEmail) {
    try {
      this.callType = callType;
      console.log(`🚀 Starting ${callType} call to ${targetEmail}`);

      // Get user media first
      const stream = await this.getUserMedia(callType);
      this.localStream = stream;
      this.onLocalStream?.(stream);
      console.log("✅ Local stream obtained for caller");

      // Create peer connection
      await this.createPeerConnection();

      // Add local stream to peer connection
      stream.getTracks().forEach((track) => {
        console.log(`📼 Adding ${track.kind} track to peer connection`);
        this.peerConnection.addTrack(track, stream);
      });

      // Wait a bit before creating offer to ensure everything is set up
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Create and send offer
      const offer = await this.peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: callType === "video",
      });
      await this.peerConnection.setLocalDescription(offer);
      console.log("📤 Offer created and set as local description");

      // Send offer through signaling server
      this.socket.emit("webrtc_offer", {
        offer,
        roomId: this.roomId,
        targetEmail,
      });
      console.log("📡 Offer sent through signaling server");

      return true;
    } catch (error) {
      console.error("❌ Error starting call:", error);
      this.onError?.("Failed to start call: " + error.message);
      return false;
    }
  }

  // Answer a call (as callee)
  async answerCall(callType = "video") {
    try {
      this.callType = callType;
      console.log(`📞 Answering ${callType} call`);

      // Get user media
      const stream = await this.getUserMedia(callType);
      this.localStream = stream;
      this.onLocalStream?.(stream);
      console.log("✅ Local stream obtained for callee");

      // Add local stream to existing peer connection
      if (this.peerConnection) {
        stream.getTracks().forEach((track) => {
          console.log(
            `📼 Adding ${track.kind} track to peer connection (answer)`
          );
          this.peerConnection.addTrack(track, stream);
        });
      }

      return true;
    } catch (error) {
      console.error("❌ Error answering call:", error);
      this.onError?.("Failed to answer call: " + error.message);
      return false;
    }
  }

  // Handle incoming offer
  async handleIncomingOffer(offer, senderEmail) {
    console.log("📥 Received WebRTC offer from:", senderEmail);

    // Create peer connection if not exists
    if (!this.peerConnection) {
      await this.createPeerConnection();
    }

    try {
      // Set remote description
      await this.peerConnection.setRemoteDescription(
        new RTCSessionDescription(offer)
      );
      console.log("✅ Remote description set from offer");

      // This will be completed when user accepts the call
      // For now, just store the offer
      this.pendingOffer = { offer, senderEmail };
    } catch (error) {
      console.error("❌ Error handling incoming offer:", error);
      this.onError?.("Failed to handle incoming call");
    }
  }

  // Complete the answer process after user accepts
  async completeAnswer() {
    if (!this.pendingOffer || !this.peerConnection) {
      console.log("⚠️ No pending offer or peer connection for answer");
      return;
    }

    try {
      console.log("📤 Creating answer for call");

      // Create and send answer
      const answer = await this.peerConnection.createAnswer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: this.callType === "video",
      });
      await this.peerConnection.setLocalDescription(answer);
      console.log("✅ Answer created and set as local description");

      // Send answer through signaling server
      this.socket.emit("webrtc_answer", {
        answer,
        roomId: this.roomId,
        targetEmail: this.pendingOffer.senderEmail,
      });
      console.log("📡 Answer sent through signaling server");

      this.pendingOffer = null;
    } catch (error) {
      console.error("❌ Error completing answer:", error);
      this.onError?.("Failed to complete call setup");
    }
  }

  // Trigger answer completion when call is accepted
  triggerAnswerCompletion() {
    if (this.pendingOffer) {
      this.completeAnswer();
    }
  }

  // Handle incoming answer
  async handleIncomingAnswer(answer) {
    console.log("📥 Received WebRTC answer");

    if (this.peerConnection) {
      try {
        await this.peerConnection.setRemoteDescription(
          new RTCSessionDescription(answer)
        );
        console.log("✅ Remote description set from answer");
      } catch (error) {
        console.error(
          "❌ Error setting remote description from answer:",
          error
        );
        this.onError?.("Failed to establish connection");
      }
    } else {
      console.error("❌ No peer connection available for answer");
    }
  }

  // Handle incoming ICE candidate
  async handleIncomingIceCandidate(candidate) {
    if (this.peerConnection && candidate) {
      try {
        await this.peerConnection.addIceCandidate(
          new RTCIceCandidate(candidate)
        );
        console.log("✅ ICE candidate added successfully");
      } catch (error) {
        console.error("❌ Error adding ICE candidate:", error);
      }
    } else {
      console.log("⚠️ No peer connection or invalid candidate for ICE");
    }
  }

  // Create peer connection
  async createPeerConnection() {
    console.log("🔗 Creating new peer connection");
    this.peerConnection = new RTCPeerConnection(this.iceServers);

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("🧊 Sending ICE candidate");
        this.socket.emit("ice_candidate", {
          candidate: event.candidate,
          roomId: this.roomId,
        });
      } else {
        console.log("🧊 ICE candidate gathering completed");
      }
    };

    // Handle remote stream
    this.peerConnection.ontrack = (event) => {
      console.log("🎬 Received remote stream");
      this.remoteStream = event.streams[0];
      this.onRemoteStream?.(event.streams[0]);
    };

    // Handle ICE connection state changes
    this.peerConnection.oniceconnectionstatechange = () => {
      console.log(
        "❄️ ICE connection state:",
        this.peerConnection.iceConnectionState
      );

      if (this.peerConnection.iceConnectionState === "connected") {
        console.log("🎉 WebRTC connection established!");
      } else if (this.peerConnection.iceConnectionState === "failed") {
        console.error("💥 ICE connection failed");
        this.onError?.("Connection failed - please try again");
      }
    };

    // Handle connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      console.log("🔗 Connection state:", this.peerConnection.connectionState);

      if (this.peerConnection.connectionState === "connected") {
        console.log("✅ Peer connection established successfully!");
      } else if (
        this.peerConnection.connectionState === "disconnected" ||
        this.peerConnection.connectionState === "failed" ||
        this.peerConnection.connectionState === "closed"
      ) {
        console.log("🔻 Peer connection ended");
        this.endCall();
      }
    };

    // Handle signaling state changes
    this.peerConnection.onsignalingstatechange = () => {
      console.log("📡 Signaling state:", this.peerConnection.signalingState);
    };
  }

  // Get user media (camera and microphone)
  async getUserMedia(callType) {
    const constraints = {
      audio: true,
      video:
        callType === "video"
          ? {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: "user",
            }
          : false,
    };

    try {
      console.log("🎥 Requesting user media:", constraints);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log("✅ Got user media stream:", stream);
      return stream;
    } catch (error) {
      console.error("❌ Error accessing media devices:", error);

      if (error.name === "NotAllowedError") {
        throw new Error(
          "Camera/microphone access denied. Please allow permissions and try again."
        );
      } else if (error.name === "NotFoundError") {
        throw new Error(
          "No camera/microphone found. Please check your devices."
        );
      } else {
        throw new Error(`Media access error: ${error.message}`);
      }
    }
  }

  // Mute/unmute audio
  toggleAudio() {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        return audioTrack.enabled;
      }
    }
    return false;
  }

  // Enable/disable video
  toggleVideo() {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        return videoTrack.enabled;
      }
    }
    return false;
  }

  // End the call
  endCall() {
    try {
      // Stop local stream
      if (this.localStream) {
        this.localStream.getTracks().forEach((track) => track.stop());
        this.localStream = null;
      }

      // Close peer connection
      if (this.peerConnection) {
        this.peerConnection.close();
        this.peerConnection = null;
      }

      // Clear remote stream
      this.remoteStream = null;
      this.pendingOffer = null;

      // Notify about call end (but prevent recursion)
      if (this.onCallEnded && !this._isEnding) {
        this._isEnding = true;
        this.onCallEnded();
        this._isEnding = false;
      }
    } catch (error) {
      console.error("Error ending call:", error);
      this._isEnding = false;
    }
  }

  // Check if WebRTC is supported
  static isSupported() {
    return !!(
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia &&
      window.RTCPeerConnection
    );
  }

  // Clean up
  cleanup() {
    this.endCall();

    // Remove socket listeners
    if (this.socket) {
      this.socket.off("webrtc_offer");
      this.socket.off("webrtc_answer");
      this.socket.off("ice_candidate");
      this.socket.off("call_ended");
    }
  }
}

export default WebRTCService;
