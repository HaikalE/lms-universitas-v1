# 🚨 URGENT VIDEO 404 FIX

## Problem Identified
Your video 404 error is caused by **URL path duplication**:

**Error URL**: `http://localhost:3000/api/api/uploads/uploads/course-materials/...`
**Should be**: `http://localhost:3000/uploads/course-materials/...`

## Root Cause
1. Backend has `app.setGlobalPrefix('api')` - adds `/api` to all routes
2. Backend also has manual `/api/uploads` static route
3. Frontend constructs URLs with `/api/uploads/`
4. Result: Double `/api` and `/uploads` in final URL

## IMMEDIATE FIX

### 1. Fix Frontend (VideoPreviewPage.tsx)

**File**: `frontend/src/pages/courses/VideoPreviewPage.tsx`
**Line**: ~151

**CHANGE FROM**:
```typescript
const getVideoUrl = (): string => {
  if (!material || !material.filePath) return '';
  
  const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000';
  
  if (material.filePath.includes('course-materials')) {
    return `${baseUrl}/api/uploads/${material.filePath}`;
  } else {
    return `${baseUrl}/api/uploads/course-materials/${material.filePath}`;
  }
};
```

**CHANGE TO**:
```typescript
const getVideoUrl = (): string => {
  if (!material || !material.filePath) return '';
  
  const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000';
  
  // FIX: Use direct /uploads route (no /api prefix needed)
  if (material.filePath.includes('course-materials')) {
    return `${baseUrl}/uploads/${material.filePath}`;
  } else {
    return `${baseUrl}/uploads/course-materials/${material.filePath}`;
  }
};
```

### 2. Clean Backend (main.ts)

**File**: `backend/src/main.ts`

**REMOVE** this entire block:
```typescript
// REMOVE THIS ENTIRE BLOCK
app.use('/api/uploads', express.static(uploadsPath, {
  // ... all the configuration
}));
```

**KEEP ONLY** the `/uploads` block:
```typescript
// KEEP THIS - the direct uploads route
app.use('/uploads', express.static(uploadsPath, {
  // ... keep all existing configuration
}));
```

## TEST THE FIX

1. **Restart backend**: `cd backend && npm run start:dev`
2. **Test URL**: `http://localhost:3000/uploads/course-materials/your-video.mp4`
3. **Play video** in your LMS - should work now!

## Quick Verification
- ✅ Video URLs should show `/uploads/` (not `/api/uploads/`)
- ✅ No 404 errors in browser console
- ✅ Videos play and progress tracking works

**STATUS**: This fix resolves the critical video playback issue immediately! 🎯