// Singleton Socket Manager to prevent multiple connections
import io from "socket.io-client";
// Base URL for chat sockets (configurable for Render/local)
const CHAT_BASE_URL =
  process.env.REACT_APP_CHAT_BASE_URL ||
  (typeof window !== "undefined" &&
  window.location &&
  window.location.hostname !== "localhost"
    ? `${window.location.protocol}//${window.location.host}`
    : "http://localhost:8089");

class SocketManager {
  constructor() {
    this.chatSocket = null;
    this.globalSocket = null;
    this.isConnecting = false;
    this.isGlobalConnecting = false;
  }

  // Get or create chat socket
  getChatSocket() {
    if (!this.chatSocket || !this.chatSocket.connected) {
      if (this.isConnecting) {
        console.log(
          "🔄 Socket connection already in progress, returning existing instance..."
        );
        return this.chatSocket || null;
      }

      this.isConnecting = true;

      // Clean up any existing socket
      if (this.chatSocket) {
        this.chatSocket.disconnect();
        this.chatSocket = null;
      }

      console.log("🔌 Creating new chat socket connection");

      this.chatSocket = io(CHAT_BASE_URL, {
        transports: ["websocket", "polling"],
        forceNew: false,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
        reconnectionDelayMax: 5000,
        timeout: 15000,
        upgrade: true,
        rememberUpgrade: true,
      });

      this.chatSocket.on("connect", () => {
        console.log("✅ Chat socket connected");
        this.isConnecting = false;
      });

      this.chatSocket.on("disconnect", () => {
        console.log("❌ Chat socket disconnected");
        this.isConnecting = false;
      });

      this.chatSocket.on("connect_error", (error) => {
        console.error("❌ Chat socket connection error:", error);
        this.isConnecting = false;
      });
    }

    return this.chatSocket;
  }

  // Get or create global call socket (separate from chat socket)
  getGlobalSocket() {
    if (!this.globalSocket || !this.globalSocket.connected) {
      console.log("🌐 Creating new global call socket connection");

      // Clean up any existing socket
      if (this.globalSocket) {
        this.globalSocket.disconnect();
        this.globalSocket = null;
      }

      this.globalSocket = io(CHAT_BASE_URL, {
        transports: ["websocket", "polling"],
        forceNew: false,
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 15000,
        upgrade: true,
        rememberUpgrade: true,
      });

      this.globalSocket.on("connect", () => {
        console.log("🌐 Global call socket connected");
      });

      this.globalSocket.on("disconnect", () => {
        console.log("🌐 Global call socket disconnected");
      });
    }

    return this.globalSocket;
  }

  // Disconnect all sockets
  disconnectAll() {
    console.log("🔌 Disconnecting all sockets");

    if (this.chatSocket) {
      this.chatSocket.disconnect();
      this.chatSocket = null;
    }

    if (this.globalSocket) {
      this.globalSocket.disconnect();
      this.globalSocket = null;
    }

    this.isConnecting = false;
  }

  // Check if chat socket is connected
  isChatConnected() {
    return this.chatSocket && this.chatSocket.connected;
  }

  // Check if global socket is connected
  isGlobalConnected() {
    return this.globalSocket && this.globalSocket.connected;
  }
}

// Export singleton instance
export default new SocketManager();
