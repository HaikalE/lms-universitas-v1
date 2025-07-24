import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixForumPostsTypeMissing1737800000000 implements MigrationInterface {
  name = 'FixForumPostsTypeMissing1737800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('🔧 Starting forum_posts schema fix...');
    
    try {
      // 1. Create enum type if it doesn't exist
      await queryRunner.query(`
        DO $$ 
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'forum_post_type_enum') THEN
                CREATE TYPE forum_post_type_enum AS ENUM ('discussion', 'question', 'announcement');
                RAISE NOTICE '✅ Created forum_post_type_enum';
            ELSE
                RAISE NOTICE '✅ forum_post_type_enum already exists';
            END IF;
        END $$;
      `);

      // 2. Add type column if missing
      await queryRunner.query(`
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
      `);

      // 3. Add isAnswer column if missing
      await queryRunner.query(`
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
      `);

      // 4. Add isAnswered column if missing
      await queryRunner.query(`
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
      `);

      // 5. Add viewsCount column if missing (just in case)
      await queryRunner.query(`
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
      `);

      // 6. Update existing posts to have default type if somehow null
      await queryRunner.query(`
        UPDATE forum_posts 
        SET "type" = 'discussion' 
        WHERE "type" IS NULL;
      `);

      // 7. Create indexes if they don't exist
      await queryRunner.query(`
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
      `);

      console.log('✅ Forum posts schema fix completed successfully!');
      
    } catch (error) {
      console.error('❌ Error during forum_posts schema fix:', error);
      throw error;
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('🔄 Reverting forum_posts schema fix...');
    
    // This migration is a fix, so down() should be safe
    // We don't want to remove columns that might have been added by other means
    console.log('⚠️  This is a fix migration - manual reversion required if needed');
  }
}
