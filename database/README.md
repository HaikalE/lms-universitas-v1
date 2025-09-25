# Database Export - LMS Universitas v1

## 📁 Konten Folder

Folder ini berisi export database PostgreSQL lengkap dari sistem LMS Universitas v1.

## 📄 File Export

- `lms_db_export_YYYYMMDD_HHMMSS.sql` - Complete database dump dengan:
  - Schema lengkap (tables, indexes, constraints)
  - Data lengkap dari semua tabel
  - User permissions dan roles

## 🔧 Cara Restore Database

### 1. Menggunakan Docker (Recommended)

```bash
# 1. Jalankan container PostgreSQL
docker run --name lms-postgres -e POSTGRES_PASSWORD=postgres -d -p 5433:5432 postgres:13

# 2. Copy file SQL ke container
docker cp lms_db_export_YYYYMMDD_HHMMSS.sql lms-postgres:/tmp/

# 3. Restore database
docker exec -i lms-postgres psql -U postgres -c "CREATE DATABASE lms_db;"
docker exec -i lms-postgres psql -U postgres -d lms_db -f /tmp/lms_db_export_YYYYMMDD_HHMMSS.sql
```

### 2. Menggunakan PostgreSQL Lokal

```bash
# 1. Buat database baru
createdb -U postgres lms_db

# 2. Restore dari file export
psql -U postgres -d lms_db -f lms_db_export_YYYYMMDD_HHMMSS.sql
```

## 📋 Informasi Database

- **Database Engine**: PostgreSQL 13
- **Database Name**: lms_db
- **Default User**: postgres
- **Port**: 5432 (dalam container), 5433 (host)

## 📊 Struktur Database

Database ini berisi tabel-tabel untuk:
- User management (students, lecturers, admin)
- Course management
- Assignment & grading system
- Forum & discussion
- Video content & progress tracking
- Attendance system
- Draft system

## 🔐 Keamanan

- Pastikan untuk mengganti password default setelah restore
- Sesuaikan user permissions sesuai kebutuhan environment
- Backup database secara berkala

## 📅 Export Info

- **Export Date**: September 25, 2025
- **Export Method**: pg_dump
- **Format**: Plain SQL