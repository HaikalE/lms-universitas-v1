# 🎥 Video-Based Attendance System - Database Schema

## Overview
Database implementation untuk fitur absensi otomatis berdasarkan penyelesaian video pembelajaran. Sistem ini melacak progress video mahasiswa dan secara otomatis submit absensi ketika threshold completion tercapai.

## 📊 New Database Entities

### 1. `video_progress` Table
Tracks student video viewing progress for attendance and analytics.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Primary key |
| `studentId` | UUID (FK) | Reference to users table |
| `materialId` | UUID (FK) | Reference to course_materials table |
| `currentTime` | FLOAT | Last watched position in seconds |
| `totalDuration` | FLOAT | Total video duration in seconds |
| `watchedPercentage` | FLOAT | Percentage of video watched |
| `watchedSeconds` | FLOAT | Total seconds actually watched (excluding skips) |
| `isCompleted` | BOOLEAN | Whether video meets completion threshold |
| `completedAt` | TIMESTAMP | When video was completed |
| `hasTriggeredAttendance` | BOOLEAN | Prevents duplicate attendance submissions |
| `watchSessions` | JSON | Array of viewing sessions for analytics |
| `createdAt` | TIMESTAMP | Record creation time |
| `updatedAt` | TIMESTAMP | Record last update time |

**Constraints:**
- `UNIQUE(studentId, materialId)` - One progress record per student per video
- `FK_video_progress_student` - Cascades on user deletion
- `FK_video_progress_material` - Cascades on material deletion

### 2. `attendances` Table
Student attendance records with support for auto-submission via video completion.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Primary key |
| `studentId` | UUID (FK) | Reference to users table |
| `courseId` | UUID (FK) | Reference to courses table |
| `triggerMaterialId` | UUID (FK) | Video that triggered attendance (nullable) |
| `attendanceDate` | DATE | Date of attendance (YYYY-MM-DD) |
| `status` | ENUM | present, absent, auto_present, excused, late |
| `attendanceType` | ENUM | manual, video_completion, qr_code, location_based |
| `notes` | TEXT | Additional notes (reason for absence, etc.) |
| `submittedAt` | TIMESTAMP | When attendance was submitted |
| `verifiedBy` | UUID | ID of lecturer/admin who verified (nullable) |
| `verifiedAt` | TIMESTAMP | When attendance was verified (nullable) |
| `metadata` | JSON | Additional data (video progress, IP, user agent) |
| `createdAt` | TIMESTAMP | Record creation time |
| `updatedAt` | TIMESTAMP | Record last update time |

**Constraints:**
- `FK_attendances_student` - Cascades on user deletion
- `FK_attendances_course` - Cascades on course deletion
- `FK_attendances_trigger_material` - Sets NULL on material deletion

## 🔧 Enhanced Existing Entities

### Modified `course_materials` Table
Added support for attendance trigger configuration:

| New Column | Type | Description |
|------------|------|-------------|
| `isAttendanceTrigger` | BOOLEAN | Flag to indicate if this video can trigger automatic attendance |
| `attendanceThreshold` | FLOAT | Custom completion threshold for this video (overrides global setting) |

## 📊 Database Indexes

### Performance Optimization Indexes:

**video_progress:**
- `IDX_video_progress_student_material(studentId, materialId)` - Unique constraint index
- `IDX_video_progress_student(studentId)` - Student progress queries
- `IDX_video_progress_material(materialId)` - Material analytics

**attendances:**
- `IDX_attendances_student_course_date(studentId, courseId, attendanceDate)` - Primary query pattern
- `IDX_attendances_course_date(courseId, attendanceDate)` - Course attendance reports
- `IDX_attendances_student(studentId)` - Student attendance history
- `IDX_attendances_course(courseId)` - Course-wide attendance statistics

## 🔄 Migration Details

**Migration File:** `1737700000000-AddVideoProgressAndAttendance.ts`

### Migration Steps:
1. Add attendance trigger fields to `course_materials`
2. Create `video_progress` table with all constraints and indexes
3. Create `attendances` table with ENUM types and constraints
4. Establish foreign key relationships
5. Add performance indexes
6. Add table/column comments for documentation

