# LMS Universitas v1.0

Learning Management System untuk Universitas dengan fitur lengkap untuk mahasiswa, dosen, dan administrator.

## 🚀 Teknologi yang Digunakan

### Backend
- **NestJS** - Framework Node.js yang powerful untuk REST API
- **TypeORM** - ORM untuk PostgreSQL dengan fitur migration
- **PostgreSQL** - Database relasional yang robust
- **JWT** - Autentikasi dan authorization
- **Multer** - File upload handling

### Frontend
- **React** - Library UI yang modern dan responsive
- **TypeScript** - Type safety untuk development yang lebih aman
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Axios** - HTTP client untuk API calls

## 📋 Fitur Utama

### Untuk Mahasiswa
- 📊 Dashboard personal dengan overview mata kuliah
- 📚 Akses dan download materi pembelajaran
- 📝 Pengumpulan tugas dengan file upload
- 💬 Forum diskusi per mata kuliah
- 📈 Melihat nilai tugas dan ujian
- 🔔 Notifikasi tugas baru dan pengumuman

### Untuk Dosen
- 🏫 Manajemen mata kuliah dan materi
- 📋 Membuat dan mengelola tugas
- ✅ Penilaian dan feedback untuk mahasiswa
- 📢 Pengumuman untuk kelas
- 👥 Manajemen peserta kelas

### Untuk Administrator
- 👤 Manajemen pengguna (mahasiswa, dosen, admin)
- 📚 Manajemen mata kuliah dan kelas
- 📊 Pendaftaran mahasiswa ke mata kuliah
- 🔧 Pengaturan sistem dan backup

## 🛠️ Instalasi dan Setup

### Prerequisites
- Node.js (v18 atau lebih baru)
- PostgreSQL (v14 atau lebih baru)
- npm atau yarn

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env dengan konfigurasi database Anda
npm run migration:run
npm run seed
npm run start:dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

## 📊 Database Schema

Database menggunakan PostgreSQL dengan relasi yang terstruktur:
- Users (mahasiswa, dosen, admin)
- Courses (mata kuliah)
- Course Materials (materi pembelajaran)
- Assignments (tugas)
- Submissions (pengumpulan tugas)
- Grades (nilai)
- Forums & Posts (diskusi)
- Announcements (pengumuman)

## 🔧 Development

### Running Tests
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

### Database Migrations
```bash
# Generate migration
npm run migration:generate

# Run migrations
npm run migration:run

# Revert migration
npm run migration:revert
```

## 📁 Struktur Project

```
lms-universitas-v1/
├── backend/
│   ├── src/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── courses/
│   │   ├── assignments/
│   │   ├── forums/
│   │   └── database/
│   └── uploads/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   └── services/
└── docs/
```

## 🚀 Deployment

### Environment Variables
Pastikan untuk mengatur environment variables yang sesuai untuk production:
- `NODE_ENV=production`
- `JWT_SECRET` dengan nilai yang aman
- Database credentials yang sesuai

### Build untuk Production
```bash
# Backend
cd backend
npm run build

# Frontend
cd frontend
npm run build
```

## 📝 API Documentation

API endpoint lengkap tersedia di `/api/docs` setelah menjalankan backend server.

## 🤝 Contributing

1. Fork repository ini
2. Buat branch feature (`git checkout -b feature/amazing-feature`)
3. Commit perubahan (`git commit -m 'Add amazing feature'`)
4. Push ke branch (`git push origin feature/amazing-feature`)
5. Buka Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## 👥 Team

- Backend Developer
- Frontend Developer  
- Database Designer
- UI/UX Designer

---

⭐ **Star repository ini jika membantu!**
