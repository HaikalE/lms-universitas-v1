import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

export class AddForumPostEnhancements1721050000000 implements MigrationInterface {
  name = 'AddForumPostEnhancements1721050000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Helper function to check if column exists
    const columnExists = async (tableName: string, columnName: string): Promise<boolean> => {
      const result = await queryRunner.query(`
        SELECT COUNT(*) 
        FROM information_schema.columns 
        WHERE table_name = $1 AND column_name = $2
      `, [tableName, columnName]);
      return parseInt(result[0].count) > 0;
    };

    // Helper function to check if index exists
    const indexExists = async (indexName: string): Promise<boolean> => {
      const result = await queryRunner.query(`
        SELECT COUNT(*) 
        FROM pg_indexes 
        WHERE indexname = $1
      `, [indexName]);
      return parseInt(result[0].count) > 0;
    };

    console.log('🔍 Checking existing forum_posts schema...');

    // Create enum type if it doesn't exist
    await queryRunner.query(`
      DO $$ 
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'forum_post_type_enum') THEN
              CREATE TYPE forum_post_type_enum AS ENUM ('discussion', 'question', 'announcement');
          END IF;
      END $$;
    `);

    // Add columns conditionally
    const columnsToAdd = [
      {
        name: 'type',
        column: new TableColumn({
          name: 'type',
          type: 'enum',
          enum: ['discussion', 'question', 'announcement'],
          default: "'discussion'",
          isNullable: false,
        })
      },
      {
        name: 'viewsCount',
        column: new TableColumn({
          name: 'viewsCount',
          type: 'integer',
          default: 0,
          isNullable: false,
        })
      },
      {
        name: 'isAnswer',
        column: new TableColumn({
          name: 'isAnswer',
          type: 'boolean',
          default: false,
          isNullable: false,
        })
      },
      {
        name: 'isAnswered',
        column: new TableColumn({
          name: 'isAnswered',
          type: 'boolean',
          default: false,
          isNullable: false,
        })
      }
    ];

    for (const { name, column } of columnsToAdd) {
      const exists = await columnExists('forum_posts', name);
      if (!exists) {
        console.log(`➕ Adding column: ${name}`);
        await queryRunner.addColumn('forum_posts', column);
      } else {
        console.log(`✅ Column ${name} already exists, skipping...`);
      }
    }

    // Add indexes conditionally
    const indexesToAdd = [
      {
        name: 'IDX_forum_posts_courseId_createdAt',
        index: new TableIndex({
          name: 'IDX_forum_posts_courseId_createdAt',
          columnNames: ['courseId', 'createdAt']
        })
      },
      {
        name: 'IDX_forum_posts_courseId_isPinned',
        index: new TableIndex({
          name: 'IDX_forum_posts_courseId_isPinned',
          columnNames: ['courseId', 'isPinned']
        })
      },
      {
        name: 'IDX_forum_posts_courseId',
        index: new TableIndex({
          name: 'IDX_forum_posts_courseId',
          columnNames: ['courseId']
        })
      },
      {
        name: 'IDX_forum_posts_authorId',
        index: new TableIndex({
          name: 'IDX_forum_posts_authorId',
          columnNames: ['authorId']
        })
      }
    ];

    for (const { name, index } of indexesToAdd) {
      const exists = await indexExists(name);
      if (!exists) {
        console.log(`📊 Adding index: ${name}`);
        await queryRunner.createIndex('forum_posts', index);
      } else {
        console.log(`✅ Index ${name} already exists, skipping...`);
      }
    }

    // Update existing posts to have default type if null
    await queryRunner.query(`
      UPDATE forum_posts 
      SET "type" = 'discussion' 
      WHERE "type" IS NULL
    `);

    console.log('✅ Forum post enhancements migration completed successfully');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Helper function to check if index exists
    const indexExists = async (indexName: string): Promise<boolean> => {
      const result = await queryRunner.query(`
        SELECT COUNT(*) 
        FROM pg_indexes 
        WHERE indexname = $1
      `, [indexName]);
      return parseInt(result[0].count) > 0;
    };

    // Drop indexes if they exist
    const indexesToDrop = [
      'IDX_forum_posts_courseId_createdAt',
      'IDX_forum_posts_courseId_isPinned',
      'IDX_forum_posts_courseId',
      'IDX_forum_posts_authorId'
    ];

    for (const indexName of indexesToDrop) {
      const exists = await indexExists(indexName);
      if (exists) {
        console.log(`🗑️ Dropping index: ${indexName}`);
        await queryRunner.dropIndex('forum_posts', indexName);
      }
    }

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
