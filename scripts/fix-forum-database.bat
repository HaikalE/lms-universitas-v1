@echo off
REM 🔧 Forum Posts Database Fix Script for Windows
REM This script fixes the missing 'type' column in forum_posts table

echo 🔧 Starting Forum Posts Database Fix...

REM Database connection details
set DB_CONTAINER=lms-universitas-v1_postgres_1
set DB_NAME=lms_db
set DB_USER=postgres

REM Check if Docker is running
docker ps >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not running or not accessible
    echo 💡 Try: Start Docker Desktop
    pause
    exit /b 1
)

echo ✅ Docker found

REM Check if PostgreSQL container is running
docker ps | findstr "%DB_CONTAINER%" >nul
if errorlevel 1 (
    echo ❌ PostgreSQL container not found or not running
    echo 💡 Try: docker-compose up -d
    pause
    exit /b 1
)

echo ✅ PostgreSQL container found

echo 📝 Executing database fix...

REM Execute the fix using docker exec
docker exec -i %DB_CONTAINER% psql -U %DB_USER% -d %DB_NAME% < fix-forum-sql.tmp

if errorlevel 1 (
    echo ❌ Database fix failed
    pause
    exit /b 1
)

echo.
echo 🎉 SUCCESS! Forum posts database fix completed!
echo 🔍 Testing API endpoint...

REM Test the API endpoint (basic test)
curl -s -o nul -w "HTTP %%{http_code}" http://localhost:3000/api/forums/my-discussions

echo.
echo.
echo 📋 Next steps:
echo 1. Check backend logs: docker-compose logs backend
echo 2. Test forum in UI: http://localhost:3001
echo 3. If still issues, restart backend: docker-compose restart backend

pause
