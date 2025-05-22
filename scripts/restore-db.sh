#!/bin/bash

# LMS Universitas v1.0 - Database Restore Script

set -e

if [ -z "$1" ]; then
    echo "Usage: $0 <backup_file.sql>"
    echo "Example: $0 backups/lms_backup_20240522_140000.sql"
    exit 1
fi

BACKUP_FILE=$1

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Error: Backup file '$BACKUP_FILE' not found"
    exit 1
fi

echo "🔄 Restoring LMS database from backup..."
echo "Backup file: $BACKUP_FILE"
echo
echo "WARNING: This will replace all existing data!"
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
    exit 1
fi

echo "Dropping existing database..."
sudo -u postgres psql << EOF
DROP DATABASE IF EXISTS $DB_DATABASE;
CREATE DATABASE $DB_DATABASE;
GRANT ALL PRIVILEGES ON DATABASE $DB_DATABASE TO $DB_USERNAME;
\q
EOF

echo "Restoring database from backup..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USERNAME -d $DB_DATABASE < $BACKUP_FILE

echo "✅ Database restore completed successfully!"
