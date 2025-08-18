#!/bin/bash

echo "🧪 Testing Real-Time Chat System"
echo "================================"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

# Function to check if port is in use
check_port() {
    lsof -i :$1 > /dev/null 2>&1
    return $?
}

echo ""
echo "1. Checking required services..."

# Check if Gateway is running (port 8088)
check_port 8088
print_status $? "Gateway service (port 8088)"

# Check if Chat service is running (port 8089)
check_port 8089
print_status $? "Chat service (port 8089)"

# Check if Dealer frontend is running (port 3000)
check_port 3000
print_status $? "Dealer frontend (port 3000)"

echo ""
echo "2. Testing Chat Service API..."

# Test health endpoint
curl -s http://localhost:8089/health > /dev/null 2>&1
print_status $? "Chat service health check"

# Test via Gateway
curl -s http://localhost:8088/chat/health > /dev/null 2>&1  
print_status $? "Chat service via Gateway"

echo ""
echo "3. Database connectivity..."

# Try to create a test room
curl -s -X GET "http://localhost:8088/chat/api/chat/room/test@dealer.com/test@tech.com" > /dev/null 2>&1
print_status $? "Database connection and room creation"

echo ""
echo "🚀 To start the chat service:"
echo "   cd Backend/chat-service && npm start"
echo ""
echo "🌐 Chat will be available in the dealer frontend at:"
echo "   http://localhost:3000"
echo ""
echo "💬 Look for the 'Chat' button on posts with assigned technicians"
echo ""

if check_port 8089; then
    echo -e "${GREEN}✨ Chat system is ready!${NC}"
else
    echo -e "${YELLOW}⚠️  Start the chat service to enable real-time messaging${NC}"
fi
