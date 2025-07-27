-- 🔥 CRITICAL DATABASE MIGRATION: Add week field to attendances table
-- This fixes the weekly attendance system mismatch

-- =====================================
-- PART 1: ADD WEEK COLUMN
-- =====================================

-- Add week column to attendances table
ALTER TABLE attendances 
ADD COLUMN week INTEGER;

-- Add comment for documentation
COMMENT ON COLUMN attendances.week IS 'Week number (1-16) for weekly attendance tracking';

-- =====================================
-- PART 2: ADD INDEXES FOR PERFORMANCE
-- =====================================

-- Index for weekly attendance queries (student + course + week)
CREATE INDEX IF NOT EXISTS idx_attendances_student_course_week 
ON attendances (studentId, courseId, week);

-- Index for course weekly reports
CREATE INDEX IF NOT EXISTS idx_attendances_course_week 
ON attendances (courseId, week);

-- Index for weekly attendance analytics
CREATE INDEX IF NOT EXISTS idx_attendances_week_status 
ON attendances (week, status);

-- =====================================
-- PART 3: BACKFILL EXISTING DATA
-- =====================================

-- Update existing records to set week based on triggerMaterial.week
UPDATE attendances 
SET week = cm.week
FROM course_materials cm
WHERE attendances.triggerMaterialId = cm.id 
  AND attendances.week IS NULL
  AND cm.week IS NOT NULL;

-- For records without triggerMaterial, try to derive week from date
-- This is a fallback - adjust logic based on your academic calendar
UPDATE attendances 
SET week = CASE 
  WHEN EXTRACT(week FROM attendanceDate) <= 16 THEN EXTRACT(week FROM attendanceDate)::INTEGER
  ELSE (EXTRACT(week FROM attendanceDate) % 16)::INTEGER + 1
END
WHERE week IS NULL
  AND attendanceDate IS NOT NULL;

-- =====================================
-- PART 4: UPDATE METADATA FOR WEEKLY TRACKING
-- =====================================

-- Add weeklyCompletion flag to existing auto-generated attendances
UPDATE attendances 
SET metadata = COALESCE(metadata, '{}'::json) || 
  json_build_object(
    'weeklyCompletion', true,
    'weekNumber', week
  )
WHERE attendanceType = 'video_completion' 
  AND week IS NOT NULL
  AND (metadata IS NULL OR metadata->>'weeklyCompletion' IS NULL);

-- =====================================
-- PART 5: VERIFICATION QUERIES
-- =====================================

-- Verify week field was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'attendances' AND column_name = 'week';

-- Check index creation
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'attendances' 
  AND indexname LIKE '%week%';

-- Verify data backfill
SELECT 
  'BACKFILL RESULTS' as status,
  COUNT(*) as total_attendances,
  COUNT(week) as attendances_with_week,
  COUNT(*) - COUNT(week) as attendances_without_week,
  ROUND(COUNT(week)::numeric / COUNT(*) * 100, 2) as week_coverage_percent
FROM attendances;

-- Show weekly attendance distribution
SELECT 
  week,
  COUNT(*) as attendance_count,
  COUNT(DISTINCT studentId) as unique_students,
  COUNT(DISTINCT courseId) as unique_courses
FROM attendances 
WHERE week IS NOT NULL
GROUP BY week 
ORDER BY week;

-- =====================================
-- PART 6: VALIDATION QUERIES
-- =====================================

-- Check for any data inconsistencies
SELECT 
  'DATA VALIDATION' as check_type,
  CASE 
    WHEN COUNT(*) = 0 THEN 'PASS: No invalid week values'
    ELSE 'FAIL: Found ' || COUNT(*) || ' records with invalid week values'
  END as result
FROM attendances 
WHERE week IS NOT NULL AND (week < 1 OR week > 16);

-- Check weekly attendance distribution by course
SELECT 
  c.title as course_name,
  a.week,
  COUNT(*) as attendance_count,
  COUNT(DISTINCT a.studentId) as student_count
FROM attendances a
JOIN courses c ON a.courseId = c.id
WHERE a.week IS NOT NULL
GROUP BY c.title, a.week
ORDER BY c.title, a.week;

-- =====================================
-- EXECUTION NOTES
-- =====================================

/*
TO EXECUTE THIS MIGRATION:

1. BACKUP YOUR DATABASE FIRST:
   pg_dump your_database > backup_before_week_migration.sql

2. Execute this migration in a transaction:
   BEGIN;
   -- Run all the above SQL
   COMMIT;

3. If something goes wrong, rollback:
   ROLLBACK;

4. Verify the migration worked:
   - Check week column exists
   - Check indexes were created  
   - Verify data backfill worked
   - Test weekly attendance queries

EXPECTED RESULTS:
- attendances table has new 'week' column
- New indexes for performance optimization
- Existing records have week values where possible
- Weekly attendance system is now functional

POST-MIGRATION STEPS:
1. Restart backend application
2. Test video completion → attendance creation
3. Verify weekly attendance dashboard works
4. Monitor logs for any errors
*/

-- =====================================
-- ROLLBACK SCRIPT (USE ONLY IF NEEDED)
-- =====================================

/*
-- ROLLBACK INSTRUCTIONS:
-- Only use if migration failed and you need to undo changes

-- Drop indexes
DROP INDEX IF EXISTS idx_attendances_student_course_week;
DROP INDEX IF EXISTS idx_attendances_course_week;
DROP INDEX IF EXISTS idx_attendances_week_status;

-- Remove week column
ALTER TABLE attendances DROP COLUMN IF EXISTS week;

-- Note: This will lose the week data, so only use if absolutely necessary
*/
