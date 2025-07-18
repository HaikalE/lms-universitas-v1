import { Controller, Get, HttpStatus, HttpException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Public } from '../auth/decorators/public.decorator';
import { User } from '../entities/user.entity';
import { Course } from '../entities/course.entity';
import { ForumPost } from '../entities/forum-post.entity';

@Controller('health')
export class HealthController {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Course)
    private courseRepository: Repository<Course>,
    @InjectRepository(ForumPost)
    private forumPostRepository: Repository<ForumPost>,
  ) {}

  @Public()
  @Get()
  async check() {
    try {
      // Test basic database connection
      await this.userRepository.query('SELECT 1');
      
      return {
        status: 'ok',
        message: 'LMS Backend is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        database: 'connected',
      };
    } catch (error) {
      console.error('❌ Health check failed:', error.message);
      
      throw new HttpException({
        status: 'error',
        message: 'Database connection failed',
        timestamp: new Date().toISOString(),
        error: error.message,
      }, HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  @Public()
  @Get('detailed')
  async detailed() {
    try {
      const startTime = Date.now();
      
      // Test database connection
      await this.userRepository.query('SELECT 1');
      const dbTime = Date.now() - startTime;
      
      // Get table counts for verification
      const [userCount, courseCount, forumCount] = await Promise.all([
        this.userRepository.count().catch(() => 0),
        this.courseRepository.count().catch(() => 0), 
        this.forumPostRepository.count().catch(() => 0),
      ]);
      
      return {
        status: 'ok',
        message: 'LMS Backend is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime(),
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100,
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024 * 100) / 100,
          external: Math.round(process.memoryUsage().external / 1024 / 1024 * 100) / 100,
        },
        nodejs: process.version,
        platform: process.platform,
        database: {
          status: 'connected',
          responseTime: `${dbTime}ms`,
          tables: {
            users: userCount,
            courses: courseCount,
            forumPosts: forumCount,
          }
        },
        features: {
          cors: 'enabled',
          auth: 'jwt',
          uploads: 'enabled',
          forums: 'enabled',
        }
      };
    } catch (error) {
      console.error('❌ Detailed health check failed:', error.message);
      
      throw new HttpException({
        status: 'error',
        message: 'Health check failed',
        timestamp: new Date().toISOString(),
        error: error.message,
        database: 'disconnected',
      }, HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  @Public()
  @Get('db')
  async database() {
    try {
      const startTime = Date.now();
      
      // Test database connection with more comprehensive checks
      await this.userRepository.query('SELECT 1');
      const basicTime = Date.now() - startTime;
      
      // Test table existence
      const tableTests = await Promise.allSettled([
        this.userRepository.query('SELECT COUNT(*) FROM users LIMIT 1'),
        this.courseRepository.query('SELECT COUNT(*) FROM courses LIMIT 1'),
        this.forumPostRepository.query('SELECT COUNT(*) FROM forum_posts LIMIT 1'),
      ]);
      
      const tables = {
        users: tableTests[0].status === 'fulfilled' ? 'exists' : 'missing',
        courses: tableTests[1].status === 'fulfilled' ? 'exists' : 'missing',
        forum_posts: tableTests[2].status === 'fulfilled' ? 'exists' : 'missing',
      };
      
      // Get database info
      const dbInfo = await this.userRepository.query(`
        SELECT 
          current_database() as database_name,
          current_user as current_user,
          version() as version
      `);
      
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: {
          status: 'connected',
          responseTime: `${basicTime}ms`,
          info: dbInfo[0],
          tables,
          host: process.env.DB_HOST,
          port: process.env.DB_PORT,
          database: process.env.DB_DATABASE,
        }
      };
    } catch (error) {
      console.error('❌ Database health check failed:', error.message);
      
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        database: {
          status: 'disconnected',
          error: error.message,
          host: process.env.DB_HOST,
          port: process.env.DB_PORT,
          database: process.env.DB_DATABASE,
        }
      };
    }
  }

  @Public()
  @Get('tables')
  async tables() {
    try {
      // Check if all required tables exist
      const tableQueries = [
        { name: 'users', query: 'SELECT COUNT(*) as count FROM users' },
        { name: 'courses', query: 'SELECT COUNT(*) as count FROM courses' },
        { name: 'forum_posts', query: 'SELECT COUNT(*) as count FROM forum_posts' },
        { name: 'assignments', query: 'SELECT COUNT(*) as count FROM assignments' },
        { name: 'submissions', query: 'SELECT COUNT(*) as count FROM submissions' },
        { name: 'notifications', query: 'SELECT COUNT(*) as count FROM notifications' },
        { name: 'announcements', query: 'SELECT COUNT(*) as count FROM announcements' },
      ];
      
      const results = {};
      
      for (const table of tableQueries) {
        try {
          const result = await this.userRepository.query(table.query);
          results[table.name] = {
            exists: true,
            count: parseInt(result[0].count),
            status: 'ok'
          };
        } catch (error) {
          results[table.name] = {
            exists: false,
            error: error.message,
            status: 'error'
          };
        }
      }
      
      const allTablesExist = Object.values(results).every(table => table['exists']);
      
      return {
        status: allTablesExist ? 'ok' : 'partial',
        message: allTablesExist ? 'All tables exist' : 'Some tables are missing',
        timestamp: new Date().toISOString(),
        tables: results,
      };
    } catch (error) {
      console.error('❌ Table check failed:', error.message);
      
      return {
        status: 'error',
        message: 'Failed to check tables',
        timestamp: new Date().toISOString(),
        error: error.message,
      };
    }
  }
}