#!/bin/bash

# Docker Compose startup script with database migration fix
# This script ensures the database is properly migrated before starting the application

set -e

echo "🚀 Starting LMS Application with Database Migration Fix..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Docker and Docker Compose are available
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed or not available in PATH"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed or not available in PATH"
    exit 1
fi

print_status "Checking Docker Compose configuration..."

# Check if docker-compose.yml exists
if [ ! -f "docker-compose.yml" ]; then
    print_error "docker-compose.yml not found in current directory"
    exit 1
fi

print_success "Docker Compose configuration found"

# Stop any existing containers
print_status "Stopping existing containers..."
docker-compose down --remove-orphans || true

# Remove any dangling images and volumes (optional)
if [ "$1" = "--clean" ]; then
    print_status "Cleaning up Docker resources..."
    docker system prune -f || true
    docker volume prune -f || true
fi

# Build and start database first
print_status "Starting PostgreSQL database..."
docker-compose up -d postgres

# Wait for database to be ready
print_status "Waiting for database to be ready..."
sleep 10

# Check database connection
print_status "Checking database connection..."
timeout=60
count=0
while [ $count -lt $timeout ]; do
    if docker-compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
        print_success "Database is ready"
        break
    fi
    
    echo -n "."
    sleep 2
    count=$((count + 2))
done

if [ $count -ge $timeout ]; then
    print_error "Database failed to start within $timeout seconds"
    docker-compose logs postgres
    exit 1
fi

# Build backend
print_status "Building backend application..."
docker-compose build backend

# Run database migrations
print_status "Running database migrations..."
docker-compose run --rm backend npm run migration:run

# Check migration status
if [ $? -eq 0 ]; then
    print_success "Database migrations completed successfully"
else
    print_error "Database migrations failed"
    print_status "Trying alternative migration approach..."
    docker-compose run --rm backend npm run db:fix
fi

# Start all services
print_status "Starting all services..."
docker-compose up -d

# Wait for services to be ready
print_status "Waiting for services to start..."
sleep 15

# Check service health
print_status "Checking service health..."

# Check backend health
backend_health=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health || echo "000")
if [ "$backend_health" = "200" ]; then
    print_success "Backend service is healthy"
else
    print_warning "Backend service health check failed (HTTP $backend_health)"
    print_status "Backend logs:"
    docker-compose logs --tail=20 backend
fi

# Check frontend accessibility
frontend_health=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001 || echo "000")
if [ "$frontend_health" = "200" ]; then
    print_success "Frontend service is accessible"
else
    print_warning "Frontend service accessibility check failed (HTTP $frontend_health)"
    print_status "Frontend logs:"
    docker-compose logs --tail=20 frontend
fi

print_success "LMS Application startup completed!"
echo ""
echo "🌐 Application URLs:"
echo "   Frontend: ${BLUE}http://localhost:3001${NC}"
echo "   Backend API: ${BLUE}http://localhost:3000${NC}"
echo "   API Health: ${BLUE}http://localhost:3000/api/health${NC}"
echo ""
echo "📊 Useful commands:"
echo "   View logs: ${YELLOW}docker-compose logs -f${NC}"
echo "   Stop services: ${YELLOW}docker-compose down${NC}"
echo "   Restart services: ${YELLOW}docker-compose restart${NC}"
echo "   Run migrations: ${YELLOW}docker-compose run --rm backend npm run migration:run${NC}"
echo ""

# Show running containers
print_status "Running containers:"
docker-compose ps

exit 0
