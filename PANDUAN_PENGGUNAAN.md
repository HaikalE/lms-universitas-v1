# 📖 Panduan Penggunaan LMS Universitas v1.0

## 🎯 Panduan Lengkap untuk Semua Pengguna

Panduan ini menjelaskan cara menggunakan setiap fitur dalam LMS Universitas v1.0 dengan contoh praktis dan screenshot workflow.

## 🚀 Quick Start - Akses Pertama Kali

### 1. Akses Aplikasi
```
URL: http://localhost:3001
atau http://your-domain.com
```

### 2. Demo Accounts untuk Testing
| Role | Email | Password | Deskripsi |
|------|-------|----------|-----------|
| **Admin** | admin@universitas.ac.id | admin123 | Akses penuh sistem |
| **Dosen** | dr.ahmad@universitas.ac.id | lecturer123 | Manage mata kuliah |
| **Mahasiswa** | andi.pratama@student.ac.id | student123 | Akses pembelajaran |

### 3. Halaman Login
```
┌─────────────────────────────────────────┐
│           🎓 LMS Universitas            │
│                                         │
│  Email: [____________________]          │
│  Password: [_________________]          │
│                                         │
│           [ Login ]                     │
│                                         │
│  Lupa Password? | Daftar Akun Baru      │
└─────────────────────────────────────────┘
```

## 👨‍💼 Panduan untuk Administrator

### Dashboard Admin
Setelah login sebagai admin, Anda akan melihat:

```
┌─────────────────────────────────────────────────────────┐
│  🏠 Dashboard  👤 Users  📚 Courses  📊 Analytics      │
├─────────────────────────────────────────────────────────┤
│  📊 Statistik Sistem                                    │
│  ├── Total Users: 150                                  │
│  ├── Total Courses: 25                                 │
│  ├── Active Students: 120                              │
│  └── Active Lecturers: 15                              │
│                                                         │
│  📈 Activity Chart                                      │
│  [████████████████████░░░░░]                           │
└─────────────────────────────────────────────────────────┘
```

### A. Manajemen Pengguna

#### 1. Membuat Pengguna Baru
1. **Navigasi**: Dashboard → Users → "Tambah User"
2. **Isi Form**:
   ```
   Nama Lengkap: [Dr. Budi Santoso]
   Email: [budi.santoso@universitas.ac.id]
   Password: [Generate atau manual]
   Role: [Dosen ▼]
   NIDN: [1234567890] (untuk dosen)
   NIM: [20230001] (untuk mahasiswa)
   ```
3. **Klik "Simpan"**

#### 2. Bulk Import Pengguna
1. **Download Template**: Klik "Download Template CSV"
2. **Isi Data** dalam Excel:
   ```csv
   fullName,email,role,studentId,lecturerId
   Andi Pratama,andi@student.ac.id,student,20230001,
   Dr. Ahmad,ahmad@lecturer.ac.id,lecturer,,123456789
   ```
3. **Upload File**: Drag & drop atau browse file
4. **Review & Import**: Cek data, lalu klik "Import"

### B. Manajemen Mata Kuliah

#### 1. Membuat Mata Kuliah Baru
1. **Navigasi**: Dashboard → Courses → "Tambah Mata Kuliah"
2. **Isi Form**:
   ```
   Kode MK: [CS101]
   Nama: [Algoritma dan Struktur Data]
   Deskripsi: [Mata kuliah dasar programming...]
   SKS: [3 ▼]
   Semester: [Ganjil 2024/2025 ▼]
   Dosen: [Dr. Ahmad ▼]
   ```
3. **Klik "Buat Mata Kuliah"**

#### 2. Bulk Enrollment Mahasiswa
1. **Buka Course**: Klik mata kuliah yang diinginkan
2. **Tab Students**: Klik tab "Mahasiswa"
3. **Add Students**: Klik "Tambah Mahasiswa"
4. **Pilih Method**:
   - **Individual**: Search dan pilih mahasiswa satu per satu
   - **Bulk Selection**: Centang multiple mahasiswa sekaligus
   - **CSV Import**: Upload file CSV dengan list mahasiswa

