#!/usr/bin/env bash

# NGINX DEFAULT PAGE FIX SCRIPT
# Script untuk memperbaiki masalah nginx default page di LMS Universitas v1

set -e

echo "🚀 Starting LMS Frontend Fix..."
echo "==============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
print_status "Checking Docker status..."
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi
print_success "Docker is running"

# Stop existing containers
print_status "Stopping existing containers..."
docker-compose down 2>/dev/null || true
print_success "Containers stopped"

# Clean up Docker system
print_status "Cleaning Docker system..."
docker system prune -f > /dev/null 2>&1
print_success "Docker system cleaned"

# Remove old images to force rebuild
print_status "Removing old frontend image..."
docker rmi lms-universitas-v1-copy-frontend 2>/dev/null || true
docker rmi $(docker images --filter "dangling=true" -q) 2>/dev/null || true
print_success "Old images removed"

# Build frontend with no cache
print_status "Building frontend with updated Dockerfile..."
docker-compose build --no-cache frontend
if [ $? -eq 0 ]; then
    print_success "Frontend build completed successfully"
else
    print_error "Frontend build failed"
    exit 1
fi

# Build backend (quick build since it should be working)
print_status "Building backend..."
docker-compose build backend
if [ $? -eq 0 ]; then
    print_success "Backend build completed"
else
    print_warning "Backend build had issues, but continuing..."
fi

# Start services
print_status "Starting services..."
docker-compose up -d
if [ $? -eq 0 ]; then
    print_success "Services started successfully"
else
    print_error "Failed to start services"
    exit 1
fi

# Wait for services to be ready
print_status "Waiting for services to be ready..."
sleep 10

# Check frontend container
print_status "Checking frontend container..."
if docker ps | grep -q "lms-frontend"; then
    print_success "Frontend container is running"
else
    print_error "Frontend container is not running"
    docker logs lms-frontend 2>/dev/null || true
    exit 1
fi

# Check backend container
print_status "Checking backend container..."
if docker ps | grep -q "lms-backend"; then
    print_success "Backend container is running"
else
    print_warning "Backend container is not running"
    docker logs lms-backend 2>/dev/null || true
fi

# Test frontend endpoint
print_status "Testing frontend endpoint..."
sleep 5
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/ 2>/dev/null || echo "000")
if [ "$response" = "200" ]; then
    print_success "Frontend is responding correctly"
else
    print_warning "Frontend returned HTTP $response"
fi

# Show container logs
print_status "Showing recent container logs..."
echo ""
echo "=== Frontend Logs ==="
docker logs --tail 20 lms-frontend 2>/dev/null || echo "No frontend logs available"
echo ""
echo "=== Backend Logs ==="
docker logs --tail 20 lms-backend 2>/dev/null || echo "No backend logs available"

echo ""
echo "==============================================="
print_success "Fix script completed!"
echo ""
echo "🌐 Frontend: http://localhost:3001"
echo "🔧 Backend:  http://localhost:3000"
echo ""
print_status "If you still see nginx default page:"
echo "   1. Wait 30 seconds for full initialization"
echo "   2. Clear browser cache (Ctrl+Shift+R)"
echo "   3. Check container logs: docker logs lms-frontend"
echo ""
print_status "To view real-time logs:"
echo "   docker-compose logs -f"
echo ""
echo "🎉 Your LMS should now be working properly!"
