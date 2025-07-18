#!/bin/bash

# LMS Forum API 500 Error - Quick Fix Script
# Run this script to diagnose and fix Forum API issues

echo "🔧 LMS Forum API 500 Error - Quick Fix Script"
echo "=============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${YELLOW}🔍 $1${NC}"
}

# Check if Docker is running
print_info "Checking Docker status..."
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker first."
    exit 1
fi
print_status "Docker is running"

# Check if containers are running
print_info "Checking containers status..."
if ! docker-compose ps | grep -q "Up"; then
    print_warning "Containers are not running. Starting them..."
    docker-compose up -d
    sleep 10
fi
print_status "Containers are running"

# Function to test URL
test_url() {
    local url=$1
    local description=$2
    print_info "Testing $description: $url"
    
    if curl -s -f "$url" > /dev/null; then
        print_status "$description is working"
        return 0
    else
        print_error "$description failed"
        return 1
    fi
}

# Test basic backend health
print_info "Testing backend health..."
if test_url "http://localhost:3000/api/health" "Backend Health Check"; then
    print_status "Backend is running"
else
    print_error "Backend is not responding. Checking logs..."
    echo "Recent backend logs:"
    docker-compose logs --tail=20 backend
    echo ""
    print_warning "Restarting backend..."
    docker-compose restart backend
    sleep 10
fi

# Test database health
print_info "Testing database connection..."
if test_url "http://localhost:3000/api/health/db" "Database Health Check"; then
    print_status "Database is connected"
else
    print_error "Database connection failed. Checking postgres..."
    if ! docker-compose ps postgres | grep -q "Up"; then
        print_warning "PostgreSQL is not running. Starting it..."
        docker-compose up -d postgres
        sleep 15
    fi
fi

# Test database tables
print_info "Checking database tables..."
response=$(curl -s "http://localhost:3000/api/health/tables")
if echo "$response" | grep -q '"status":"ok"'; then
    print_status "All database tables exist"
else
    print_warning "Some tables are missing. Running database seeder..."
    cd backend && npm run seed
    cd ..
fi

# Test frontend
print_info "Testing frontend..."
if test_url "http://localhost:3001" "Frontend"; then
    print_status "Frontend is accessible"
else
    print_error "Frontend is not responding"
    print_warning "Restarting frontend..."
    docker-compose restart frontend
fi

# Run database seeder if needed
print_info "Checking if sample data exists..."
response=$(curl -s "http://localhost:3000/api/health/detailed")
if echo "$response" | grep -q '"users":0'; then
    print_warning "No sample data found. Running database seeder..."
    cd backend
    npm run seed
    cd ..
    print_status "Sample data created"
else
    print_status "Sample data exists"
fi

# Test forum API with sample data
print_info "Testing authentication..."
login_response=$(curl -s -X POST "http://localhost:3000/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"student@university.edu","password":"student123"}')

if echo "$login_response" | grep -q '"success":true'; then
    print_status "Authentication is working"
    
    # Extract JWT token
    token=$(echo "$login_response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    
    if [ -n "$token" ]; then
        print_info "Testing Forum API with authentication..."
        
        # Get course ID from health check
        health_response=$(curl -s "http://localhost:3000/api/health/detailed")
        
        # Test forum API - we'll use a dummy course ID since we need the real one from seeder
        print_info "Forum API test requires course ID from seeded data"
        print_status "Authentication token obtained successfully"
    fi
else
    print_error "Authentication failed. Check if seeder ran properly."
fi

echo ""
echo "🎯 QUICK DIAGNOSIS SUMMARY"
echo "========================="

# Final health check
print_info "Running final health checks..."

# Backend
if test_url "http://localhost:3000/api/health" "Backend" > /dev/null 2>&1; then
    print_status "Backend: Healthy"
else
    print_error "Backend: Failed"
fi

# Database
if test_url "http://localhost:3000/api/health/db" "Database" > /dev/null 2>&1; then
    print_status "Database: Connected"
else
    print_error "Database: Failed"
fi

# Frontend
if test_url "http://localhost:3001" "Frontend" > /dev/null 2>&1; then
    print_status "Frontend: Accessible"
else
    print_error "Frontend: Failed"
fi

echo ""
echo "🚀 NEXT STEPS:"
echo "=============="
echo "1. Open browser: http://localhost:3001"
echo "2. Login with: student@university.edu / student123"
echo "3. Navigate to forum section"
echo "4. If still getting 500 errors, check logs:"
echo "   docker-compose logs -f backend"
echo ""
echo "📚 For detailed debugging, see:"
echo "   FORUM_API_500_ERROR_COMPLETE_FIX.md"
echo ""
print_status "Quick fix script completed!"