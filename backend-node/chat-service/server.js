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
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());

// PostgreSQL connection - Using same credentials as other services
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "Aa123123@",
  database: process.env.DB_NAME || "inspection",
  port: parseInt(process.env.DB_PORT || "5432", 10),
  // Production connection pooling (important for free Postgres)
  max: 5,
  min: 1,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  // SSL required for Render
  ssl: {
    rejectUnauthorized: false
  }
};

let db;

// Initialize database connection
async function initializeDatabase() {
  try {
    // First, connect to default postgres database to create our database if it doesn't exist
    const defaultDbConfig = {
      ...dbConfig,
      database: 'postgres' // Connect to default postgres database first
    };
    
    const defaultDb = new Pool(defaultDbConfig);
    
    // Check if our database exists, if not create it
    try {
      await defaultDb.query(`CREATE DATABASE "${process.env.DB_NAME || 'inspection'}"`);
      console.log(`✅ Database "${process.env.DB_NAME || 'inspection'}" created successfully`);
    } catch (dbError) {
      if (dbError.code === '42P04') {
        console.log(`✅ Database "${process.env.DB_NAME || 'inspection'}" already exists`);
      } else {
        console.log(`ℹ️ Database creation result:`, dbError.message);
      }
    }
    
    await defaultDb.end();
    
    // Now connect to our actual database
    db = new Pool(dbConfig);

    // Create tables
    await createTables();
    console.log("✅ Database initialized successfully");
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    // Exit so orchestrator/systemd can restart after DB is fixed; prevents running without DB
    process.exit(1);
  }
}

