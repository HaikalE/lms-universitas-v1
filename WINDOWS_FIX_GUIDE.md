# 🪟 WINDOWS USERS - COMPLETE FIX GUIDE

## 🚨 KHUSUS UNTUK WINDOWS USERS!

Karena kamu pakai Windows, ada beberapa cara berbeda untuk fix masalah error. 

## ⚡ QUICK FIX UNTUK WINDOWS

### Method 1: PowerShell Emergency Script (RECOMMENDED) 🔥
```powershell
# Buka PowerShell as Administrator
# Navigate ke project directory
cd "D:\LMS_V1\lms-universitas-v1 - Copy"

# Pull latest changes
git pull origin main

# Run emergency PowerShell script
PowerShell -ExecutionPolicy Bypass -File scripts\emergency-backend-fix.ps1
```

### Method 2: PowerShell Startup Script
```powershell
# Untuk startup normal dengan migration
PowerShell -ExecutionPolicy Bypass -File scripts\start-with-migration.ps1

# Untuk clean startup
PowerShell -ExecutionPolicy Bypass -File scripts\start-with-migration.ps1 --clean
```

### Method 3: Manual Fix di Windows Command Prompt
```batch
REM Stop containers
docker-compose down

REM Clean up images
docker images | findstr "lms.*backend" > temp.txt
for /f "tokens=3" %%i in (temp.txt) do docker rmi %%i
del temp.txt

REM Go to backend directory
cd backend

REM Clean and rebuild
rmdir /s /q node_modules
rmdir /s /q dist
npm install
npm run build

REM Check if build successful
dir dist\main.js

REM Go back and rebuild Docker
cd ..
docker-compose build --no-cache backend
docker-compose up -d
```

## 🛠️ WINDOWS-SPECIFIC TROUBLESHOOTING

### Problem 1: PowerShell Execution Policy
```powershell
# If you get execution policy error, run this first:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Or run scripts with bypass:
PowerShell -ExecutionPolicy Bypass -File scripts\emergency-backend-fix.ps1
```

### Problem 2: Docker Desktop Not Running
```powershell
# Make sure Docker Desktop is running
# Check with:
docker --version
docker-compose --version

# If not found, restart Docker Desktop
```

### Problem 3: Path Issues
```batch
REM Make sure you're in the right directory
cd /d "D:\LMS_V1\lms-universitas-v1 - Copy"

REM Check if docker-compose.yml exists
dir docker-compose.yml
```

### Problem 4: Node.js Version Issues
```batch
REM Check Node.js version (should be 18.x)
node --version

REM If wrong version, download Node.js 18.x from nodejs.org
```

## 🔍 WINDOWS DEBUGGING COMMANDS

### Check Docker Status
```batch
docker ps
docker-compose ps
docker images | findstr lms
```

### Check Backend Logs
```batch
docker-compose logs backend
docker-compose logs --tail=50 backend
```

### Test Local Build (Windows CMD)
```batch
cd backend
rmdir /s /q dist
npm run build
dir dist\main.js
```

### Test API (Windows)
```batch
REM Test backend API
curl http://localhost:3000/api/health

REM Or use PowerShell
powershell "Invoke-WebRequest -Uri http://localhost:3000/api/health"
```

## 🚀 RECOMMENDED STEPS FOR WINDOWS USERS

### Step 1: Pull Latest Changes
```batch
git pull origin main
```

### Step 2: Open PowerShell as Administrator
- Press `Win + X`
- Select "Windows PowerShell (Admin)"
- Navigate to project: `cd "D:\LMS_V1\lms-universitas-v1 - Copy"`

### Step 3: Run Emergency Fix
```powershell
PowerShell -ExecutionPolicy Bypass -File scripts\emergency-backend-fix.ps1
```

### Step 4: Verify Results
- Frontend: http://localhost:3001
- Backend: http://localhost:3000/api/health
- Check browser console for errors

## 🎯 SUCCESS INDICATORS

You'll know it's working when:
- ✅ PowerShell script completes without errors
- ✅ Backend container shows "healthy" status
- ✅ API returns 200 on health check
- ✅ Frontend loads without console errors
- ✅ No more 400 Bad Request errors

## 📱 WINDOWS ALTERNATIVES

### If PowerShell Doesn't Work:

#### Option A: Windows Subsystem for Linux (WSL)
```bash
# If you have WSL installed
wsl
cd /mnt/d/LMS_V1/lms-universitas-v1\ -\ Copy
chmod +x scripts/emergency-backend-fix.sh
./scripts/emergency-backend-fix.sh
```

#### Option B: Git Bash
```bash
# If you have Git for Windows installed
# Open Git Bash in project directory
chmod +x scripts/emergency-backend-fix.sh
./scripts/emergency-backend-fix.sh
```

#### Option C: Manual Docker Commands
```batch
docker-compose down
docker-compose build --no-cache backend
docker-compose up -d postgres
timeout /t 15 /nobreak
docker-compose run --rm backend npm run migration:run
docker-compose up -d
```

## 🆘 IF NOTHING WORKS

### Nuclear Option for Windows:
```batch
REM Stop everything
docker-compose down
docker system prune -a

REM Reset backend
cd backend
rmdir /s /q node_modules
rmdir /s /q dist
cd ..

REM Fresh start
git clean -fd
git pull origin main
PowerShell -ExecutionPolicy Bypass -File scripts\emergency-backend-fix.ps1
```

### Check System Requirements:
```batch
REM Check versions
node --version
npm --version
docker --version
docker-compose --version

REM Check available memory
wmic OS get TotalVisibleMemorySize /value
```

## 📞 QUICK COMMANDS REFERENCE (WINDOWS)

```batch
REM Pull latest fixes
git pull origin main

REM Emergency fix (PowerShell)
PowerShell -ExecutionPolicy Bypass -File scripts\emergency-backend-fix.ps1

REM Check status
docker-compose ps

REM View logs
docker-compose logs -f backend

REM Test API
curl http://localhost:3000/api/health

REM Stop everything
docker-compose down

REM Complete restart
docker-compose up -d
```

## 🎉 FINAL NOTES FOR WINDOWS USERS

- Always run PowerShell as Administrator
- Make sure Docker Desktop is running
- Use `PowerShell -ExecutionPolicy Bypass` if you get execution policy errors
- Path should use backslashes: `scripts\emergency-backend-fix.ps1`
- If PowerShell fails, try Git Bash or WSL
- Emergency script will automatically fix all build issues

**The PowerShell scripts are specifically designed for Windows and should resolve all your Docker build issues!** 🚀

**Try the PowerShell emergency script now and let me know the results!** 💪
