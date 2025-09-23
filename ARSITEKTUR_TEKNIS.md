# 🏗️ Arsitektur Teknis LMS Universitas v1.0

## 📐 Diagram Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│  🌐 Web Browser (Chrome, Firefox, Safari, Edge)                │
│  📱 Mobile Browser (Responsive Design)                         │
│  💻 Desktop Application (Future: Electron)                     │
└─────────────────────────────────────────────────────────────────┘
                              │ HTTP/HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      FRONTEND LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│  🔷 React 18 Application (TypeScript)                          │
│  ├── Components (UI Components)                                │
│  ├── Pages (Route Components)                                  │
│  ├── Services (API Integration)                                │
│  ├── Contexts (State Management)                               │
│  └── Hooks (Custom React Hooks)                                │
│                                                                 │
│  🎨 Styling: Tailwind CSS                                      │
│  🧭 Routing: React Router v6                                   │
│  🔄 State: React Query + Context API                           │
│  📡 HTTP Client: Axios                                         │
└─────────────────────────────────────────────────────────────────┘
                              │ REST API Calls
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     API GATEWAY LAYER                          │
├─────────────────────────────────────────────────────────────────┤
│  🌐 Nginx Reverse Proxy                                        │
│  ├── Load Balancing                                            │
│  ├── SSL Termination                                           │
│  ├── Static File Serving                                       │
│  └── Request Routing                                           │
└─────────────────────────────────────────────────────────────────┘
                              │ Forward to Backend
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│  🔶 NestJS Application (Node.js + TypeScript)                  │
│                                                                 │
│  📦 Core Modules:                                               │
│  ├── 🔐 Auth Module (JWT Authentication)                       │
│  ├── 👤 Users Module (User Management)                         │
│  ├── 📚 Courses Module (Course Management)                     │
│  ├── 📝 Assignments Module (Assignment System)                 │
│  ├── 💬 Forums Module (Discussion Forums)                      │
│  ├── 📢 Announcements Module                                   │
│  ├── 🔔 Notifications Module                                   │
│  ├── 📤 Uploads Module (File Management)                       │
│  ├── 👨‍💼 Admin Module (Administration)                          │
│  ├── 🎥 Video Progress Module ✨                               │
│  └── 📊 Attendance Module ✨                                   │
│                                                                 │
│  🛡️ Security Layer:                                            │
│  ├── Guards (Authentication & Authorization)                   │
│  ├── Interceptors (Request/Response Processing)                │
│  ├── Pipes (Input Validation)                                  │
│  └── Filters (Exception Handling)                              │
│                                                                 │
│  📋 Data Transfer Objects (DTOs):                               │
│  ├── Validation Schemas                                        │
│  ├── Type Definitions                                          │
│  └── API Contracts                                             │
└─────────────────────────────────────────────────────────────────┘
                              │ Database Queries
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATA ACCESS LAYER                           │
├─────────────────────────────────────────────────────────────────┤
│  🗃️ TypeORM (Object-Relational Mapping)                        │
│  ├── Entity Definitions                                        │
│  ├── Repository Pattern                                        │
│  ├── Query Builder                                             │
│  ├── Migration System                                          │
│  └── Connection Pooling                                        │
└─────────────────────────────────────────────────────────────────┘
                              │ SQL Queries
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE LAYER                              │
├─────────────────────────────────────────────────────────────────┤
│  🐘 PostgreSQL 14+ Database                                    │
│                                                                 │
│  📊 Core Tables:                                                │
│  ├── users (Pengguna sistem)                                   │
│  ├── courses (Mata kuliah)                                     │
│  ├── course_materials (Materi pembelajaran)                    │
│  ├── assignments (Tugas)                                       │
│  ├── submissions (Pengumpulan tugas)                           │
│  ├── grades (Nilai)                                            │
│  ├── forums (Forum diskusi)                                    │
│  ├── forum_posts (Post forum)                                  │
│  ├── announcements (Pengumuman)                                │
│  ├── notifications (Notifikasi)                                │
│  ├── course_enrollments (Pendaftaran mahasiswa) ✨             │
│  ├── video_progress (Progress video) ✨                        │
│  ├── attendance (Kehadiran) ✨                                 │
│  └── weekly_attendance (Kehadiran mingguan) ✨                 │
│                                                                 │
│  🔍 Indexes & Optimization:                                     │
│  ├── Primary Keys (UUID)                                       │
│  ├── Foreign Key Constraints                                   │
│  ├── Search Indexes                                            │
│  └── Performance Indexes                                       │
└─────────────────────────────────────────────────────────────────┘
                              │ File I/O
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FILE STORAGE LAYER                          │
├─────────────────────────────────────────────────────────────────┤
│  📁 Local File System                                          │
│  ├── /uploads/materials (Materi pembelajaran)                  │
│  ├── /uploads/assignments (File tugas)                         │
│  ├── /uploads/submissions (File pengumpulan)                   │
│  ├── /uploads/avatars (Foto profil)                            │
│  └── /uploads/temp (File sementara)                            │
│                                                                 │
│  🔮 Future: Cloud Storage                                       │
│  ├── AWS S3                                                    │
│  ├── Google Cloud Storage                                      │
│  └── Azure Blob Storage                                        │
└─────────────────────────────────────────────────────────────────┘

