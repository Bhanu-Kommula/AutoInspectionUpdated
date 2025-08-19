#!/bin/bash

# Test Script for Inspection Data Saving
# This script tests if radio button data is correctly saved to the database

echo "=========================================="
echo "Testing Inspection Data Saving"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKEND_URL="http://localhost:8085/api/v1/dashboard"
GATEWAY_URL="http://localhost:8080/tech-dashboard/api/v1/dashboard"

echo -e "${BLUE}1. Testing Checklist Item Update${NC}"
echo "----------------------------------------"

# Test data for updating a checklist item
TEST_REPORT_ID=1
TEST_ITEM_ID=1

# Test updating a checklist item with radio button data
echo "Testing condition rating update..."
UPDATE_RESPONSE=$(curl -s -X PUT "${GATEWAY_URL}/reports/${TEST_REPORT_ID}/checklist/${TEST_ITEM_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "isChecked": true,
    "conditionRating": "EXCELLENT", 
    "workingStatus": "WORKING",
    "remarks": "Test update from script",
    "priorityLevel": "LOW"
  }')

echo "Update Response: $UPDATE_RESPONSE"

if [[ $UPDATE_RESPONSE == *"success"* ]]; then
    echo -e "${GREEN}✅ Checklist item update successful${NC}"
else
    echo -e "${RED}❌ Checklist item update failed${NC}"
    echo "Response: $UPDATE_RESPONSE"
fi

echo -e "${BLUE}2. Testing Bulk Update${NC}"
echo "----------------------------------------"

# Test bulk update with multiple items
BULK_UPDATE_RESPONSE=$(curl -s -X PUT "${GATEWAY_URL}/reports/${TEST_REPORT_ID}/checklist/bulk" \
  -H "Content-Type: application/json" \
  -d '{
    "updates": [
      {
        "itemId": 1,
        "isChecked": true,
        "conditionRating": "GOOD",
        "workingStatus": "WORKING",
        "remarks": "Bulk test 1"
      },
      {
        "itemId": 2,
        "isChecked": true,
        "conditionRating": "FAIR",
        "workingStatus": "NEEDS_REPAIR",
        "remarks": "Bulk test 2"
      }
    ]
  }')

echo "Bulk Update Response: $BULK_UPDATE_RESPONSE"

if [[ $BULK_UPDATE_RESPONSE == *"success"* ]]; then
    echo -e "${GREEN}✅ Bulk update successful${NC}"
else
    echo -e "${RED}❌ Bulk update failed${NC}"
    echo "Response: $BULK_UPDATE_RESPONSE"
fi

echo -e "${BLUE}3. Verifying Database Values${NC}"
echo "----------------------------------------"

# Check if the values were actually saved to database
echo "Checking database for saved values..."
# Note: This would need actual database connection to verify
echo "Manual verification needed: Check database for condition_rating and working_status values"

echo -e "${BLUE}4. Testing All Condition Values${NC}"
echo "----------------------------------------"

CONDITIONS=("EXCELLENT" "GOOD" "FAIR" "POOR" "FAILED")
WORKING_STATUSES=("WORKING" "NEEDS_REPAIR" "NOT_WORKING")

for condition in "${CONDITIONS[@]}"; do
    echo "Testing condition: $condition"
    RESPONSE=$(curl -s -X PUT "${GATEWAY_URL}/reports/${TEST_REPORT_ID}/checklist/${TEST_ITEM_ID}" \
      -H "Content-Type: application/json" \
      -d "{\"conditionRating\": \"$condition\", \"isChecked\": true}")
    
    if [[ $RESPONSE == *"success"* ]]; then
        echo -e "  ${GREEN}✅ $condition works${NC}"
    else
        echo -e "  ${RED}❌ $condition failed${NC}"
    fi
done

echo -e "${BLUE}5. Summary${NC}"
echo "----------------------------------------"
echo "Test completed. Check the following:"
echo "1. All condition ratings (EXCELLENT, GOOD, FAIR, POOR, FAILED) should work"
echo "2. All working statuses (WORKING, NEEDS_REPAIR, NOT_WORKING) should work"
echo "3. Database should contain actual values, not 0 or null"
echo "4. Frontend radio buttons should send correct enum values"
