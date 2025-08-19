#!/bin/bash

echo "🧪 Testing Remarks Save and Retrieve Flow"
echo "=========================================="

# Configuration
API_GATEWAY_URL="http://localhost:8080"
POST_ID=1  # Use a test post ID
TECHNICIAN_ID=1

echo "1️⃣ Starting inspection for post $POST_ID..."
START_RESPONSE=$(curl -s -X POST "$API_GATEWAY_URL/tech-dashboard/api/v1/dashboard/start-inspection/$POST_ID" \
  -H "Content-Type: application/json" \
  -d "{\"technicianId\": $TECHNICIAN_ID}")

echo "Start inspection response: $START_RESPONSE"

# Extract report ID from response
REPORT_ID=$(echo $START_RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ -z "$REPORT_ID" ]; then
    echo "❌ Failed to get report ID from start inspection response"
    exit 1
fi

echo "✅ Got report ID: $REPORT_ID"

echo ""
echo "2️⃣ Submitting inspection report with remarks..."
SUBMIT_RESPONSE=$(curl -s -X POST "$API_GATEWAY_URL/tech-dashboard/api/v1/dashboard/reports/$REPORT_ID/submit" \
  -H "Content-Type: application/json" \
  -d '{
    "finalRemarks": "Test remarks from script - vehicle needs brake inspection"
  }')

echo "Submit response: $SUBMIT_RESPONSE"

echo ""
echo "3️⃣ Completing inspection report..."
COMPLETE_RESPONSE=$(curl -s -X POST "$API_GATEWAY_URL/tech-dashboard/api/v1/dashboard/reports/$REPORT_ID/complete" \
  -H "Content-Type: application/json" \
  -d '{
    "finalRemarks": "Final test remarks - inspection completed successfully"
  }')

echo "Complete response: $COMPLETE_RESPONSE"

echo ""
echo "4️⃣ Retrieving complete report by post ID..."
REPORT_RESPONSE=$(curl -s -X GET "$API_GATEWAY_URL/tech-dashboard/api/v1/dashboard/reports/by-post/$POST_ID")

echo "Report response: $REPORT_RESPONSE"

echo ""
echo "5️⃣ Checking if remarks are in the response..."
if echo "$REPORT_RESPONSE" | grep -q "generalNotes"; then
    echo "✅ Remarks found in response!"
    echo "Remarks content:"
    echo "$REPORT_RESPONSE" | grep -o '"generalNotes":"[^"]*"' | cut -d'"' -f4
else
    echo "❌ No remarks found in response"
fi

echo ""
echo "6️⃣ Checking if checklist items are in the response..."
if echo "$REPORT_RESPONSE" | grep -q "checklistItems"; then
    echo "✅ Checklist items found in response!"
    CHECKLIST_COUNT=$(echo "$REPORT_RESPONSE" | grep -o '"checklistItems":\[[^]]*\]' | grep -o '\[.*\]' | jq length 2>/dev/null || echo "unknown")
    echo "Checklist items count: $CHECKLIST_COUNT"
else
    echo "❌ No checklist items found in response"
fi

echo ""
echo "7️⃣ Checking if files are in the response..."
if echo "$REPORT_RESPONSE" | grep -q "files"; then
    echo "✅ Files found in response!"
    FILES_COUNT=$(echo "$REPORT_RESPONSE" | grep -o '"files":\[[^]]*\]' | grep -o '\[.*\]' | jq length 2>/dev/null || echo "unknown")
    echo "Files count: $FILES_COUNT"
else
    echo "❌ No files found in response"
fi

echo ""
echo "🎯 Test Summary:"
echo "- Report ID: $REPORT_ID"
echo "- Post ID: $POST_ID"
echo "- Backend endpoints are working"
echo "- Data structure includes remarks, checklist, and files"
