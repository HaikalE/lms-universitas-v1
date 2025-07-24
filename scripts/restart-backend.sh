#!/bin/bash

# Quick Backend Restart Script
# Use this to restart just the backend service after code changes

set -e

echo "🔄 Quick Backend Restart..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check if Docker Compose is running
if ! docker-compose ps | grep -q "Up"; then
    print_warning "Docker Compose services are not running. Starting all services..."
    docker-compose up -d
    exit 0
fi

print_status "Stopping backend service..."
docker-compose stop backend

print_status "Rebuilding backend service..."
docker-compose build backend

print_status "Starting backend service..."
docker-compose up -d backend

print_status "Waiting for backend to be ready..."
sleep 5

# Health check
backend_health=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health || echo "000")
if [ "$backend_health" = "200" ]; then
    print_success "Backend service is healthy and ready!"
else
    print_warning "Backend health check failed (HTTP $backend_health)"
    print_status "Backend logs:"
    docker-compose logs --tail=10 backend
fi

print_success "Backend restart completed!"
echo ""
echo "🔧 To check logs: ${YELLOW}docker-compose logs -f backend${NC}"
echo "🌐 API Health: ${BLUE}http://localhost:3000/api/health${NC}"
echo "🌐 Frontend: ${BLUE}http://localhost:3001${NC}"
