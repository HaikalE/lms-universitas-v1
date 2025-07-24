# 🔥 BACKEND BUILD ERROR FIX - Cannot find module '/app/dist/main'

## 🚨 URGENT: Backend Build Error Solution

**Error**: `Error: Cannot find module '/app/dist/main'`
**Cause**: Backend build process failed, `dist/main.js` file not created

## ⚡ IMMEDIATE FIX

### Method 1: Emergency Script (Recommended)
```bash
# Pull latest changes
git pull origin main

# Make script executable
chmod +x scripts/emergency-backend-fix.sh

# Run emergency fix
./scripts/emergency-backend-fix.sh
```

### Method 2: Manual Fix
```bash
# Stop everything
docker-compose down

# Clean up
docker container prune -f
docker rmi $(docker images | grep lms.*backend | awk '{print $3}') 2>/dev/null || true

# Go to backend directory
cd backend

# Clean and rebuild locally first
rm -rf node_modules dist
npm install
npm run build

# Verify build works
ls -la dist/main.js

# Go back and rebuild Docker
cd ..
docker-compose build --no-cache backend
docker-compose up -d
```

### Method 3: Test Local Build First
```bash
# Test if backend can build locally
cd backend

# Check if TypeScript compiles
npm run build

# If build fails, check these:
npm install --save-dev @types/node typescript
npm run build

# If still fails, check tsconfig.json
cat tsconfig.json
```

## 🔍 Debugging Steps

### Step 1: Check Build Output
```bash
# Build with verbose output
cd backend
npm run build --verbose

# Check what was created
ls -la dist/
```

### Step 2: Check Docker Build Logs
```bash
# Build with no cache and see output
docker-compose build --no-cache backend

# Check if build stage succeeded
docker images | grep backend
```

### Step 3: Inspect Container
```bash
# Run container interactively to debug
docker run -it --rm lms-universitas-v1-copy-backend sh

# Inside container, check files
ls -la dist/
ls -la dist/main.js
```

## 🛠️ Common Causes & Solutions

### Cause 1: Node Modules Issue
```bash
# Solution: Clean install
cd backend
rm -rf node_modules package-lock.json
npm install
```

### Cause 2: TypeScript Configuration
```bash
# Check tsconfig.json
cat backend/tsconfig.json

# Ensure these settings exist:
{
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  }
}
```

### Cause 3: Missing Dependencies
```bash
# Install missing dev dependencies
cd backend
npm install --save-dev @nestjs/cli typescript
```

### Cause 4: Docker Layer Caching
```bash
# Force rebuild without cache
docker-compose build --no-cache backend
```

## 🔧 Dockerfile Improvements Applied

The new Dockerfile includes:
- Better error handling and debugging
- Verification steps for build output
- Improved health checks
- Better file permissions
- More detailed logging

## 📊 Verification Steps

After applying fixes:

### 1. Check Local Build
```bash
cd backend
npm run build
ls -la dist/main.js  # Should exist
```

### 2. Check Docker Build
```bash
docker-compose build backend
# Should see: "Build completed. Checking dist folder"
```

### 3. Check Container Health
```bash
docker-compose up -d backend
docker-compose ps  # Should show "healthy"
```

### 4. Test API
```bash
curl http://localhost:3000/api/health
# Should return 200 OK
```

## 🚨 If Still Not Working

### Emergency Fallback - Development Mode
```bash
# Use development mode instead of production build
cd backend

# Start backend in development mode
npm run start:dev
```

### Check System Requirements
```bash
# Check Node version
node --version  # Should be 18.x

# Check npm version  
npm --version   # Should be latest

# Check available memory
free -h         # Docker needs sufficient memory
```

### Reset Everything
```bash
# Nuclear option - reset everything
docker system prune -a
rm -rf backend/node_modules
rm -rf backend/dist
git clean -fd
git pull origin main
./scripts/emergency-backend-fix.sh
```

## 🎯 Success Indicators

You'll know it's fixed when:
- ✅ `npm run build` creates `dist/main.js`
- ✅ Docker build completes without errors
- ✅ Backend container starts and stays healthy
- ✅ API returns 200 on `/api/health`
- ✅ No "Cannot find module" errors in logs

## 📞 Last Resort

If nothing works, try this minimal Dockerfile:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "start:prod"]
```

**The enhanced Dockerfile and emergency script should resolve the build issues!** 🚀
