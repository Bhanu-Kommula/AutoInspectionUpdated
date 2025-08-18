# Audio/Video Calling Implementation

## Overview

I've successfully implemented basic audio and video calling functionality for your chat system. The implementation uses WebRTC for peer-to-peer communication and Socket.IO for signaling.

## Features Implemented

### ✅ Backend (Chat Service)

- **WebRTC Signaling**: Added Socket.IO events for call initiation, acceptance, rejection, and WebRTC signaling
- **Call Database Logging**: Created `call_logs` table to track call history with status, duration, and participants
- **Call Management**: Handles call states (INITIATED, ANSWERED, REJECTED, ENDED, MISSED)

### ✅ Frontend Components

- **VideoCall Component**: Main call interface with video streams, controls (mute, camera toggle, hang up)
- **CallButton Component**: Reusable call buttons for audio/video calls
- **IncomingCallNotification**: Toast notification for incoming calls
- **WebRTC Service**: Utility class handling all WebRTC peer connection logic

### ✅ Integration

- **Chat Window Integration**: Added call buttons to chat headers
- **Global Call Context**: Manages incoming calls across the entire application
- **Call State Management**: Proper state handling for call initiation, acceptance, and termination

## How It Works

### 1. Call Initiation

- User clicks audio/video call button in chat
- Frontend emits `call_initiate` event with room ID and target user
- Backend logs call and notifies target user

### 2. Incoming Call Flow

- Target user receives `incoming_call` event
- Shows incoming call notification toast
- User can accept or reject the call

### 3. WebRTC Connection

- Once accepted, WebRTC peer connection is established
- Audio/video streams are exchanged
- STUN servers (Google's free STUN) help with NAT traversal

### 4. Call Controls

- **Mute/Unmute**: Toggle audio track
- **Camera On/Off**: Toggle video track (video calls only)
- **Hang Up**: End call and clean up resources
- **Fullscreen**: Expand video call interface

## Current Features

### ✅ Basic Functionality

- Audio-only calls
- Video calls with camera and microphone
- Call acceptance/rejection
- Call duration tracking
- Proper cleanup on call end

### ✅ User Interface

- Modern, responsive call interface
- Incoming call notifications
- Call controls (mute, camera, hang up)
- Connection status indicators
- Call duration display

### ✅ Technical Implementation

- WebRTC peer-to-peer connections
- Socket.IO signaling server
- Database logging of all calls
- Error handling and connection state management

## Usage Instructions

### For Users:

1. **Start a Call**: Click the phone (audio) or video camera icon in any chat window
2. **Answer Calls**: Click "Accept" in the incoming call notification
3. **During Calls**: Use the control buttons to mute, turn off camera, or hang up
4. **End Calls**: Click the red phone button to hang up

### For Developers:

The implementation is modular and can be easily extended:

- **WebRTC Service** (`/src/utils/webrtcService.js`): Handles all WebRTC logic
- **Call Hook** (`/src/hooks/useCall.js`): React hook for call state management
- **Call Context** (`/src/contexts/CallContext.js`): Global call state across app

## Browser Support

- Chrome/Chromium browsers (recommended)
- Firefox
- Safari (with some limitations)
- Edge

**Note**: HTTPS is required for WebRTC in production environments.

## What's NOT Implemented (Future Enhancements)

### Security & Authentication

- No call encryption beyond browser defaults
- No call authentication/authorization
- No TURN servers for corporate firewalls

### Advanced Features

- Group calls (currently only 1-on-1)
- Screen sharing
- Call recording
- Push notifications for mobile
- Bandwidth optimization

### Production Considerations

- HTTPS/SSL certificates needed
- TURN servers for enterprise networks
- Call quality metrics
- Load balancing for multiple users

## Getting Started

1. **Start the chat service**:

   ```bash
   cd Backend/chat-service
   node server.js
   ```

2. **Start the frontend**:

   ```bash
   cd dealer-frontend
   npm start
   ```

3. **Test calls**:
   - Open two browser windows
   - Log in as different users (dealer & technician)
   - Start a chat and click the call buttons

## Database Schema

The `call_logs` table tracks all calls:

```sql
CREATE TABLE call_logs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  room_id VARCHAR(255) NOT NULL,
  caller_email VARCHAR(255) NOT NULL,
  caller_type ENUM('DEALER', 'TECHNICIAN') NOT NULL,
  call_type ENUM('AUDIO', 'VIDEO') NOT NULL,
  call_status ENUM('INITIATED', 'ANSWERED', 'REJECTED', 'ENDED', 'MISSED') NOT NULL,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP NULL,
  duration_seconds INT DEFAULT 0
);
```

This implementation provides a solid foundation for audio/video calling that can be extended based on your specific needs!
