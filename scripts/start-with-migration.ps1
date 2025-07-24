# Quick Start Script for Windows PowerShell
# Starts LMS application with database migration fix

Write-Host "🚀 Starting LMS Application (Windows)" -ForegroundColor Green

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

# Check if Docker and Docker Compose are available
try {
    docker --version | Out-Null
} catch {
    Write-Host "❌ Docker is not installed or not available in PATH" -ForegroundColor Red
    exit 1
}

try {
    docker-compose --version | Out-Null
} catch {
    Write-Host "❌ Docker Compose is not installed or not available in PATH" -ForegroundColor Red
    exit 1
}

Write-Status "Checking Docker Compose configuration..."

# Check if docker-compose.yml exists
if (-not (Test-Path "docker-compose.yml")) {
    Write-Host "❌ docker-compose.yml not found in current directory" -ForegroundColor Red
    exit 1
}

Write-Success "Docker Compose configuration found"

# Stop any existing containers
Write-Status "Stopping existing containers..."
docker-compose down --remove-orphans

# Clean up if requested
if ($args[0] -eq "--clean") {
    Write-Status "Cleaning up Docker resources..."
    docker system prune -f
    docker volume prune -f
}

# Build and start database first
Write-Status "Starting PostgreSQL database..."
docker-compose up -d postgres

# Wait for database to be ready
Write-Status "Waiting for database to be ready..."
Start-Sleep 10

# Check database connection
Write-Status "Checking database connection..."
$timeout = 60
$count = 0

while ($count -lt $timeout) {
    try {
        $result = docker-compose exec -T postgres pg_isready -U postgres 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Database is ready"
            break
        }
    } catch {
        # Continue waiting
    }
    
    Write-Host "." -NoNewline
    Start-Sleep 2
    $count += 2
}

if ($count -ge $timeout) {
    Write-Host "❌ Database failed to start within $timeout seconds" -ForegroundColor Red
    docker-compose logs postgres
    exit 1
}

# Build backend
Write-Status "Building backend application..."
docker-compose build backend

# Run database migrations
Write-Status "Running database migrations..."
$migrationResult = docker-compose run --rm backend npm run migration:run

# Check migration status
if ($LASTEXITCODE -eq 0) {
    Write-Success "Database migrations completed successfully"
} else {
    Write-Warning "Database migrations failed, trying alternative approach..."
    docker-compose run --rm backend npm run db:fix
}

# Start all services
Write-Status "Starting all services..."
docker-compose up -d

# Wait for services to be ready
Write-Status "Waiting for services to start..."
Start-Sleep 15

# Check service health
Write-Status "Checking service health..."

# Check backend health
try {
    $backendResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -UseBasicParsing -TimeoutSec 10
    if ($backendResponse.StatusCode -eq 200) {
        Write-Success "Backend service is healthy"
    } else {
        Write-Warning "Backend service health check failed (HTTP $($backendResponse.StatusCode))"
        Write-Status "Backend logs:"
        docker-compose logs --tail=20 backend
    }
} catch {
    Write-Warning "Backend service health check failed"
    Write-Status "Backend logs:"
    docker-compose logs --tail=20 backend
}

# Check frontend accessibility
try {
    $frontendResponse = Invoke-WebRequest -Uri "http://localhost:3001" -UseBasicParsing -TimeoutSec 10
    if ($frontendResponse.StatusCode -eq 200) {
        Write-Success "Frontend service is accessible"
    } else {
        Write-Warning "Frontend service accessibility check failed (HTTP $($frontendResponse.StatusCode))"
        Write-Status "Frontend logs:"
        docker-compose logs --tail=20 frontend
    }
} catch {
    Write-Warning "Frontend service accessibility check failed"
    Write-Status "Frontend logs:"
    docker-compose logs --tail=20 frontend
}

Write-Success "LMS Application startup completed!"
Write-Host ""
Write-Host "🌐 Application URLs:" -ForegroundColor Blue
Write-Host "   Frontend: http://localhost:3001" -ForegroundColor Blue
Write-Host "   Backend API: http://localhost:3000" -ForegroundColor Blue
Write-Host "   API Health: http://localhost:3000/api/health" -ForegroundColor Blue
Write-Host ""
Write-Host "📊 Useful commands:" -ForegroundColor Blue
Write-Host "   View logs: docker-compose logs -f" -ForegroundColor Yellow
Write-Host "   Stop services: docker-compose down" -ForegroundColor Yellow
Write-Host "   Restart services: docker-compose restart" -ForegroundColor Yellow
Write-Host "   Run migrations: docker-compose run --rm backend npm run migration:run" -ForegroundColor Yellow
Write-Host ""

# Show running containers
Write-Status "Running containers:"
docker-compose ps

exit 0
