# API Documentation - LMS Universitas v1.0

Dokumentasi lengkap untuk REST API LMS Universitas.

## Base URL

```
Development: http://localhost:3000/api
Production: https://yourdomain.com/api
```

## Authentication

API menggunakan JWT (JSON Web Token) untuk autentikasi.

### Headers yang Diperlukan

```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

## Authentication Endpoints

### Login

```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "fullName": "User Name",
    "role": "student",
    "studentId": "20230001"
  }
}
```

### Get Current User Profile

```http
GET /auth/profile
```

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "fullName": "User Name",
  "role": "student",
  "studentId": "20230001",
  "phone": "+62812345678",
  "address": "Jakarta, Indonesia",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### Update Profile

```http
PATCH /auth/profile
```

**Request Body:**
```json
{
  "fullName": "New Name",
  "phone": "+62812345678",
  "address": "New Address"
}
```

## User Management Endpoints

### Get Users (Admin Only)

```http
GET /users?page=1&limit=10&role=student&search=john
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `role` (optional): Filter by role (student, lecturer, admin)
- `search` (optional): Search by name, email, or ID
- `isActive` (optional): Filter by active status

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "email": "student@example.com",
      "fullName": "Student Name",
      "role": "student",
      "studentId": "20230001",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
}
```

### Create User (Admin Only)

```http
POST /users
```

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "fullName": "New User",
  "role": "student",
  "studentId": "20230002",
  "phone": "+62812345678"
}
```

### Enroll Student to Course (Admin Only)

```http
POST /users/{studentId}/enroll
```

**Request Body:**
```json
{
  "courseId": "course-uuid"
}
```

## Course Management Endpoints

### Get Courses

```http
GET /courses?page=1&limit=10&semester=2024/1&search=programming
```

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "code": "CS101",
      "name": "Introduction to Programming",
      "description": "Basic programming concepts",
      "credits": 3,
      "semester": "2024/1",
      "lecturer": {
        "id": "uuid",
        "fullName": "Dr. John Doe",
        "lecturerId": "NIDN001"
      },
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "total": 50,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

### Get Course Details

```http
GET /courses/{courseId}
```