### C. Monitoring & Analytics
1. **System Health**: Monitor status server, database, dan storage
2. **User Activity**: Tracking login, course access, submission
3. **Performance Metrics**: Response time, error rates
4. **Reports**: Generate laporan bulanan/semester

## 👨‍🏫 Panduan untuk Dosen

### Dashboard Dosen
```
┌─────────────────────────────────────────────────────────┐
│  🏠 Dashboard  📚 My Courses  📝 Assignments  📊 Grades │
├─────────────────────────────────────────────────────────┤
│  📚 Mata Kuliah Saya                                    │
│  ┌─────────────────┐  ┌─────────────────┐              │
│  │  CS101          │  │  CS201          │              │
│  │  Algoritma      │  │  Database       │              │
│  │  25 students    │  │  30 students    │              │
│  │  [Kelola]       │  │  [Kelola]       │              │
│  └─────────────────┘  └─────────────────┘              │
│                                                         │
│  📋 Tugas Pending Review: 5                            │
│  🔔 Notifikasi Baru: 3                                 │
└─────────────────────────────────────────────────────────┘
```

### A. Mengelola Mata Kuliah

#### 1. Setup Struktur Mata Kuliah
1. **Buka Course**: Klik mata kuliah yang ingin dikelola
2. **Tab Materi**: Organize materi per minggu
   ```
   Minggu 1: Pengenalan Algoritma
   ├── 📄 Slide Pengenalan.pdf
   ├── 🎥 Video Lecture Part 1
   ├── 📖 Reading Assignment
   └── 🔗 Link ke Resources Online
   
   Minggu 2: Array dan String
   ├── 📄 Materi Array.pdf
   ├── 🎥 Demo Coding Array
   └── 💻 Lab Exercise
   ```

#### 2. Upload Materi Pembelajaran
1. **Klik "Tambah Materi"**
2. **Pilih Tipe Materi**:
   - **File**: PDF, DOC, PPT (max 50MB)
   - **Video**: Upload atau embed link
   - **Link**: External resources
   - **Text**: Rich text content

3. **Isi Detail**:
   ```
   Title: [Slide Pengenalan Algoritma]
   Deskripsi: [Materi pengenalan konsep dasar algoritma...]
   Minggu: [1 ▼]
   Order: [1]
   Visibility: [✅ Visible to students]
   
   📎 Upload File: [Browse atau Drag & Drop]
   ```

#### 3. ✨ Mengaktifkan Video Attendance
Untuk video yang ingin dijadikan trigger absensi:

1. **Upload Video**: Seperti langkah di atas
2. **Scroll ke "Pengaturan Absensi Otomatis"**
3. **Toggle "Attendance Trigger" = ON**
4. **Set Threshold**: 80% (recommended)
5. **Simpan**

**Hasilnya**: Mahasiswa yang menonton ≥80% video otomatis terabsen hadir.

### B. Manajemen Mahasiswa

#### 1. Lihat Daftar Mahasiswa
```
┌─────────────────────────────────────────────────────────┐
│  🔍 Search: [_____________] 🔄 Sort: [Name ▼]           │
├─────────────────────────────────────────────────────────┤
│  📊 Stats: 25 Total | 23 Active | 2 New This Week      │
├─────────────────────────────────────────────────────────┤
│  ☑️  Andi Pratama     20230001   andi@student.ac.id     │
│  ☑️  Budi Setiawan    20230002   budi@student.ac.id     │
│  ☑️  Citra Dewi       20230003   citra@student.ac.id    │
│                                                         │
│  [➕ Add Student] [📤 Export CSV] [🗑️ Remove Selected]  │
└─────────────────────────────────────────────────────────┘
```

#### 2. Menambah Mahasiswa
**Method 1: Search & Add**
1. Klik "Add Student"
2. Search mahasiswa by nama/NIM/email
3. Pilih dari hasil search
4. Klik "Enroll"

**Method 2: Bulk Enrollment**
1. Klik "Add Student" → "Bulk Add"
2. Centang multiple mahasiswa
3. Klik "Enroll Selected"

**Method 3: Add by Email**
1. Klik "Add by Email"
2. Masukkan email mahasiswa
3. Sistem akan cari dan enroll otomatis

