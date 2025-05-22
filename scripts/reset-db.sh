#!/bin/bash

# LMS Universitas v1.0 - Database Reset Script
# This script will reset the database to initial state

set -e

echo "🔄 Resetting LMS database..."
echo "WARNING: This will delete all existing data!"
echo

read -p "Are you sure you want to continue? (y/N): " confirm
if [[ $confirm != [yY] ]]; then
    echo "Operation cancelled"
    exit 0
fi

# Load environment variables
if [ -f "backend/.env" ]; then
    export $(cat backend/.env | grep -v '^#' | xargs)
else
    echo "❌ Error: backend/.env file not found"
    echo "Please run the setup script first"
    exit 1
fi

echo "Dropping existing database..."
sudo -u postgres psql << EOF
DROP DATABASE IF EXISTS $DB_DATABASE;
CREATE DATABASE $DB_DATABASE;
GRANT ALL PRIVILEGES ON DATABASE $DB_DATABASE TO $DB_USERNAME;
\q
EOF

echo "Running migrations..."
cd backend
npm run migration:run

echo "Seeding initial data..."
npm run seed

echo "✅ Database reset completed successfully!"
echo
echo "👤 Demo accounts available:"
echo "Admin: admin@universitas.ac.id / admin123"
echo "Lecturer: dr.ahmad@universitas.ac.id / lecturer123"
echo "Student: andi.pratama@student.ac.id / student123"
