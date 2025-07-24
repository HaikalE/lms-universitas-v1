# 🎥 Video-Based Attendance System - Backend API Documentation

## Overview
Complete API documentation untuk sistem absensi otomatis berdasarkan video pembelajaran. Backend ini menyediakan RESTful APIs untuk video progress tracking dan automatic attendance submission.

## 🔐 Authentication
Semua endpoints memerlukan JWT authentication kecuali yang disebutkan khusus.

**Headers:**
```bash
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

## 📊 Video Progress APIs

### 1. Update Video Progress
Track video viewing progress dari frontend video player.

```http
POST /api/video-progress
```

**Role:** `STUDENT`

**Request Body:**
```json
{
  "materialId": "uuid",
  "currentTime": 120.5,
  "totalDuration": 300.0,
  "watchedPercentage": 40.17,
  "watchedSeconds": 120.5,
  "watchSession": {
    "startTime": 100.0,
    "endTime": 120.5,
    "duration": 20.5
  }
}
```

**Response:**
```json
{
  "id": "uuid",
  "materialId": "uuid",
  "currentTime": 120.5,
  "totalDuration": 300.0,
  "watchedPercentage": 40.17,
  "watchedSeconds": 120.5,
  "isCompleted": false,
  "completedAt": null,
  "hasTriggeredAttendance": false,
  "createdAt": "2025-01-20T10:00:00Z",
  "updatedAt": "2025-01-20T10:02:00Z",
  "material": {
    "id": "uuid",
    "title": "Introduction to React",
    "type": "video",
    "isAttendanceTrigger": true,
    "attendanceThreshold": 80
  }
}
```

### 2. Get Video Progress
Mendapatkan progress video untuk material tertentu.

```http
GET /api/video-progress/material/:materialId
```

**Role:** `STUDENT`

**Response:** Same as update progress response

### 3. Get Resume Position
Mendapatkan posisi terakhir untuk melanjutkan video.

```http
GET /api/video-progress/material/:materialId/resume
```

**Role:** `STUDENT`

**Response:**
```json
{
  "currentTime": 120.5,
  "watchedPercentage": 40.17
}
```

### 4. Get Course Video Progress
Mendapatkan semua progress video dalam course.

```http
GET /api/video-progress/course/:courseId
```

**Role:** `STUDENT`

**Response:** Array of progress objects

### 5. Get Video Statistics (Lecturer/Admin)
Mendapatkan statistik completion video untuk course.

```http
GET /api/video-progress/course/:courseId/stats
```

**Role:** `LECTURER`, `ADMIN`

**Response:**
```json
[
  {
    "materialId": "uuid",
    "title": "Introduction to React",
    "totalViewers": 25,
    "completedViewers": 20,
    "completionRate": "80.0",
    "avgCompletion": "85.5",
    "attendanceTriggered": 18
  }
]
```

### 6. Get Student Progress (Lecturer/Admin)
Melihat progress video student tertentu.

```http
GET /api/video-progress/student/:studentId/material/:materialId
GET /api/video-progress/student/:studentId/course/:courseId
```

**Role:** `LECTURER`, `ADMIN`

---

## 📅 Attendance APIs

### 1. Auto-Submit Attendance (Internal)
API internal yang dipanggil dari VideoProgressService ketika video selesai.

```http
POST /api/attendance/auto-submit
```

**Request Body:**
```json
{
  "studentId": "uuid",
  "courseId": "uuid",
  "triggerMaterialId": "uuid",
  "completionPercentage": 85.2,
  "metadata": {
    "videoProgress": 85.2,
    "completionTime": "2025-01-20T10:05:00Z"
  }
}
```

**Response:**
```json
{
  "id": "uuid",
  "studentId": "uuid",
  "courseId": "uuid",
  "triggerMaterialId": "uuid",
  "attendanceDate": "2025-01-20",
  "status": "auto_present",
  "attendanceType": "video_completion",
  "notes": "Auto-submitted via video completion (85.2%)",
  "submittedAt": "2025-01-20T10:05:00Z",
  "verifiedBy": null,
  "verifiedAt": null,
  "metadata": {
    "videoProgress": 85.2,
    "completionTime": "2025-01-20T10:05:00Z",
    "ipAddress": "192.168.1.1",
    "userAgent": "Mozilla/5.0..."
  },
  "createdAt": "2025-01-20T10:05:00Z",
  "updatedAt": "2025-01-20T10:05:00Z"
}
```

### 2. Create Manual Attendance
Membuat attendance record secara manual.

```http
POST /api/attendance
```

**Role:** `LECTURER`, `ADMIN`

**Request Body:**
```json
{
  "studentId": "uuid",
  "courseId": "uuid",
  "attendanceDate": "2025-01-20",
  "status": "present",
  "attendanceType": "manual",
  "notes": "Present in class"
}
```

### 3. Update Attendance
Update existing attendance record.

```http
PUT /api/attendance/:id
```

**Role:** `LECTURER`, `ADMIN`

**Request Body:**
```json
{
  "status": "excused",
  "notes": "Medical leave"
}
```

### 4. Get Attendance Records
Mendapatkan attendance records dengan filter dan pagination.

```http
GET /api/attendance
```

**Role:** `LECTURER`, `ADMIN`

**Query Parameters:**
- `courseId` (optional): Filter by course
- `studentId` (optional): Filter by student
- `startDate` (optional): Filter from date (YYYY-MM-DD)
- `endDate` (optional): Filter to date (YYYY-MM-DD)
- `status` (optional): Filter by status
- `attendanceType` (optional): Filter by type
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response:**
```json
{
  "data": [...],
  "total": 150,
  "page": 1,
  "limit": 20
}
```

### 5. Get My Attendance (Student)
Mendapatkan attendance student yang sedang login.

```http
GET /api/attendance/my-attendance/course/:courseId
```

**Role:** `STUDENT`

**Response:** Array of attendance records

### 6. Get Student Attendance (Lecturer/Admin)
Melihat attendance student tertentu.

```http
GET /api/attendance/student/:studentId/course/:courseId
```

**Role:** `LECTURER`, `ADMIN`

### 7. Get Course Attendance Statistics
Mendapatkan statistik attendance untuk course.

```http
GET /api/attendance/course/:courseId/stats
```

**Role:** `LECTURER`, `ADMIN`

**Query Parameters:**
- `startDate` (optional): From date
- `endDate` (optional): To date

**Response:**
```json
{
  "courseId": "uuid",
  "totalStudents": 30,
  "presentCount": 25,
  "absentCount": 3,
  "excusedCount": 1,
  "lateCount": 1,
  "autoAttendanceCount": 18,
  "attendanceRate": 86.67
}
```

### 8. Check Auto-Submit Eligibility
Mengecek apakah student bisa auto-submit attendance hari ini.

```http
GET /api/attendance/can-auto-submit/course/:courseId
```

**Role:** `STUDENT`

**Response:**
```json
{
  "canAutoSubmit": true
}
```

### 9. Get My Attendance Summary
Ringkasan attendance untuk dashboard student.

```http
GET /api/attendance/my-summary?courseId=:courseId
```

**Role:** `STUDENT`

**Response:**
```json
{
  "courseId": "uuid",
  "summary": {
    "totalDays": 20,
    "presentDays": 18,
    "absentDays": 1,
    "excusedDays": 1,
    "autoAttendanceDays": 12,
    "attendanceRate": 90.0
  },
  "recentAttendances": [...]
}
```

### 10. Get Today's Attendance Status
Status attendance hari ini untuk student.

```http
GET /api/attendance/today-status/course/:courseId
```

**Role:** `STUDENT`

**Response:**
```json
{
  "hasAttendanceToday": true,
  "canAutoSubmit": false,
  "attendance": {
    "id": "uuid",
    "status": "auto_present",
    "attendanceType": "video_completion",
    "submittedAt": "2025-01-20T10:05:00Z"
  }
}
```

---

## 🔧 Environment Configuration

### Required Environment Variables

```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=lms_user
DB_PASSWORD=lms_password
DB_DATABASE=lms_db