**Response:**
```json
{
  "id": "uuid",
  "code": "CS101",
  "name": "Introduction to Programming",
  "description": "Basic programming concepts",
  "credits": 3,
  "semester": "2024/1",
  "lecturer": {
    "id": "uuid",
    "fullName": "Dr. John Doe",
    "lecturerId": "NIDN001"
  },
  "students": [
    {
      "id": "uuid",
      "fullName": "Student Name",
      "studentId": "20230001"
    }
  ],
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### Get Course Materials

```http
GET /courses/{courseId}/materials
```

**Response:**
```json
[
  {
    "id": "uuid",
    "title": "Lecture 1: Introduction",
    "description": "Introduction to programming concepts",
    "type": "pdf",
    "fileName": "lecture1.pdf",
    "filePath": "uploads/lecture1.pdf",
    "fileSize": 1024000,
    "url": "http://localhost:3000/uploads/lecture1.pdf",
    "week": 1,
    "orderIndex": 1,
    "uploadedBy": {
      "id": "uuid",
      "fullName": "Dr. John Doe"
    },
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### Create Course Material (Lecturer/Admin)

```http
POST /courses/{courseId}/materials
```

**Request Body:**
```json
{
  "title": "Lecture 2: Variables",
  "description": "Introduction to variables and data types",
  "type": "pdf",
  "fileName": "lecture2.pdf",
  "filePath": "uploads/lecture2.pdf",
  "fileSize": 2048000,
  "week": 2,
  "orderIndex": 1
}
```

## Assignment Management Endpoints

### Get Assignments

```http
GET /assignments?page=1&limit=10&courseId=uuid&type=individual
```

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Assignment 1: Hello World",
      "description": "Create your first program",
      "type": "individual",
      "dueDate": "2024-02-15T23:59:59.000Z",
      "maxScore": 100,
      "allowLateSubmission": true,
      "latePenaltyPercent": 10,
      "allowedFileTypes": ["py", "txt"],
      "maxFileSize": 10485760,
      "isVisible": true,
      "course": {
        "id": "uuid",
        "code": "CS101",
        "name": "Introduction to Programming"
      },
      "lecturer": {
        "id": "uuid",
        "fullName": "Dr. John Doe"
      },
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "total": 20,
    "page": 1,
    "limit": 10,
    "totalPages": 2
  }
}
```

### Create Assignment (Lecturer/Admin)

```http
POST /assignments
```

**Request Body:**
```json
{
  "title": "Assignment 2: Data Structures",
  "description": "Implement basic data structures",
  "type": "individual",
  "dueDate": "2024-03-15T23:59:59.000Z",
  "maxScore": 100,
  "allowLateSubmission": true,
  "latePenaltyPercent": 5,
  "allowedFileTypes": ["py", "java", "cpp"],
  "maxFileSize": 10485760,
  "courseId": "course-uuid"
}
```

### Submit Assignment (Student)

```http
POST /assignments/{assignmentId}/submit
```

**Request Body:**
```json
{
  "content": "Solution explanation",
  "fileName": "assignment1.py",
  "filePath": "uploads/submissions/assignment1.py",
  "fileSize": 2048
}
```

### Grade Submission (Lecturer/Admin)

```http
POST /assignments/submissions/{submissionId}/grade
```

**Request Body:**
```json
{
  "score": 85,
  "feedback": "Good work! Consider optimizing the algorithm."
}
```

## Forum Endpoints

### Get Forum Posts by Course

```http
GET /forums/course/{courseId}?page=1&limit=10&search=question
```

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Question about assignment 1",
      "content": "I'm having trouble with the first assignment...",
      "isPinned": false,
      "isLocked": false,
      "likesCount": 5,
      "author": {
        "id": "uuid",
        "fullName": "Student Name",
        "role": "student"
      },
      "children": [
        {
          "id": "uuid",
          "content": "Try checking the documentation...",
          "author": {
            "id": "uuid",
            "fullName": "Dr. John Doe",
            "role": "lecturer"
          },
          "createdAt": "2024-01-02T00:00:00.000Z"
        }
      ],
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "total": 30,
    "page": 1,
    "limit": 10,
    "totalPages": 3
  }
}
```

### Create Forum Post

```http
POST /forums
```

**Request Body:**
```json
{
  "title": "Help with debugging",
  "content": "I'm getting an error when running my code...",
  "courseId": "course-uuid",
  "parentId": "parent-post-uuid" // Optional, for replies
}
```

## Announcement Endpoints

### Get Announcements

```http
GET /announcements?page=1&limit=10&courseId=uuid&priority=high
```

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Important: Exam Schedule",
      "content": "The midterm exam will be held on...",
      "priority": "high",
      "isActive": true,
      "expiresAt": "2024-03-01T00:00:00.000Z",
      "author": {
        "id": "uuid",
        "fullName": "Dr. John Doe"
      },
      "course": {
        "id": "uuid",
        "code": "CS101",
        "name": "Introduction to Programming"
      },
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "total": 15,
    "page": 1,
    "limit": 10,
    "totalPages": 2
  }
}
```

### Create Announcement (Lecturer/Admin)

```http
POST /announcements
```

**Request Body:**
```json
{
  "title": "Class Cancellation",
  "content": "Today's class is cancelled due to...",
  "priority": "urgent",
  "courseId": "course-uuid", // Optional, null for global announcements
  "expiresAt": "2024-02-01T00:00:00.000Z"
}
```

## Notification Endpoints

### Get My Notifications

```http
GET /notifications/my-notifications?page=1&limit=10&isRead=false
```

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "New Assignment",
      "message": "A new assignment has been posted for CS101",
      "type": "assignment_new",
      "isRead": false,
      "metadata": {
        "assignmentId": "uuid",
        "courseName": "Introduction to Programming"
      },
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "total": 25,
    "page": 1,
    "limit": 10,
    "totalPages": 3
  }
}
```

### Mark Notification as Read

```http
PATCH /notifications/{notificationId}/read
```

### Mark All Notifications as Read

```http
PATCH /notifications/mark-all-read
```

### Get Unread Count

```http
GET /notifications/unread-count
```

**Response:**
```json
{
  "unreadCount": 5
}
```

## File Upload Endpoints

### Upload File

```http
POST /uploads/file
Content-Type: multipart/form-data
```

