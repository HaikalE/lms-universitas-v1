# Admin Module

This module provides comprehensive administrative functionality for the LMS system, including statistics, analytics, and system monitoring.

## Features

### Statistics & Analytics
- **System Overview**: Total users, courses, assignments, and submissions
- **User Statistics**: User breakdown by role, growth trends, and registration analytics
- **Course Statistics**: Course enrollment stats, active/inactive courses
- **Assignment Statistics**: Submission rates, grading completion, and performance metrics
- **Activity Monitoring**: Real-time activity tracking and recent activities

### Admin Endpoints

#### Core Statistics
- `GET /api/admin/stats` - Complete system statistics
- `GET /api/admin/stats/overview` - Quick overview stats
- `GET /api/admin/stats/users` - User-specific statistics
- `GET /api/admin/stats/courses` - Course-specific statistics
- `GET /api/admin/stats/assignments` - Assignment-specific statistics
- `GET /api/admin/stats/activity` - Activity statistics

#### Analytics & Reporting
- `GET /api/admin/analytics/engagement` - User engagement analytics
- `GET /api/admin/analytics/performance` - Academic performance analytics
- `GET /api/admin/reports/users` - User reports (supports CSV export)
- `GET /api/admin/reports/courses` - Course reports

#### System Monitoring
- `GET /api/admin/dashboard` - Dashboard data
- `GET /api/admin/system-health` - System health status
- `GET /api/admin/recent-activities` - Recent system activities

## Authentication & Authorization

All admin endpoints require:
1. **JWT Authentication**: Valid JWT token
2. **Admin Role**: Only users with ADMIN role can access these endpoints

## Query Parameters

### Time Period Filtering
Many endpoints support period filtering:
- `period=7d` - Last 7 days
- `period=30d` - Last 30 days
- `period=90d` - Last 90 days
- `period=1y` - Last year

### Date Range Filtering
Report endpoints support custom date ranges:
- `startDate=2024-01-01`
- `endDate=2024-12-31`
- `format=csv` - Export as CSV

### Pagination & Limits
- `limit=50` - Limit results (default: 50 for activities)

## Response Examples

### System Stats Response
```json
{
  "overview": {
    "totalUsers": 150,
    "totalCourses": 25,
    "totalAssignments": 120,
    "totalSubmissions": 340
  },
  "users": {
    "total": 150,
    "students": 120,
    "lecturers": 25,
    "admins": 5,
    "breakdown": {
      "studentPercentage": 80,
      "lecturerPercentage": 17,
      "adminPercentage": 3
    }
  },
  "courses": {
    "total": 25,
    "active": 20,
    "inactive": 5,
    "activePercentage": 80
  },
  "assignments": {
    "total": 120,
    "submissions": 340,
    "pending": 45,
    "graded": 295,
    "submissionRate": 85,
    "gradingCompletionRate": 87
  }
}
```

### Recent Activities Response
```json
[
  {
    "type": "submission",
    "id": "uuid",
    "title": "Assignment submission: Math Quiz 1",
    "user": "John Doe",
    "timestamp": "2024-01-15T10:30:00Z"
  },
  {
    "type": "forum_post",
    "id": "uuid",
    "title": "Forum post: Question about Chapter 5",
    "user": "Jane Smith",
    "timestamp": "2024-01-15T09:15:00Z"
  }
]
```

## Error Handling

All endpoints include comprehensive error handling:
- **Authentication errors**: 401 Unauthorized
- **Authorization errors**: 403 Forbidden
- **Database errors**: 500 Internal Server Error with descriptive messages
- **Invalid parameters**: 400 Bad Request

## Performance Considerations

- **Caching**: Consider implementing Redis caching for frequently accessed statistics
- **Database Indexing**: Ensure proper indexes on date fields and foreign keys
- **Query Optimization**: Complex analytics queries are optimized with proper joins and aggregations
- **Rate Limiting**: Consider implementing rate limiting for analytics endpoints

## Usage Examples

### Fetch System Overview
```typescript
const response = await fetch('/api/admin/stats/overview', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
const stats = await response.json();
```

### Get User Growth Data
```typescript
const response = await fetch('/api/admin/stats/users?period=30d', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
const userStats = await response.json();
```

### Export User Reports as CSV
```typescript
const response = await fetch('/api/admin/reports/users?format=csv&startDate=2024-01-01&endDate=2024-12-31', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
const report = await response.json();
```

## Dependencies

- **TypeORM**: For database operations
- **NestJS Guards**: For authentication and authorization
- **JWT**: For token validation
- **Class Validators**: For request validation

## Future Enhancements

- **Real-time Notifications**: WebSocket integration for real-time admin notifications
- **Advanced Analytics**: Machine learning-based insights and predictions
- **Export Formats**: Additional export formats (PDF, Excel)
- **Automated Reports**: Scheduled report generation and email delivery
- **Performance Monitoring**: Detailed application performance metrics
