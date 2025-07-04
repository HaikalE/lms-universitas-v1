-- ============================================
-- FORUM ENHANCEMENT MIGRATION SCRIPT
-- Version: 2.0
-- Description: Enhance forum with categories, tags, attachments, individual likes, and notifications
-- ============================================

-- Drop existing constraints if they exist to avoid conflicts
ALTER TABLE forum_posts DROP CONSTRAINT IF EXISTS FK_forum_posts_course;
ALTER TABLE forum_posts DROP CONSTRAINT IF EXISTS FK_forum_posts_author;

-- ============================================
-- 1. ENHANCE EXISTING FORUM_POSTS TABLE
-- ============================================

-- Add new columns to forum_posts
ALTER TABLE forum_posts 
ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'general',
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS is_announcement BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS reply_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS best_answer_id UUID;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS IDX_forum_post_title ON forum_posts USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS IDX_forum_post_category ON forum_posts (category);
CREATE INDEX IF NOT EXISTS IDX_forum_post_course ON forum_posts (course_id);
CREATE INDEX IF NOT EXISTS IDX_forum_post_author ON forum_posts (author_id);
CREATE INDEX IF NOT EXISTS IDX_forum_post_created ON forum_posts (created_at);
CREATE INDEX IF NOT EXISTS IDX_forum_post_activity ON forum_posts (last_activity_at);
CREATE INDEX IF NOT EXISTS IDX_forum_post_pinned ON forum_posts (is_pinned);
CREATE INDEX IF NOT EXISTS IDX_forum_post_likes ON forum_posts (likes_count);

-- ============================================
-- 2. CREATE FORUM_LIKES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS forum_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    post_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT FK_forum_likes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT FK_forum_likes_post FOREIGN KEY (post_id) REFERENCES forum_posts(id) ON DELETE CASCADE,
    CONSTRAINT UQ_forum_likes_user_post UNIQUE (user_id, post_id)
);

-- Indexes for forum_likes
CREATE INDEX IF NOT EXISTS IDX_forum_like_user ON forum_likes (user_id);
CREATE INDEX IF NOT EXISTS IDX_forum_like_post ON forum_likes (post_id);

-- ============================================
-- 3. CREATE FORUM_ATTACHMENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS forum_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_size INTEGER NOT NULL DEFAULT 0,
    mime_type VARCHAR(100) NOT NULL DEFAULT 'application/octet-stream',
    file_url VARCHAR(500),
    thumbnail_url VARCHAR(500),
    uploaded_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT FK_forum_attachments_post FOREIGN KEY (post_id) REFERENCES forum_posts(id) ON DELETE CASCADE
);

-- Indexes for forum_attachments
CREATE INDEX IF NOT EXISTS IDX_forum_attachment_post ON forum_attachments (post_id);

