import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as path from 'path';

// Load environment variables
config({ path: path.join(__dirname, '../.env') });

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'lms_db',
  entities: [path.join(__dirname, '../src/entities/*.entity.{ts,js}')],
  migrations: [path.join(__dirname, '../src/database/migrations/*.{ts,js}')],
  synchronize: false, // Don't auto-sync, use migrations
  logging: true,
});

async function runMigrations() {
  try {
    console.log('🔄 Initializing database connection...');
    
    await AppDataSource.initialize();
    console.log('✅ Database connection established');

    console.log('🔄 Running pending migrations...');
    const migrations = await AppDataSource.runMigrations();
    
    if (migrations.length === 0) {
      console.log('✅ No pending migrations to run');
    } else {
      console.log(`✅ Successfully ran ${migrations.length} migrations:`);
      migrations.forEach(migration => {
        console.log(`  - ${migration.name}`);
      });
    }

    console.log('🔄 Checking database schema...');
    
    // Check if the isAttendanceTrigger column exists
    const queryRunner = AppDataSource.createQueryRunner();
    try {
      const columnExists = await queryRunner.hasColumn('course_materials', 'isAttendanceTrigger');
      if (columnExists) {
        console.log('✅ Column "isAttendanceTrigger" exists in course_materials table');
      } else {
        console.log('❌ Column "isAttendanceTrigger" is missing from course_materials table');
        console.log('🔄 This indicates the migration may not have run properly');
      }
    } finally {
      await queryRunner.release();
    }

    await AppDataSource.destroy();
    console.log('✅ Migration process completed successfully');
    
  } catch (error) {
    console.error('❌ Error running migrations:', error);
    
    if (error.message.includes('connect')) {
      console.error('💡 Database connection failed. Please check:');
      console.error('   - Database server is running');
      console.error('   - Connection parameters in .env file');
      console.error('   - Network connectivity');
    }
    
    process.exit(1);
  }
}

// Self-executing function
if (require.main === module) {
  runMigrations();
}

export { runMigrations, AppDataSource };