### Rollback Support:
- Complete rollback support in `down()` method
- Safely removes foreign keys, indexes, tables, and columns
- Removes custom ENUM types

## 🎯 Usage Patterns

### 1. Track Video Progress
```sql
-- Insert or update video progress
INSERT INTO video_progress (studentId, materialId, currentTime, totalDuration, watchedPercentage)
VALUES ($1, $2, $3, $4, $5)
ON CONFLICT (studentId, materialId) 
DO UPDATE SET 
  currentTime = EXCLUDED.currentTime,
  watchedPercentage = EXCLUDED.watchedPercentage,
  updatedAt = NOW();
```

### 2. Check Attendance Eligibility
```sql
-- Check if student can get auto-attendance
SELECT cm.isAttendanceTrigger, cm.attendanceThreshold
FROM course_materials cm
WHERE cm.id = $1 AND cm.type = 'video';
```

### 3. Auto-Submit Attendance
```sql
-- Check if attendance already exists for today
SELECT id FROM attendances 
WHERE studentId = $1 AND courseId = $2 AND attendanceDate = CURRENT_DATE;

-- Insert auto-attendance if not exists
INSERT INTO attendances (studentId, courseId, triggerMaterialId, attendanceDate, status, attendanceType)
VALUES ($1, $2, $3, CURRENT_DATE, 'auto_present', 'video_completion');
```

### 4. Analytics Queries
```sql
-- Get course video completion statistics
SELECT 
  cm.title,
  COUNT(vp.id) as total_viewers,
  COUNT(CASE WHEN vp.isCompleted THEN 1 END) as completed_viewers,
  AVG(vp.watchedPercentage) as avg_completion
FROM course_materials cm
LEFT JOIN video_progress vp ON cm.id = vp.materialId
WHERE cm.courseId = $1 AND cm.type = 'video'
GROUP BY cm.id, cm.title;
```

## 🔐 Security Considerations

### Data Integrity:
- Unique constraints prevent duplicate progress records
- Foreign key constraints maintain referential integrity
- Cascading deletes for data consistency

### Privacy:
- Video progress data is tied to specific users
- Metadata field allows storing additional context without schema changes
- Soft delete support via status fields

### Performance:
- Composite indexes for optimal query performance
- JSON fields for flexible metadata storage
- Date-based partitioning ready for large datasets

## 🚀 Deployment Steps

1. **Backup Database:**
   ```bash
   pg_dump lms_db > backup_before_attendance_$(date +%Y%m%d).sql
   ```

2. **Run Migration:**
   ```bash
   cd backend
   npm run migration:run
   ```

3. **Verify Tables:**
   ```sql
   \dt *progress*
   \dt *attendance*
   \d+ video_progress
   \d+ attendances
   ```

4. **Test Queries:**
   ```sql
   SELECT COUNT(*) FROM video_progress;
   SELECT COUNT(*) FROM attendances;
   ```

## 📈 Future Enhancements

### Planned Features:
- **Partitioning:** Date-based partitioning for `attendances` table
- **Archiving:** Automated archiving of old video progress data
- **Analytics:** Materialized views for performance reporting
- **Audit Trail:** Detailed change tracking for attendance modifications

### Schema Evolution:
- Additional attendance types (facial recognition, location-based)
- Video interaction tracking (pause, rewind, speed changes)
- Multi-video completion requirements
- Attendance appeals and override system

---

## 📋 Checklist for Implementation

### Database Setup ✅
- [x] VideoProgress entity created
- [x] Attendance entity created  
- [x] CourseMaterial entity enhanced
- [x] Migration file created
- [x] Indexes optimized
- [x] Foreign key constraints established

### Next Steps 🔄
- [ ] Create Video Progress service
- [ ] Create Attendance service
- [ ] Build REST API endpoints
- [ ] Implement frontend components
- [ ] Add validation and testing
- [ ] Deploy and monitor

---

**Note:** This database schema is designed to be scalable, performant, and extensible for future video-based learning features.