-- ============================================
-- 4. CREATE FORUM_NOTIFICATIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS forum_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    post_id UUID NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('reply', 'like', 'mention', 'best_answer', 'pin', 'announcement')),
    message TEXT,
    is_read BOOLEAN DEFAULT false,
    triggered_by_id UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT FK_forum_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT FK_forum_notifications_post FOREIGN KEY (post_id) REFERENCES forum_posts(id) ON DELETE CASCADE,
    CONSTRAINT FK_forum_notifications_triggered_by FOREIGN KEY (triggered_by_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes for forum_notifications
CREATE INDEX IF NOT EXISTS IDX_forum_notification_user ON forum_notifications (user_id);
CREATE INDEX IF NOT EXISTS IDX_forum_notification_read ON forum_notifications (user_id, is_read);
CREATE INDEX IF NOT EXISTS IDX_forum_notification_created ON forum_notifications (user_id, created_at);

-- ============================================
-- 5. UPDATE EXISTING DATA
-- ============================================

-- Set default category for existing posts
UPDATE forum_posts 
SET category = 'general' 
WHERE category IS NULL;

-- Set last_activity_at for existing posts
UPDATE forum_posts 
SET last_activity_at = COALESCE(updated_at, created_at)
WHERE last_activity_at IS NULL;

-- Update reply counts for existing posts
WITH reply_counts AS (
    SELECT 
        parent.id as parent_id,
        COUNT(child.id) as reply_count
    FROM forum_posts parent
    LEFT JOIN forum_posts child ON child.parent_id = parent.id
    WHERE parent.parent_id IS NULL
    GROUP BY parent.id
)
UPDATE forum_posts 
SET reply_count = reply_counts.reply_count
FROM reply_counts 
WHERE forum_posts.id = reply_counts.parent_id;

-- ============================================
-- 6. CREATE FUNCTIONS AND TRIGGERS
-- ============================================

-- Function to update likes count
CREATE OR REPLACE FUNCTION update_forum_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE forum_posts 
        SET likes_count = likes_count + 1,
            last_activity_at = NOW()
        WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE forum_posts 
        SET likes_count = GREATEST(likes_count - 1, 0)
        WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for likes count
DROP TRIGGER IF EXISTS trigger_update_likes_count ON forum_likes;
CREATE TRIGGER trigger_update_likes_count
    AFTER INSERT OR DELETE ON forum_likes
    FOR EACH ROW EXECUTE FUNCTION update_forum_post_likes_count();

-- Function to update reply count and last activity
CREATE OR REPLACE FUNCTION update_forum_post_reply_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Update parent post reply count and activity
        IF NEW.parent_id IS NOT NULL THEN
            UPDATE forum_posts 
            SET reply_count = reply_count + 1,
                last_activity_at = NOW()
            WHERE id = NEW.parent_id;
        END IF;
        
        -- Update self activity
        UPDATE forum_posts 
        SET last_activity_at = NOW()
        WHERE id = NEW.id;
        
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Update parent post reply count
        IF OLD.parent_id IS NOT NULL THEN
            UPDATE forum_posts 
            SET reply_count = GREATEST(reply_count - 1, 0)
            WHERE id = OLD.parent_id;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for reply stats
DROP TRIGGER IF EXISTS trigger_update_reply_stats ON forum_posts;
CREATE TRIGGER trigger_update_reply_stats
    AFTER INSERT OR DELETE ON forum_posts
    FOR EACH ROW EXECUTE FUNCTION update_forum_post_reply_stats();

-- ============================================
-- 7. ADD FOREIGN KEY CONSTRAINTS
-- ============================================

-- Add best answer foreign key
ALTER TABLE forum_posts 
ADD CONSTRAINT FK_forum_posts_best_answer 
FOREIGN KEY (best_answer_id) REFERENCES forum_posts(id) ON DELETE SET NULL;

-- Re-add other foreign keys if they don't exist
ALTER TABLE forum_posts 
ADD CONSTRAINT FK_forum_posts_course 
FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;

ALTER TABLE forum_posts 
ADD CONSTRAINT FK_forum_posts_author 
FOREIGN KEY (author_id) REFERENCES users(id);

-- ============================================
-- 8. CREATE VIEWS FOR ANALYTICS
-- ============================================

-- View for forum statistics per course
CREATE OR REPLACE VIEW forum_course_stats AS
SELECT 
    c.id as course_id,
    c.name as course_name,
    c.code as course_code,
    COUNT(DISTINCT fp.id) as total_posts,
    COUNT(DISTINCT CASE WHEN fp.parent_id IS NULL THEN fp.id END) as root_posts,
    COUNT(DISTINCT CASE WHEN fp.parent_id IS NOT NULL THEN fp.id END) as replies,
    COUNT(DISTINCT fp.author_id) as active_users,
    SUM(fp.likes_count) as total_likes,
    SUM(fp.view_count) as total_views,
    MAX(fp.last_activity_at) as last_activity
FROM courses c
LEFT JOIN forum_posts fp ON fp.course_id = c.id
GROUP BY c.id, c.name, c.code;

-- View for user forum activity
CREATE OR REPLACE VIEW forum_user_stats AS
SELECT 
    u.id as user_id,
    u.full_name,
    u.role,
    COUNT(DISTINCT fp.id) as total_posts,
    COUNT(DISTINCT CASE WHEN fp.parent_id IS NULL THEN fp.id END) as root_posts,
    COUNT(DISTINCT CASE WHEN fp.parent_id IS NOT NULL THEN fp.id END) as replies,
    COUNT(DISTINCT fl.id) as likes_given,
    SUM(fp.likes_count) as likes_received,
    COUNT(DISTINCT CASE WHEN fp.best_answer_id IS NOT NULL THEN fp.id END) as best_answers
FROM users u
LEFT JOIN forum_posts fp ON fp.author_id = u.id
LEFT JOIN forum_likes fl ON fl.user_id = u.id
GROUP BY u.id, u.full_name, u.role;

-- ============================================
-- 9. SAMPLE DATA (OPTIONAL - for testing)
-- ============================================

-- Insert sample categories data
INSERT INTO forum_posts (id, title, content, course_id, author_id, category, tags, is_announcement) 
SELECT 
    gen_random_uuid(),
    'Welcome to the Enhanced Forum!',
    'This is an announcement about the new forum features including categories, tags, and better notifications.',
    c.id,
    u.id,
    'announcement',
    ARRAY['welcome', 'announcement', 'new-features'],
    true
FROM courses c
CROSS JOIN users u
WHERE u.role = 'lecturer' 
AND c.lecturer_id = u.id
LIMIT 3
ON CONFLICT DO NOTHING;

-- ============================================
-- 10. FINAL CHECKS AND CLEANUP
-- ============================================

-- Verify all tables exist
DO $$
BEGIN
    ASSERT (SELECT COUNT(*) FROM information_schema.tables 
            WHERE table_name IN ('forum_likes', 'forum_attachments', 'forum_notifications')) = 3,
           'Not all forum enhancement tables were created successfully';
    
    RAISE NOTICE 'Forum Enhancement Migration Completed Successfully!';
    RAISE NOTICE 'New features available:';
    RAISE NOTICE '✅ Individual likes tracking';
    RAISE NOTICE '✅ File attachments support';
    RAISE NOTICE '✅ Real-time notifications';
    RAISE NOTICE '✅ Post categories and tags';
    RAISE NOTICE '✅ View count and activity tracking';
    RAISE NOTICE '✅ Best answer marking';
    RAISE NOTICE '✅ Performance optimizations';
END $$;
