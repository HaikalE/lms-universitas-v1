# Quick Start Guide - LMS Universitas v1.0

Panduan cepat untuk menjalankan LMS Universitas dalam 5 menit! 🚀

## 🎯 Tujuan
Menjalankan LMS Universitas v1.0 secepat mungkin untuk testing dan development.

## ⚡ Metode 1: Docker (Tercepat - 2 menit)

### Prerequisites
- Docker dan Docker Compose terinstall

### Langkah-langkah

```bash
# 1. Clone repository
git clone https://github.com/HaikalE/lms-universitas-v1.git
cd lms-universitas-v1

# 2. Start dengan Docker
docker-compose up --build -d

# 3. Tunggu hingga semua container running
docker-compose logs -f
```

**Selesai!** Buka http://localhost:3001

## ⚡ Metode 2: Script Otomatis (3 menit)

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Git

### Langkah-langkah

```bash
# 1. Clone repository
git clone https://github.com/HaikalE/lms-universitas-v1.git
cd lms-universitas-v1

# 2. Jalankan setup otomatis
chmod +x scripts/setup.sh
./scripts/setup.sh

# 3. Start development server
./start-dev.sh
```

**Selesai!** 
- Frontend: http://localhost:3001
- Backend: http://localhost:3000

## ⚡ Metode 3: Manual Cepat (5 menit)

### 1. Setup Database (1 menit)

```bash
# Login ke PostgreSQL
sudo -u postgres psql

# Buat database dan user
CREATE DATABASE lms_db;
CREATE USER lms_user WITH ENCRYPTED PASSWORD 'lms_password';
GRANT ALL PRIVILEGES ON DATABASE lms_db TO lms_user;
\q
```

### 2. Setup Backend (2 menit)

```bash
cd backend

# Install dependencies
npm install

# Copy environment
cp .env.example .env

# Run migrations dan seed
npm run migration:run
npm run seed

# Start backend
npm run start:dev
```

### 3. Setup Frontend (2 menit)

```bash
# Terminal baru
cd frontend

# Install dependencies
npm install

# Start frontend
npm start
```

## 🔐 Login Test

Setelah aplikasi berjalan, buka http://localhost:3001 dan login dengan:

### Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@universitas.ac.id | admin123 |
| **Dosen** | dr.ahmad@universitas.ac.id | lecturer123 |
| **Mahasiswa** | andi.pratama@student.ac.id | student123 |

## ✅ Verifikasi Setup

### Cek Backend
```bash
# Health check
curl http://localhost:3000/api/health

# Login test
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@universitas.ac.id","password":"admin123"}'
```

### Cek Frontend
- Buka http://localhost:3001
- Pastikan halaman login muncul
- Test login dengan akun demo

### Cek Database
```bash
# Connect ke database
psql -h localhost -U lms_user -d lms_db

# List tables
\dt

# Count users
SELECT COUNT(*) FROM users;
```

## 🎉 Selesai!

Jika semua berjalan dengan baik, Anda sekarang memiliki:

✅ **Backend API** running di port 3000  
✅ **Frontend Web** running di port 3001  
✅ **PostgreSQL Database** dengan sample data  
✅ **Demo accounts** untuk testing  
✅ **File upload** system ready  
✅ **Complete LMS features** available  

## 🔄 Next Steps

1. **Explore Features**: Login dengan role berbeda untuk explore fitur
2. **Read Documentation**: Lihat `docs/` untuk panduan lengkap
3. **Customize**: Edit environment variables sesuai kebutuhan
4. **Develop**: Mulai development dengan hot reload enabled

## 🆘 Troubleshooting Cepat

### Port Conflict
```bash
# Kill process di port 3000/3001
kill -9 $(lsof -ti:3000)
kill -9 $(lsof -ti:3001)
```

### Database Connection Error
```bash
# Start PostgreSQL
sudo systemctl start postgresql

# Check status
sudo systemctl status postgresql
```

### Reset Everything
```bash
# Stop all
docker-compose down  # jika pakai Docker
# atau
pkill -f "node"      # jika manual

# Reset database
./scripts/reset-db.sh

# Restart
./start-dev.sh
```

## 📱 Mobile Testing

Untuk test di mobile device:

```bash
# Find your IP
ifconfig | grep inet

# Update CORS di backend/.env
CORS_ORIGIN=http://YOUR-IP:3001

# Akses dari mobile
http://YOUR-IP:3001
```

## 🎯 Quick Demo Script

Untuk demo cepat, ikuti skenario ini:

### 1. Login sebagai Admin
- Login: admin@universitas.ac.id / admin123
- Explore dashboard admin
- Lihat user management
- Lihat course management

### 2. Login sebagai Dosen
- Login: dr.ahmad@universitas.ac.id / lecturer123
- Lihat dashboard dosen
- Explore course materials
- Lihat assignments dan submissions

### 3. Login sebagai Mahasiswa
- Login: andi.pratama@student.ac.id / student123
- Lihat dashboard mahasiswa
- Download course materials
- Submit assignment
- Participate in forum

## 📊 Sample Data

Setelah seed, tersedia:
- **13 Users**: 1 admin, 3 dosen, 10 mahasiswa
- **4 Courses**: Computer Science courses
- **4 Course Materials**: PDF, video, presentation samples
- **3 Assignments**: Individual, quiz, group project
- **3 Announcements**: Different priority levels
- **Course Enrollments**: Students enrolled in multiple courses

## 🚀 Production Deployment

Untuk production deployment:

```bash
# Build production
./build-prod.sh

# Deploy dengan Docker
docker-compose -f docker-compose.prod.yml up -d
```

Lihat [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) untuk panduan lengkap.

---

**Happy coding! 🎉**

Jika ada masalah, check [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) atau create issue di GitHub.
