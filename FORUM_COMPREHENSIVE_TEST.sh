#!/bin/bash

# 🧪 COMPREHENSIVE FORUM TESTING SCRIPT
# This script tests all forum functionality after the critical fixes

echo "🚀 Starting Comprehensive Forum Testing..."
echo "============================================="

# Configuration
BASE_URL="http://localhost:3000"
FRONTEND_URL="http://localhost:3001"
POST_ID="9ef49fa6-47c4-4829-9c45-af53a888f2c0"
TOKEN="YOUR_AUTH_TOKEN_HERE"  # Replace with actual token

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to test API endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    local data=$4
    
    echo -e "\n${BLUE}🔍 Testing: $description${NC}"
    echo "   Method: $method"
    echo "   Endpoint: $endpoint"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" \
            "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" \
            -X $method \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$BASE_URL$endpoint")
    fi
    
    # Extract HTTP status code (last line)
    http_code=$(echo "$response" | tail -n1)
    # Extract response body (all but last line)
    response_body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo -e "   ${GREEN}✅ SUCCESS ($http_code)${NC}"
        echo "   Response: $(echo "$response_body" | jq -r '.message // .success // "Success"' 2>/dev/null || echo "OK")"
        return 0
    else
        echo -e "   ${RED}❌ FAILED ($http_code)${NC}"
        echo "   Error: $(echo "$response_body" | jq -r '.message // .error // "Unknown error"' 2>/dev/null || echo "$response_body")"
        return 1
    fi
}

# Function to test frontend functionality
test_frontend() {
    echo -e "\n${BLUE}🖥️  Testing Frontend Forum Page${NC}"
    
    # Check if frontend is running
    if curl -s "$FRONTEND_URL" > /dev/null; then
        echo -e "   ${GREEN}✅ Frontend is running${NC}"
        
        # Check specific forum page
        if curl -s "$FRONTEND_URL/forums/$POST_ID" > /dev/null; then
            echo -e "   ${GREEN}✅ Forum detail page accessible${NC}"
            echo -e "   ${YELLOW}📝 Please manually verify:${NC}"
            echo "      - Replies are displayed (not 'Belum ada balasan')"
            echo "      - Reply count shows correct number"
            echo "      - Sort functionality works"
            echo "      - Like functionality works"
            echo "      - Reply creation works"
        else
            echo -e "   ${RED}❌ Forum detail page not accessible${NC}"
        fi
    else
        echo -e "   ${RED}❌ Frontend not running on $FRONTEND_URL${NC}"
    fi
}

# Function to check database
check_database() {
    echo -e "\n${BLUE}🗄️  Database Verification${NC}"
    echo "   Please run these SQL queries manually to verify:"
    echo ""
    echo "   1. Check if forum_post_likes table exists:"
    echo "      SELECT * FROM information_schema.tables WHERE table_name = 'forum_post_likes';"
    echo ""
    echo "   2. Check replies for the test post:"
    echo "      SELECT id, title, content, parentId, repliesCount FROM forum_posts WHERE parentId = '$POST_ID';"
    echo ""
    echo "   3. Check main post reply count:"
    echo "      SELECT id, title, repliesCount FROM forum_posts WHERE id = '$POST_ID';"
    echo ""
    echo "   4. Check likes functionality:"
    echo "      SELECT * FROM forum_post_likes LIMIT 5;"
}

# Main testing sequence
echo -e "\n${YELLOW}🔧 STEP 1: Backend API Testing${NC}"
echo "=================================="

# Test 1: Get single forum post
test_endpoint "GET" "/forums/$POST_ID" "Get forum post details"

# Test 2: Get forum replies (THE CRITICAL FIX)
test_endpoint "GET" "/forums/$POST_ID/replies" "Get forum replies"

# Test 3: Get forum replies with sort parameter
test_endpoint "GET" "/forums/$POST_ID/replies?sort=latest" "Get forum replies (sorted by latest)"

# Test 4: Create a test reply
test_reply_data='{
    "content": "<p>Test reply from automated testing script - $(date)</p>"
}'
test_endpoint "POST" "/forums/$POST_ID/replies" "Create new reply" "$test_reply_data"

