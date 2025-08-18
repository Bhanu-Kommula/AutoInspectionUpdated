#!/bin/bash

echo "🚀 Starting all services..."

echo "Starting Service Registry..."
cd /Users/bhanuprasadkommula/Downloads/Inspectioproject/Backend/serviceregistry
./mvnw spring-boot:run > serviceregistry.log 2>&1 &
sleep 30

echo "Starting Gateway..."
cd /Users/bhanuprasadkommula/Downloads/Inspectioproject/Backend/gateway
./mvnw spring-boot:run > gateway.log 2>&1 &
sleep 15

echo "Starting Dealer Service..."
cd /Users/bhanuprasadkommula/Downloads/Inspectioproject/Backend/dealer
./mvnw spring-boot:run > dealer.log 2>&1 &
sleep 10

echo "Starting Technician Service..."
cd /Users/bhanuprasadkommula/Downloads/Inspectioproject/Backend/techincian
./mvnw spring-boot:run > technician.log 2>&1 &
sleep 10

echo "Starting Postings Service..."
cd /Users/bhanuprasadkommula/Downloads/Inspectioproject/Backend/postings
./mvnw spring-boot:run > postings.log 2>&1 &
sleep 10

echo "Starting Tech Dashboard..."
cd /Users/bhanuprasadkommula/Downloads/Inspectioproject/Backend/tech-dashboard
./mvnw spring-boot:run > tech-dashboard.log 2>&1 &
sleep 10

echo "Starting Chat Service..."
cd /Users/bhanuprasadkommula/Downloads/Inspectioproject/Backend/chat-service
PORT=8089 DB_HOST=localhost DB_USER=root DB_PASSWORD=root DB_NAME=chat_db npm start > chat-service.log 2>&1 &
sleep 5

echo "Starting Frontend..."
cd /Users/bhanuprasadkommula/Downloads/Inspectioproject/dealer-frontend
npm start &

echo "✅ All services started!"
echo "Frontend: http://localhost:3000"
echo "Service Registry: http://localhost:8761"