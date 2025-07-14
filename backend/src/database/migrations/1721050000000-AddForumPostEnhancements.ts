import { MigrationInterface, QueryRunner, TableColumn, Index } from 'typeorm';

export class AddForumPostEnhancements1721050000000 implements MigrationInterface {
  name = 'AddForumPostEnhancements1721050000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add the new columns to forum_posts table
    await queryRunner.addColumns('forum_posts', [
      new TableColumn({
        name: 'type',
        type: 'enum',
        enum: ['discussion', 'question', 'announcement'],
        default: "'discussion'",
        isNullable: false,
      }),
      new TableColumn({
        name: 'viewsCount',
        type: 'integer',
        default: 0,
        isNullable: false,
      }),
      new TableColumn({
        name: 'isAnswer',
        type: 'boolean',
        default: false,
        isNullable: false,
      }),
      new TableColumn({
        name: 'isAnswered',
        type: 'boolean',
        default: false,
        isNullable: false,
      }),
    ]);

    // Add indexes for better performance
    await queryRunner.createIndex(
      'forum_posts',
      new Index('IDX_forum_posts_courseId_createdAt', ['courseId', 'createdAt'])
    );

    await queryRunner.createIndex(
      'forum_posts',
      new Index('IDX_forum_posts_courseId_isPinned', ['courseId', 'isPinned'])
    );

    await queryRunner.createIndex(
      'forum_posts',
      new Index('IDX_forum_posts_courseId', ['courseId'])
    );

    await queryRunner.createIndex(
      'forum_posts',
      new Index('IDX_forum_posts_authorId', ['authorId'])
    );

    console.log('✅ Forum post enhancements migration completed successfully');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.dropIndex('forum_posts', 'IDX_forum_posts_courseId_createdAt');
    await queryRunner.dropIndex('forum_posts', 'IDX_forum_posts_courseId_isPinned');
    await queryRunner.dropIndex('forum_posts', 'IDX_forum_posts_courseId');
    await queryRunner.dropIndex('forum_posts', 'IDX_forum_posts_authorId');

    // Remove the new columns
    await queryRunner.dropColumns('forum_posts', [
      'type',
      'viewsCount',
      'isAnswer',
      'isAnswered',
    ]);

    console.log('✅ Forum post enhancements migration reverted successfully');
  }
}