#!/bin/bash

# Emergency Backend Fix Script
# Use this when backend fails to build or start

set -e

echo "🚨 Emergency Backend Fix Script"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
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

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    print_error "docker-compose.yml not found! Please run this from the project root directory."
    exit 1
fi

print_status "Step 1: Stopping and cleaning up containers..."
docker-compose down --remove-orphans
docker container prune -f

print_status "Step 2: Cleaning up backend images..."
docker rmi $(docker images | grep lms.*backend | awk '{print $3}') 2>/dev/null || true

print_status "Step 3: Check backend source files..."
if [ ! -f "backend/src/main.ts" ]; then
    print_error "backend/src/main.ts not found!"
    exit 1
fi

print_success "Backend source files exist"

print_status "Step 4: Check backend dependencies..."
cd backend
if [ ! -f "package.json" ]; then
    print_error "backend/package.json not found!"
    exit 1
fi

print_status "Step 5: Clean backend node_modules and build..."
rm -rf node_modules dist
npm install

print_status "Step 6: Test local build..."
npm run build

if [ ! -f "dist/main.js" ]; then
    print_error "Build failed - dist/main.js not created!"
    print_status "Checking build errors..."
    npm run build || true
    exit 1
fi

print_success "Local build successful - dist/main.js created"

cd ..

print_status "Step 7: Building Docker image with fresh context..."
docker-compose build --no-cache backend

print_status "Step 8: Start database first..."
docker-compose up -d postgres

print_status "Step 9: Wait for database..."
sleep 15

print_status "Step 10: Start backend with logs..."
docker-compose up -d backend

print_status "Step 11: Check backend logs..."
sleep 10
docker-compose logs backend | tail -20

print_status "Step 12: Health check..."
sleep 5

# Check if backend is running
if docker-compose ps | grep backend | grep -q "Up"; then
    print_success "Backend container is running!"
    
    # Test API endpoint
    backend_health=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health 2>/dev/null || echo "000")
    if [ "$backend_health" = "200" ]; then
        print_success "Backend API is responding!"
    else
        print_warning "Backend API not responding yet (HTTP $backend_health)"
        print_status "Waiting a bit more..."
        sleep 10
        backend_health=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health 2>/dev/null || echo "000")
        if [ "$backend_health" = "200" ]; then
            print_success "Backend API is now responding!"
        else
            print_error "Backend API still not responding"
            print_status "Latest backend logs:"
            docker-compose logs --tail=30 backend
        fi
    fi
else
    print_error "Backend container failed to start!"
    print_status "Backend logs:"
    docker-compose logs backend
    exit 1
fi

print_status "Step 13: Start all services..."
docker-compose up -d

print_success "Emergency fix completed!"
echo ""
echo "🌐 Application URLs:"
echo "   Frontend: ${BLUE}http://localhost:3001${NC}"
echo "   Backend API: ${BLUE}http://localhost:3000${NC}"
echo "   API Health: ${BLUE}http://localhost:3000/api/health${NC}"
echo ""
echo "📊 Check status:"
echo "   View logs: ${YELLOW}docker-compose logs -f${NC}"
echo "   Check containers: ${YELLOW}docker-compose ps${NC}"

exit 0