### C. Membuat dan Mengelola Tugas

#### 1. Membuat Assignment Baru
1. **Tab Assignments** → "Buat Tugas Baru"
2. **Basic Info**:
   ```
   Judul: [Implementasi Array dan Sorting]
   Deskripsi: [Buat program untuk mengimplementasikan...]
   Tipe: [Individual Assignment ▼]
   ```

3. **Timeline**:
   ```
   Due Date: [2024-12-01 23:59]
   ☑️ Allow Late Submission
   Late Penalty: [10]% per hari
   ```

4. **File Settings**:
   ```
   Allowed Types: [.java, .cpp, .py, .zip]
   Max File Size: [10] MB
   Max Files: [3]
   ```

5. **Grading**:
   ```
   Max Score: [100] points
   ☑️ Auto Grade (untuk quiz)
   Grading Rubric: [Upload rubric.pdf]
   ```

#### 2. Menilai Tugas Mahasiswa
1. **Tab Assignments** → Pilih assignment
2. **Tab Submissions**:
   ```
   ┌─────────────────────────────────────────────────┐
   │  Andi Pratama  |  Submitted  |  [Grade]        │
   │  📎 solution.java (uploaded 2 hours ago)       │
   │  💬 "Pak, ini solusi saya untuk soal array"    │
   └─────────────────────────────────────────────────┘
   ```

3. **Klik "Grade"**:
   ```
   Score: [85]/100
   Feedback: [Good implementation, but optimize 
             the sorting algorithm for better performance...]
   
   [Save Grade]
   ```

### D. Forum & Diskusi

#### 1. Monitoring Forum Activity
1. **Tab Forum**: Lihat semua diskusi dalam mata kuliah
2. **Recent Posts**: Diskusi terbaru yang perlu perhatian
3. **Moderation**: Hapus/edit post yang tidak sesuai

#### 2. Memulai Diskusi
1. **Klik "New Discussion"**
2. **Post Content**:
   ```
   Subject: [Diskusi Minggu 3: Kompleksitas Algoritma]
   Content: [Silakan diskusikan implementasi binary search
            yang telah kalian buat. Apa challengenya?]
   
   📎 Attach: [code_example.java]
   ```

## 👨‍🎓 Panduan untuk Mahasiswa

### Dashboard Mahasiswa
```
┌─────────────────────────────────────────────────────────┐
│  🏠 Dashboard  📚 Courses  📝 Assignments  💬 Forums    │
├─────────────────────────────────────────────────────────┤
│  📚 Mata Kuliah Aktif                                   │
│  ┌─────────────────┐  ┌─────────────────┐              │
│  │  CS101          │  │  MAT201         │              │
│  │  📊 Progress:   │  │  📊 Progress:   │              │
│  │  ████████░░ 80% │  │  ██████░░░░ 60% │              │
│  └─────────────────┘  └─────────────────┘              │
│                                                         │
│  ⏰ Upcoming Deadlines:                                 │
│  • Array Assignment (CS101) - 2 hari lagi              │
│  • Calculus Quiz (MAT201) - 5 hari lagi                │
│                                                         │
│  🔔 Notifications: 3 new                               │
└─────────────────────────────────────────────────────────┘
```

### A. Mengakses Materi Pembelajaran

#### 1. Navigate ke Course
1. **Dashboard** → **Courses** → Pilih mata kuliah
2. **Tab Materials**: Lihat materi per minggu

#### 2. Download/View Materials
```
📚 Minggu 1: Pengenalan Algoritma
├── 📄 Slide Pengenalan.pdf [Download] [View]
├── 🎥 Video Lecture Part 1 [▶️ Play] Progress: 100% ✅
├── 📖 Reading Chapter 1 [View Online]
└── 🔗 Additional Resources [Open Link]
```

#### 3. ✨ Video Learning dengan Auto Attendance
1. **Klik video pembelajaran**
2. **Watch video** (sistem track progress otomatis)
3. **Progress bar** menunjukkan berapa persen sudah ditonton
4. **Auto attendance** tercatat setelah menonton ≥80%

