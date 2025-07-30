-- Fix attendance trigger for video material "giohojpo"
-- This video is already completed but wasn't triggering attendance because isAttendanceTrigger was false

UPDATE course_materials 
SET 
  "isAttendanceTrigger" = true,
  "attendanceThreshold" = 80,
  "updatedAt" = NOW()
WHERE id = 'e2915fc2-9345-4188-a6ba-484e7294ee42';

-- Verify the update
SELECT 
  id,
  title,
  type,
  "isAttendanceTrigger",
  "attendanceThreshold",
  "updatedAt"
FROM course_materials 
WHERE id = 'e2915fc2-9345-4188-a6ba-484e7294ee42';

-- Also check the video progress status
SELECT 
  vp.id,
  vp."materialId",
  vp."studentId",
  vp."isCompleted",
  vp."hasTriggeredAttendance",
  vp."watchedPercentage",
  cm.title,
  cm."isAttendanceTrigger"
FROM video_progress vp
JOIN course_materials cm ON vp."materialId" = cm.id
WHERE vp."materialId" = 'e2915fc2-9345-4188-a6ba-484e7294ee42';