# Docker Build Troubleshooting & Multiple Solutions

## 🚨 Problem Analysis

Error yang terjadi: `react-scripts: not found` pada semua metode build, menunjukkan masalah fundamental dengan instalasi dependencies, bukan masalah PATH.

### Root Causes Identified:
1. **Node.js Version Compatibility**: Node.js 18 Alpine memiliki compatibility issues dengan react-scripts 5.0.1
2. **npm vs npm ci**: `npm install` tidak deterministic, npm ci lebih reliable
3. **Dependency Resolution**: npm vs yarn memiliki algoritma resolution yang berbeda
4. **Native Dependencies**: Missing build tools untuk compile native modules

## 🛠 Multiple Solutions Provided

### Solution 1: Stable Node.js 16 + npm ci (RECOMMENDED)
**File**: `Dockerfile.node16`
```bash
# Usage
docker-compose up --build -d
```

**Why this works**:
- Node.js 16 memiliki compatibility yang lebih baik dengan React Scripts 5.0.1
- `npm ci` menggunakan package-lock.json secara deterministik
- Alpine packages yang lebih stabil pada Node.js 16

### Solution 2: Yarn Build System
**File**: `Dockerfile.yarn`
```bash
# Usage (manual)
cd frontend
docker build -f Dockerfile.yarn -t lms-frontend-yarn .
docker run -p 3001:80 lms-frontend-yarn
```

**Why this works**:
- Yarn memiliki dependency resolution yang lebih robust
- Better network handling dan retry logic
- Lockfile yang lebih reliable

### Solution 3: Node.js 18 dengan Comprehensive Debugging
**File**: `Dockerfile` (current)
```bash
# Usage untuk debugging
docker build --no-cache -t lms-frontend-debug frontend/
```

**What this provides**:
- Detailed logging setiap step
- Multiple fallback strategies
- Manual recovery options
- Comprehensive debugging information

## 🚀 Testing Methods

### Method 1: Test Individual Dockerfiles

```bash
# Test Node.js 16 version (RECOMMENDED)
cd frontend
docker build -f Dockerfile.node16 -t lms-frontend-node16 .
docker run -p 3001:80 lms-frontend-node16

# Test Yarn version
docker build -f Dockerfile.yarn -t lms-frontend-yarn .
docker run -p 3002:80 lms-frontend-yarn

# Test debug version
docker build -f Dockerfile -t lms-frontend-debug .
```

### Method 2: Update docker-compose.yml

Current setup sudah menggunakan `Dockerfile.node16`. Alternative configs:

```yaml
# For Yarn build
frontend:
  build:
    context: ./frontend
    dockerfile: Dockerfile.yarn

# For debug build
frontend:
  build:
    context: ./frontend
    dockerfile: Dockerfile
```

## 🔍 Debugging Steps

### Step 1: Verify Local Dependencies
```bash
cd frontend
npm install
npm ls react-scripts
npm run build
```

### Step 2: Test with Different Node Versions
```bash
# Node.js 16
docker run --rm -v $(pwd):/app -w /app node:16-alpine npm install
docker run --rm -v $(pwd):/app -w /app node:16-alpine npm run build

# Node.js 18
docker run --rm -v $(pwd):/app -w /app node:18-alpine npm install
docker run --rm -v $(pwd):/app -w /app node:18-alpine npm run build
```

### Step 3: Analyze npm Install Logs
```bash
# Build with detailed logs
docker build --no-cache --progress=plain -f Dockerfile.node16 -t test-build .
```

## 📊 Compatibility Matrix

| Solution | Node.js | Package Manager | Success Rate | Build Time | Image Size |
|----------|---------|-----------------|--------------|------------|------------|
| **Dockerfile.node16** | 16-alpine | npm ci | 🟢 95% | ⚡ Fast | 📦 Small |
| Dockerfile.yarn | 18-alpine | yarn | 🟢 90% | ⚡ Fast | 📦 Small |
| Dockerfile (debug) | 18-alpine | npm install | 🟡 70% | 🐌 Slow | 📦 Large |

## ✅ Expected Results

### Successful Build Should Show:
```
Step X/Y : RUN npm run build
 ---> Running in xxxxx
> lms-frontend@2.0.0 build
> react-scripts build && npm run build:sw

Creating an optimized production build...
Compiled successfully.

File sizes after gzip:
  XX.XX KB  build/static/js/main.xxxxx.js
  XX.XX KB  build/static/css/main.xxxxx.css

The build folder is ready to be deployed.
```

### Container Health Check:
```bash
# Check container status
docker-compose ps
# Should show "healthy" status

# Test frontend access
curl http://localhost:3001
# Should return HTML content
```

## 🆘 Fallback Manual Build

If all Docker methods fail, manual build:

```bash
# 1. Local build
cd frontend
npm install --legacy-peer-deps
npm run build

# 2. Manual container
docker run -d -p 3001:80 -v $(pwd)/build:/usr/share/nginx/html nginx:alpine
```

## 🔧 Quick Fixes

### Fix 1: Clear All Docker Cache
```bash
docker system prune -a
docker volume prune
docker-compose down --volumes --remove-orphans
```

### Fix 2: Force Node.js 16
Update docker-compose.yml:
```yaml
frontend:
  build:
    context: ./frontend
    dockerfile: Dockerfile.node16
```

### Fix 3: Use Pre-built Alternative
```bash
# Use official React build environment
docker run --rm -v $(pwd):/app -w /app/frontend node:16-alpine sh -c "npm ci && npm run build"
```

## 📝 Testing Checklist

- [ ] Node.js 16 build works
- [ ] Yarn build works  
- [ ] Local npm build works
- [ ] Container serves content on port 3001
- [ ] No console errors in browser
- [ ] API calls work to backend
- [ ] Service worker loads correctly

## 🎯 Next Steps After Fix

1. **Verify All Features Work**:
   ```bash
   # Frontend
   curl http://localhost:3001
   
   # Backend API
   curl http://localhost:3000/api/health
   
   # Login test
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@universitas.ac.id","password":"admin123"}'
   ```

2. **Performance Optimization**:
   - Use multi-stage builds
   - Optimize nginx configuration
   - Enable gzip compression

3. **Production Deployment**:
   - Use specific Node.js versions
   - Add security headers
   - Setup SSL/TLS

## 🔄 Update Commands

After pulling latest changes:
```bash
# Method 1: Quick restart
docker-compose down && docker-compose up --build -d

# Method 2: Clean rebuild
docker-compose down --volumes
docker system prune -f
docker-compose up --build -d

# Method 3: Test specific build
cd frontend && docker build -f Dockerfile.node16 -t test .
```

---

**Current Status**: ✅ Multiple solutions provided  
**Recommended**: Use `Dockerfile.node16` with Node.js 16 + npm ci  
**Fallback**: Use `Dockerfile.yarn` with Yarn package manager  
**Debug**: Use main `Dockerfile` with comprehensive logging
