-- 🔧 SQL Fix: AttendanceDate Null Error 
-- Error: "attendance.attendanceDate.toISOString is not a function"
-- Cause: Records with null attendanceDate in database

-- ========================================
-- 1. DIAGNOSTIC: Check for Null AttendanceDate Records
-- ========================================

-- Count records with null attendanceDate
SELECT 
    COUNT(*) as null_count,
    COUNT(CASE WHEN attendanceDate IS NOT NULL THEN 1 END) as valid_count
FROM attendances;

-- Show problematic records
SELECT 
    id,
    studentId,
    courseId,
    attendanceDate,
    submittedAt,
    createdAt,
    status
FROM attendances 
WHERE attendanceDate IS NULL
ORDER BY createdAt DESC
LIMIT 20;

-- ========================================
-- 2. IMMEDIATE FIX: Handle Null Dates
-- ========================================

-- Option A: Fix by using submittedAt as fallback
UPDATE attendances 
SET attendanceDate = DATE(submittedAt)
WHERE attendanceDate IS NULL 
  AND submittedAt IS NOT NULL;

-- Option B: Fix by using createdAt as fallback  
UPDATE attendances 
SET attendanceDate = DATE(createdAt)
WHERE attendanceDate IS NULL 
  AND createdAt IS NOT NULL
  AND submittedAt IS NULL;

-- Option C: Fix remaining records with today's date
UPDATE attendances 
SET attendanceDate = CURRENT_DATE
WHERE attendanceDate IS NULL;

-- ========================================
-- 3. VERIFICATION: Check Fix Results
-- ========================================

-- Verify no null dates remain
SELECT COUNT(*) as remaining_null_dates
FROM attendances 
WHERE attendanceDate IS NULL;

-- Check distribution of fixed dates
SELECT 
    DATE(attendanceDate) as attendance_date,
    COUNT(*) as count,
    status
FROM attendances 
WHERE DATE(attendanceDate) >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(attendanceDate), status
ORDER BY attendance_date DESC
LIMIT 20;

-- ========================================
-- 4. PREVENTION: Add Database Constraints
-- ========================================

-- Add NOT NULL constraint to prevent future null dates
-- Note: This will fail if there are still null records
ALTER TABLE attendances 
ALTER COLUMN attendanceDate SET NOT NULL;

-- Add check constraint to ensure valid dates
ALTER TABLE attendances 
ADD CONSTRAINT chk_valid_attendance_date 
CHECK (attendanceDate IS NOT NULL AND attendanceDate >= '2020-01-01');

-- ========================================
-- 5. CLEAN UP DUPLICATE RECORDS (Optional)
-- ========================================

-- Find potential duplicates (same student, course, date)
SELECT 
    studentId,
    courseId,
    attendanceDate,
    COUNT(*) as duplicate_count
FROM attendances
GROUP BY studentId, courseId, attendanceDate
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- Remove duplicates, keeping the latest record
WITH ranked_attendance AS (
    SELECT *,
           ROW_NUMBER() OVER (
               PARTITION BY studentId, courseId, attendanceDate 
               ORDER BY submittedAt DESC, createdAt DESC
           ) as rn
    FROM attendances
)
DELETE FROM attendances 
WHERE id IN (
    SELECT id 
    FROM ranked_attendance 
    WHERE rn > 1
);

-- ========================================
-- 6. ADVANCED: Fix Week Data Issues
-- ========================================

-- Update week numbers for attendance records based on material
UPDATE attendances a
SET metadata = jsonb_set(
    COALESCE(a.metadata, '{}'::jsonb),
    '{week}',
    to_jsonb(cm.week)
)
FROM course_materials cm
WHERE a.triggerMaterialId = cm.id
  AND cm.week IS NOT NULL
  AND (a.metadata IS NULL OR a.metadata->>'week' IS NULL);

-- ========================================
-- 7. MONITORING QUERIES
-- ========================================

-- Monitor attendance creation patterns
SELECT 
    DATE(createdAt) as creation_date,
    COUNT(*) as records_created,
    COUNT(CASE WHEN attendanceDate IS NULL THEN 1 END) as null_dates,
    COUNT(CASE WHEN status = 'auto_present' THEN 1 END) as auto_attendance
FROM attendances
WHERE createdAt >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(createdAt)
ORDER BY creation_date DESC;

-- Check data quality metrics
SELECT 
    'Total Records' as metric,
    COUNT(*) as value
FROM attendances

UNION ALL

SELECT 
    'Records with Valid Dates' as metric,
    COUNT(*) as value
FROM attendances 
WHERE attendanceDate IS NOT NULL

UNION ALL

SELECT 
    'Auto-Generated Attendance' as metric,
    COUNT(*) as value
FROM attendances 
WHERE status = 'auto_present'

UNION ALL

SELECT 
    'Records from Last 30 Days' as metric,
    COUNT(*) as value
FROM attendances 
WHERE createdAt >= CURRENT_DATE - INTERVAL '30 days';

-- ========================================
-- 8. BACKUP & RESTORE (Safety)
-- ========================================

-- Create backup table before major changes
CREATE TABLE attendances_backup AS 
SELECT * FROM attendances WHERE attendanceDate IS NULL;

-- Restore from backup if needed
-- INSERT INTO attendances SELECT * FROM attendances_backup;

-- ========================================
-- USAGE INSTRUCTIONS:
-- ========================================
-- 1. Run section 1 to diagnose the problem
-- 2. Run section 2 step by step to fix null dates
-- 3. Run section 3 to verify the fix
-- 4. Run section 4 to add constraints (optional)
-- 5. Run section 5 to clean duplicates (optional)
-- 6. Use section 7 for ongoing monitoring
-- ========================================

-- ========================================
-- EXPECTED RESULTS:
-- ========================================
-- Before fix: attendance.attendanceDate.toISOString() → Error
-- After fix:  attendance.attendanceDate.toISOString() → "2025-07-27"
-- API response: 200 OK instead of 500 Internal Server Error
-- ========================================