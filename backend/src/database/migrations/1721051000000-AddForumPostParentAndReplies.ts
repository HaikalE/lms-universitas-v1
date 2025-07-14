import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

export class AddForumPostParentAndReplies1721051000000 implements MigrationInterface {
  name = 'AddForumPostParentAndReplies1721051000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add parentId column for simple parent-child relationships
    await queryRunner.addColumn(
      'forum_posts',
      new TableColumn({
        name: 'parentId',
        type: 'uuid',
        isNullable: true,
      })
    );

    // Add repliesCount column for tracking reply counts
    await queryRunner.addColumn(
      'forum_posts',
      new TableColumn({
        name: 'repliesCount',
        type: 'integer',
        default: 0,
        isNullable: false,
      })
    );

    // Add index for parentId for better query performance
    await queryRunner.createIndex(
      'forum_posts',
      new TableIndex({
        name: 'IDX_forum_posts_parentId',
        columnNames: ['parentId'],
      })
    );

    // Add foreign key constraint for parentId
    await queryRunner.query(`
      ALTER TABLE "forum_posts" 
      ADD CONSTRAINT "FK_forum_posts_parentId" 
      FOREIGN KEY ("parentId") 
      REFERENCES "forum_posts"("id") 
      ON DELETE CASCADE
    `);

    console.log('✅ Forum post parent and replies fields migration completed successfully');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "forum_posts" 
      DROP CONSTRAINT "FK_forum_posts_parentId"
    `);

    // Drop index
    await queryRunner.dropIndex('forum_posts', 'IDX_forum_posts_parentId');

    // Remove the columns
    await queryRunner.dropColumns('forum_posts', ['parentId', 'repliesCount']);

    console.log('✅ Forum post parent and replies fields migration reverted successfully');
  }
}