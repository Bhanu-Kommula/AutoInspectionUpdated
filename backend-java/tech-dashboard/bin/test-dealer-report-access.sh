#!/bin/bash

echo "🧪 Testing Dealer Report Access"
echo "==============================="

# Configuration
API_GATEWAY_URL="http://localhost:8088"
POST_ID=1  # Use a test post ID

echo "1️⃣ Testing API Gateway access to tech-dashboard service..."
GATEWAY_HEALTH=$(curl -s -X GET "$API_GATEWAY_URL/health")

if [ $? -eq 0 ]; then
    echo "✅ API Gateway is accessible"
    echo "Gateway response: $GATEWAY_HEALTH"
else
    echo "❌ API Gateway is not accessible"
    exit 1
fi

echo ""
echo "2️⃣ Testing tech-dashboard service health..."
TECH_HEALTH=$(curl -s -X GET "$API_GATEWAY_URL/tech-dashboard/api/v1/dashboard/health")

if [ $? -eq 0 ]; then
    echo "✅ Tech-dashboard service is accessible through gateway"
    echo "Tech-dashboard response: $TECH_HEALTH"
else
    echo "❌ Tech-dashboard service is not accessible through gateway"
    echo "This might indicate a routing issue in the API gateway"
fi

echo ""
echo "3️⃣ Testing inspection report access by post ID..."
REPORT_RESPONSE=$(curl -s -X GET "$API_GATEWAY_URL/tech-dashboard/api/v1/dashboard/reports/by-post/$POST_ID")

if [ $? -eq 0 ]; then
    if echo "$REPORT_RESPONSE" | grep -q "success.*true"; then
        echo "✅ Inspection report endpoint is working"
        echo "Report found for post $POST_ID"
        
        # Check if report contains expected fields
        if echo "$REPORT_RESPONSE" | grep -q "generalNotes"; then
            echo "✅ Report contains remarks field"
        else
            echo "⚠️ Report does not contain remarks field"
        fi
        
        if echo "$REPORT_RESPONSE" | grep -q "checklistItems"; then
            echo "✅ Report contains checklist items"
        else
            echo "⚠️ Report does not contain checklist items"
        fi
        
        if echo "$REPORT_RESPONSE" | grep -q "files"; then
            echo "✅ Report contains files"
        else
            echo "⚠️ Report does not contain files"
        fi
        
    elif echo "$REPORT_RESPONSE" | grep -q "404"; then
        echo "ℹ️ No inspection report found for post $POST_ID (this is expected if no report exists)"
    else
        echo "❌ Unexpected response from inspection report endpoint"
        echo "Response: $REPORT_RESPONSE"
    fi
else
    echo "❌ Failed to access inspection report endpoint"
    echo "This might indicate a CORS or routing issue"
fi

echo ""
echo "4️⃣ Testing CORS headers..."
CORS_HEADERS=$(curl -s -I -X GET "$API_GATEWAY_URL/tech-dashboard/api/v1/dashboard/reports/by-post/$POST_ID" | grep -i "access-control")

if [ -n "$CORS_HEADERS" ]; then
    echo "✅ CORS headers are present"
    echo "CORS headers: $CORS_HEADERS"
else
    echo "⚠️ No CORS headers found (this might cause issues in browser)"
fi

echo ""
echo "🎯 Test Summary:"
echo "- API Gateway: $(if curl -s "$API_GATEWAY_URL/health" > /dev/null; then echo "✅ Working"; else echo "❌ Not working"; fi)"
echo "- Tech-dashboard service: $(if curl -s "$API_GATEWAY_URL/tech-dashboard/api/v1/dashboard/health" > /dev/null; then echo "✅ Working"; else echo "❌ Not working"; fi)"
echo "- Report endpoint: $(if curl -s "$API_GATEWAY_URL/tech-dashboard/api/v1/dashboard/reports/by-post/$POST_ID" > /dev/null; then echo "✅ Working"; else echo "❌ Not working"; fi)"
echo "- CORS headers: $(if curl -s -I "$API_GATEWAY_URL/tech-dashboard/api/v1/dashboard/reports/by-post/$POST_ID" | grep -i "access-control" > /dev/null; then echo "✅ Present"; else echo "⚠️ Missing"; fi)"

echo ""
echo "📋 Next Steps:"
echo "1. If all tests pass, the dealer frontend should be able to access reports"
echo "2. If CORS headers are missing, check the API gateway configuration"
echo "3. If tech-dashboard service is not accessible, check the gateway routing"
echo "4. Test the 'View Report' button in the dealer frontend with a completed post"
