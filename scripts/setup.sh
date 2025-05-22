#!/bin/bash

# LMS Universitas v1.0 - Setup Script
# This script will setup the entire LMS system automatically

set -e

echo "🚀 Starting LMS Universitas v1.0 Setup..."
echo "================================================="

# Check if required commands exist
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo "❌ Error: $1 is not installed"
        echo "Please install $1 and try again"
        exit 1
    fi
}

echo "🔍 Checking system requirements..."
check_command "node"
check_command "npm"
check_command "psql"
check_command "git"

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt "18" ]; then
    echo "❌ Error: Node.js version 18 or higher is required"
    echo "Current version: $(node --version)"
    exit 1
fi

echo "✅ System requirements met"

# Database setup
echo "\n📦 Setting up PostgreSQL database..."
read -p "Enter PostgreSQL superuser name (default: postgres): " PG_SUPERUSER
PG_SUPERUSER=${PG_SUPERUSER:-postgres}

read -p "Enter database name (default: lms_db): " DB_NAME
DB_NAME=${DB_NAME:-lms_db}

read -p "Enter database user (default: lms_user): " DB_USER
DB_USER=${DB_USER:-lms_user}

read -s -p "Enter database password: " DB_PASSWORD
echo

if [ -z "$DB_PASSWORD" ]; then
    echo "❌ Error: Database password cannot be empty"
    exit 1
fi

# Create database and user
echo "Creating database and user..."
sudo -u $PG_SUPERUSER psql << EOF
DROP DATABASE IF EXISTS $DB_NAME;
DROP USER IF EXISTS $DB_USER;
CREATE DATABASE $DB_NAME;
CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
\q
EOF

echo "✅ Database setup completed"

# Backend setup
echo "\n⚙️ Setting up backend..."
cd backend

echo "Installing backend dependencies..."
npm install

# Generate JWT secret
JWT_SECRET=$(openssl rand -base64 64)

# Create .env file
cat > .env << EOF
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_DATABASE=$DB_NAME

# JWT
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=7d

# App
PORT=3000
NODE_ENV=development
APP_URL=http://localhost:3000

# File Upload
UPLOAD_DEST=./uploads
MAX_FILE_SIZE=10485760

# Cors
CORS_ORIGIN=http://localhost:3001
EOF

echo "Running database migrations..."
npm run migration:run

echo "Seeding initial data..."
npm run seed

# Create uploads directory
mkdir -p uploads
chmod 755 uploads

echo "✅ Backend setup completed"

# Frontend setup
echo "\n🎨 Setting up frontend..."
cd ../frontend

echo "Installing frontend dependencies..."
npm install

# Create .env file for frontend
cat > .env << EOF
REACT_APP_API_URL=http://localhost:3000/api
EOF

echo "✅ Frontend setup completed"

# Create start script
echo "\n📜 Creating start scripts..."
cd ..

# Create start script for development
cat > start-dev.sh << 'EOF'
#!/bin/bash

echo "🚀 Starting LMS Universitas v1.0 in development mode..."
echo "Backend: http://localhost:3000"
echo "Frontend: http://localhost:3001"
echo "Press Ctrl+C to stop all services"
echo

# Function to kill all background processes on exit
cleanup() {
    echo "\n🛑 Stopping all services..."
    kill $(jobs -p) 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start backend
echo "🔧 Starting backend server..."
cd backend && npm run start:dev &
BACKEND_PID=$!

# Wait for backend to start
sleep 5

# Start frontend
echo "🎨 Starting frontend server..."
cd ../frontend && npm start &
FRONTEND_PID=$!

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
EOF

chmod +x start-dev.sh

# Create production build script
cat > build-prod.sh << 'EOF'
#!/bin/bash

echo "🏗️ Building LMS Universitas v1.0 for production..."

# Build backend
echo "Building backend..."
cd backend
npm run build
echo "✅ Backend built successfully"

# Build frontend
echo "Building frontend..."
cd ../frontend
npm run build
echo "✅ Frontend built successfully"

echo "\n🎉 Production build completed!"
echo "Backend build: backend/dist/"
echo "Frontend build: frontend/build/"
EOF

chmod +x build-prod.sh

# Create Docker start script
cat > start-docker.sh << 'EOF'
#!/bin/bash

echo "🐳 Starting LMS Universitas v1.0 with Docker..."
echo "This will build and run the application in containers"
echo

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Error: Docker is not installed"
    echo "Please install Docker and try again"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Error: Docker Compose is not installed"
    echo "Please install Docker Compose and try again"
    exit 1
fi

# Build and start containers
docker-compose up --build -d

echo "\n🎉 LMS is starting up in Docker containers!"
echo "Frontend: http://localhost:3001"
echo "Backend API: http://localhost:3000/api"
echo
echo "To stop the containers, run: docker-compose down"
echo "To view logs, run: docker-compose logs -f"
EOF

chmod +x start-docker.sh

echo "\n🎉 Setup completed successfully!"
echo "================================================="
echo
echo "📋 What's been set up:"
echo "✅ PostgreSQL database: $DB_NAME"
echo "✅ Database user: $DB_USER"
echo "✅ Backend with migrations and seed data"
echo "✅ Frontend with environment configuration"
echo "✅ Development and production scripts"
echo
echo "🚀 Quick start options:"
echo "1. Development mode: ./start-dev.sh"
echo "2. Docker mode: ./start-docker.sh"
echo "3. Production build: ./build-prod.sh"
echo
echo "👤 Demo accounts created:"
echo "Admin: admin@universitas.ac.id / admin123"
echo "Lecturer: dr.ahmad@universitas.ac.id / lecturer123"
echo "Student: andi.pratama@student.ac.id / student123"
echo
echo "📖 For more information, see docs/SETUP.md"
echo "🐛 If you encounter issues, check docs/TROUBLESHOOTING.md"
