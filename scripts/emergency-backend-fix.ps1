# Emergency Backend Fix Script for Windows PowerShell
# Use this when backend fails to build or start on Windows

Write-Host "🚨 Emergency Backend Fix Script for Windows" -ForegroundColor Red

function Write-Status {
    param($Message)
    $timestamp = Get-Date -Format "HH:mm:ss"
    Write-Host "[$timestamp] $Message" -ForegroundColor Blue
}

function Write-Success {
    param($Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Warning {
    param($Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Write-Error {
    param($Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

# Check if we're in the right directory
if (-not (Test-Path "docker-compose.yml")) {
    Write-Error "docker-compose.yml not found! Please run this from the project root directory."
    exit 1
}

Write-Status "Step 1: Stopping and cleaning up containers..."
docker-compose down --remove-orphans
docker container prune -f

Write-Status "Step 2: Cleaning up backend images..."
$backendImages = docker images | Select-String "lms.*backend" | ForEach-Object { ($_ -split "\s+")[2] }
if ($backendImages) {
    docker rmi $backendImages 2>$null
}

Write-Status "Step 3: Check backend source files..."
if (-not (Test-Path "backend\src\main.ts")) {
    Write-Error "backend\src\main.ts not found!"
    exit 1
}

Write-Success "Backend source files exist"

Write-Status "Step 4: Check backend dependencies..."
Set-Location backend

if (-not (Test-Path "package.json")) {
    Write-Error "backend\package.json not found!"
    exit 1
}

Write-Status "Step 5: Clean backend node_modules and build..."
if (Test-Path "node_modules") { Remove-Item -Recurse -Force "node_modules" }
if (Test-Path "dist") { Remove-Item -Recurse -Force "dist" }

Write-Status "Installing dependencies..."
npm install

Write-Status "Step 6: Test local build..."
npm run build

if (-not (Test-Path "dist\main.js")) {
    Write-Error "Build failed - dist\main.js not created!"
    Write-Status "Checking build errors..."
    npm run build
    exit 1
}

Write-Success "Local build successful - dist\main.js created"

Set-Location ..

Write-Status "Step 7: Building Docker image with fresh context..."
docker-compose build --no-cache backend

Write-Status "Step 8: Start database first..."
docker-compose up -d postgres

Write-Status "Step 9: Wait for database..."
Start-Sleep 15

Write-Status "Step 10: Start backend with logs..."
docker-compose up -d backend

Write-Status "Step 11: Check backend logs..."
Start-Sleep 10
docker-compose logs backend | Select-Object -Last 20

Write-Status "Step 12: Health check..."
Start-Sleep 5

# Check if backend is running
$backendStatus = docker-compose ps | Select-String "backend.*Up"
if ($backendStatus) {
    Write-Success "Backend container is running!"
    
    # Test API endpoint
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -UseBasicParsing -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Success "Backend API is responding!"
        } else {
            Write-Warning "Backend API returned status: $($response.StatusCode)"
        }
    } catch {
        Write-Warning "Backend API not responding yet"
        Write-Status "Waiting a bit more..."
        Start-Sleep 10
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -UseBasicParsing -TimeoutSec 10
            if ($response.StatusCode -eq 200) {
                Write-Success "Backend API is now responding!"
            } else {
                Write-Error "Backend API still not responding"
                Write-Status "Latest backend logs:"
                docker-compose logs --tail=30 backend
            }
        } catch {
            Write-Error "Backend API still not responding"
            Write-Status "Latest backend logs:"
            docker-compose logs --tail=30 backend
        }
    }
} else {
    Write-Error "Backend container failed to start!"
    Write-Status "Backend logs:"
    docker-compose logs backend
    exit 1
}

Write-Status "Step 13: Start all services..."
docker-compose up -d

Write-Success "Emergency fix completed!"
Write-Host ""
Write-Host "🌐 Application URLs:" -ForegroundColor Blue
Write-Host "   Frontend: http://localhost:3001" -ForegroundColor Blue
Write-Host "   Backend API: http://localhost:3000" -ForegroundColor Blue
Write-Host "   API Health: http://localhost:3000/api/health" -ForegroundColor Blue
Write-Host ""
Write-Host "📊 Check status:" -ForegroundColor Blue
Write-Host "   View logs: docker-compose logs -f" -ForegroundColor Yellow
Write-Host "   Check containers: docker-compose ps" -ForegroundColor Yellow

exit 0
