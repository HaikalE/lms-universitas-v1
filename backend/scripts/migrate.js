#!/usr/bin/env node

const { DataSource } = require('typeorm');

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'lms_db',
  entities: ['dist/**/*.entity.js'],
  migrations: ['dist/database/migrations/*.js'],
  synchronize: false,
  logging: true,
});

async function runMigrations() {
  try {
    console.log('🔄 Initializing database connection...');
    await AppDataSource.initialize();
    
    console.log('🔄 Running migrations...');
    await AppDataSource.runMigrations();
    
    console.log('✅ Migrations completed successfully!');
    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();
