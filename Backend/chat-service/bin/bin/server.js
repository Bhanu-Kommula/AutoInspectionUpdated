const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();
const server = http.createServer(app);

// Socket.IO with CORS for your frontend
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:3001"],
    credentials: true,
  })
);
app.use(express.json());

// PostgreSQL connection
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "Aa123123@",
  database: process.env.DB_NAME || "inspection",
  port: parseInt(process.env.DB_PORT || "5432", 10),
  max: 10,
};

let db;

// Initialize database connection
async function initializeDatabase() {
  try {
    db = new Pool(dbConfig);

    // Create tables
    await createTables();
    console.log("✅ Database initialized successfully");
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
  }
}

async function createTables() {
  const createRoomsTable = `
    CREATE TABLE IF NOT EXISTS chat_rooms (
      room_id VARCHAR(255) PRIMARY KEY,
      dealer_email VARCHAR(255) NOT NULL,
      technician_email VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_dealer_email ON chat_rooms (dealer_email);
    CREATE INDEX IF NOT EXISTS idx_technician_email ON chat_rooms (technician_email);
  `;

  const createMessagesTable = `
    CREATE TABLE IF NOT EXISTS chat_messages (
      id BIGSERIAL PRIMARY KEY,
      room_id VARCHAR(255) NOT NULL,
      sender_email VARCHAR(255) NOT NULL,
      sender_type TEXT CHECK (sender_type IN ('DEALER','TECHNICIAN')) NOT NULL,
      message_content TEXT NOT NULL,
      sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      read_status BOOLEAN DEFAULT FALSE,
      FOREIGN KEY (room_id) REFERENCES chat_rooms(room_id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_room_id_sent_at ON chat_messages (room_id, sent_at);
    CREATE INDEX IF NOT EXISTS idx_sender_email ON chat_messages (sender_email);
  `;

  await db.query(createRoomsTable);
  await db.query(createMessagesTable);
}

// Helper function to create room ID
function createRoomId(dealerEmail, technicianEmail) {
  return `${dealerEmail}:${technicianEmail}`;
}

// REST API Endpoints

// Get or create chat room
app.get("/api/chat/room/:dealerEmail/:technicianEmail", async (req, res) => {
  try {
    const { dealerEmail, technicianEmail } = req.params;
    const roomId = createRoomId(dealerEmail, technicianEmail);

    // Check if room exists
    const { rows: rooms } = await db.query(
      "SELECT * FROM chat_rooms WHERE room_id = $1",
      [roomId]
    );

    let room;
    if (rooms.length === 0) {
      // Create new room
      await db.query(
        "INSERT INTO chat_rooms (room_id, dealer_email, technician_email) VALUES ($1, $2, $3)",
        [roomId, dealerEmail, technicianEmail]
      );
      room = {
        room_id: roomId,
        dealer_email: dealerEmail,
        technician_email: technicianEmail,
      };
    } else {
      room = rooms[0];
    }

    res.json(room);
  } catch (error) {
    console.error("Error getting/creating room:", error);
    res.status(500).json({ error: "Failed to get/create room" });
  }
});

// Get chat history
app.get("/api/chat/room/:roomId/messages", async (req, res) => {
  try {
    const { roomId } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const { rows: messages } = await db.query(
      `SELECT * FROM chat_messages 
       WHERE room_id = $1 
       ORDER BY sent_at DESC 
       LIMIT $2 OFFSET $3`,
      [roomId, limit, offset]
    );

    res.json(messages.reverse()); // Return in chronological order
  } catch (error) {
    console.error("Error getting messages:", error);
    res.status(500).json({ error: "Failed to get messages" });
  }
});

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    service: "chat-service",
    timestamp: new Date().toISOString(),
  });
});

// Socket.IO for real-time messaging
io.on("connection", (socket) => {
  console.log(`👤 User connected: ${socket.id}`);

  // Join room
  socket.on("join_room", (data) => {
    const { dealerEmail, technicianEmail, userType } = data;
    const roomId = createRoomId(dealerEmail, technicianEmail);

    socket.join(roomId);
    socket.roomId = roomId;
    socket.userEmail = userType === "DEALER" ? dealerEmail : technicianEmail;
    socket.userType = userType;

    console.log(`📱 ${userType} ${socket.userEmail} joined room: ${roomId}`);

    // Notify others in room
    socket.to(roomId).emit("user_joined", {
      userType,
      email: socket.userEmail,
      timestamp: new Date().toISOString(),
    });
  });

  // Send message
  socket.on("send_message", async (data) => {
    try {
      const { roomId, message, senderType } = data;
      const senderEmail = socket.userEmail;

      if (!roomId || !message || !senderEmail || !senderType) {
        socket.emit("error", { message: "Missing required fields" });
        return;
      }

      // Save message to database
      const { rows: insertRows } = await db.query(
        "INSERT INTO chat_messages (room_id, sender_email, sender_type, message_content) VALUES ($1, $2, $3, $4) RETURNING id, sent_at",
        [roomId, senderEmail, senderType, message]
      );
      const inserted = insertRows[0];

      const messageData = {
        id: inserted.id,
        room_id: roomId,
        sender_email: senderEmail,
        sender_type: senderType,
        message_content: message,
        sent_at: inserted.sent_at,
        read_status: false,
      };

      // Broadcast to all users in the room
      io.to(roomId).emit("new_message", messageData);

      console.log(`💬 Message sent in room ${roomId} by ${senderEmail}`);
    } catch (error) {
      console.error("Error sending message:", error);
      socket.emit("error", { message: "Failed to send message" });
    }
  });

  // Mark message as read
  socket.on("mark_read", async (data) => {
    try {
      const { messageId } = data;
      await db.execute(
        "UPDATE chat_messages SET read_status = TRUE WHERE id = ?",
        [messageId]
      );

      socket.to(socket.roomId).emit("message_read", { messageId });
    } catch (error) {
      console.error("Error marking message as read:", error);
    }
  });

  // Handle typing indicators
  socket.on("typing", (data) => {
    socket.to(socket.roomId).emit("user_typing", {
      userEmail: socket.userEmail,
      userType: socket.userType,
      isTyping: data.isTyping,
    });
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log(`👋 User disconnected: ${socket.id}`);
    if (socket.roomId) {
      socket.to(socket.roomId).emit("user_left", {
        userEmail: socket.userEmail,
        userType: socket.userType,
        timestamp: new Date().toISOString(),
      });
    }
  });
});

const PORT = process.env.PORT || 8089;

// Start server
initializeDatabase().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 Chat Service running on port ${PORT}`);
    console.log(`🌐 Socket.IO server ready for real-time messaging`);
  });
});
