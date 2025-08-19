#!/bin/bash

# Tech Dashboard Admin Endpoints Test Script
# Tests all admin endpoints to ensure they're working correctly

BASE_URL="http://localhost:8085/api/v1/admin/dashboard"
ADMIN_EMAIL="admin@example.com"

echo "🔧 Testing Tech Dashboard Admin Endpoints"
echo "=========================================="
echo "Base URL: $BASE_URL"
echo "Admin Email: $ADMIN_EMAIL"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to test endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4
    
    echo -n "Testing $description... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$BASE_URL$endpoint")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo -e "${GREEN}✅ PASS${NC} (HTTP $http_code)"
    else
        echo -e "${RED}❌ FAIL${NC} (HTTP $http_code)"
        echo "Response: $body"
    fi
}

# Test 1: Dashboard Overview
echo "📊 Testing Dashboard Overview & Analytics"
echo "----------------------------------------"
test_endpoint "GET" "/overview" "" "Dashboard Overview"
test_endpoint "GET" "/statistics" "" "System Statistics"
echo ""

# Test 2: Inspection Reports Management
echo "🔍 Testing Inspection Reports Management"
echo "---------------------------------------"
test_endpoint "GET" "/reports?page=0&size=5" "" "Get All Reports (Paginated)"
test_endpoint "GET" "/reports?status=COMPLETED" "" "Get Reports by Status"
test_endpoint "GET" "/reports/1" "" "Get Report by ID"

# Test 3: Checklist Management
echo "✅ Testing Checklist Management"
echo "------------------------------"
test_endpoint "GET" "/checklist?page=0&size=10" "" "Get All Checklist Items"
test_endpoint "GET" "/checklist?reportId=1" "" "Get Checklist by Report ID"

# Test 4: File Management
echo "📁 Testing File Management"
echo "--------------------------"
test_endpoint "GET" "/files?page=0&size=10" "" "Get All Files"
test_endpoint "GET" "/files?reportId=1" "" "Get Files by Report ID"

# Test 5: Technician Performance
echo "👨‍🔧 Testing Technician Performance"
echo "---------------------------------"
test_endpoint "GET" "/technicians/performance" "" "Get Performance Metrics"
test_endpoint "GET" "/technicians/top-performers?limit=5" "" "Get Top Performers"

# Test 6: System Health
echo "🏥 Testing System Health"
echo "-----------------------"
test_endpoint "GET" "/health" "" "System Health Check"

# Test 7: Data Export
echo "📤 Testing Data Export"
echo "---------------------"
test_endpoint "GET" "/export/inspections?format=json" "" "Export Inspection Data"
test_endpoint "GET" "/export/technician-performance?format=json" "" "Export Performance Data"

echo ""
echo "🎯 Testing Complete!"
echo "==================="
echo ""
echo "Next Steps:"
echo "1. Review any failed tests above"
echo "2. Check server logs for detailed error information"
echo "3. Verify database connectivity and data"
echo "4. Test with actual data in the system"
echo ""
echo "For manual testing, use the examples in ADMIN_ENDPOINTS_SUMMARY.md"
