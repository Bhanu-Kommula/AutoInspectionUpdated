#!/bin/bash

# Dealer Service Endpoint Test Script
# Make sure the dealer service is running on port 8080

BASE_URL="http://localhost:8080/api/dealers"

echo "=== Testing Dealer Service Endpoints ==="
echo ""

# Test 1: Register a new dealer
echo "1. Testing dealer registration..."
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Dealer",
    "email": "test@dealer.com",
    "password": "password123",
    "location": "Test City",
    "zipcode": "12345",
    "phone": "1234567890"
  }')

echo "Registration Response: $REGISTER_RESPONSE"
echo ""

# Test 2: Get dealer statistics
echo "2. Testing dealer statistics..."
STATS_RESPONSE=$(curl -s -X GET "$BASE_URL/statistics")
echo "Statistics Response: $STATS_RESPONSE"
echo ""

# Test 3: Get all dealers (paginated)
echo "3. Testing dealer listing..."
LIST_RESPONSE=$(curl -s -X GET "$BASE_URL/list?page=0&size=10")
echo "List Response: $LIST_RESPONSE"
echo ""

# Test 4: Search dealers
echo "4. Testing dealer search..."
SEARCH_RESPONSE=$(curl -s -X GET "$BASE_URL/search?name=Test&status=ACTIVE")
echo "Search Response: $SEARCH_RESPONSE"
echo ""

# Test 5: Get dealers by status
echo "5. Testing status-based filtering..."
STATUS_RESPONSE=$(curl -s -X GET "$BASE_URL/status/ACTIVE")
echo "Status Filter Response: $STATUS_RESPONSE"
echo ""

# Test 6: Get dealers by location
echo "6. Testing location-based filtering..."
LOCATION_RESPONSE=$(curl -s -X GET "$BASE_URL/location/Test")
echo "Location Filter Response: $LOCATION_RESPONSE"
echo ""

echo "=== Endpoint Testing Complete ==="
echo ""
echo "Note: Some endpoints may return empty results if no data exists"
echo "Check the dealer service logs for any errors"
