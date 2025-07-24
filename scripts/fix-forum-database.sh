#!/bin/bash

# 🔧 Forum Posts Database Fix Script
# This script fixes the missing 'type' column in forum_posts table

echo "🔧 Starting Forum Posts Database Fix..."

# Database connection details (adjust if needed)
DB_CONTAINER="lms-universitas-v1_postgres_1"
DB_NAME="lms_db"
DB_USER="postgres"

# Check if PostgreSQL container is running
if ! docker ps | grep -q "$DB_CONTAINER"; then
    echo "❌ PostgreSQL container not found or not running"
    echo "💡 Try: docker-compose up -d"
    exit 1
fi

echo "✅ PostgreSQL container found"

# Execute the fix
docker exec -i $DB_CONTAINER psql -U $DB_USER -d $DB_NAME << 'EOF'

\echo '🔧 Starting forum_posts schema fix...'

-- 1. Create enum type if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'forum_post_type_enum') THEN
        CREATE TYPE forum_post_type_enum AS ENUM ('discussion', 'question', 'announcement');
        RAISE NOTICE '✅ Created forum_post_type_enum';
    ELSE
        RAISE NOTICE '✅ forum_post_type_enum already exists';
    END IF;
END $$;

-- 2. Add type column if missing
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'forum_posts' AND column_name = 'type') THEN
        ALTER TABLE forum_posts 
        ADD COLUMN "type" forum_post_type_enum DEFAULT 'discussion' NOT NULL;
        RAISE NOTICE '✅ Added type column to forum_posts';
    ELSE
        RAISE NOTICE '✅ type column already exists in forum_posts';
    END IF;
END $$;

-- 3. Add isAnswer column if missing
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'forum_posts' AND column_name = 'isAnswer') THEN
        ALTER TABLE forum_posts 
        ADD COLUMN "isAnswer" BOOLEAN DEFAULT FALSE NOT NULL;
        RAISE NOTICE '✅ Added isAnswer column to forum_posts';
    ELSE
        RAISE NOTICE '✅ isAnswer column already exists in forum_posts';
    END IF;
END $$;

-- 4. Add isAnswered column if missing
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'forum_posts' AND column_name = 'isAnswered') THEN
        ALTER TABLE forum_posts 
        ADD COLUMN "isAnswered" BOOLEAN DEFAULT FALSE NOT NULL;
        RAISE NOTICE '✅ Added isAnswered column to forum_posts';
    ELSE
        RAISE NOTICE '✅ isAnswered column already exists in forum_posts';
    END IF;
END $$;

-- 5. Add viewsCount column if missing
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'forum_posts' AND column_name = 'viewsCount') THEN
        ALTER TABLE forum_posts 
        ADD COLUMN "viewsCount" INTEGER DEFAULT 0 NOT NULL;
        RAISE NOTICE '✅ Added viewsCount column to forum_posts';
    ELSE
        RAISE NOTICE '✅ viewsCount column already exists in forum_posts';
    END IF;
END $$;

-- 6. Update existing posts to have default type
UPDATE forum_posts 
SET "type" = 'discussion' 
WHERE "type" IS NULL;

-- 7. Create indexes if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'IDX_forum_posts_courseId_createdAt') THEN
        CREATE INDEX "IDX_forum_posts_courseId_createdAt" ON forum_posts ("courseId", "createdAt");
        RAISE NOTICE '✅ Created index IDX_forum_posts_courseId_createdAt';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'IDX_forum_posts_courseId_isPinned') THEN
        CREATE INDEX "IDX_forum_posts_courseId_isPinned" ON forum_posts ("courseId", "isPinned");
        RAISE NOTICE '✅ Created index IDX_forum_posts_courseId_isPinned';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'IDX_forum_posts_courseId') THEN
        CREATE INDEX "IDX_forum_posts_courseId" ON forum_posts ("courseId");
        RAISE NOTICE '✅ Created index IDX_forum_posts_courseId';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'IDX_forum_posts_authorId') THEN
        CREATE INDEX "IDX_forum_posts_authorId" ON forum_posts ("authorId");
        RAISE NOTICE '✅ Created index IDX_forum_posts_authorId';
    END IF;
END $$;

-- 8. Verify the fix
\echo '🔍 Verifying forum_posts table structure...'
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'forum_posts' 
ORDER BY column_name;

\echo '✅ Forum posts schema fix completed successfully!'
EOF

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 SUCCESS! Forum posts database fix completed!"
    echo "🔍 Testing API endpoint..."
    
    # Test the API endpoint
    response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/forums/my-discussions 2>/dev/null)
    
    if [ "$response" = "200" ] || [ "$response" = "401" ]; then
        echo "✅ API endpoint is responding (HTTP $response)"
        echo "🎯 Forum functionality should now work properly!"
    else
        echo "⚠️  API still returning HTTP $response - backend may need restart"
        echo "💡 Try: docker-compose restart backend"
    fi
    
    echo ""
    echo "📋 Next steps:"
    echo "1. Check backend logs: docker-compose logs backend"
    echo "2. Test forum in UI: http://localhost:3001"
    echo "3. If still issues, restart backend: docker-compose restart backend"
else
    echo "❌ Database fix failed. Check the error messages above."
    exit 1
fi
