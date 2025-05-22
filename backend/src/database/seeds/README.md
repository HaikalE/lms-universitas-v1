# Database Seeds

File ini berisi data awal untuk testing dan development.

## Cara Menjalankan Seeds

```bash
npm run seed
```

## Data yang Dibuat

### Users
- **Admin**: admin@universitas.ac.id / admin123
- **Dosen**: 
  - dr.ahmad@universitas.ac.id / lecturer123
  - dr.sari@universitas.ac.id / lecturer123  
  - prof.hendra@universitas.ac.id / lecturer123
- **Mahasiswa**: 10 mahasiswa dengan password student123
  - andi.pratama@student.ac.id
  - siti.nurhaliza@student.ac.id
  - budi.setiawan@student.ac.id
  - dll.

### Courses
- CS101 - Pengantar Ilmu Komputer (Dr. Ahmad)
- CS201 - Struktur Data dan Algoritma (Dr. Ahmad)
- CS301 - Basis Data (Dr. Sari)
- CS401 - Rekayasa Perangkat Lunak (Prof. Hendra)

### Enrollments
- Setiap course memiliki 5-6 mahasiswa yang terdaftar
- Mahasiswa dapat terdaftar di multiple courses

### Course Materials
- Berbagai jenis materi (PDF, Video, Presentation, Document)
- Materi diorganisir per minggu

### Assignments
- Assignment individual, grup, dan quiz
- Berbagai due date dan file type restrictions

### Announcements
- Pengumuman per course dan global
- Berbagai priority level

## Notes

- Password di-hash menggunakan bcrypt
- Semua user aktif secara default
- Data ini hanya untuk development, jangan digunakan di production
