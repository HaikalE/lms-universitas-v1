#!/usr/bin/env node

const { DataSource } = require('typeorm');
const { InitialSeeder } = require('../database/seeds/initial-seeder');
require('dotenv').config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'lms_db',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: true,
  logging: ['error', 'warn', 'log'],
});

async function runSeeder() {
  console.log('🚀 Starting database seeder...');
  console.log('📊 Database config:');
  console.log(`   Host: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}`);
  console.log(`   Database: ${process.env.DB_DATABASE || 'lms_db'}`);
  console.log(`   User: ${process.env.DB_USERNAME || 'postgres'}`);

  try {
    // Initialize database connection
    await AppDataSource.initialize();
    console.log('✅ Database connected successfully');

    // Run seeder
    const seeder = new InitialSeeder();
    await seeder.run(AppDataSource);

    console.log('🎉 Seeder completed successfully!');
  } catch (error) {
    console.error('❌ Seeder failed:', error.message);
    console.error('❌ Stack trace:', error.stack);
    process.exit(1);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('📡 Database connection closed');
    }
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n⚡ Received SIGINT, gracefully shutting down...');
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n⚡ Received SIGTERM, gracefully shutting down...');
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
  process.exit(0);
});

// Run seeder
runSeeder();