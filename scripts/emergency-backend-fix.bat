@echo off
REM Emergency Backend Fix Script for Windows Batch
REM Use this when backend fails to build or start on Windows

echo 🚨 Emergency Backend Fix Script for Windows
echo.

REM Check if we're in the right directory
if not exist "docker-compose.yml" (
    echo ❌ docker-compose.yml not found! Please run this from the project root directory.
    pause
    exit /b 1
)

echo [%time%] Step 1: Stopping and cleaning up containers...
docker-compose down --remove-orphans
docker container prune -f

echo [%time%] Step 2: Cleaning up backend images...
for /f "tokens=3" %%i in ('docker images ^| findstr "lms.*backend"') do docker rmi %%i 2>nul

echo [%time%] Step 3: Check backend source files...
if not exist "backend\src\main.ts" (
    echo ❌ backend\src\main.ts not found!
    pause
    exit /b 1
)

echo ✅ Backend source files exist

echo [%time%] Step 4: Check backend dependencies...
cd backend

if not exist "package.json" (
    echo ❌ backend\package.json not found!
    pause
    exit /b 1
)

echo [%time%] Step 5: Clean backend node_modules and build...
if exist "node_modules" rmdir /s /q "node_modules"
if exist "dist" rmdir /s /q "dist"

echo [%time%] Installing dependencies...
call npm install

echo [%time%] Step 6: Test local build...
call npm run build

if not exist "dist\main.js" (
    echo ❌ Build failed - dist\main.js not created!
    echo [%time%] Checking build errors...
    call npm run build
    pause
    exit /b 1
)

echo ✅ Local build successful - dist\main.js created

cd ..

echo [%time%] Step 7: Building Docker image with fresh context...
docker-compose build --no-cache backend

echo [%time%] Step 8: Start database first...
docker-compose up -d postgres

echo [%time%] Step 9: Wait for database...
timeout /t 15 /nobreak > nul

echo [%time%] Step 10: Start backend with logs...
docker-compose up -d backend

echo [%time%] Step 11: Check backend logs...
timeout /t 10 /nobreak > nul
docker-compose logs backend | more

echo [%time%] Step 12: Health check...
timeout /t 5 /nobreak > nul

REM Check if backend is running
docker-compose ps | findstr "backend.*Up" > nul
if %errorlevel% equ 0 (
    echo ✅ Backend container is running!
    
    REM Test API endpoint using curl if available
    curl -s -o nul -w "%%{http_code}" http://localhost:3000/api/health > temp_status.txt 2>nul
    if exist temp_status.txt (
        set /p api_status=<temp_status.txt
        del temp_status.txt
        if "!api_status!"=="200" (
            echo ✅ Backend API is responding!
        ) else (
            echo ⚠️  Backend API returned status: !api_status!
        )
    ) else (
        echo ⚠️  Could not test API endpoint - curl not available
    )
) else (
    echo ❌ Backend container failed to start!
    echo [%time%] Backend logs:
    docker-compose logs backend
    pause
    exit /b 1
)

echo [%time%] Step 13: Start all services...
docker-compose up -d

echo ✅ Emergency fix completed!
echo.
echo 🌐 Application URLs:
echo    Frontend: http://localhost:3001
echo    Backend API: http://localhost:3000
echo    API Health: http://localhost:3000/api/health
echo.
echo 📊 Check status:
echo    View logs: docker-compose logs -f
echo    Check containers: docker-compose ps
echo.

REM Show running containers
echo [%time%] Running containers:
docker-compose ps

echo.
echo Press any key to exit...
pause > nul
exit /b 0
