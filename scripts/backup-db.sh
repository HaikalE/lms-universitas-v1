#!/bin/bash

# LMS Universitas v1.0 - Database Backup Script

set -e

echo "💾 Creating LMS database backup..."

# Load environment variables
if [ -f "backend/.env" ]; then
    export $(cat backend/.env | grep -v '^#' | xargs)
else
    echo "❌ Error: backend/.env file not found"
    exit 1
fi

# Create backup directory
BACKUP_DIR="backups"
mkdir -p $BACKUP_DIR

# Generate filename with timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/lms_backup_$TIMESTAMP.sql"
UPLOADS_BACKUP="$BACKUP_DIR/uploads_backup_$TIMESTAMP.tar.gz"

echo "Creating database backup..."
PGPASSWORD=$DB_PASSWORD pg_dump -h $DB_HOST -U $DB_USERNAME -d $DB_DATABASE > $BACKUP_FILE

echo "Creating uploads backup..."
if [ -d "backend/uploads" ]; then
    tar -czf $UPLOADS_BACKUP backend/uploads/
else
    echo "⚠️  Warning: uploads directory not found"
fi

echo "✅ Backup completed successfully!"
echo "Database backup: $BACKUP_FILE"
if [ -f "$UPLOADS_BACKUP" ]; then
    echo "Uploads backup: $UPLOADS_BACKUP"
fi
echo
echo "📁 Backup size:"
ls -lh $BACKUP_FILE
if [ -f "$UPLOADS_BACKUP" ]; then
    ls -lh $UPLOADS_BACKUP
fi
