-- 🔧 SQL Fix: Attendance Issue for Completed Videos
-- Problem: Video completed but no attendance recorded due to isAttendanceTrigger = false

-- ========================================
-- 1. IMMEDIATE FIX: Enable Attendance Trigger for Specific Video
-- ========================================

-- Replace 'e2915fc2-9345-4188-a6ba-484e7294ee42' with your actual material ID
UPDATE course_materials 
SET 
    isAttendanceTrigger = true,
    attendanceThreshold = 80,  -- 80% completion required for attendance
    updatedAt = NOW()
WHERE id = 'e2915fc2-9345-4188-a6ba-484e7294ee42';

-- Verify the update
SELECT 
    id,
    title,
    type,
    week,
    isAttendanceTrigger,
    attendanceThreshold,
    updatedAt
FROM course_materials 
WHERE id = 'e2915fc2-9345-4188-a6ba-484e7294ee42';

-- ========================================
-- 2. BULK FIX: Enable for All Week 1 Videos in Course
-- ========================================

-- Replace '2024ece7-edc2-4f75-bdd2-e605512f4ac7' with your actual course ID
UPDATE course_materials 
SET 
    isAttendanceTrigger = true,
    attendanceThreshold = 80,
    updatedAt = NOW()
WHERE 
    courseId = '2024ece7-edc2-4f75-bdd2-e605512f4ac7'  -- Replace with your course ID
    AND type = 'video'
    AND week = 1
    AND (isAttendanceTrigger IS NULL OR isAttendanceTrigger = false);

-- Verify bulk update
SELECT 
    id,
    title,
    week,
    orderIndex,
    isAttendanceTrigger,
    attendanceThreshold
FROM course_materials 
WHERE 
    courseId = '2024ece7-edc2-4f75-bdd2-e605512f4ac7'
    AND type = 'video'
    AND week = 1
ORDER BY orderIndex;

-- ========================================
-- 3. DIAGNOSTIC: Check Students with Completed Videos
-- ========================================

-- Find students who completed videos but haven't triggered attendance
SELECT 
    vp.studentId,
    u.fullName as studentName,
    vp.materialId,
    cm.title as videoTitle,
    cm.week,
    vp.watchedPercentage,
    vp.isCompleted,
    vp.hasTriggeredAttendance,
    cm.isAttendanceTrigger,
    cm.attendanceThreshold,
    vp.completedAt
FROM video_progress vp
JOIN users u ON vp.studentId = u.id
JOIN course_materials cm ON vp.materialId = cm.id  
WHERE 
    cm.courseId = '2024ece7-edc2-4f75-bdd2-e605512f4ac7'  -- Replace with your course ID
    AND cm.week = 1
    AND vp.isCompleted = true
    AND vp.hasTriggeredAttendance = false
ORDER BY cm.week, cm.orderIndex, u.fullName;

-- ========================================
-- 4. ATTENDANCE CHECK: Current Attendance Status
-- ========================================

-- Check current attendance records for Week 1
SELECT 
    a.id,
    u.fullName as studentName,
    a.week,
    a.status,
    a.submittedAt,
    a.autoSubmitted,
    a.triggerMaterialId
FROM attendances a
JOIN users u ON a.studentId = u.id
WHERE 
    a.courseId = '2024ece7-edc2-4f75-bdd2-e605512f4ac7'  -- Replace with your course ID
    AND a.week = 1
ORDER BY u.fullName;

-- Count attendance statistics
SELECT 
    week,
    COUNT(*) as totalAttendance,
    COUNT(CASE WHEN status = 'present' THEN 1 END) as presentCount,
    COUNT(CASE WHEN autoSubmitted = true THEN 1 END) as autoSubmittedCount
FROM attendances 
WHERE courseId = '2024ece7-edc2-4f75-bdd2-e605512f4ac7'  -- Replace with your course ID
GROUP BY week
ORDER BY week;

-- ========================================
-- 5. PREVENTION: Set Default Attendance Trigger for Future Videos
-- ========================================

