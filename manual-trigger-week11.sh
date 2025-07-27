#!/bin/bash

# 🔥 WEEK 11 MANUAL ATTENDANCE TRIGGER SCRIPT
# This script manually triggers attendance for completed videos in Week 11

echo "🔥 WEEK 11 MANUAL ATTENDANCE TRIGGER"
echo "====================================="

# Configuration
BACKEND_URL="http://localhost:3000"
VIDEO1_ID="b4283028-cc52-42c9-8b7c-f30367deafd6"  # ddasd23
VIDEO2_ID="281b7411-49a3-4ffb-9d0f-8940b525047a"  # gretw2341
STUDENT_ID="407bbc2d-3f5a-4314-ab68-26cdfcf15192"  # munir
COURSE_ID="2024ece7-edc2-4f75-bdd2-e605512f4ac7"  # Algoritma

# Note: You need to replace YOUR_LECTURER_TOKEN with actual lecturer JWT token
# Get this from browser dev tools or login API response
LECTURER_TOKEN="YOUR_LECTURER_TOKEN"

if [ "$LECTURER_TOKEN" = "YOUR_LECTURER_TOKEN" ]; then
    echo "❌ ERROR: Please update LECTURER_TOKEN in script with actual JWT token"
    echo "   Get JWT token from:"
    echo "   1. Login as lecturer in browser"
    echo "   2. Open dev tools -> Application -> Local Storage"
    echo "   3. Find 'token' or similar key"
    echo "   4. Copy the JWT token value"
    echo ""
    exit 1
fi

echo "📊 Step 1: Check current attendance status..."
echo ""

# Check attendance status for both videos
echo "🔍 Video 1 (ddasd23) attendance status:"
curl -s -X GET "$BACKEND_URL/api/video-progress/material/$VIDEO1_ID/attendance-status" \
  -H "Authorization: Bearer $LECTURER_TOKEN" \
  -H "Content-Type: application/json" | jq '.'

echo ""
echo "🔍 Video 2 (gretw2341) attendance status:"
curl -s -X GET "$BACKEND_URL/api/video-progress/material/$VIDEO2_ID/attendance-status" \
  -H "Authorization: Bearer $LECTURER_TOKEN" \
  -H "Content-Type: application/json" | jq '.'

echo ""
echo "📊 Step 2: Debug weekly completion for student..."
echo ""

# Debug weekly completion
echo "🔍 Week 11 completion debug for student:"
curl -s -X GET "$BACKEND_URL/api/video-progress/debug/student/$STUDENT_ID/course/$COURSE_ID/week/11" \
  -H "Authorization: Bearer $LECTURER_TOKEN" \
  -H "Content-Type: application/json" | jq '.'

echo ""
echo "📊 Step 3: Manual trigger attendance for both videos..."
echo ""

# Trigger attendance for video 1
echo "🔥 Triggering attendance for Video 1 (ddasd23):"
RESULT1=$(curl -s -X POST "$BACKEND_URL/api/video-progress/material/$VIDEO1_ID/trigger-attendance" \
  -H "Authorization: Bearer $LECTURER_TOKEN" \
  -H "Content-Type: application/json")
echo "$RESULT1" | jq '.'

echo ""

# Trigger attendance for video 2
echo "🔥 Triggering attendance for Video 2 (gretw2341):"
RESULT2=$(curl -s -X POST "$BACKEND_URL/api/video-progress/material/$VIDEO2_ID/trigger-attendance" \
  -H "Authorization: Bearer $LECTURER_TOKEN" \
  -H "Content-Type: application/json")
echo "$RESULT2" | jq '.'

echo ""
echo "📊 Step 4: Verify attendance was triggered..."
echo ""

# Wait a moment for database updates
sleep 2

# Check attendance status again
echo "✅ Video 1 (ddasd23) attendance status after trigger:"
curl -s -X GET "$BACKEND_URL/api/video-progress/material/$VIDEO1_ID/attendance-status" \
  -H "Authorization: Bearer $LECTURER_TOKEN" \
  -H "Content-Type: application/json" | jq '.'

echo ""
echo "✅ Video 2 (gretw2341) attendance status after trigger:"
curl -s -X GET "$BACKEND_URL/api/video-progress/material/$VIDEO2_ID/attendance-status" \
  -H "Authorization: Bearer $LECTURER_TOKEN" \
  -H "Content-Type: application/json" | jq '.'

echo ""
echo "📊 Step 5: Check weekly completion status after trigger..."
echo ""

# Check weekly completion again
echo "✅ Week 11 completion status after trigger:"
curl -s -X GET "$BACKEND_URL/api/video-progress/debug/student/$STUDENT_ID/course/$COURSE_ID/week/11" \
  -H "Authorization: Bearer $LECTURER_TOKEN" \
  -H "Content-Type: application/json" | jq '.'

echo ""
echo "🎉 MANUAL TRIGGER COMPLETED!"
echo "=========================="
echo ""
echo "Next steps:"
echo "1. Check if attendance was created in the attendance dashboard"
echo "2. Verify hasTriggeredAttendance: true for both videos"
echo "3. Test new video completion to ensure automatic triggering works"
echo ""
echo "Expected result:"
echo "- Both videos should have attendanceTriggered > 0"
echo "- Week 11 should show canTriggerAttendance: true"
echo "- Student should have attendance record for week 11"
