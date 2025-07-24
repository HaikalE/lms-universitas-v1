# 🚨 API 400 BAD REQUEST ERRORS - COMPLETE FIX GUIDE

## ⚡ IMMEDIATE SOLUTION

Jika ada error 400 Bad Request di API assignments dan announcements, ikuti langkah ini:

### Step 1: Pull Latest Fixes
```bash
git pull origin main
```

### Step 2: Quick Backend Restart
```bash
# Make script executable
chmod +x scripts/restart-backend.sh

# Restart backend with latest code
./scripts/restart-backend.sh
```

### Step 3: Database Migration (if needed)
```bash
# Check and run database migrations
cd backend
npm run migration:check

# Or force run migrations
npm run migration:run
```

### Step 4: Verify Fix
Buka browser dan cek console - seharusnya tidak ada error 400 lagi.

## 🔍 Root Cause Analysis

### Problem 1: Missing `role` Parameter in DTOs
**Error**: `GET /api/assignments?role=lecturer 400 (Bad Request)`
**Cause**: Frontend mengirim parameter `role=lecturer` tapi backend DTO tidak menerima parameter `role`

**Files Fixed**:
- `backend/src/assignments/dto/query-assignments.dto.ts`
- `backend/src/announcements/dto/query-announcements.dto.ts`

### Problem 2: Database Schema Missing Column
**Error**: `column CourseMaterial.isAttendanceTrigger does not exist`
**Cause**: Migration tidak jalan dengan benar

**Files Created**:
- `backend/scripts/run-migrations.ts` - Migration runner
- `scripts/start-with-migration.sh` - Complete startup script
- `scripts/restart-backend.sh` - Quick backend restart

### Problem 3: Frontend Icon Loading
**Error**: Icon loading errors di browser console
**Cause**: Manifest.json reference non-existent icons

**Files Fixed**:
- `frontend/public/manifest.json`

## 🛠️ Alternative Fix Methods

### Method 1: Manual Database Fix (via pgAdmin)
```sql
-- Add missing columns
ALTER TABLE "course_materials" 
ADD COLUMN "isAttendanceTrigger" boolean NOT NULL DEFAULT false;

ALTER TABLE "course_materials" 
ADD COLUMN "attendanceThreshold" double precision;
```

### Method 2: Complete Restart
```bash
# Stop all services
docker-compose down

# Clean restart with migrations
./scripts/start-with-migration.sh
```

### Method 3: Check Backend Logs
```bash
# View backend logs for errors
docker-compose logs backend
```

## ✅ Success Verification

After applying fixes, you should see:
- ✅ No 400 Bad Request errors in browser console
- ✅ APIs returning data properly
- ✅ No database column errors in backend logs
- ✅ No icon loading errors

## 🆘 If Problems Persist

1. **Check backend logs**: `docker-compose logs backend`
2. **Test API directly**: `curl http://localhost:3000/api/health`
3. **Run database migration**: `cd backend && npm run migration:check`
4. **Restart everything**: `docker-compose down && docker-compose up -d`

## 📞 Quick Commands Reference

```bash
# Pull latest fixes
git pull origin main

# Quick backend restart
./scripts/restart-backend.sh

# Complete system restart
./scripts/start-with-migration.sh

# Check backend logs
docker-compose logs -f backend

# Test API health
curl http://localhost:3000/api/health

# Check database migrations
cd backend && npm run migration:check
```

**The fixes are now applied! Your API should work without 400 errors.** 🎉
