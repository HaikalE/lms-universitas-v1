# Setup Guide - LMS Universitas v1.0

Panduan lengkap untuk menginstall dan menjalankan LMS Universitas.

## Prerequisites

Pastikan sistem Anda memiliki:

- **Node.js** v18 atau lebih baru
- **PostgreSQL** v14 atau lebih baru
- **npm** atau **yarn**
- **Git**

## 1. Clone Repository

```bash
git clone https://github.com/HaikalE/lms-universitas-v1.git
cd lms-universitas-v1
```

## 2. Setup Database

### Install PostgreSQL

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

**macOS (dengan Homebrew):**
```bash
brew install postgresql
brew services start postgresql
```

**Windows:**
Download dan install dari [official PostgreSQL website](https://www.postgresql.org/download/windows/)

### Create Database

```bash
# Login ke PostgreSQL
sudo -u postgres psql

# Buat database dan user
CREATE DATABASE lms_db;
CREATE USER lms_user WITH ENCRYPTED PASSWORD 'lms_password';
GRANT ALL PRIVILEGES ON DATABASE lms_db TO lms_user;
\q
```

## 3. Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit file .env sesuai konfigurasi database Anda
nano .env
```

### Konfigurasi Environment (.env)

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=lms_user
DB_PASSWORD=lms_password
DB_DATABASE=lms_db

# JWT
JWT_SECRET=your-super-secret-jwt-key-here-change-this-in-production
JWT_EXPIRES_IN=7d

# App
PORT=3000
NODE_ENV=development

# File Upload
UPLOAD_DEST=./uploads
MAX_FILE_SIZE=10485760

# Cors
CORS_ORIGIN=http://localhost:3001
```

### Run Migration dan Seed

```bash
# Jalankan migration untuk membuat tabel
npm run migration:run

# Jalankan seed untuk data sample
npm run seed

# Start backend server
npm run start:dev
```

Backend akan berjalan di `http://localhost:3000`

## 4. Setup Frontend

```bash
# Buka terminal baru
cd frontend

# Install dependencies
npm install

# Start frontend server
npm start
```

Frontend akan berjalan di `http://localhost:3001`

## 5. Test Login

Setelah seed data berhasil, Anda dapat login dengan akun berikut:

### Admin
- Email: `admin@universitas.ac.id`
- Password: `admin123`

### Dosen
- Email: `dr.ahmad@universitas.ac.id`
- Password: `lecturer123`

### Mahasiswa
- Email: `andi.pratama@student.ac.id`
- Password: `student123`

## 6. Development Scripts

### Backend Scripts

```bash
# Development
npm run start:dev

# Production build
npm run build
npm run start:prod

# Database
npm run migration:run      # Jalankan migration
npm run migration:revert   # Rollback migration
npm run seed              # Jalankan seed data

# Testing
npm test
npm run test:watch
npm run test:cov
```

### Frontend Scripts

```bash
# Development
npm start

# Production build
npm run build

# Testing
npm test
npm run test:coverage
```

## 7. Troubleshooting

### Database Connection Error

1. Pastikan PostgreSQL service berjalan:
   ```bash
   # Ubuntu/Debian
   sudo systemctl status postgresql
   
   # macOS
   brew services list | grep postgresql
   ```

2. Periksa konfigurasi database di `.env`
3. Pastikan user dan database sudah dibuat

### Port Already in Use

1. Backend (port 3000):
   ```bash
   # Cari process yang menggunakan port 3000
   lsof -i :3000
   
   # Kill process
   kill -9 <PID>
   ```

2. Frontend (port 3001):
   ```bash
   # Cari process yang menggunakan port 3001
   lsof -i :3001
   
   # Kill process
   kill -9 <PID>
   ```

### Migration Error

1. Drop database dan buat ulang:
   ```sql
   DROP DATABASE lms_db;
   CREATE DATABASE lms_db;
   GRANT ALL PRIVILEGES ON DATABASE lms_db TO lms_user;
   ```

2. Jalankan migration lagi:
   ```bash
   npm run migration:run
   npm run seed
   ```

## 8. File Upload Setup

1. Buat folder uploads di backend:
   ```bash
   mkdir backend/uploads
   chmod 755 backend/uploads
   ```

2. Untuk production, gunakan cloud storage seperti AWS S3 atau Google Cloud Storage.

## 9. Production Deployment

Lihat file `docs/DEPLOYMENT.md` untuk panduan deployment ke production.

## 10. API Documentation

Setelah backend berjalan, API documentation tersedia di:
`http://localhost:3000/api/docs`

## Support

Jika mengalami masalah, silakan buat issue di repository GitHub atau hubungi tim development.
