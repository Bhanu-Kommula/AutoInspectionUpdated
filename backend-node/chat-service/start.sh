#!/bin/bash

# Chat Service Startup Script
echo "🚀 Starting Chat Service..."

# Set environment variables
export PORT=8089
export DB_HOST=localhost
export DB_USER=postgres
export DB_PASSWORD=Aa123123@
export DB_NAME=inspection

# Start the Node.js chat service
npm start
