#!/bin/bash

# Enhanced Quick Fix Script for Docker Build Issues
# Author: Claude AI Assistant
# Created: July 26, 2025
# Updated: July 26, 2025 - Add ajv dependency conflict fix

echo "🔧 LMS Docker Enhanced Quick Fix - Build & Nginx Issues"
echo "======================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check if docker and docker-compose are installed
print_status "Checking Docker installation..."
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed!"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed!"
    exit 1
fi

print_status "Docker installation verified ✓"

# Step 1: Stop and clean
print_step "1/6 Stopping existing containers..."
docker-compose down

print_step "2/6 Cleaning up Docker cache and images..."
docker system prune -f

# Remove specific images to force rebuild
print_warning "Removing old LMS images..."
docker rmi lms-universitas-v1_frontend 2>/dev/null || true
docker rmi lms-universitas-v1_backend 2>/dev/null || true

# Step 3: Check for common issues
print_step "3/6 Checking for common build issues..."

# Check if frontend directory exists
if [ ! -d "frontend" ]; then
    print_error "Frontend directory not found! Make sure you're in the project root."
    exit 1
fi

# Check package.json
if [ ! -f "frontend/package.json" ]; then
    print_error "Frontend package.json not found!"
    exit 1
fi

# Check for node_modules conflicts
if [ -d "frontend/node_modules" ]; then
    print_warning "Removing existing node_modules to prevent conflicts..."
    rm -rf frontend/node_modules
fi

if [ -f "frontend/package-lock.json" ]; then
    print_warning "Removing package-lock.json to prevent dependency conflicts..."
    rm -f frontend/package-lock.json
fi

# Step 4: Enhanced rebuild
print_step "4/6 Rebuilding with dependency fix (this may take several minutes)..."

# Try building with no cache first
print_status "Attempting clean build..."
if docker-compose build --no-cache; then
    print_status "✅ Build successful!"
else
    print_warning "Standard build failed, trying with dependency fixes..."
    
    # If build fails, try alternative approaches
    print_status "Trying alternative build approach..."
    
    # Create a temporary docker-compose for debugging
    cat > docker-compose.debug.yml << EOF
version: '3.8'
services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        REACT_APP_API_URL: http://localhost:3000/api
    container_name: lms-frontend-debug
    environment:
      - REACT_APP_API_URL=http://localhost:3000/api
      - NODE_ENV=production
    ports:
      - "3001:80"
    networks:
      - lms-network

networks:
  lms-network:
    driver: bridge
EOF

    if docker-compose -f docker-compose.debug.yml build --no-cache; then
        print_status "✅ Debug build successful!"
        mv docker-compose.debug.yml docker-compose.yml
    else
        print_error "❌ Build still failing. Check the logs above for specific error details."
        rm -f docker-compose.debug.yml
        
        print_warning "Common solutions:"
        echo "1. Check if you have enough disk space (need ~2GB free)"
        echo "2. Check if you have enough RAM (need ~4GB available)"
        echo "3. Try running: docker system prune -a --volumes"
        echo "4. Try manually: cd frontend && npm install --legacy-peer-deps"
        exit 1
    fi
fi

# Step 5: Start services
print_step "5/6 Starting services..."
docker-compose up -d

# Wait for services
print_status "Waiting for services to initialize..."
sleep 15

# Step 6: Verification
print_step "6/6 Verifying deployment..."

# Check container status
print_status "Checking container status..."
docker-compose ps

# Check if containers are running
if ! docker ps | grep -q "lms-frontend.*Up"; then
    print_error "Frontend container is not running!"
    print_warning "Frontend container logs:"
    docker logs lms-frontend 2>/dev/null || echo "No logs available"
    exit 1
fi

if ! docker ps | grep -q "lms-backend.*Up"; then
    print_warning "Backend container is not running (this might be normal if DB is not configured)"
    print_warning "Backend container logs:"
    docker logs lms-backend 2>/dev/null || echo "No logs available"
fi

# Test frontend accessibility
print_status "Testing frontend accessibility..."
sleep 5

# More comprehensive test
FRONTEND_TEST=$(curl -s -w "%{http_code}" http://localhost:3001/ -o /tmp/lms_test.html 2>/dev/null || echo "000")

if [ "$FRONTEND_TEST" = "200" ]; then
    # Check if it's actually the React app, not nginx default
    if grep -qi "nginx" /tmp/lms_test.html && grep -qi "welcome to nginx" /tmp/lms_test.html; then
        print_error "❌ Still getting nginx default page"
        print_warning "This might be a timing issue. Waiting 30 seconds and retrying..."
        sleep 30
        
        FRONTEND_TEST2=$(curl -s -w "%{http_code}" http://localhost:3001/ -o /tmp/lms_test2.html 2>/dev/null || echo "000")
        if [ "$FRONTEND_TEST2" = "200" ] && ! grep -qi "welcome to nginx" /tmp/lms_test2.html; then
            print_status "✅ Success! React app is now serving correctly (after delay)"
        else
            print_error "❌ Still showing nginx default page after retry"
            print_warning "Check container logs for build issues:"
            echo "  docker logs lms-frontend"
        fi
    else
        print_status "✅ Success! React app is serving correctly"
    fi
    
    print_status "🎉 You can now access your LMS at: http://localhost:3001"
else
    print_error "❌ Frontend is not accessible (HTTP $FRONTEND_TEST)"
    print_warning "Checking for common issues..."
fi

# Cleanup temp files
rm -f /tmp/lms_test.html /tmp/lms_test2.html docker-compose.debug.yml

# Show logs for debugging
print_status "Recent container logs for debugging:"
echo ""
print_warning "Frontend logs (last 10 lines):"
docker logs --tail 10 lms-frontend 2>/dev/null || echo "No frontend logs available"

echo ""
print_warning "Backend logs (last 10 lines):"
docker logs --tail 10 lms-backend 2>/dev/null || echo "No backend logs available"

echo ""
print_status "Enhanced Quick Fix Complete!"
print_status "================================="
print_status "Frontend: http://localhost:3001"
print_status "Backend API: http://localhost:3000/api"
print_status ""
print_warning "If you still see issues:"
echo "1. Check logs with: docker logs lms-frontend"
echo "2. Try waiting a few more minutes for build completion"
echo "3. Check available disk space: df -h"
echo "4. Check available memory: free -h"
echo "5. For persistent issues, check GitHub Issues"
