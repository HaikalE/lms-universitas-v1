#!/usr/bin/env node

const { DataSource } = require('typeorm');
const bcrypt = require('bcryptjs');

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

async function seedDatabase() {
  try {
    console.log('🔄 Initializing database connection...');
    await AppDataSource.initialize();
    
    console.log('🔄 Seeding database...');
    
    // Create users
    const userRepository = AppDataSource.getRepository('User');
    
    // Check if users already exist
    const existingUsers = await userRepository.count();
    if (existingUsers > 0) {
      console.log('✅ Database already seeded!');
      await AppDataSource.destroy();
      return;
    }
    
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    // Create admin user - Fixed: Use lowercase 'admin'
    await userRepository.save({
      fullName: 'Administrator',
      email: 'admin@lms.com',
      password: hashedPassword,
      role: 'admin',
      isActive: true
    });
    
    // Create lecturer - Fixed: Use lowercase 'lecturer'
    await userRepository.save({
      fullName: 'Dr. John Lecturer',
      email: 'lecturer@lms.com',
      password: hashedPassword,
      role: 'lecturer',
      lecturerId: 'LEC001',
      isActive: true
    });
    
    // Create student - Fixed: Use lowercase 'student'
    await userRepository.save({
      fullName: 'Jane Student',
      email: 'student@lms.com',
      password: hashedPassword,
      role: 'student',
      studentId: 'STD001',
      isActive: true
    });
    
    console.log('✅ Database seeded successfully!');
    console.log('🔑 Demo accounts created:');
    console.log('   Admin: admin@lms.com / password123');
    console.log('   Lecturer: lecturer@lms.com / password123');
    console.log('   Student: student@lms.com / password123');
    
    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedDatabase();