**Contoh Progress Tracking**:
```
🎥 Video Lecture: Introduction to Arrays
Progress: ████████████████████░░░░░░ 80%
⏱️ Watched: 24 min of 30 min
✅ Attendance: Marked (auto)
```

### B. Mengerjakan dan Mengumpulkan Tugas

#### 1. Lihat Assignment Details
1. **Tab Assignments** → Pilih tugas
2. **Assignment Info**:
   ```
   📝 Implementasi Array dan Sorting
   
   📅 Due: Dec 1, 2024 at 11:59 PM (3 hari lagi)
   📊 Max Score: 100 points
   📎 File Types: .java, .cpp, .py, .zip
   📏 Max Size: 10 MB
   
   📋 Instructions:
   Implementasikan algoritma sorting (bubble, selection, 
   insertion) dan bandingkan performanya...
   ```

#### 2. Submit Assignment
1. **Klik "Submit Assignment"**
2. **Upload Files**:
   ```
   📎 Choose Files: [Browse] atau [Drag & Drop]
   
   Selected Files:
   ✅ ArraySorting.java (2.3 MB)
   ✅ TestResults.txt (45 KB)
   ✅ Documentation.pdf (1.2 MB)
   ```

3. **Add Description**:
   ```
   Submission Comments:
   [Pak, ini implementasi saya. Saya menggunakan 
   bubble sort dan insertion sort. Test case 
   sudah saya lampirkan dalam file terpisah.]
   ```

4. **Submit**: Klik "Submit Assignment"

#### 3. Track Submission Status
```
📝 My Submissions
┌─────────────────────────────────────────────────┐
│  Implementasi Array dan Sorting                 │
│  Status: ✅ Submitted                           │
│  Submitted: Nov 28, 2024 at 3:45 PM            │
│  Files: 3 files uploaded                       │
│  Grade: ⏳ Pending                              │
└─────────────────────────────────────────────────┘
```

### C. Berpartisipasi dalam Forum

#### 1. Browse Forum Discussions
```
💬 CS101 - Forum Diskusi
┌─────────────────────────────────────────────────┐
│  📌 Pinned: Peraturan Forum                     │
│  🔥 Hot: Bantuan Debug Array Implementation     │
│  💡 Tips: Optimasi Algoritma Sorting            │
│  ❓ Q&A: Complexity Analysis                    │
└─────────────────────────────────────────────────┘
```

#### 2. Post New Discussion
1. **Klik "New Post"**
2. **Create Post**:
   ```
   Subject: [Bantuan: Error di Array Implementation]
   
   Content: [Halo teman-teman, saya mengalami error saat 
   implement bubble sort. Code saya seperti ini:
   
   ```java
   public void bubbleSort(int[] arr) {
       // code here
   }
   ```
   
   Error messagenya: ArrayIndexOutOfBoundsException...
   Ada yang bisa bantu?]
   
   📎 Attach: [my_code.java]
   ```

#### 3. Reply to Discussions
1. **Buka post yang ingin direply**
2. **Scroll ke comment section**
3. **Write reply**:
   ```
   💬 Your Reply:
   [Hi Andi, coba cek loop condition-nya. Kayaknya 
   ada issue di batas array. Coba ganti i < arr.length-1]
   
   [Post Reply]
   ```

### D. Melihat Nilai dan Progress

#### 1. Grade Dashboard
```
📊 My Grades - CS101
┌─────────────────────────────────────────────────┐
│  Assignment 1: Array Implementation             │
│  Grade: 85/100 ⭐⭐⭐⭐☆                        │
│  Feedback: Good work, optimize sorting algo     │
│                                                 │
│  Quiz 1: Basic Algorithms                      │
│  Grade: 92/100 ⭐⭐⭐⭐⭐                       │
│  Feedback: Excellent understanding             │
│                                                 │
│  Current Average: 88.5/100                     │
└─────────────────────────────────────────────────┘
```

#### 2. Progress Tracking
```
📈 Learning Progress
Course: CS101 - Algoritma dan Struktur Data

Materials Completed: ████████████████████░░ 80%
Assignments Submitted: ██████████████████████ 100%
Forum Participation: ████████████░░░░░░░░░░ 60%
Attendance Rate: ████████████████████████░░ 95%

Overall Progress: ████████████████████░░░░ 85%
```

