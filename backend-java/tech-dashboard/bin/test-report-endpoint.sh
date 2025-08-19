#!/bin/bash

# Test script for the new report by post ID endpoint
# This script tests the new /api/v1/dashboard/reports/by-post/{postId} endpoint

echo "Testing the new report by post ID endpoint..."
echo "=============================================="

# Test with a sample post ID (you can change this to match your test data)
POST_ID=1
BASE_URL="http://localhost:8080"

echo "Testing endpoint: ${BASE_URL}/api/v1/dashboard/reports/by-post/${POST_ID}"
echo ""

# Test the endpoint
curl -X GET \
  "${BASE_URL}/api/v1/dashboard/reports/by-post/${POST_ID}" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -w "\nHTTP Status: %{http_code}\n" \
  | jq '.' 2>/dev/null || echo "Response (raw):"

echo ""
echo "=============================================="
echo "Test completed. Check the response above."
echo ""
echo "Expected responses:"
echo "- 200 OK with report data if inspection report exists for the post"
echo "- 404 Not Found if no inspection report exists for the post"
echo "- 500 Internal Server Error if there's a server issue"
