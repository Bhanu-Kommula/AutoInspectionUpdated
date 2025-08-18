#!/bin/bash

echo "Testing Simple Chat API..."

# Test health
echo "1. Health check:"
curl -s http://localhost:8089/api/simple-chat/health
echo -e "\n"

# Start conversation
echo "2. Starting conversation:"
RESPONSE=$(curl -s -X POST http://localhost:8089/api/simple-chat/start \
  -H "Content-Type: application/json" \
  -d '{
    "user1Id": "prasad",
    "user1Name": "Prasad",
    "user1Type": "DEALER",
    "user2Id": "kommula",
    "user2Name": "Kommula",
    "user2Type": "TECHNICIAN"
  }')
echo $RESPONSE
echo -e "\n"

# Extract conversation ID
CONV_ID=$(echo $RESPONSE | grep -o '"id":[0-9]*' | cut -d':' -f2)
echo "Conversation ID: $CONV_ID"
echo -e "\n"

# Send message
echo "3. Sending message:"
curl -s -X POST http://localhost:8089/api/simple-chat/send \
  -H "Content-Type: application/json" \
  -d "{
    \"conversationId\": $CONV_ID,
    \"senderId\": \"prasad\",
    \"senderName\": \"Prasad\",
    \"content\": \"This is a PRIVATE chat between Prasad and Kommula ONLY!\"
  }"
echo -e "\n\n"

# Get messages
echo "4. Getting messages:"
curl -s http://localhost:8089/api/simple-chat/conversation/$CONV_ID/messages
echo -e "\n\n"

# Test another user trying to see messages
echo "5. Testing bhanu trying to see messages (should be empty conversation):"
curl -s -X POST http://localhost:8089/api/simple-chat/start \
  -H "Content-Type: application/json" \
  -d '{
    "user1Id": "bhanu",
    "user1Name": "Bhanu",
    "user1Type": "DEALER",
    "user2Id": "prasad",
    "user2Name": "Prasad",
    "user2Type": "DEALER"
  }'
echo -e "\n"