# Test 5: Mark post as viewed
test_endpoint "POST" "/forums/$POST_ID/view" "Mark post as viewed"

# Test 6: Toggle like on post
test_endpoint "POST" "/forums/$POST_ID/like" "Toggle like on post"

echo -e "\n${YELLOW}🔧 STEP 2: Frontend Testing${NC}"
echo "=============================="
test_frontend

echo -e "\n${YELLOW}🔧 STEP 3: Database Verification${NC}"
echo "=================================="
check_database

echo -e "\n${YELLOW}🔧 STEP 4: Manual Testing Checklist${NC}"
echo "====================================="
echo "Please manually verify the following:"
echo ""
echo "1. 🌐 Open: $FRONTEND_URL/forums/$POST_ID"
echo "2. 👀 Check: Replies section shows actual replies, not 'Belum ada balasan'"
echo "3. 🔢 Verify: Reply counter shows correct number (should match database)"
echo "4. 🔄 Test: Sort dropdown (Terlama/Terbaru/Terpopuler) works"
echo "5. ➕ Test: Create new reply works and updates counter immediately"
echo "6. ❤️  Test: Like functionality works on both posts and replies"
echo "7. 📝 Test: Edit/Delete reply functionality works (if user owns reply)"
echo "8. 🏆 Test: Mark as answer functionality works (if user owns post)"
echo ""

echo -e "\n${YELLOW}🔧 STEP 5: Browser Console Logs${NC}"
echo "================================="
echo "Open browser developer tools and check console for:"
echo ""
echo "Expected logs when loading forum page:"
echo "  🔍 FRONTEND: Fetching forum post details for ID: $POST_ID"
echo "  ✅ FRONTEND: Forum post fetched: {...}"
echo "  🔍 FRONTEND: Fetching replies for post: $POST_ID"
echo "  📊 FRONTEND: Sort by: oldest"
echo "  ✅ FRONTEND: Raw replies response: {...}"
echo "  📝 FRONTEND: Using response.data format"
echo "  📝 FRONTEND: Processed X replies"
echo ""

echo -e "\n${YELLOW}🔧 STEP 6: Performance & Load Testing${NC}"
echo "======================================"
echo "For production verification:"
echo ""
echo "1. Test with multiple concurrent users"
echo "2. Test with large number of replies (100+)"
echo "3. Test pagination functionality"
echo "4. Test with slow network conditions"
echo "5. Test browser refresh and cache behavior"
echo ""

echo -e "\n${YELLOW}🔧 STEP 7: Error Scenarios Testing${NC}"
echo "=================================="
echo "Test these error scenarios:"
echo ""
echo "1. Non-existent post ID"
echo "2. Unauthorized access"
echo "3. Network connectivity issues"
echo "4. Invalid reply content"
echo "5. Server downtime scenarios"
echo ""

# Summary
echo -e "\n${GREEN}🎉 TESTING COMPLETE!${NC}"
echo "==================="
echo ""
echo -e "${BLUE}📋 SUMMARY OF FIXES APPLIED:${NC}"
echo "✅ Backend: Enhanced getPostReplies method with proper data structure"
echo "✅ Backend: Fixed API response format consistency"
echo "✅ Frontend: Improved error handling and response processing"
echo "✅ Frontend: Enhanced logging for debugging"
echo "✅ Service: Updated forum service with comprehensive logging"
echo "✅ Database: Added forum_post_likes table with triggers"
echo "✅ Types: Ensured TypeScript consistency"
echo ""

if [ "$1" = "--auto-test" ]; then
    echo -e "${YELLOW}⚠️  IMPORTANT:${NC}"
    echo "Replace 'YOUR_AUTH_TOKEN_HERE' with actual auth token to run API tests"
    echo "Make sure both backend (port 3000) and frontend (port 3001) are running"
fi

echo -e "\n${BLUE}🔗 USEFUL COMMANDS:${NC}"
echo "==================="
echo "Start backend:  cd backend && npm run start:dev"
echo "Start frontend: cd frontend && npm start"
echo "Run this test:  bash FORUM_COMPREHENSIVE_TEST.sh"
echo "View logs:      tail -f backend/logs/app.log (if logging configured)"
echo ""

echo -e "${GREEN}✨ Happy Testing! ✨${NC}"