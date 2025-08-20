#!/bin/bash

# Test script for database URL parsing logic
echo "🧪 Testing Database URL Parsing Logic..."

# Test case 1: Render's postgresql:// format
echo "Test 1: Render postgresql:// format"
export SPRING_DATASOURCE_URL="postgresql://autoinspect_db_user:kIO9pfH78FraPP9Z1sb1mMwHC8wERAl9@dpg-d2ic5d3uibrs73euu120-a/autoinspect_db"

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
    echo "  Username: $SPRING_DATASOURCE_USERNAME"
    echo "  Password: [HIDDEN]"
else
    echo "  Not a postgresql:// URL"
fi

echo ""
echo "Test 2: Standard JDBC format (should remain unchanged)"
export SPRING_DATASOURCE_URL="jdbc:postgresql://localhost:5432/testdb?user=testuser&password=testpass"
echo "  Original URL: $SPRING_DATASOURCE_URL"

if [[ "$SPRING_DATASOURCE_URL" == postgresql://* ]]; then
    echo "  Would convert to JDBC format"
else
    echo "  Already in JDBC format, no conversion needed"
fi

echo ""
echo "✅ Database URL parsing test completed!"
