#!/bin/bash

# Quick Fix Script for Nginx Default Page Issue
# Author: Claude AI Assistant
# Created: July 26, 2025

echo "🔧 LMS Docker Quick Fix - Nginx Default Page Issue"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Stop existing containers
print_status "Stopping existing containers..."
docker-compose down

# Clean up Docker system
print_status "Cleaning up Docker cache..."
docker system prune -f

# Remove old images (optional)
print_warning "Removing old LMS images..."
docker rmi lms-universitas-v1_frontend 2>/dev/null || true
docker rmi lms-universitas-v1_backend 2>/dev/null || true

# Rebuild with no cache
print_status "Rebuilding containers (this may take a few minutes)..."
docker-compose build --no-cache

# Start services
print_status "Starting services..."
docker-compose up -d

# Wait for services to be ready
print_status "Waiting for services to start..."
sleep 10

# Check container status
print_status "Checking container status..."
docker-compose ps

# Test frontend accessibility
print_status "Testing frontend accessibility..."
sleep 5

if curl -s http://localhost:3001/ | grep -q "nginx" && curl -s http://localhost:3001/ | grep -q "Welcome to nginx"; then
    print_error "❌ Issue still exists - nginx default page is showing"
    print_warning "Please check container logs:"
    echo "  docker logs lms-frontend"
    echo "  docker logs lms-backend"
else
    print_status "✅ Success! React app is now serving correctly"
    print_status "🎉 You can now access your LMS at: http://localhost:3001"
fi

# Show logs for debugging
print_status "Recent frontend logs:"
docker logs --tail 10 lms-frontend

print_status "Recent backend logs:"
docker logs --tail 10 lms-backend

echo ""
print_status "Quick Fix Complete!"
print_status "========================"
print_status "Frontend: http://localhost:3001"
print_status "Backend API: http://localhost:3000/api"
print_status ""
print_warning "If you still see issues, check the logs with:"
echo "  docker logs lms-frontend"
echo "  docker logs lms-backend"