```

## 🔧 Teknologi Stack Detail

### Frontend Technologies
```javascript
// React 18 dengan TypeScript
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';

// Tailwind CSS untuk styling
import 'tailwindcss/tailwind.css';

// Custom hooks dan services
import { useAuth } from './hooks/useAuth';
import { courseService } from './services/courseService';
```

### Backend Technologies
```typescript
// NestJS dengan TypeScript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

// TypeORM untuk database
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Course } from './entities/course.entity';

// JWT untuk authentication
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
```

### Database Schema
```sql
-- Core user table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'lecturer', 'student')),
  student_id VARCHAR(50),
  lecturer_id VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Course enrollments for many-to-many relationship
CREATE TABLE course_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(course_id, student_id)
);

-- Video progress tracking
CREATE TABLE video_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  material_id UUID REFERENCES course_materials(id) ON DELETE CASCADE,
  progress_percentage DECIMAL(5,2) DEFAULT 0,
  total_watch_time INTEGER DEFAULT 0,
  last_watched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🌐 API Architecture

### RESTful API Design
```typescript
// API Endpoint Structure
/api/auth/*           // Authentication endpoints
/api/users/*          // User management
/api/courses/*        // Course management
/api/assignments/*    // Assignment system
/api/forums/*         // Discussion forums
/api/notifications/*  // Notification system
/api/admin/*          // Administrative functions
```

### Request/Response Flow
```
1. Client Request → Nginx → NestJS Application
2. Authentication Guard → JWT Validation
3. Authorization Guard → Role-based Access Check
4. Controller → Service → Repository
5. Database Query → TypeORM → PostgreSQL
6. Response Processing → JSON Response
7. Client Response ← Nginx ← NestJS Application
```

## 🔐 Security Architecture

### Authentication Flow
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Client    │    │  Backend    │    │  Database   │
└─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │
       │ POST /auth/login  │                   │
       ├──────────────────►│                   │
       │                   │ Verify password   │
       │                   ├──────────────────►│
       │                   │ User data         │
       │                   │◄──────────────────┤
       │ JWT Token         │                   │
       │◄──────────────────┤                   │
       │                   │                   │
       │ API Request       │                   │
       │ + Authorization   │                   │
       ├──────────────────►│                   │
       │                   │ Verify JWT        │
       │                   │ Extract user info │
       │                   │                   │
       │ Protected Data    │                   │
       │◄──────────────────┤                   │
```

### Role-Based Access Control Matrix
```
┌─────────────────┬─────────┬──────────┬──────────┬─────────┐
│     Resource    │  Admin  │ Lecturer │ Student  │  Guest  │
├─────────────────┼─────────┼──────────┼──────────┼─────────┤
│ User Management │   ✅    │    ❌    │    ❌    │   ❌    │
│ Course Creation │   ✅    │    ✅    │    ❌    │   ❌    │
│ Course Access   │   ✅    │    ✅    │    ✅*   │   ❌    │
│ Grade Students  │   ✅    │    ✅*   │    ❌    │   ❌    │
│ View Grades     │   ✅    │    ✅*   │    ✅*   │   ❌    │
│ Forum Posts     │   ✅    │    ✅*   │    ✅*   │   ❌    │
│ System Settings │   ✅    │    ❌    │    ❌    │   ❌    │
└─────────────────┴─────────┴──────────┴──────────┴─────────┘
* = Only for enrolled/assigned courses
```

## 📊 Data Flow Architecture

### Student Management Flow
```
Frontend Component
       │
       ▼
API Service Call
       │
       ▼
NestJS Controller
       │
       ▼
