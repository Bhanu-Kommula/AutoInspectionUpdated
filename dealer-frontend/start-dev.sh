#!/bin/bash

echo "🚀 Starting All State Auto Inspection Application in Development Mode"
echo "================================================================"

# Ensure we run inside the dealer-frontend directory
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# Clear any cached data
echo "🧹 Clearing cached data..."
rm -rf node_modules/.cache
rm -rf build

# Set development environment variables
export NODE_ENV=development
export REACT_APP_SECURITY_DISABLED=true
export REACT_APP_API_GATEWAY_URL=http://localhost:8088

# Service endpoints through Gateway (correct format)
export REACT_APP_DEALER_BASE_URL=http://localhost:8088/dealer/api/dealers
export REACT_APP_TECHNICIAN_BASE_URL=http://localhost:8088/technician/api/technicians
export REACT_APP_POSTS_BASE_URL=http://localhost:8088/postings

# Admin and User endpoints through Gateway
export REACT_APP_ADMIN_BASE_URL=http://localhost:8088/api/admin
export REACT_APP_USER_BASE_URL=http://localhost:8088/api/users
export REACT_APP_AUTH_BASE_URL=http://localhost:8088/api/users/auth

# WebSocket
export REACT_APP_WEBSOCKET_BASE_URL=http://localhost:8088

echo "🔧 Environment variables set:"
echo "   NODE_ENV: $NODE_ENV"
echo "   REACT_APP_SECURITY_DISABLED: $REACT_APP_SECURITY_DISABLED"
echo "   REACT_APP_API_GATEWAY_URL: $REACT_APP_API_GATEWAY_URL"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

echo "🎯 Starting development server..."
echo "   The application will be available at: http://localhost:3000"
echo "   Press Ctrl+C to stop the server"
echo ""

# Start the development server
npm start
