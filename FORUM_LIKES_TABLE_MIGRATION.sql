-- 🔧 FORUM LIKES TABLE MIGRATION
-- This table is needed for the like functionality to work properly

-- Drop table if exists (for clean recreation)
DROP TABLE IF EXISTS forum_post_likes;

-- Create forum_post_likes table
CREATE TABLE forum_post_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key constraints
    CONSTRAINT fk_forum_post_likes_post_id 
        FOREIGN KEY (post_id) 
        REFERENCES forum_posts(id) 
        ON DELETE CASCADE,
        
    CONSTRAINT fk_forum_post_likes_user_id 
        FOREIGN KEY (user_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE,
    
    -- Unique constraint to prevent duplicate likes
    CONSTRAINT uk_forum_post_likes_post_user 
        UNIQUE (post_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX idx_forum_post_likes_post_id ON forum_post_likes(post_id);
CREATE INDEX idx_forum_post_likes_user_id ON forum_post_likes(user_id);
CREATE INDEX idx_forum_post_likes_created_at ON forum_post_likes(created_at);

-- Create trigger to update forum_posts.likesCount automatically
CREATE OR REPLACE FUNCTION update_forum_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Increment likes count
        UPDATE forum_posts 
        SET likesCount = likesCount + 1,
            updatedAt = NOW()
        WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrement likes count
        UPDATE forum_posts 
        SET likesCount = GREATEST(likesCount - 1, 0),
            updatedAt = NOW()
        WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for insert and delete
DROP TRIGGER IF EXISTS trigger_forum_post_likes_insert ON forum_post_likes;
CREATE TRIGGER trigger_forum_post_likes_insert
    AFTER INSERT ON forum_post_likes
    FOR EACH ROW
    EXECUTE FUNCTION update_forum_post_likes_count();

DROP TRIGGER IF EXISTS trigger_forum_post_likes_delete ON forum_post_likes;
CREATE TRIGGER trigger_forum_post_likes_delete
    AFTER DELETE ON forum_post_likes
    FOR EACH ROW
    EXECUTE FUNCTION update_forum_post_likes_count();

-- Verify the table was created
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'forum_post_likes'
ORDER BY ordinal_position;

-- Test data insertion (optional - for testing)
-- Replace these UUIDs with actual values from your database
/*
-- Get some real post and user IDs for testing
INSERT INTO forum_post_likes (post_id, user_id) VALUES 
    ('9ef49fa6-47c4-4829-9c45-af53a888f2c0', '93739b43-c91b-486d-b4da-0d49eada1a7b');

-- Verify the like was inserted and count updated
SELECT 
    p.id,
    p.title,
    p.likesCount,
    COUNT(l.id) as actual_likes
FROM forum_posts p
LEFT JOIN forum_post_likes l ON p.id = l.post_id
WHERE p.id = '9ef49fa6-47c4-4829-9c45-af53a888f2c0'
GROUP BY p.id, p.title, p.likesCount;
*/

-- Final verification
SELECT 'Forum likes table created successfully!' as status;