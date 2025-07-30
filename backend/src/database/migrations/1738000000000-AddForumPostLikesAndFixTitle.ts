import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddForumPostLikesAndFixTitle1738000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Make title nullable for forum posts (since replies don't need titles)
    await queryRunner.query(`
      ALTER TABLE "forum_posts" 
      ALTER COLUMN "title" DROP NOT NULL
    `);

    // Step 2: Create forum_post_likes table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "forum_post_likes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "post_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_forum_post_likes" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_forum_post_likes_user_post" UNIQUE ("post_id", "user_id")
      )
    `);

    // Step 3: Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "forum_post_likes" 
      ADD CONSTRAINT "FK_forum_post_likes_post" 
      FOREIGN KEY ("post_id") REFERENCES "forum_posts"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "forum_post_likes" 
      ADD CONSTRAINT "FK_forum_post_likes_user" 
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    // Step 4: Create indexes for performance
    await queryRunner.query(`
      CREATE INDEX "IDX_forum_post_likes_post_id" ON "forum_post_likes" ("post_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_forum_post_likes_user_id" ON "forum_post_likes" ("user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_forum_post_likes_created_at" ON "forum_post_likes" ("created_at")
    `);

    // Step 5: Add trigger for updated_at
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_forum_post_likes_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await queryRunner.query(`
      CREATE TRIGGER trigger_update_forum_post_likes_updated_at
        BEFORE UPDATE ON "forum_post_likes"
        FOR EACH ROW
        EXECUTE FUNCTION update_forum_post_likes_updated_at()
    `);

    // Step 6: Add comments for documentation
    await queryRunner.query(`
      COMMENT ON TABLE "forum_post_likes" IS 'Tracks individual user likes on forum posts'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "forum_posts"."title" IS 'Post title - required for root posts, optional for replies'
    `);

    // Step 7: Update existing replies to have proper titles if they don't have one
    await queryRunner.query(`
      UPDATE "forum_posts"
      SET "title" = CONCAT('Re: ', parent_post.title)
      FROM "forum_posts" AS parent_post
      WHERE "forum_posts"."parentId" = parent_post.id 
      AND ("forum_posts"."title" IS NULL OR "forum_posts"."title" = '')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop trigger
    await queryRunner.query(`DROP TRIGGER IF EXISTS trigger_update_forum_post_likes_updated_at ON "forum_post_likes"`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS update_forum_post_likes_updated_at()`);

    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_forum_post_likes_created_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_forum_post_likes_user_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_forum_post_likes_post_id"`);

    // Drop table
    await queryRunner.query(`DROP TABLE IF EXISTS "forum_post_likes"`);

    // Revert title to NOT NULL (fill empty titles first)
    await queryRunner.query(`
      UPDATE "forum_posts"
      SET "title" = 'Untitled Post'
      WHERE "title" IS NULL OR "title" = ''
    `);

    await queryRunner.query(`
      ALTER TABLE "forum_posts" 
      ALTER COLUMN "title" SET NOT NULL
    `);
  }
}