Service Layer (Business Logic)
       │
       ▼
Repository Pattern
       │
       ▼
TypeORM Query Builder
       │
       ▼
PostgreSQL Database
       │
       ▼
Response Data
       │
       ▼
Frontend State Update
       │
       ▼
UI Re-render
```

### Video Attendance Tracking Flow
```
Video Player Event
       │
       ▼
Progress API Call
       │
       ▼
Video Progress Service
       │
       ▼
Calculate Percentage
       │
       ▼
Update Progress Table
       │
       ▼
Check Attendance Trigger
       │
       ▼
Auto Mark Attendance (if >= 80%)
       │
       ▼
Send Notification
```

## 🐳 Docker Architecture

### Container Structure
```yaml
# docker-compose.yml structure
services:
  db:                 # PostgreSQL Database
    image: postgres:13
    ports: ["5433:5432"]
    
  backend:            # NestJS API Server
    build: ./backend
    ports: ["3000:3000"]
    depends_on: [db]
    
  frontend:           # React Application
    build: ./frontend
    ports: ["3001:80"]
    depends_on: [backend]
```

### Network Architecture
```
┌─────────────────────────────────────────┐
│            Docker Network               │
│                                         │
│  ┌─────────────┐  ┌─────────────┐      │
│  │  Frontend   │  │   Backend   │      │
│  │   :3001     │  │    :3000    │      │
│  │             │  │             │      │
│  └─────────────┘  └─────────────┘      │
│         │                 │            │
│         └─────────────────┼────────────┘
│                           │
│                  ┌─────────────┐
│                  │ PostgreSQL  │
│                  │    :5432    │
│                  │             │
│                  └─────────────┘
└─────────────────────────────────────────┘
```

## 🚀 Deployment Architecture

### Development Environment
```bash
# Local development setup
npm run dev          # Frontend on :3001
npm run start:dev    # Backend on :3000
postgresql           # Database on :5432
```

### Production Environment
```bash
# Docker production deployment
docker-compose up -d
# - Frontend served by Nginx on :3001
# - Backend API on :3000
# - PostgreSQL on :5433 (external access)
```

### Cloud Deployment Options
```
AWS:
├── EC2 Instance (Application Server)
├── RDS PostgreSQL (Database)
├── S3 Bucket (File Storage)
├── CloudFront (CDN)
└── Route 53 (DNS)

Google Cloud:
├── Compute Engine (Application Server)
├── Cloud SQL (Database)
├── Cloud Storage (File Storage)
├── Cloud CDN
└── Cloud DNS

Azure:
├── Virtual Machine (Application Server)
├── Azure Database for PostgreSQL
├── Blob Storage (File Storage)
├── Azure CDN
└── Azure DNS
```

## 📈 Performance Architecture

### Caching Strategy
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Browser   │    │   Server    │    │  Database   │
│   Cache     │    │   Cache     │    │   Cache     │
└─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │
       │ Static Assets     │ API Responses     │ Query Results
       │ (24h)             │ (5min)            │ (1min)
       │                   │                   │
       ▼                   ▼                   ▼
  Reduce Requests    Reduce Processing    Reduce DB Load
```

### Scalability Considerations
```
Horizontal Scaling:
├── Load Balancer (Nginx/HAProxy)
├── Multiple Backend Instances
├── Database Clustering
└── File Storage CDN

Vertical Scaling:
├── Increase Server Resources
├── Database Performance Tuning
├── Application Optimization
└── Memory/CPU Monitoring
```

## 🔮 Future Architecture Evolution

### Microservices Migration Path
```
Current Monolith → Microservices

┌─────────────────┐    ┌─────────────────┐
│   Monolithic    │    │  Microservices  │
│   NestJS App    │ -> │   Architecture  │
└─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────┐
                       │ API Gateway │
                       └─────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        ┌──────────┐  ┌──────────┐  ┌──────────┐
        │   Auth   │  │ Courses  │  │  Users   │
        │ Service  │  │ Service  │  │ Service  │
        └──────────┘  └──────────┘  └──────────┘
```

### Event-Driven Architecture
```
Event Bus (Redis/RabbitMQ)
       │
       ├── User Created Event
       ├── Course Enrolled Event
       ├── Assignment Submitted Event
       ├── Grade Updated Event
       └── Notification Event
```

---

**🏗️ Arsitektur yang Robust, Scalable, dan Maintainable**

**Dikembangkan dengan prinsip Clean Architecture dan Best Practices**