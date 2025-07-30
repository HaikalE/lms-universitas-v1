#!/bin/bash

# Fix attendance trigger for video material
MATERIAL_ID="e2915fc2-9345-4188-a6ba-484e7294ee42"

echo "🔧 Fixing attendance trigger for video material..."
echo "📹 Material ID: $MATERIAL_ID"

# First, check if backend is running
if ! curl -s http://localhost:3000/health > /dev/null; then
    echo "❌ Backend is not running on port 3000"
    echo "🚀 Starting backend..."
    cd ../backend
    npm run start:dev &
    sleep 10
fi

# Update the material via API (if you have authentication token)
echo "🔄 Updating material via direct database query..."

# Connect to local postgres and run the fix
export PGPASSWORD=postgres
psql -h localhost -U postgres -d lms_db << EOF
-- Enable attendance trigger for the video
UPDATE course_materials 
SET 
  "isAttendanceTrigger" = true,
  "attendanceThreshold" = 80,
  "updatedAt" = NOW()
WHERE id = '$MATERIAL_ID';

-- Check the update
SELECT 
  id,
  title,
  type,
  "isAttendanceTrigger",
  "attendanceThreshold"
FROM course_materials 
WHERE id = '$MATERIAL_ID';

-- Now manually trigger attendance for the completed video
-- Get student who completed the video
INSERT INTO attendances (
  id,
  "studentId",
  "courseId", 
  "triggerMaterialId",
  "attendanceDate",
  status,
  "attendanceType",
  "submittedAt",
  notes,
  metadata,
  "createdAt",
  "updatedAt"
)
SELECT 
  gen_random_uuid(),
  vp."studentId",
  cm."courseId",
  vp."materialId",
  DATE(vp."completedAt"),
  'auto_present',
  'video_completion',
  vp."completedAt",
  'Auto-submitted via video completion (100.0%)',
  '{"videoProgress": 100, "manualFix": true}',
  NOW(),
  NOW()
FROM video_progress vp
JOIN course_materials cm ON vp."materialId" = cm.id
WHERE vp."materialId" = '$MATERIAL_ID' 
  AND vp."isCompleted" = true
  AND NOT EXISTS (
    SELECT 1 FROM attendances a 
    WHERE a."studentId" = vp."studentId" 
      AND a."courseId" = cm."courseId"
      AND DATE(a."attendanceDate") = DATE(vp."completedAt")
  )
ON CONFLICT DO NOTHING;

-- Update video progress to mark attendance as triggered
UPDATE video_progress 
SET "hasTriggeredAttendance" = true
WHERE "materialId" = '$MATERIAL_ID' AND "isCompleted" = true;

-- Verify results
SELECT 'Video Material Updated:' as result;
SELECT id, title, "isAttendanceTrigger" FROM course_materials WHERE id = '$MATERIAL_ID';

SELECT 'Attendance Records Created:' as result;
SELECT a.id, a."studentId", u."fullName", a.status, a."attendanceDate" 
FROM attendances a
JOIN users u ON a."studentId" = u.id
WHERE a."triggerMaterialId" = '$MATERIAL_ID';

SELECT 'Video Progress Updated:' as result;
SELECT "studentId", "isCompleted", "hasTriggeredAttendance" 
FROM video_progress 
WHERE "materialId" = '$MATERIAL_ID';
EOF

echo "✅ Fix completed! Check the database output above."