**Form Data:**
- `file`: The file to upload

**Response:**
```json
{
  "message": "File successfully uploaded",
  "file": {
    "originalName": "document.pdf",
    "fileName": "uuid-document.pdf",
    "filePath": "uploads/uuid-document.pdf",
    "fileSize": 1024000,
    "mimeType": "application/pdf",
    "url": "http://localhost:3000/uploads/uuid-document.pdf"
  }
}
```

### Upload Avatar

```http
POST /uploads/avatar
Content-Type: multipart/form-data
```

**Form Data:**
- `avatar`: Image file (jpg, jpeg, png, gif)

## Error Responses

API menggunakan HTTP status codes standar dan mengembalikan error dalam format berikut:

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Insufficient permissions",
  "error": "Forbidden"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Resource not found",
  "error": "Not Found"
}
```

### 500 Internal Server Error
```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "error": "Internal Server Error"
}
```

## Rate Limiting

API mengimplementasikan rate limiting untuk mencegah abuse:

- **General endpoints**: 100 requests per 15 minutes per IP
- **Authentication endpoints**: 5 requests per 15 minutes per IP
- **File upload endpoints**: 10 requests per hour per user

## Pagination

Semua endpoints yang mengembalikan list data menggunakan pagination dengan parameter:

- `page`: Nomor halaman (default: 1)
- `limit`: Jumlah item per halaman (default: 10, max: 100)

Response pagination:
```json
{
  "data": [...],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
}
```

## Sorting

Beberapa endpoints mendukung sorting dengan parameter:

- `sortBy`: Field untuk sorting (default: 'createdAt')
- `sortOrder`: Arah sorting ('ASC' atau 'DESC', default: 'DESC')

Contoh:
```http
GET /users?sortBy=fullName&sortOrder=ASC
```

## Filtering

Endpoints mendukung berbagai filter sesuai dengan resource:

- **Users**: `role`, `isActive`, `search`
- **Courses**: `semester`, `lecturerId`, `isActive`, `search`
- **Assignments**: `courseId`, `type`, `isVisible`
- **Announcements**: `courseId`, `priority`, `isActive`, `search`
- **Notifications**: `type`, `isRead`

## Testing API

### Menggunakan cURL

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@universitas.ac.id","password":"admin123"}'

# Get courses (dengan token)
curl -X GET http://localhost:3000/api/courses \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Menggunakan Postman

1. Import collection dari `docs/postman_collection.json`
2. Set environment variables:
   - `base_url`: `http://localhost:3000/api`
   - `token`: JWT token dari login

### Menggunakan Swagger UI

Setelah menjalankan backend, buka:
```
http://localhost:3000/api/docs
```

## SDK dan Libraries

### JavaScript/TypeScript

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// Login
const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

// Get courses
const getCourses = async () => {
  const response = await api.get('/courses');
  return response.data;
};
```

### Python

```python
import requests

class LMSClient:
    def __init__(self, base_url, token=None):
        self.base_url = base_url
        self.token = token
        self.session = requests.Session()
        if token:
            self.session.headers.update({'Authorization': f'Bearer {token}'})
    
    def login(self, email, password):
        response = self.session.post(f'{self.base_url}/auth/login', 
                                   json={'email': email, 'password': password})
        data = response.json()
        self.token = data['access_token']
        self.session.headers.update({'Authorization': f'Bearer {self.token}'})
        return data
    
    def get_courses(self):
        response = self.session.get(f'{self.base_url}/courses')
        return response.json()

# Usage
client = LMSClient('http://localhost:3000/api')
client.login('admin@universitas.ac.id', 'admin123')
courses = client.get_courses()
```

## Changelog

### Version 1.0.0
- Initial API release
- Authentication with JWT
- User management
- Course management
- Assignment management
- Forum discussions
- Announcements
- Notifications
- File uploads

## Support

Untuk pertanyaan atau masalah terkait API:

1. **Documentation**: Periksa dokumentasi ini terlebih dahulu
2. **GitHub Issues**: Buat issue untuk bug reports atau feature requests
3. **Community**: Join diskusi komunitas untuk bantuan

Remember to always use HTTPS in production dan jangan pernah expose JWT tokens atau credentials dalam logs atau client-side code.
