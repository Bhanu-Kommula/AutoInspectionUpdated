#!/bin/bash

# Test script to verify the complete inspection report system
echo "🔍 Testing Complete Inspection Report System"
echo "=============================================="

# Configuration
API_BASE_URL="http://localhost:8084/tech-dashboard/api/v1/dashboard"
POSTS_API_URL="http://localhost:8083/api/v1"
TEST_POST_ID=1
TEST_TECHNICIAN_ID=1
TEST_REPORT_ID=1

echo ""
echo "📋 Test Configuration:"
echo "- API Base URL: $API_BASE_URL"
echo "- Posts API URL: $POSTS_API_URL"
echo "- Test Post ID: $TEST_POST_ID"
echo "- Test Technician ID: $TEST_TECHNICIAN_ID"
echo "- Test Report ID: $TEST_REPORT_ID"

echo ""
echo "🔍 1. Testing Database Connection..."
curl -s "$API_BASE_URL/health" | jq '.' || echo "❌ Health check failed"

echo ""
echo "🔍 2. Testing Get Report by Post ID..."
curl -s "$API_BASE_URL/reports/by-post/$TEST_POST_ID" | jq '.' || echo "❌ Get report by post ID failed"

echo ""
echo "🔍 3. Testing Get Report by Report ID..."
curl -s "$API_BASE_URL/reports/$TEST_REPORT_ID" | jq '.' || echo "❌ Get report by report ID failed"

echo ""
echo "🔍 4. Testing Get Checklist for Report..."
curl -s "$API_BASE_URL/reports/$TEST_REPORT_ID/checklist" | jq '.' || echo "❌ Get checklist failed"

echo ""
echo "🔍 5. Testing Get Files for Report..."
curl -s "$API_BASE_URL/reports/$TEST_REPORT_ID/files" | jq '.' || echo "❌ Get files failed"

echo ""
echo "🔍 6. Testing Dashboard Summary..."
curl -s "$API_BASE_URL/summary/$TEST_TECHNICIAN_ID" | jq '.' || echo "❌ Dashboard summary failed"

echo ""
echo "✅ Testing Complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Check if inspection_report_id is properly set in posts"
echo "2. Verify report status is SUBMITTED for completed posts"
echo "3. Test frontend view mode with real data"
echo "4. Check data format compatibility between backend and frontend"
