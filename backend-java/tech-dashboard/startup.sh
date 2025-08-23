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
echo "  SPRING_PROFILES_ACTIVE: ${SPRING_PROFILES_ACTIVE:-render}"
echo "  SPRING_DATASOURCE_URL: ${SPRING_DATASOURCE_URL:-not set}"

# Check if we're in production mode and fix database URL if needed
if [ -n "$SPRING_DATASOURCE_URL" ]; then
    echo "  Production mode detected - using database: ${SPRING_DATASOURCE_URL}"
    export SPRING_PROFILES_ACTIVE=render
    
    # Fix Render's postgresql:// URL format to proper JDBC format
    if [[ "$SPRING_DATASOURCE_URL" == postgresql://* ]]; then
        echo "  Detected Render postgresql:// format, converting to JDBC format..."
        
        # Parse the URL: postgresql://user:pass@host/dbname
        # Extract components
        DB_URL_WITHOUT_PROTOCOL=${SPRING_DATASOURCE_URL#postgresql://}
        USER_PASS=${DB_URL_WITHOUT_PROTOCOL%%@*}
        HOST_DB=${DB_URL_WITHOUT_PROTOCOL#*@}
        
        if [[ "$USER_PASS" == *:* ]]; then
            DB_USER=${USER_PASS%%:*}
            DB_PASS=${USER_PASS#*:}
        else
            DB_USER=$USER_PASS
            DB_PASS=""
        fi
        
        if [[ "$HOST_DB" == */* ]]; then
            DB_HOST=${HOST_DB%%/*}
            DB_NAME=${HOST_DB#*/}
        else
            DB_HOST=$HOST_DB
            DB_NAME=""
        fi
        
        # Set individual environment variables
        export SPRING_DATASOURCE_USERNAME="$DB_USER"
        export SPRING_DATASOURCE_PASSWORD="$DB_PASS"
        
        # Construct proper JDBC URL
        if [ -n "$DB_NAME" ]; then
            export SPRING_DATASOURCE_URL="jdbc:postgresql://${DB_HOST}:5432/${DB_NAME}?sslmode=require"
        else
            export SPRING_DATASOURCE_URL="jdbc:postgresql://${DB_HOST}:5432/?sslmode=require"
        fi
        
        echo "  Fixed JDBC URL: $SPRING_DATASOURCE_URL"
        echo "  Database User: $DB_USER"
        echo "  Database Host: $DB_HOST"
        echo "  Database Name: $DB_NAME"
    fi
else
    echo "  Development mode - using local database"
    export SPRING_PROFILES_ACTIVE=default
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
    -Dspring.profiles.active=${SPRING_PROFILES_ACTIVE:-render} \
    -jar "$JAR_FILE"
