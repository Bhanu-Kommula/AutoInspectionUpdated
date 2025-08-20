#!/bin/bash

# Tech Dashboard Service Startup Script for Render
# This script ensures proper startup configuration for Render deployment

echo "🚀 Starting Tech Dashboard Service..."

# Set default values
export PORT=${PORT:-8085}
export JAVA_OPTS=${JAVA_OPTS:-"-XX:MaxRAMPercentage=75.0"}

# Log environment variables
echo "Environment Configuration:"
echo "  PORT: $PORT"
echo "  JAVA_OPTS: $JAVA_OPTS"
echo "  SPRING_PROFILES_ACTIVE: ${SPRING_PROFILES_ACTIVE:-default}"
echo "  SPRING_DATASOURCE_URL: ${SPRING_DATASOURCE_URL:-not set}"

# Check if we're in production mode
if [ -n "$SPRING_DATASOURCE_URL" ]; then
    echo "  Production mode detected - using database: ${SPRING_DATASOURCE_URL}"
    export SPRING_PROFILES_ACTIVE=render
else
    echo "  Development mode - using local database"
fi

# Find the JAR file
JAR_FILE=$(find target/ -name "*.jar" -type f | head -1)

if [ -z "$JAR_FILE" ]; then
    echo "❌ Error: No JAR file found in target directory"
    echo "Available files in target/:"
    ls -la target/
    exit 1
fi

echo "📦 Using JAR file: $JAR_FILE"

# Start the application
echo "🔧 Starting application on port $PORT..."
exec java $JAVA_OPTS \
    -Dserver.port=$PORT \
    -Dspring.profiles.active=${SPRING_PROFILES_ACTIVE:-default} \
    -jar "$JAR_FILE"
