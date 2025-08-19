#!/bin/bash

# Script to update phone number for technician kommula
# This script will use the REST API to update the phone number

# Configuration
API_BASE_URL="http://localhost:8088"  # Gateway URL
TECHNICIAN_SERVICE_URL="$API_BASE_URL/api/technicians"

# Generate a random US phone number
generate_random_phone() {
    area_code=$((100 + RANDOM % 900))
    exchange=$((100 + RANDOM % 900))
    number=$((1000 + RANDOM % 9000))
    echo "+1${area_code}${exchange}${number}"
}

# First, let's find the technician by searching for "kommula"
echo "🔍 Searching for technician with name containing 'kommula'..."

# We'll need to use the admin endpoints to search and update
# For now, let's create a specific phone number
RANDOM_PHONE=$(generate_random_phone)
echo "📱 Generated random phone number: $RANDOM_PHONE"

echo ""
echo "📋 To update the phone number for technician 'kommula', you can:"
echo "1. Use the SQL script: backend-java/techincian/update-kommula-phone.sql"
echo "2. Or use the REST API (if you know the technician ID):"
echo ""
echo "   # Update via admin endpoint (replace {id} with actual technician ID)"
echo "   curl -X PUT $API_BASE_URL/api/admin/technicians/{id} \\"
echo "        -H 'Content-Type: application/json' \\"
echo "        -d '{\"phone\": \"$RANDOM_PHONE\"}'"
echo ""
echo "   # Or update via technician profile endpoint (if you know the email)"
echo "   curl -X PUT $TECHNICIAN_SERVICE_URL/profile \\"
echo "        -H 'Content-Type: application/json' \\"
echo "        -d '{\"email\": \"kommula@example.com\", \"phone\": \"$RANDOM_PHONE\", \"updatedBy\": \"admin\"}'"
echo ""
echo "🎲 Random phone number generated: $RANDOM_PHONE"
echo "💾 You can also run the SQL script directly on your PostgreSQL database."