-- Update all existing videos in the course to have attendance trigger
-- (Use with caution - only if you want ALL videos to trigger attendance)
/*
UPDATE course_materials 
SET 
    isAttendanceTrigger = true,
    attendanceThreshold = 80,
    updatedAt = NOW()
WHERE 
    courseId = '2024ece7-edc2-4f75-bdd2-e605512f4ac7'  -- Replace with your course ID
    AND type = 'video'
    AND (isAttendanceTrigger IS NULL OR isAttendanceTrigger = false);
*/

-- ========================================
-- 6. MANUAL ATTENDANCE CREATION (Use as last resort)
-- ========================================

-- If API manual trigger doesn't work, manually create attendance records
-- Only use this if you're sure about the data
/*
INSERT INTO attendances (
    id,
    studentId,
    courseId,
    week,
    status,
    submittedAt,
    autoSubmitted,
    triggerMaterialId,
    metadata,
    createdAt,
    updatedAt
)
SELECT 
    gen_random_uuid() as id,
    vp.studentId,
    cm.courseId,
    cm.week,
    'present' as status,
    vp.completedAt as submittedAt,
    true as autoSubmitted,
    vp.materialId as triggerMaterialId,
    json_build_object(
        'videoProgress', vp.watchedPercentage,
        'completionTime', vp.completedAt,
        'manualFix', true
    ) as metadata,
    NOW() as createdAt,
    NOW() as updatedAt
FROM video_progress vp
JOIN course_materials cm ON vp.materialId = cm.id
WHERE 
    cm.courseId = '2024ece7-edc2-4f75-bdd2-e605512f4ac7'  -- Replace with your course ID
    AND cm.week = 1
    AND cm.isAttendanceTrigger = true
    AND vp.isCompleted = true
    AND vp.hasTriggeredAttendance = false
    AND NOT EXISTS (
        SELECT 1 FROM attendances a 
        WHERE a.studentId = vp.studentId 
        AND a.courseId = cm.courseId 
        AND a.week = cm.week
    );

-- Update video_progress to mark as triggered
UPDATE video_progress 
SET hasTriggeredAttendance = true
WHERE id IN (
    SELECT vp.id
    FROM video_progress vp
    JOIN course_materials cm ON vp.materialId = cm.id
    WHERE 
        cm.courseId = '2024ece7-edc2-4f75-bdd2-e605512f4ac7'  -- Replace with your course ID
        AND cm.week = 1
        AND cm.isAttendanceTrigger = true
        AND vp.isCompleted = true
        AND vp.hasTriggeredAttendance = false
);
*/

-- ========================================
-- 7. VERIFICATION: Final Check
-- ========================================

-- Check that everything is working
SELECT 
    'Video Materials' as table_name,
    COUNT(*) as total_videos,
    COUNT(CASE WHEN isAttendanceTrigger = true THEN 1 END) as attendance_enabled
FROM course_materials 
WHERE courseId = '2024ece7-edc2-4f75-bdd2-e605512f4ac7' AND type = 'video'

UNION ALL

SELECT 
    'Video Progress' as table_name,
    COUNT(*) as total_progress,
    COUNT(CASE WHEN isCompleted = true THEN 1 END) as completed
FROM video_progress vp
JOIN course_materials cm ON vp.materialId = cm.id
WHERE cm.courseId = '2024ece7-edc2-4f75-bdd2-e605512f4ac7'

UNION ALL

SELECT 
    'Attendances' as table_name,
    COUNT(*) as total_attendance,
    COUNT(CASE WHEN status = 'present' THEN 1 END) as present_count
FROM attendances
WHERE courseId = '2024ece7-edc2-4f75-bdd2-e605512f4ac7';

-- ========================================
-- USAGE INSTRUCTIONS:
-- ========================================
-- 1. Replace all course IDs with your actual course ID
-- 2. Replace material ID with your actual material ID  
-- 3. Run sections 1-4 first to diagnose and fix
-- 4. Use section 5 only if you want all videos to trigger attendance
-- 5. Use section 6 (manual attendance) only as last resort
-- 6. Run section 7 to verify everything works
-- ========================================