## 🔔 Sistem Notifikasi

### Jenis Notifikasi
1. **📝 Assignment Notifications**:
   - Tugas baru tersedia
   - Deadline approaching (24h, 1h)
   - Grade released

2. **📚 Course Notifications**:
   - Materi baru diupload
   - Pengumuman dari dosen
   - Schedule changes

3. **💬 Forum Notifications**:
   - Reply pada post Anda
   - New post in subscribed topics
   - Mentions (@username)

4. **✅ Attendance Notifications**:
   - Attendance marked (auto from video)
   - Missing attendance warnings

### Notification Center
```
🔔 Notifications (3 new)
┌─────────────────────────────────────────────────┐
│  🆕 New assignment in CS101                     │
│     "Database Design Project" - Due: Dec 15     │
│     2 hours ago                                 │
│                                                 │
│  ✅ Attendance marked                           │
│     CS101 - Week 5 (Video completion)          │
│     1 day ago                                   │
│                                                 │
│  💬 New reply in forum                          │
│     "Your post about sorting algorithms"        │
│     3 days ago                                  │
└─────────────────────────────────────────────────┘
```

## 📱 Mobile Experience

### Responsive Design
LMS Universitas v1.0 fully responsive untuk semua device:

**Desktop (1920x1080)**
```
┌─────────────────────────────────────────────────────────┐
│  Navigation | Main Content Area    | Sidebar           │
│  (sidebar)  | (assignments, etc)   | (notifications)   │
└─────────────────────────────────────────────────────────┘
```

**Tablet (768x1024)**
```
┌─────────────────────────────────┐
│  Top Navigation Bar             │
├─────────────────────────────────┤
│  Main Content                   │
│  (full width)                   │
│                                 │
└─────────────────────────────────┘
```

**Mobile (375x667)**
```
┌─────────────────┐
│  🍔 Menu        │
├─────────────────┤
│  Content        │
│  (stacked)      │
│                 │
│                 │
└─────────────────┘
```

## 🆘 Troubleshooting Common Issues

### 1. Cannot Access Course Materials
**Problem**: Error 403 atau materials tidak muncul
**Solution**:
1. Check enrollment status
2. Contact dosen untuk enrollment
3. Clear browser cache

### 2. File Upload Failed
**Problem**: Assignment submission gagal
**Solution**:
1. Check file size (<10MB)
2. Check file type (sesuai requirement)
3. Try different browser
4. Check internet connection

### 3. Video Attendance Not Recorded
**Problem**: Sudah nonton video 100% tapi attendance tidak tercatat
**Solution**:
1. Pastikan video memiliki "Attendance Trigger" aktif
2. Contact dosen untuk enable attendance trigger
3. Manual trigger attendance (dosen bisa lakukan)

### 4. Forum Post Not Showing
**Problem**: Post forum tidak muncul setelah submit
**Solution**:
1. Refresh halaman
2. Check apakah ada moderation queue
3. Pastikan konten sesuai guidelines

### 5. Grades Not Updated
**Problem**: Nilai tidak muncul setelah submission
**Solution**:
1. Wait for dosen grading (biasanya 3-7 hari)
2. Check submission status
3. Contact dosen jika urgent

## 📞 Support & Help

### Getting Help
1. **Built-in Help**: Klik ❓ icon di setiap halaman
2. **Forum Help**: Post di forum umum
3. **Contact Admin**: Email admin@universitas.ac.id
4. **Documentation**: Baca folder `docs/`
5. **GitHub Issues**: Report bugs di GitHub repository

### System Status
Check system status di:
- **Health Check**: http://localhost:3000/api/health
- **Status Page**: Built-in system monitoring
- **Maintenance Schedule**: Notifikasi untuk planned maintenance

---

**🎓 Selamat Belajar dengan LMS Universitas v1.0!**

**Sistem pembelajaran digital yang modern, user-friendly, dan powerful untuk kemajuan pendidikan Indonesia.**