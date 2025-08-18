#!/bin/bash

# Chat Service Startup Script
echo "🚀 Starting Chat Service..."

# Set environment variables
export PORT=8089
export DB_HOST=localhost
export DB_USER=root
export DB_PASSWORD=root
export DB_NAME=chat_db

# Start the Node.js chat service
npm start