# JWT Configuration
JWT_SECRET=your_super_secret_key
JWT_EXPIRES_IN=24h

# Video Attendance Configuration
VIDEO_COMPLETION_THRESHOLD=80    # Percentage (default: 80%)
ATTENDANCE_TIME_WINDOW=24        # Hours (default: 24)
ATTENDANCE_AUTO_SUBMIT=true      # Enable auto-submit (default: true)

# Application Configuration
NODE_ENV=development
PORT=3000
```

---

## 🎯 Business Logic Flow

### Video Progress Tracking Flow:
1. **Video Load**: Frontend calls `GET /video-progress/material/:id/resume` untuk get last position
2. **Progress Update**: Frontend calls `POST /video-progress` setiap 5-10 detik
3. **Completion Check**: Server checks `watchedPercentage >= threshold`
4. **Auto-Attendance**: Jika video completed dan `isAttendanceTrigger = true`, panggil `AttendanceService.autoSubmitAttendance()`
5. **Notification**: Log success/failure dan optionally send notification

### Attendance Rules:
- **One Per Day**: Student hanya bisa dapat 1 attendance per day per course
- **Completion Threshold**: Default 80%, bisa di-override per video via `attendanceThreshold`
- **Attendance Trigger**: Video harus set `isAttendanceTrigger = true`
- **Time Window**: Auto-submit hanya berlaku dalam 24 jam (configurable)

---

## 📊 Database Integration

### Migration Command:
```bash
cd backend
npm run migration:run
```

### Seeding (Optional):
```bash
npm run seed
```

### Verify Tables:
```sql
-- Check new tables
\dt video_progress
\dt attendances