async function createTables() {
  const createRoomsTable = `
    CREATE TABLE IF NOT EXISTS chat_rooms (
      room_id VARCHAR(255),
      dealer_email VARCHAR(255) NOT NULL,
      technician_email VARCHAR(255) NOT NULL,
      post_id INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
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
  `;

  const createCallLogsTable = `
    CREATE TABLE IF NOT EXISTS call_logs (
      id BIGSERIAL PRIMARY KEY,
      room_id VARCHAR(255) NOT NULL,
      caller_email VARCHAR(255) NOT NULL,
      caller_type TEXT CHECK (caller_type IN ('DEALER','TECHNICIAN')) NOT NULL,
      call_type TEXT CHECK (call_type IN ('AUDIO','VIDEO')) NOT NULL,
      call_status TEXT CHECK (call_status IN ('INITIATED','ANSWERED','REJECTED','ENDED','MISSED')) NOT NULL,
      started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      ended_at TIMESTAMP NULL,
      duration_seconds INT DEFAULT 0,
      FOREIGN KEY (room_id) REFERENCES chat_rooms(room_id) ON DELETE CASCADE
    );
  `;

  // Create base table (no PK to avoid conflicts if legacy table exists)
  await db.query(createRoomsTable);
  // Ensure required columns exist
  await db.query(`
    ALTER TABLE IF EXISTS chat_rooms
      ADD COLUMN IF NOT EXISTS room_id VARCHAR(255),
      ADD COLUMN IF NOT EXISTS dealer_email VARCHAR(255),
      ADD COLUMN IF NOT EXISTS technician_email VARCHAR(255),
      ADD COLUMN IF NOT EXISTS post_id INT NULL,
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      ADD COLUMN IF NOT EXISTS last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
  `);
  // Ensure primary key on room_id
  await db.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'chat_rooms'::regclass AND contype = 'p'
      ) THEN
        ALTER TABLE chat_rooms ADD CONSTRAINT chat_rooms_pkey PRIMARY KEY (room_id);
      END IF;
    END $$;
  `);
  // Ensure indexes exist
  await db.query(
    `CREATE INDEX IF NOT EXISTS idx_dealer_email ON chat_rooms (dealer_email);`
  );
  await db.query(
    `CREATE INDEX IF NOT EXISTS idx_technician_email ON chat_rooms (technician_email);`
  );
  await db.query(
    `CREATE INDEX IF NOT EXISTS idx_post_id ON chat_rooms (post_id);`
  );

  await db.query(createMessagesTable);
  await db.query(`
    ALTER TABLE IF EXISTS chat_messages
      ADD COLUMN IF NOT EXISTS room_id VARCHAR(255),
      ADD COLUMN IF NOT EXISTS sender_email VARCHAR(255),
      ADD COLUMN IF NOT EXISTS sender_type TEXT,
      ADD COLUMN IF NOT EXISTS message_content TEXT,
      ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      ADD COLUMN IF NOT EXISTS read_status BOOLEAN DEFAULT FALSE;
  `);
  // Ensure indexes after columns exist
  await db.query(
    `CREATE INDEX IF NOT EXISTS idx_room_id_sent_at ON chat_messages (room_id, sent_at);`
  );
  await db.query(
    `CREATE INDEX IF NOT EXISTS idx_sender_email ON chat_messages (sender_email);`
  );

  await db.query(createCallLogsTable);
  await db.query(`
    ALTER TABLE IF EXISTS call_logs
      ADD COLUMN IF NOT EXISTS room_id VARCHAR(255),
      ADD COLUMN IF NOT EXISTS caller_email VARCHAR(255),
      ADD COLUMN IF NOT EXISTS caller_type TEXT,
      ADD COLUMN IF NOT EXISTS call_type TEXT,
      ADD COLUMN IF NOT EXISTS call_status TEXT,
      ADD COLUMN IF NOT EXISTS started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      ADD COLUMN IF NOT EXISTS ended_at TIMESTAMP NULL,
      ADD COLUMN IF NOT EXISTS duration_seconds INT DEFAULT 0;
  `);
  // Ensure indexes after columns exist
  await db.query(
    `CREATE INDEX IF NOT EXISTS idx_room_id_started_at ON call_logs (room_id, started_at);`
  );
  await db.query(
    `CREATE INDEX IF NOT EXISTS idx_caller_email ON call_logs (caller_email);`
  );
}

// Helper function to create room ID
function createRoomId(dealerEmail, technicianEmail, postId = null) {
  if (postId) {
    return `${dealerEmail}:${technicianEmail}:POST_${postId}`;
  }
  return `${dealerEmail}:${technicianEmail}`;
}

// REST API Endpoints

// Get or create chat room (supports optional postId)
app.get("/api/chat/room/:dealerEmail/:technicianEmail", async (req, res) => {
  try {
    const { dealerEmail, technicianEmail } = req.params;
    const { postId } = req.query; // Optional postId from query parameters
    const roomId = createRoomId(dealerEmail, technicianEmail, postId);

    // Check if room exists
    const { rows: rooms } = await db.query(
      "SELECT * FROM chat_rooms WHERE room_id = $1",
      [roomId]
    );

    let room;
    if (rooms.length === 0) {
      // Create new room
      await db.query(
        "INSERT INTO chat_rooms (room_id, dealer_email, technician_email, post_id) VALUES ($1, $2, $3, $4)",
        [roomId, dealerEmail, technicianEmail, postId || null]
      );
      room = {
        room_id: roomId,
        dealer_email: dealerEmail,
        technician_email: technicianEmail,
        post_id: postId || null,
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

// Get chat history using query parameters to avoid URL encoding issues
app.get("/api/chat/messages", async (req, res) => {
  try {
    const { dealerEmail, technicianEmail, postId } = req.query;
    console.log("📩 Getting messages for:", {
      dealerEmail,
      technicianEmail,
      postId,
    });

    if (!dealerEmail || !technicianEmail) {
      console.log("❌ Missing emails");
      return res
        .status(400)
        .json({ error: "Missing dealerEmail or technicianEmail" });
    }

    const roomId = createRoomId(dealerEmail, technicianEmail, postId);
    console.log("🏠 Room ID:", roomId);
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const { rows: messages } = await db.query(
      `SELECT * FROM chat_messages 
       WHERE room_id = $1 
       ORDER BY sent_at DESC 
       LIMIT $2 OFFSET $3`,
      [roomId, limit, offset]
    );

    console.log("💬 Found messages:", messages.length);
    res.json(messages.reverse()); // Return in chronological order
  } catch (error) {
    console.error("❌ Error getting messages:", error);
    res.status(500).json({ error: "Failed to get messages" });
  }
});

// Keep the old endpoint for backward compatibility, but with proper URL encoding handling
app.get("/api/chat/room/:roomId/messages", async (req, res) => {
  try {
    const roomId = decodeURIComponent(req.params.roomId);
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

// Get unread message count for user
app.get("/api/chat/unread-count/:userEmail", async (req, res) => {
  try {
    const userEmail = decodeURIComponent(req.params.userEmail);

    const { rows } = await db.query(
      `SELECT COUNT(*)::int as unread_count 
       FROM chat_messages cm
       JOIN chat_rooms cr ON cm.room_id = cr.room_id
       WHERE (cr.dealer_email = $1 OR cr.technician_email = $1)
       AND cm.sender_email != $1
       AND cm.read_status = FALSE`,
      [userEmail]
    );

    res.json({ unreadCount: rows[0]?.unread_count || 0 });
  } catch (error) {
    console.error("Error getting unread count:", error);
    res.status(500).json({ error: "Failed to get unread count" });
  }
});

// Get all chat rooms for a user with latest message and unread count
app.get("/api/chat/rooms/:userEmail", async (req, res) => {
  try {
    const userEmail = decodeURIComponent(req.params.userEmail);

    const { rows } = await db.query(
      `SELECT 
        cr.*,
        (SELECT COUNT(*)::int FROM chat_messages 
         WHERE room_id = cr.room_id 
         AND sender_email != $1 
         AND read_status = FALSE) as unread_count,
        (SELECT message_content FROM chat_messages 
         WHERE room_id = cr.room_id 
         ORDER BY sent_at DESC LIMIT 1) as last_message,
        (SELECT sent_at FROM chat_messages 
         WHERE room_id = cr.room_id 
         ORDER BY sent_at DESC LIMIT 1) as last_message_time,
        (SELECT sender_email FROM chat_messages 
         WHERE room_id = cr.room_id 
         ORDER BY sent_at DESC LIMIT 1) as last_message_sender
       FROM chat_rooms cr 
       WHERE cr.dealer_email = $1 OR cr.technician_email = $1
       ORDER BY last_activity DESC`,
      [userEmail]
    );

    res.json(rows);
  } catch (error) {
    console.error("Error getting chat rooms:", error);
    res.status(500).json({ error: "Failed to get chat rooms" });
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

  // Register socket for global notifications
  socket.on("register_for_notifications", (data) => {
    const { userEmail, userType } = data;
    if (userEmail && userType) {
      socket.userEmail = userEmail;
      socket.userType = userType;
      socket.isRegisteredForNotifications = true;
      console.log(
        `🔔 Registered ${userType} ${userEmail} for global notifications`
      );
    }
  });

  // Join room
  socket.on("join_room", async (data) => {
    try {
      const { dealerEmail, technicianEmail, userType, postId } = data;

      if (!dealerEmail || !technicianEmail || !userType) {
        console.error("❌ Missing required fields for join_room:", data);
        socket.emit("error", {
          message:
            "Missing required fields: dealerEmail, technicianEmail, userType",
        });
        return;
      }

      const roomId = createRoomId(dealerEmail, technicianEmail, postId);

      // Check if database is available
      if (!db) {
        console.error("❌ Database not initialized");
        socket.emit("error", { message: "Database not available" });
        return;
      }

      // Ensure the room exists in the database
      try {
        // Check if room exists
        const { rows: rooms } = await db.query(
          "SELECT * FROM chat_rooms WHERE room_id = $1",
          [roomId]
        );

        if (rooms.length === 0) {
          // Create new room
          await db.query(
            "INSERT INTO chat_rooms (room_id, dealer_email, technician_email, post_id) VALUES ($1, $2, $3, $4)",
            [roomId, dealerEmail, technicianEmail, postId || null]
          );
          console.log(`🆕 Created new chat room: ${roomId}`);
        } else {
          console.log(`🏠 Using existing chat room: ${roomId}`);
        }
      } catch (dbError) {
        console.error("❌ Error managing chat room:", dbError);
        socket.emit("error", {
          message: "Failed to manage chat room",
          details: dbError.message,
        });
        return;
      }

      // Leave previous room if exists
      if (socket.roomId) {
        socket.leave(socket.roomId);
        console.log(
          `👋 ${socket.userType} ${socket.userEmail} left room: ${socket.roomId}`
        );
      }

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
    } catch (error) {
      console.error("❌ Error in join_room:", error);
      socket.emit("error", {
        message: "Failed to join room",
        details: error.message,
      });
    }
  });

  // Send message
  socket.on("send_message", async (data) => {
    try {
      console.log("💬 Received send_message:", data);
      const { roomId, message, senderType } = data;
      const senderEmail = socket.userEmail;

      console.log("📝 Message details:", {
        roomId,
        message,
        senderEmail,
        senderType,
      });

      if (!roomId || !message || !senderEmail || !senderType) {
        console.error("❌ Missing required fields:", {
          roomId,
          message,
          senderEmail,
          senderType,
        });
        socket.emit("error", { message: "Missing required fields" });
        return;
      }

      // Check if database is available
      if (!db) {
        console.error("❌ Database not initialized");
        socket.emit("error", { message: "Database not available" });
        return;
      }

      // Ensure the room exists before sending message
      const { rows: roomsInitial } = await db.query(
        "SELECT * FROM chat_rooms WHERE room_id = $1",
        [roomId]
      );
      let rooms = roomsInitial;

      if (rooms.length === 0) {
        console.log("🆕 Room doesn't exist, creating it:", roomId);
        // Extract postId from roomId if it exists
        const postId = roomId.includes(":POST_")
          ? roomId.split(":POST_")[1]
          : null;
        const [dealerEmail, technicianEmail] = roomId.split(":");

        // Create the room
        await db.query(
          "INSERT INTO chat_rooms (room_id, dealer_email, technician_email, post_id) VALUES ($1, $2, $3, $4)",
          [roomId, dealerEmail, technicianEmail, postId]
        );
        console.log("✅ Room created successfully:", roomId);

        // Re-fetch the room after creation
        const { rows: roomsRefetch } = await db.query(
          "SELECT * FROM chat_rooms WHERE room_id = $1",
          [roomId]
        );
        rooms = roomsRefetch;
      }

      console.log("💾 Saving message to database...");
      // Save message to database
      const { rows: insertRows } = await db.query(
        "INSERT INTO chat_messages (room_id, sender_email, sender_type, message_content) VALUES ($1, $2, $3, $4) RETURNING id, sent_at",
        [roomId, senderEmail, senderType, message]
      );
      const inserted = insertRows[0];
      console.log("✅ Message saved successfully:", inserted.id);

      // Update last_activity for the room
      await db.query(
        "UPDATE chat_rooms SET last_activity = CURRENT_TIMESTAMP WHERE room_id = $1",
        [roomId]
      );

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

      // Also send to all sockets of both users for guaranteed delivery
      const dealerEmail = rooms[0].dealer_email;
      const technicianEmail = rooms[0].technician_email;

      const allSockets = await io.fetchSockets();

      // Send to all dealer sockets
      const dealerSockets = allSockets.filter(
        (s) => s.userEmail === dealerEmail
      );
      dealerSockets.forEach((socket) => {
        socket.emit("chat_notification", {
          ...messageData,
          senderName: senderEmail.split("@")[0],
          roomId: roomId,
        });
      });

      // Send to all technician sockets
      const technicianSockets = allSockets.filter(
        (s) => s.userEmail === technicianEmail
      );
      technicianSockets.forEach((socket) => {
        socket.emit("chat_notification", {
          ...messageData,
          senderName: senderEmail.split("@")[0],
          roomId: roomId,
        });
      });

      console.log(
        `📢 Sent to ${dealerSockets.length} dealer sockets and ${technicianSockets.length} technician sockets`
      );

      console.log(`💬 Message sent in room ${roomId} by ${senderEmail}`);
    } catch (error) {
      console.error("❌ Error sending message:", error);
      console.error("❌ Error details:", error.message);
      console.error("❌ Error stack:", error.stack);
      socket.emit("error", {
        message: "Failed to send message",
        details: error.message,
        code: error.code,
      });
    }
  });

  // Mark message as read
  socket.on("mark_read", async (data) => {
    try {
      const { messageId } = data;
      await db.query(
        "UPDATE chat_messages SET read_status = TRUE WHERE id = $1",
        [messageId]
      );

      socket.to(socket.roomId).emit("message_read", { messageId });
    } catch (error) {
      console.error("Error marking message as read:", error);
    }
  });

  // Mark all messages in a room as read
  socket.on("mark_room_read", async (data) => {
    try {
      const { roomId } = data;
      const userEmail = socket.userEmail;

      if (!roomId || !userEmail) {
        console.error("Missing roomId or userEmail for mark_room_read");
        return;
      }

      // Mark all messages in this room as read for this user (except messages sent by this user)
      await db.query(
        `UPDATE chat_messages 
         SET read_status = TRUE 
         WHERE room_id = $1 AND sender_email != $2`,
        [roomId, userEmail]
      );

      console.log(
        `📖 Marked all messages in room ${roomId} as read for ${userEmail}`
      );

      // Emit to all sockets of this user to update their notification counts
      const allSockets = await io.fetchSockets();
      const userSockets = allSockets.filter((s) => s.userEmail === userEmail);

      userSockets.forEach((userSocket) => {
        userSocket.emit("room_marked_read", { roomId });
      });
    } catch (error) {
      console.error("Error marking room as read:", error);
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

  // WebRTC Signaling Events

  // Initiate call
  socket.on("call_initiate", async (data) => {
    try {
      const { roomId, callType, targetEmail } = data;
      const callerEmail = socket.userEmail;
      const callerType = socket.userType;

      console.log(
        `📞 Call initiated: ${callType} call from ${callerEmail} to ${targetEmail}`
      );

      // Ensure the room exists before initiating call
      const { rows: rooms } = await db.query(
        "SELECT * FROM chat_rooms WHERE room_id = $1",
        [roomId]
      );

      if (rooms.length === 0) {
        console.log("🆕 Room doesn't exist for call, creating it:", roomId);
        // Extract postId from roomId if it exists
        const postId = roomId.includes(":POST_")
          ? roomId.split(":POST_")[1]
          : null;
        const [dealerEmail, technicianEmail] = roomId.split(":");

        // Create the room
        await db.query(
          "INSERT INTO chat_rooms (room_id, dealer_email, technician_email, post_id) VALUES ($1, $2, $3, $4)",
          [roomId, dealerEmail, technicianEmail, postId]
        );
        console.log("✅ Room created successfully for call:", roomId);
      }

      // Join the caller to the call room so future events (accept/reject/ICE) reach them
      try {
        socket.join(roomId);
        socket.callRoomId = roomId;
        console.log(`📥 Caller joined call room: ${roomId}`);
      } catch (joinErr) {
        console.error("❌ Error joining caller to call room:", joinErr);
      }

      // Log call initiation in database
      const { rows: callRows } = await db.query(
        "INSERT INTO call_logs (room_id, caller_email, caller_type, call_type, call_status) VALUES ($1, $2, $3, $4, 'INITIATED') RETURNING id",
        [roomId, callerEmail, callerType, callType.toUpperCase()]
      );

      const callId = callRows[0].id;

      // Find target user's socket
      const allSockets = await io.fetchSockets();
      const targetSockets = allSockets.filter(
        (s) => s.userEmail === targetEmail
      );

      if (targetSockets.length > 0) {
        // Send call notification to target user
        targetSockets.forEach((targetSocket) => {
          targetSocket.emit("incoming_call", {
            callId,
            roomId,
            callerEmail,
            callerType,
            callType,
            timestamp: new Date().toISOString(),
          });
        });

        // Send confirmation to caller
        socket.emit("call_initiated", { callId, status: "sent" });
      } else {
        // Target user not online
        socket.emit("call_failed", { reason: "User not available" });
        // Do not mark MISSED immediately; allow peer to connect within 30s
        setTimeout(async () => {
          try {
            const { rows: check } = await db.query(
              "SELECT call_status FROM call_logs WHERE id = $1",
              [callId]
            );
            if (check?.[0]?.call_status === "INITIATED") {
              await db.query(
                "UPDATE call_logs SET call_status = 'MISSED', ended_at = NOW() WHERE id = $1",
                [callId]
              );
            }
          } catch (e) {
            console.error("Error marking missed call:", e);
          }
        }, 30000);
      }
    } catch (error) {
      console.error("Error initiating call:", error);
      socket.emit("call_failed", { reason: "Failed to initiate call" });
    }
  });

  // Accept call
  socket.on("call_accept", async (data) => {
    try {
      const { callId, roomId } = data;
      console.log(`✅ Call accepted: ${callId}`);

      // Ensure the acceptor is in the call room
      try {
        socket.join(roomId);
        socket.callRoomId = roomId;
        console.log(`📥 Acceptor joined call room: ${roomId}`);
      } catch (joinErr) {
        console.error("❌ Error joining acceptor to call room:", joinErr);
      }

      // Update call status in database
      await db.query(
        "UPDATE call_logs SET call_status = 'ANSWERED' WHERE id = $1",
        [callId]
      );

      // Notify all users in the room that call was accepted
      io.to(roomId).emit("call_accepted", { callId, roomId });
    } catch (error) {
      console.error("Error accepting call:", error);
    }
  });

  // Reject call
  socket.on("call_reject", async (data) => {
    try {
      const { callId, roomId } = data;
      console.log(`❌ Call rejected: ${callId}`);

      // Ensure the rejecter is in the call room so broadcast reaches all
      try {
        socket.join(roomId);
        socket.callRoomId = roomId;
        console.log(`📥 Rejecter ensured in call room: ${roomId}`);
      } catch (joinErr) {
        console.error("❌ Error joining rejecter to call room:", joinErr);
      }

      // Update call status in database
      await db.query(
        "UPDATE call_logs SET call_status = 'REJECTED', ended_at = NOW() WHERE id = $1",
        [callId]
      );

      // Notify ALL users in the room that call was rejected (including the rejecter)
      io.to(roomId).emit("call_rejected", {
        callId,
        roomId,
        rejectedBy: socket.userEmail,
        timestamp: new Date().toISOString(),
      });

      console.log(`📢 Call rejection notification sent to room: ${roomId}`);
    } catch (error) {
      console.error("Error rejecting call:", error);
    }
  });

  // End call
  socket.on("call_end", async (data) => {
    try {
      const { callId, roomId } = data;
      console.log(`📴 Call ended: ${callId}`);

      // Calculate duration and update call status
      const { rows } = await db.query(
        "SELECT started_at FROM call_logs WHERE id = $1",
        [callId]
      );

      const startTime = rows?.[0]?.started_at
        ? new Date(rows[0].started_at)
        : null;
      const endTime = new Date();
      const duration = startTime
        ? Math.max(0, Math.floor((endTime - startTime) / 1000))
        : 0;

      await db.query(
        "UPDATE call_logs SET call_status = 'ENDED', ended_at = NOW(), duration_seconds = $1 WHERE id = $2",
        [duration, callId]
      );

      // Notify all users in the room that call ended
      io.to(roomId).emit("call_ended", { callId, durationSeconds: duration });
    } catch (error) {
      console.error("Error ending call:", error);
    }
  });

  // WebRTC Signaling - ICE candidates
  socket.on("ice_candidate", (data) => {
    const { candidate, roomId, targetEmail } = data;

    // Forward ICE candidate to target user
    socket.to(roomId).emit("ice_candidate", {
      candidate,
      roomId,
      senderEmail: socket.userEmail,
    });
  });

  // WebRTC Signaling - Offer
  socket.on("webrtc_offer", (data) => {
    const { offer, roomId, targetEmail } = data;

    // Forward offer to target user
    socket.to(roomId).emit("webrtc_offer", {
      offer,
      roomId,
      senderEmail: socket.userEmail,
    });
  });

  // WebRTC Signaling - Answer
  socket.on("webrtc_answer", (data) => {
    const { answer, roomId, targetEmail } = data;

    // Forward answer to target user
    socket.to(roomId).emit("webrtc_answer", {
      answer,
      roomId,
      senderEmail: socket.userEmail,
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
