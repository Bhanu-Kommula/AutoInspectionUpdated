# Chat Service

Real-time chat service for dealer-technician communication using Node.js and Socket.IO.

## Features

- ✅ **Real-time messaging** with Socket.IO
- ✅ **One-to-one chat** between dealers and technicians
- ✅ **Message persistence** in MySQL database
- ✅ **Typing indicators**
- ✅ **Connection status** indicators
- ✅ **Chat history** retrieval
- ✅ **Auto room creation** for dealer-technician pairs

## Quick Start

### Prerequisites

- Node.js 16+
- MySQL database
- Gateway service running on port 8088

### Installation & Setup

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Set environment variables** (create `.env` file):

   ```env
   PORT=8089
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=root
   DB_NAME=chat_db
   ```

3. **Start the service:**
   ```bash
   npm start
   # or for development
   npm run dev
   ```

The service will:

- Start on port 8089
- Auto-create database and tables
- Accept WebSocket connections
- Provide REST API endpoints

## API Endpoints

### REST API

- `GET /api/chat/room/:dealerEmail/:technicianEmail` - Get/create chat room
- `GET /api/chat/room/:roomId/messages` - Get message history
- `GET /health` - Health check

### WebSocket Events

- `join_room` - Join a chat room
- `send_message` - Send a message
- `typing` - Send typing indicator
- `mark_read` - Mark message as read

## Database Schema

```sql
chat_rooms:
- room_id (VARCHAR) - Format: "dealer_email:technician_email"
- dealer_email (VARCHAR)
- technician_email (VARCHAR)
- created_at (TIMESTAMP)
- last_activity (TIMESTAMP)

chat_messages:
- id (BIGINT AUTO_INCREMENT)
- room_id (VARCHAR FK)
- sender_email (VARCHAR)
- sender_type (ENUM: 'DEALER', 'TECHNICIAN')
- message_content (TEXT)
- sent_at (TIMESTAMP)
- read_status (BOOLEAN)
```

## Integration

The chat service integrates with:

- **Gateway** (port 8088) - Routes `/chat/**` requests
- **Frontend** - React components with Socket.IO client
- **MySQL** - Shared database with other services

## Room ID Format

Rooms use deterministic IDs: `dealer_email:technician_email`

Example: `john@dealer.com:tech@service.com`

This ensures:

- ✅ Same dealer-tech pair always gets same room
- ✅ Automatic room isolation
- ✅ Simple room discovery

## Testing

Use the health endpoint to verify service:

```bash
curl http://localhost:8089/health
```

Chat functionality is automatically available in the dealer frontend when:

1. Chat service is running (port 8089)
2. Gateway is running (port 8088)
3. Post has assigned technician
4. Chat button appears in PostCard component