-- Check updated course_materials
\d+ course_materials
```

---

## 🧪 Testing APIs

### Test Video Progress:
```bash
# Update progress
curl -X POST http://localhost:3000/api/video-progress \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "materialId": "material-uuid",
    "currentTime": 120.5,
    "totalDuration": 300.0,
    "watchedPercentage": 85.0
  }'

# Get progress
curl -X GET http://localhost:3000/api/video-progress/material/material-uuid \
  -H "Authorization: Bearer <token>"
```

### Test Attendance:
```bash
# Check auto-submit eligibility
curl -X GET http://localhost:3000/api/attendance/can-auto-submit/course/course-uuid \
  -H "Authorization: Bearer <token>"

# Get my attendance
curl -X GET http://localhost:3000/api/attendance/my-attendance/course/course-uuid \
  -H "Authorization: Bearer <token>"
```

---

## 🚀 Deployment Checklist

### Pre-Deployment:
- [ ] Set environment variables
- [ ] Run database migrations
- [ ] Test API endpoints
- [ ] Verify authentication works
- [ ] Check logging configuration

### Post-Deployment:
- [ ] Monitor attendance auto-submissions
- [ ] Check video progress tracking
- [ ] Verify database performance
- [ ] Monitor error logs
- [ ] Test with actual video content

---

## 📈 Monitoring & Analytics

### Important Logs to Monitor:
- `🎯 TRIGGERING AUTO-ATTENDANCE` - When video completion triggers attendance
- `✅ AUTO-ATTENDANCE SUCCESS` - Successful auto-submission
- `❌ AUTO-ATTENDANCE FAILED` - Failed auto-submission (investigate immediately)

### Key Metrics:
- Video completion rates per course
- Auto-attendance success rate
- Average video watch time
- Student engagement patterns

### Performance Considerations:
- Video progress updates are frequent (every 5-10 seconds)
- Use database connection pooling
- Monitor database query performance
- Consider caching for course statistics

---

**Ready to integrate with frontend! 🚀**

Backend API sudah fully functional dengan comprehensive video progress tracking dan automatic attendance submission system.
