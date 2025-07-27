-- ✅ MIGRATION: Create forum_post_likes table for proper like tracking
-- This fixes the multiple likes bug by tracking individual user likes

-- Create forum_post_likes table
CREATE TABLE IF NOT EXISTS forum_post_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key constraints
    CONSTRAINT fk_forum_post_likes_post FOREIGN KEY (post_id) REFERENCES forum_posts(id) ON DELETE CASCADE,
    CONSTRAINT fk_forum_post_likes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Unique constraint to prevent duplicate likes from same user
    CONSTRAINT unique_user_post_like UNIQUE (post_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_forum_post_likes_post_id ON forum_post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_forum_post_likes_user_id ON forum_post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_forum_post_likes_created_at ON forum_post_likes(created_at);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_forum_post_likes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_forum_post_likes_updated_at
    BEFORE UPDATE ON forum_post_likes
    FOR EACH ROW
    EXECUTE FUNCTION update_forum_post_likes_updated_at();

-- ✅ UPDATE: Fix existing forum_posts like counts
-- Recalculate like counts from existing data (if any)
UPDATE forum_posts 
SET likes_count = (
    SELECT COUNT(*) 
    FROM forum_post_likes 
    WHERE forum_post_likes.post_id = forum_posts.id
);

-- Add comment for documentation
COMMENT ON TABLE forum_post_likes IS 'Tracks individual user likes on forum posts to prevent duplicate likes';
COMMENT ON COLUMN forum_post_likes.post_id IS 'Reference to the forum post being liked';
COMMENT ON COLUMN forum_post_likes.user_id IS 'Reference to the user who liked the post';
COMMENT ON CONSTRAINT unique_user_post_like ON forum_post_likes IS 'Prevents users from liking the same post multiple times';

-- ✅ VERIFICATION: Check table creation
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'forum_post_likes') THEN
        RAISE NOTICE '✅ forum_post_likes table created successfully';
    ELSE
        RAISE EXCEPTION '❌ Failed to create forum_post_likes table';
    END IF;
END $$;