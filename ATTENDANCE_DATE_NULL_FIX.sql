-- ✅ FIXED SQL: AttendanceDate Null Error (PostgreSQL Compatible)
-- Error: "attendance.attendanceDate.toISOString is not a function"
-- Fix: Corrected column names for PostgreSQL case sensitivity

-- ========================================
-- 🔍 STEP 1: DIAGNOSTIC (Check Column Names & Null Records)
-- ========================================

-- First, let's see the actual table structure
\d attendances;

-- Check for null attendance_date records (using snake_case)
SELECT 
    COUNT(*) as total_records,
    COUNT("attendanceDate") as valid_dates,
    COUNT(*) - COUNT("attendanceDate") as null_dates
FROM attendances;

-- Show problematic records (first 10)
SELECT 
    id,
    "studentId",
    "courseId", 
    "attendanceDate",
    "submittedAt",
    "createdAt",
    status
FROM attendances 
WHERE "attendanceDate" IS NULL
ORDER BY "createdAt" DESC
LIMIT 10;

-- ========================================
-- 🔧 STEP 2: IMMEDIATE FIX (Execute These in Order)
-- ========================================

-- Fix null dates using submittedAt as fallback
UPDATE attendances 
SET "attendanceDate" = DATE("submittedAt")
WHERE "attendanceDate" IS NULL 
  AND "submittedAt" IS NOT NULL;

-- Fix remaining null dates using createdAt as fallback  
UPDATE attendances 
SET "attendanceDate" = DATE("createdAt")
WHERE "attendanceDate" IS NULL 
  AND "createdAt" IS NOT NULL;

-- Fix any remaining null dates with current date
UPDATE attendances 
SET "attendanceDate" = CURRENT_DATE
WHERE "attendanceDate" IS NULL;

-- ========================================
-- 🎯 STEP 3: ENABLE ATTENDANCE TRIGGER FOR YOUR VIDEO
-- ========================================

-- Enable attendance trigger for your specific video
UPDATE course_materials 
SET 
    "isAttendanceTrigger" = true,
    "attendanceThreshold" = 80,
    "updatedAt" = NOW()
WHERE id = 'e2915fc2-9345-4188-a6ba-484e7294ee42';

-- Verify the video is now configured
SELECT 
    id,
    title,
    type,
    week,
    "isAttendanceTrigger",
    "attendanceThreshold"
FROM course_materials 
WHERE id = 'e2915fc2-9345-4188-a6ba-484e7294ee42';

-- ========================================
-- ✅ STEP 4: VERIFICATION (Check Everything Fixed)
-- ========================================

-- Should return 0 null dates
SELECT COUNT(*) as remaining_null_dates
FROM attendances 
WHERE "attendanceDate" IS NULL;

-- Check recent attendance records
SELECT 
    "attendanceDate",
    COUNT(*) as count,
    status
FROM attendances 
WHERE "attendanceDate" >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY "attendanceDate", status
ORDER BY "attendanceDate" DESC;

-- ========================================
-- 🚀 STEP 5: BULK ENABLE FOR WEEK 1 (Optional)
-- ========================================

-- Enable attendance trigger for ALL Week 1 videos in your course
UPDATE course_materials 
SET 
    "isAttendanceTrigger" = true,
    "attendanceThreshold" = 80,
    "updatedAt" = NOW()
WHERE 
    "courseId" = '2024ece7-edc2-4f75-bdd2-e605512f4ac7'  -- Your course ID
    AND type = 'video'
    AND week = 1
    AND ("isAttendanceTrigger" IS NULL OR "isAttendanceTrigger" = false);

-- Verify bulk update
SELECT 
    id,
    title,
    week,
    "orderIndex",
    "isAttendanceTrigger",
    "attendanceThreshold"
FROM course_materials 
WHERE 
    "courseId" = '2024ece7-edc2-4f75-bdd2-e605512f4ac7'
    AND type = 'video'
    AND week = 1
ORDER BY "orderIndex";

-- ========================================
-- 📊 STEP 6: DATA HEALTH CHECK
-- ========================================

-- Check attendance data quality
SELECT 
    'Total Attendances' as metric,
    COUNT(*) as value
FROM attendances

UNION ALL

SELECT 
    'Valid Attendance Dates' as metric,
    COUNT(*) as value
FROM attendances 
WHERE "attendanceDate" IS NOT NULL

UNION ALL

SELECT 
    'Auto Attendances' as metric,
    COUNT(*) as value
FROM attendances 
WHERE status = 'auto_present'

UNION ALL

SELECT 
    'Videos with Attendance Trigger' as metric,
    COUNT(*) as value
FROM course_materials 
WHERE type = 'video' AND "isAttendanceTrigger" = true;

-- Check for students who completed videos but no attendance
SELECT 
    vp."studentId",
    u."fullName",
    vp."materialId",
    cm.title as video_title,
    cm.week,
    vp."watchedPercentage",
    vp."isCompleted",
    vp."hasTriggeredAttendance",
    cm."isAttendanceTrigger"
FROM video_progress vp
JOIN users u ON vp."studentId" = u.id
JOIN course_materials cm ON vp."materialId" = cm.id  
WHERE 
    cm."courseId" = '2024ece7-edc2-4f75-bdd2-e605512f4ac7'
    AND cm.week = 1
    AND vp."isCompleted" = true
    AND vp."hasTriggeredAttendance" = false
    AND cm."isAttendanceTrigger" = true
ORDER BY cm.week, cm."orderIndex", u."fullName";

-- ========================================
-- 🔒 STEP 7: PREVENT FUTURE ISSUES (Optional)
-- ========================================

-- Add constraint to prevent null attendance dates in future
ALTER TABLE attendances 
ALTER COLUMN "attendanceDate" SET NOT NULL;

-- ========================================
-- 📋 USAGE INSTRUCTIONS:
-- ========================================
-- 1. Copy and paste EACH SECTION separately in pgAdmin or psql
-- 2. Execute Step 1 to check current state
-- 3. Execute Step 2 to fix null dates  
-- 4. Execute Step 3 to enable attendance trigger
-- 5. Execute Step 4 to verify everything is fixed
-- 6. Execute Step 5 if you want to enable all Week 1 videos
-- 7. Run Step 6 to check data health
-- 8. Restart your backend after running these queries
-- ========================================

-- ✅ EXPECTED RESULTS AFTER FIX:
-- - No more 500 errors in attendance API
-- - Students get attendance when completing videos  
-- - Attendance dashboard loads successfully
-- - Blue "Attendance Trigger" badge on videos
-- ========================================