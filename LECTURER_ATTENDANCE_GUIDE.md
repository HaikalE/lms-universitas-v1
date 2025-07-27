# 👨‍🏫 Panduan Dosen: Video Attendance Tracking

## 🚨 Masalah yang Sering Terjadi

**Keluhan Mahasiswa**: "Saya sudah nonton video 100% tapi attendance tidak tercatat!"

**Penyebab**: Video tidak dikonfigurasi sebagai "Attendance Trigger" oleh dosen.

---

## ✅ Solusi: Enable Attendance Trigger untuk Video

### **🎯 Cara Mengaktifkan Attendance Trigger**

#### **Untuk Video Baru:**

1. **Login sebagai Dosen** → Masuk ke course
2. **Tab "Materi"** → Klik **"Tambah Materi"**
3. **Pilih Type "Video"** 
4. **Isi form standar**: Title, Description, Upload file
5. **⭐ PENTING**: Scroll ke bawah ke section **"Pengaturan Absensi Otomatis"**
6. **Toggle "Attendance Trigger" = ON** ✅
7. **Set Threshold**: 80% (recommended) 
8. **Simpan Material**

#### **Untuk Video yang Sudah Ada:**

1. **Course → Tab Materi** → Cari video yang bermasalah
2. **Klik "Edit"** pada material video
3. **Scroll ke bawah** → Cari **"Pengaturan Absensi Otomatis"**
4. **Toggle ON** + Set threshold 80%
5. **Simpan**

---

## 🔍 Cara Mengecek Status Attendance Trigger

### **Visual Check di Interface:**

**✅ Video dengan Attendance Trigger:**
```
📹 Nama Video
🔵 Attendance Trigger (80%)    ← Badge biru ini harus ada!
📅 Week 1
```

**❌ Video tanpa Attendance Trigger:**
```
📹 Nama Video
📅 Week 1                     ← Tidak ada badge biru!
```

### **Check via Database:**
```sql
-- Lihat status semua video dalam course
SELECT 
    title,
    week,
    isAttendanceTrigger,
    attendanceThreshold
FROM course_materials 
WHERE courseId = 'YOUR_COURSE_ID' 
AND type = 'video'
ORDER BY week, orderIndex;
```

---

## 🔧 Fix untuk Video yang Sudah Bermasalah

### **Option 1: Via UI (Recommended)**
1. Edit material video → Enable attendance trigger
2. Gunakan API manual trigger (lihat section API di bawah)

### **Option 2: Via SQL (Admin only)**
```sql
-- Enable attendance trigger
UPDATE course_materials 
SET isAttendanceTrigger = true, attendanceThreshold = 80
WHERE id = 'MATERIAL_ID';
```

### **Option 3: Via API (Developer/Admin)**
```bash
# Check attendance status
GET /api/video-progress/material/{materialId}/attendance-status

# Manual trigger attendance untuk students yang sudah complete
POST /api/video-progress/material/{materialId}/trigger-attendance
```

---

## 📊 Monitoring & Dashboard untuk Dosen

### **Attendance Statistics API:**
```bash
GET /api/video-progress/course/{courseId}/stats
```

**Response menunjukkan:**
- Total viewers per video
- Completion rate
- Attendance triggered count
- Students yang belum dapat attendance

### **Check Individual Student:**
```bash
GET /api/video-progress/student/{studentId}/course/{courseId}
```

---

## ⚠️ Best Practices untuk Dosen

### **1. Default Configuration:**
- **SELALU enable Attendance Trigger** untuk video pembelajaran
- **Threshold recommended**: 80%
- **Jangan set terlalu tinggi** (>95%) karena bisa ada lag di video player

### **2. Komunikasi ke Mahasiswa:**
- Informasikan bahwa video mana yang count untuk attendance
- Berikan badge visual di course materials
- Set expectation berapa persen video harus ditonton

### **3. Monitoring Rutin:**
- Check attendance stats setiap minggu
- Lihat ada mahasiswa yang complaint
- Verify attendance counts match expectations

### **4. Prevention Checklist:**
```
☑️ Video upload dengan attendance trigger ON
☑️ Threshold set 80% 
☑️ Badge "Attendance Trigger" visible
☑️ Test dengan akun student
☑️ Monitor attendance weekly
```

---

## 🎯 API Reference untuk Developer/Admin

### **Manual Trigger Attendance:**
```typescript
POST /api/video-progress/material/:materialId/trigger-attendance

// Response:
{
  "success": true,
  "triggered": 5,      // Students yang berhasil di-trigger
  "skipped": 0,        // Students yang di-skip
  "message": "Successfully triggered attendance for 5 students",
  "errors": []         // Jika ada error
}
```

### **Check Attendance Status:**
```typescript
GET /api/video-progress/material/:materialId/attendance-status

// Response:
{
  "isAttendanceTrigger": true,
  "threshold": 80,
  "completedStudents": 10,    // Total yang udah complete video
  "attendanceTriggered": 8,   // Yang udah dapat attendance
  "pendingTrigger": 2,        // Yang complete tapi belum attendance
  "needsManualTrigger": true  // Perlu manual trigger?
}
```

---

## 🚨 Troubleshooting Common Issues

### **Issue 1**: "Student complete video tapi tidak ada attendance"
**Fix**: Check `isAttendanceTrigger` status → Enable → Manual trigger

### **Issue 2**: "Semua student complaint attendance tidak masuk"
**Fix**: Kemungkinan semua video di course tidak ada attendance trigger → Bulk enable

### **Issue 3**: "Video shows 100% tapi attendance tidak trigger"
**Fix**: Check threshold setting → Pastikan player reports >= threshold

### **Issue 4**: "API manual trigger error"
**Fix**: Check permissions (harus LECTURER/ADMIN) → Check material exists

---

## 📈 Improvement Recommendations

### **Short Term:**
1. **Default ON**: Make attendance trigger default untuk semua video baru
2. **Validation Alert**: Warning jika upload video tanpa attendance trigger
3. **Dashboard**: Show attendance trigger status per video

### **Long Term:**
1. **Auto Detection**: Smart detection video mana yang should trigger attendance
2. **Bulk Operations**: Enable/disable attendance trigger untuk multiple videos
3. **Analytics**: Better reporting untuk attendance vs video completion

---

## 📞 Support & Contact

**Untuk Dosen yang butuh bantuan:**
1. Check dokumentasi ini dulu
2. Test dengan SQL scripts yang disediakan
3. Contact admin untuk API access jika perlu
4. Report bugs di GitHub Issues

**Files terkait:**
- `ATTENDANCE_ISSUE_ANALYSIS.md` - Technical analysis
- `ATTENDANCE_FIX_SQL.sql` - Database fix scripts
- `backend/src/video-progress/` - API implementation

---

## 🎉 Summary

**Key Points:**
- ✅ **SELALU enable "Attendance Trigger"** saat upload video
- ✅ **Set threshold 80%** (recommended)
- ✅ **Monitor badge biru** untuk visual confirmation
- ✅ **Check attendance stats** regular
- ✅ **Use manual trigger API** untuk fix existing issues

**Remember**: Attendance hanya di-trigger untuk video yang **explicitly configured** sebagai attendance trigger. Default behavior adalah **NO attendance** untuk protect privacy and prevent accidental tracking.