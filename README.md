# LMS Universitas v1.0 🎓

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-blue.svg)](https://postgresql.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue.svg)](https://typescriptlang.org/)

Learning Management System untuk Universitas yang dibangun dengan teknologi modern. Sistem ini menyediakan platform pembelajaran online yang lengkap untuk mahasiswa, dosen, dan administrator.

## ✨ Fitur Utama

### 👨‍🎓 Untuk Mahasiswa
- 📊 **Dashboard Personal** dengan overview mata kuliah dan tugas
- 📚 **Akses Materi** pembelajaran (PDF, video, dokumen, presentasi)
- 📝 **Pengumpulan Tugas** dengan file upload
- 💬 **Forum Diskusi** per mata kuliah
- 📈 **Lihat Nilai** tugas dan ujian
- 👥 **Daftar Teman Sekelas** dengan pencarian
- 🔔 **Notifikasi** untuk tugas baru dan pengumuman

### 👨‍🏫 Untuk Dosen
- 🏫 **Manajemen Mata Kuliah** dan struktur materi
- 📋 **Membuat dan Mengelola Tugas** dengan berbagai tipe
- ✅ **Sistem Penilaian** dengan feedback
- 📢 **Pengumuman** untuk kelas
- 👥 **Manajemen Mahasiswa** lengkap dengan:
  - ➕ Pendaftaran mahasiswa (individual/bulk)
  - 🔍 Pencarian dan filter mahasiswa
  - 📊 Statistik kelas real-time
  - 📁 Export data mahasiswa
  - 🗑️ Penghapusan mahasiswa dari kelas
- 📊 **Analytics** performa mahasiswa

### 👨‍💼 Untuk Administrator
- 👤 **Manajemen Pengguna** (mahasiswa, dosen, admin)
- 📚 **Manajemen Mata Kuliah** dan kelas
- 📊 **Pendaftaran Mahasiswa** ke mata kuliah dengan bulk operations
- 🔧 **Pengaturan Sistem** dan monitoring
- 🗄️ **Backup & Restore** data

## 🆕 New Features (v1.0.1)

### 🎯 **Fitur Pengelolaan Mahasiswa yang Lengkap**
Sistem pengelolaan mahasiswa yang telah diimplementasikan secara komprehensif:

#### **Untuk Dosen & Admin:**
- **Tambah Mahasiswa**: 
  - 📧 Tambah via email individual
  - 📋 Bulk selection dari daftar mahasiswa tersedia
  - ✅ Validasi otomatis dan duplicate prevention
- **Kelola Daftar Mahasiswa**:
  - 🔍 Search real-time berdasarkan nama, NIM, atau email
  - 🗂️ Sorting by nama, NIM, atau tanggal daftar
  - 📄 Pagination untuk handling data besar
- **Analytics & Export**:
  - 📊 Statistik real-time (total, aktif, pendaftar baru)
  - 📁 Export ke CSV untuk Excel
  - 📈 Tracking enrollment history
- **Advanced Management**:
  - 🗑️ Remove mahasiswa dari kelas
  - 👁️ View detail mahasiswa
  - 🔄 Bulk operations untuk multiple mahasiswa

#### **Untuk Mahasiswa:**
- 👥 **Lihat Teman Sekelas**: Akses daftar mahasiswa dalam kelas yang sama
- 🔍 **Pencarian Mahasiswa**: Cari teman sekelas dengan mudah
- 📇 **Info Kontak**: Lihat email dan informasi kontak teman

## 🛠️ Teknologi

### Backend
- **NestJS** - Framework Node.js yang powerful
- **TypeORM** - ORM untuk PostgreSQL dengan migrations
- **PostgreSQL** - Database relasional yang robust
- **JWT** - Authentication dan authorization
- **Multer** - File upload handling
- **TypeScript** - Type safety

### Frontend
- **React 18** - Library UI yang modern
- **TypeScript** - Type safety untuk frontend
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **React Query** - Server state management
- **Axios** - HTTP client

### Database
- **PostgreSQL 14+** dengan skema yang terstruktur
- **TypeORM Migrations** untuk version control database
- **Relasi Lengkap** antar entitas dengan junction tables
- **Indexing** untuk performa optimal

## 🚀 Quick Start

### Metode 1: Setup Otomatis (Recommended)

```bash
# Clone repository
git clone https://github.com/HaikalE/lms-universitas-v1.git
cd lms-universitas-v1

# Jalankan setup otomatis
chmod +x scripts/setup.sh
./scripts/setup.sh

# Start development server
./start-dev.sh
```

### Metode 2: Docker (Paling Mudah)

```bash
# Clone repository
git clone https://github.com/HaikalE/lms-universitas-v1.git
cd lms-universitas-v1

# Start dengan Docker
chmod +x start-docker.sh
./start-docker.sh
```

### Metode 3: Manual Setup

```bash
# 1. Setup Database
sudo -u postgres psql
CREATE DATABASE lms_db;
CREATE USER lms_user WITH ENCRYPTED PASSWORD 'lms_password';
GRANT ALL PRIVILEGES ON DATABASE lms_db TO lms_user;
\q

# 2. Backend Setup
cd backend
npm install
cp .env.example .env
# Edit .env dengan konfigurasi database Anda
npm run migration:run
npm run seed
npm run start:dev

# 3. Frontend Setup (terminal baru)
cd frontend
npm install
npm start
```

## 🔐 Demo Accounts

Setelah setup, Anda dapat login dengan akun demo berikut:

| Role | Email | Password | Akses |
|------|-------|----------|-------|
| **Admin** | admin@universitas.ac.id | admin123 | Full system access |
| **Dosen** | dr.ahmad@universitas.ac.id | lecturer123 | Course management |
| **Mahasiswa** | andi.pratama@student.ac.id | student123 | Course participation |

## 📱 Akses Aplikasi

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3000/api
- **API Documentation**: http://localhost:3000/api/docs

## 📊 Database Schema

Sistem menggunakan PostgreSQL dengan relasi yang terstruktur:

```
Users (mahasiswa, dosen, admin)
├── Courses (mata kuliah)
│   ├── Course Materials (materi pembelajaran)
│   ├── Assignments (tugas)
│   │   ├── Submissions (pengumpulan tugas)
│   │   └── Grades (nilai)
│   ├── Forums & Posts (diskusi)
│   ├── Announcements (pengumuman)
│   └── Course Enrollments (pendaftaran mahasiswa) ✨ NEW
└── Notifications (notifikasi)
```

## 🗂️ Struktur Project

```
lms-universitas-v1/
├── backend/                 # NestJS Backend
│   ├── src/
│   │   ├── auth/           # Authentication
│   │   ├── users/          # User Management
│   │   ├── courses/        # Course Management
│   │   │   ├── dto/        # DTO termasuk student management ✨
│   │   │   ├── courses.controller.ts  # Endpoints student mgmt ✨
│   │   │   └── courses.service.ts     # Business logic ✨
│   │   ├── assignments/    # Assignment System
│   │   ├── forums/         # Discussion Forums
│   │   ├── announcements/  # Announcements
│   │   ├── notifications/  # Notifications
│   │   ├── uploads/        # File Upload
│   │   ├── database/       # DB Config & Migrations
│   │   └── entities/       # TypeORM Entities
│   └── uploads/           # File Storage
├── frontend/               # React Frontend
│   ├── src/
│   │   ├── components/    # UI Components
│   │   ├── pages/         # Page Components
│   │   │   └── courses/   # Course pages
│   │   │       ├── CourseDetailPage.tsx          # Tab mahasiswa ✨
│   │   │       └── CourseStudentManagementPage.tsx ✨ NEW
│   │   ├── services/      # API Services
│   │   │   └── courseService.ts  # Student mgmt APIs ✨
│   │   ├── contexts/      # React Contexts
│   │   └── types/         # TypeScript Types
│   └── build/            # Production Build
├── docs/                  # Documentation
│   └── STUDENT_MANAGEMENT_FEATURE.md ✨ NEW
├── scripts/               # Utility Scripts
└── docker-compose.yml     # Docker Config
```

## 🔧 Development Scripts

### Backend Commands
```bash
cd backend

# Development
npm run start:dev          # Start with hot reload
npm run start:debug        # Start with debugging
npm run build              # Build for production
npm run start:prod         # Start production server

# Database
npm run migration:run      # Run migrations
npm run migration:revert   # Revert last migration
npm run seed              # Seed demo data
npm run schema:drop       # Drop all tables

# Testing
npm test                  # Unit tests
npm run test:e2e         # Integration tests
npm run test:cov         # Coverage report
```

### Frontend Commands
```bash
cd frontend

# Development
npm start                 # Start dev server
npm run build            # Build for production
npm test                 # Run tests
npm run test:coverage    # Coverage report
```

### Utility Scripts
```bash
# Development
./start-dev.sh           # Start both frontend & backend
./build-prod.sh          # Build for production
./start-docker.sh        # Start with Docker

# Database
./scripts/reset-db.sh    # Reset database
./scripts/backup-db.sh   # Backup database
./scripts/restore-db.sh  # Restore from backup
```

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get current user
- `PATCH /api/auth/profile` - Update profile

### Users
- `GET /api/users` - List users (Admin)
- `POST /api/users` - Create user (Admin)
- `GET /api/users/my-courses` - Get my courses
- `POST /api/users/:id/enroll` - Enroll student (Admin)

### Courses
- `GET /api/courses` - List courses
- `POST /api/courses` - Create course (Admin)
- `GET /api/courses/:id/materials` - Get course materials
- `POST /api/courses/:id/materials` - Upload material (Lecturer)

### ✨ Student Management (New)
- `GET /api/courses/:id/students` - List course students
- `POST /api/courses/:id/students/enroll` - Enroll single student
- `POST /api/courses/:id/students/enroll-multiple` - Bulk enroll students
- `POST /api/courses/:id/students/add-by-email` - Add student by email
- `DELETE /api/courses/:id/students/:studentId` - Remove student
- `GET /api/courses/:id/students/available` - Get available students

### Assignments
- `GET /api/assignments` - List assignments
- `POST /api/assignments` - Create assignment (Lecturer)
- `POST /api/assignments/:id/submit` - Submit assignment (Student)
- `POST /api/assignments/submissions/:id/grade` - Grade submission (Lecturer)

### Forums
- `GET /api/forums/course/:id` - Get forum posts
- `POST /api/forums` - Create forum post
- `POST /api/forums/:id/like` - Like post

### Announcements
- `GET /api/announcements` - List announcements
- `POST /api/announcements` - Create announcement (Lecturer/Admin)

### Notifications
- `GET /api/notifications/my-notifications` - Get my notifications
- `PATCH /api/notifications/:id/read` - Mark as read

**Full API Documentation**: [docs/API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md)

## 📋 System Requirements

### Minimum
- **Node.js**: v18.0.0+
- **PostgreSQL**: v14.0+
- **RAM**: 4GB
- **Storage**: 20GB

### Recommended
- **Node.js**: v20.0.0+
- **PostgreSQL**: v15.0+
- **RAM**: 8GB
- **Storage**: 50GB SSD

## 🚀 Deployment

### Production dengan Docker
```bash
# Build dan deploy
docker-compose -f docker-compose.prod.yml up -d

# Dengan custom environment
cp .env.example .env.production
# Edit environment variables
docker-compose --env-file .env.production up -d
```

### Manual Deployment
Lihat panduan lengkap di [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

### Cloud Deployment
- **AWS**: EC2 + RDS PostgreSQL
- **Google Cloud**: Compute Engine + Cloud SQL
- **Azure**: VM + Azure Database for PostgreSQL
- **DigitalOcean**: Droplet + Managed Database

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm test                 # Unit tests
npm run test:e2e        # Integration tests
npm run test:cov        # Coverage report
```

### Frontend Testing
```bash
cd frontend
npm test                # Component tests
npm run test:coverage   # Coverage report
```

### API Testing
- **Postman Collection**: Import dari `docs/postman_collection.json`
- **Swagger UI**: http://localhost:3000/api/docs
- **Manual Testing**: Gunakan cURL atau API clients

## 📚 Dokumentasi

| Dokumen | Deskripsi |
|---------|-----------|
| [SETUP.md](docs/SETUP.md) | Panduan instalasi lengkap |
| [DEPLOYMENT.md](docs/DEPLOYMENT.md) | Panduan deployment production |
| [API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md) | Dokumentasi REST API |
| [FEATURES.md](docs/FEATURES.md) | Deskripsi fitur lengkap |
| [STUDENT_MANAGEMENT_FEATURE.md](STUDENT_MANAGEMENT_FEATURE.md) | ✨ Dokumentasi fitur manajemen mahasiswa |
| [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) | Panduan troubleshooting |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Panduan kontribusi |

## 🔒 Security Features

- **JWT Authentication** dengan expiration
- **Role-based Authorization** (Admin, Lecturer, Student)
- **Password Hashing** dengan bcrypt
- **Input Validation** dengan class-validator
- **SQL Injection Protection** dengan TypeORM
- **File Upload Security** dengan type validation
- **CORS Protection** yang dapat dikonfigurasi
- **Rate Limiting** untuk API endpoints
- **Permission Matrix** untuk student management ✨

## 🎯 Performance

- **Database Indexing** untuk query optimization
- **Pagination** di semua list endpoints (including student lists) ✨
- **Caching Headers** untuk static assets
- **Gzip Compression** untuk responses
- **Code Splitting** di frontend
- **Lazy Loading** untuk routes
- **Connection Pooling** untuk database
- **Bulk Operations** untuk student enrollment ✨

## 🔄 Backup & Recovery

```bash
# Backup database
./scripts/backup-db.sh

# Restore database
./scripts/restore-db.sh backups/lms_backup_20240522.sql

# Reset database to initial state
./scripts/reset-db.sh
```

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**
   ```bash
   # Check PostgreSQL service
   sudo systemctl status postgresql
   sudo systemctl start postgresql
   ```

2. **Port Already in Use**
   ```bash
   # Kill process on port 3000
   kill -9 $(lsof -ti:3000)
   ```

3. **Migration Failed**
   ```bash
   # Reset database
   ./scripts/reset-db.sh
   ```

4. **Student Management Issues** ✨
   ```bash
   # Check junction table
   sudo -u postgres psql lms_db
   SELECT * FROM course_enrollments;
   
   # Verify user roles
   SELECT id, fullName, role FROM users WHERE role = 'student';
   ```

Lihat panduan lengkap di [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)

## 🤝 Contributing

Kami menyambut kontribusi dari komunitas! 

1. Fork repository ini
2. Buat feature branch (`git checkout -b feature/amazing-feature`)
3. Commit perubahan (`git commit -m 'Add amazing feature'`)
4. Push ke branch (`git push origin feature/amazing-feature`)
5. Buka Pull Request

Lihat [CONTRIBUTING.md](CONTRIBUTING.md) untuk panduan lengkap.

## 📄 License

Project ini menggunakan [MIT License](LICENSE). Anda bebas menggunakan, memodifikasi, dan mendistribusikan sesuai dengan ketentuan lisensi.

## 🆘 Support

- **GitHub Issues**: [Create Issue](https://github.com/HaikalE/lms-universitas-v1/issues)
- **Documentation**: Periksa folder `docs/`
- **Community**: Join diskusi di GitHub Discussions

## 🎉 Acknowledgments

- **NestJS Team** untuk framework yang powerful
- **React Team** untuk library UI yang amazing
- **TypeORM Team** untuk ORM yang excellent
- **Tailwind CSS** untuk utility-first CSS framework
- **PostgreSQL Community** untuk database yang robust

## 🗺️ Roadmap

### Version 1.1 (Coming Soon)
- 🔄 Real-time notifications dengan WebSocket
- 📧 Email notification integration
- 🔍 Advanced search dengan Elasticsearch
- 📱 Progressive Web App features
- 🔐 Two-factor authentication
- 📊 Enhanced student analytics & reporting

### Version 1.2
- 🎥 Video conferencing integration
- 📊 Advanced analytics dashboard
- 📱 Mobile app (React Native)
- 🌐 Multi-language support
- 🤖 AI-powered recommendations
- 🎓 Student performance predictions

### Version 2.0
- 🏗️ Microservices architecture
- ☁️ Cloud-native deployment
- 🧠 Machine learning integration
- 🔗 Blockchain certificates
- 🥽 VR/AR learning experiences

---

<div align="center">

**⭐ Star repository ini jika membantu! ⭐**

[🌟 Star](https://github.com/HaikalE/lms-universitas-v1/stargazers) • [🍴 Fork](https://github.com/HaikalE/lms-universitas-v1/fork) • [🐛 Issues](https://github.com/HaikalE/lms-universitas-v1/issues) • [💬 Discussions](https://github.com/HaikalE/lms-universitas-v1/discussions)

**Dibuat dengan ❤️ untuk pendidikan Indonesia**

</div>
