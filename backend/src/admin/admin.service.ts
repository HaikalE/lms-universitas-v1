import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { User, UserRole } from '../entities/user.entity';
import { Course } from '../entities/course.entity';
import { Assignment } from '../entities/assignment.entity';
import { Submission } from '../entities/submission.entity';
import { Announcement } from '../entities/announcement.entity';
import { ForumPost } from '../entities/forum-post.entity';
import { Grade } from '../entities/grade.entity';
import { Notification } from '../entities/notification.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Course)
    private courseRepository: Repository<Course>,
    @InjectRepository(Assignment)
    private assignmentRepository: Repository<Assignment>,
    @InjectRepository(Submission)
    private submissionRepository: Repository<Submission>,
    @InjectRepository(Announcement)
    private announcementRepository: Repository<Announcement>,
    @InjectRepository(ForumPost)
    private forumPostRepository: Repository<ForumPost>,
    @InjectRepository(Grade)
    private gradeRepository: Repository<Grade>,
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
  ) {}

  async getSystemStats() {
    try {
      const [
        totalUsers,
        totalStudents,
        totalLecturers,
        totalAdmins,
        totalCourses,
        activeCourses,
        totalAssignments,
        totalSubmissions,
        pendingSubmissions,
        gradedSubmissions,
        totalAnnouncements,
        totalForumPosts,
        totalGrades,
        totalNotifications,
      ] = await Promise.all([
        this.userRepository.count(),
        this.userRepository.count({ where: { role: UserRole.STUDENT } }),
        this.userRepository.count({ where: { role: UserRole.LECTURER } }),
        this.userRepository.count({ where: { role: UserRole.ADMIN } }),
        this.courseRepository.count(),
        this.courseRepository.count({ where: { isActive: true } }),
        this.assignmentRepository.count(),
        this.submissionRepository.count(),
        this.submissionRepository.count({ where: { grade: null } }),
        this.submissionRepository.count({ where: { grade: { not: null } } }),
        this.announcementRepository.count(),
        this.forumPostRepository.count(),
        this.gradeRepository.count(),
        this.notificationRepository.count(),
      ]);

      // Calculate submission rate
      const submissionRate = totalAssignments > 0 
        ? Math.round((totalSubmissions / totalAssignments) * 100)
        : 0;

      // Calculate grading completion rate
      const gradingCompletionRate = totalSubmissions > 0
        ? Math.round((gradedSubmissions / totalSubmissions) * 100)
        : 0;

      return {
        overview: {
          totalUsers,
          totalCourses,
          totalAssignments,
          totalSubmissions,
        },
        users: {
          total: totalUsers,
          students: totalStudents,
          lecturers: totalLecturers,
          admins: totalAdmins,
          breakdown: {
            studentPercentage: totalUsers > 0 ? Math.round((totalStudents / totalUsers) * 100) : 0,
            lecturerPercentage: totalUsers > 0 ? Math.round((totalLecturers / totalUsers) * 100) : 0,
            adminPercentage: totalUsers > 0 ? Math.round((totalAdmins / totalUsers) * 100) : 0,
          }
        },
        courses: {
          total: totalCourses,
          active: activeCourses,
          inactive: totalCourses - activeCourses,
          activePercentage: totalCourses > 0 ? Math.round((activeCourses / totalCourses) * 100) : 0,
        },
        assignments: {
          total: totalAssignments,
          submissions: totalSubmissions,
          pending: pendingSubmissions,
          graded: gradedSubmissions,
          submissionRate,
          gradingCompletionRate,
        },
        engagement: {
          announcements: totalAnnouncements,
          forumPosts: totalForumPosts,
          notifications: totalNotifications,
          grades: totalGrades,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(`Failed to fetch system stats: ${error.message}`);
    }
  }

  async getOverviewStats() {
    const stats = await this.getSystemStats();
    return {
      totalUsers: stats.users.total,
      totalCourses: stats.courses.total,
      totalAssignments: stats.assignments.total,
      totalSubmissions: stats.assignments.submissions,
      activeCoursesPercentage: stats.courses.activePercentage,
      submissionRate: stats.assignments.submissionRate,
      gradingCompletionRate: stats.assignments.gradingCompletionRate,
    };
  }

  async getUserStats(period?: string) {
    const dateRange = this.getDateRange(period);
    
    try {
      let whereCondition = {};
      if (dateRange) {
        whereCondition = { createdAt: Between(dateRange.start, dateRange.end) };
      }

      const [totalUsers, newUsers, studentCount, lecturerCount, adminCount] = await Promise.all([
        this.userRepository.count(),
        dateRange ? this.userRepository.count({ where: whereCondition }) : 0,
        this.userRepository.count({ where: { role: UserRole.STUDENT } }),
        this.userRepository.count({ where: { role: UserRole.LECTURER } }),
        this.userRepository.count({ where: { role: UserRole.ADMIN } }),
      ]);

      // Get recent user registrations by month
      const recentRegistrations = await this.userRepository
        .createQueryBuilder('user')
        .select("DATE_TRUNC('month', user.createdAt)", 'month')
        .addSelect('COUNT(*)', 'count')
        .addSelect('user.role', 'role')
        .where('user.createdAt >= :date', { date: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000) })
        .groupBy("DATE_TRUNC('month', user.createdAt)")
        .addGroupBy('user.role')
        .orderBy("DATE_TRUNC('month', user.createdAt)", 'DESC')
        .getRawMany();

      return {
        total: totalUsers,
        newUsers: newUsers,
        breakdown: {
          students: studentCount,
          lecturers: lecturerCount,
          admins: adminCount,
        },
        growth: recentRegistrations,
        period: period || 'all-time',
      };
    } catch (error) {
      throw new Error(`Failed to fetch user stats: ${error.message}`);
    }
  }

  async getCourseStats(period?: string) {
    const dateRange = this.getDateRange(period);
    
    try {
      let whereCondition = {};
      if (dateRange) {
        whereCondition = { createdAt: Between(dateRange.start, dateRange.end) };
      }

      const [totalCourses, newCourses, activeCourses] = await Promise.all([
        this.courseRepository.count(),
        dateRange ? this.courseRepository.count({ where: whereCondition }) : 0,
        this.courseRepository.count({ where: { isActive: true } }),
      ]);

      // Get course enrollment stats
      const enrollmentStats = await this.courseRepository
        .createQueryBuilder('course')
        .leftJoin('course.enrollments', 'enrollment')
        .select('course.id', 'courseId')
        .addSelect('course.title', 'courseTitle')
        .addSelect('COUNT(enrollment.id)', 'enrollmentCount')
        .groupBy('course.id')
        .addGroupBy('course.title')
        .orderBy('COUNT(enrollment.id)', 'DESC')
        .limit(10)
        .getRawMany();

      return {
        total: totalCourses,
        active: activeCourses,
        inactive: totalCourses - activeCourses,
        newCourses: newCourses,
        topEnrolledCourses: enrollmentStats,
        period: period || 'all-time',
      };
    } catch (error) {
      throw new Error(`Failed to fetch course stats: ${error.message}`);
    }
  }

  async getAssignmentStats(period?: string) {
    const dateRange = this.getDateRange(period);
    
    try {
      let whereCondition = {};
      if (dateRange) {
        whereCondition = { createdAt: Between(dateRange.start, dateRange.end) };
      }

      const [
        totalAssignments,
        newAssignments,
        totalSubmissions,
        gradedSubmissions,
        avgGrade
      ] = await Promise.all([
        this.assignmentRepository.count(),
        dateRange ? this.assignmentRepository.count({ where: whereCondition }) : 0,
        this.submissionRepository.count(),
        this.submissionRepository.count({ where: { grade: { not: null } } }),
        this.gradeRepository
          .createQueryBuilder('grade')
          .select('AVG(grade.value)', 'average')
          .getRawOne()
      ]);

      const submissionRate = totalAssignments > 0 
        ? Math.round((totalSubmissions / totalAssignments) * 100)
        : 0;

      const gradingRate = totalSubmissions > 0
        ? Math.round((gradedSubmissions / totalSubmissions) * 100)
        : 0;

      return {
        total: totalAssignments,
        newAssignments,
        submissions: {
          total: totalSubmissions,
          graded: gradedSubmissions,
          pending: totalSubmissions - gradedSubmissions,
          submissionRate,
          gradingRate,
        },
        averageGrade: avgGrade?.average ? parseFloat(avgGrade.average).toFixed(2) : 0,
        period: period || 'all-time',
      };
    } catch (error) {
      throw new Error(`Failed to fetch assignment stats: ${error.message}`);
    }
  }

  async getActivityStats(period?: string) {
    const dateRange = this.getDateRange(period || '7d');
    
    try {
      const activities = await Promise.all([
        this.submissionRepository.count({
          where: { createdAt: Between(dateRange.start, dateRange.end) }
        }),
        this.forumPostRepository.count({
          where: { createdAt: Between(dateRange.start, dateRange.end) }
        }),
        this.announcementRepository.count({
          where: { createdAt: Between(dateRange.start, dateRange.end) }
        }),
        this.userRepository.count({
          where: { createdAt: Between(dateRange.start, dateRange.end) }
        }),
      ]);

      return {
        submissions: activities[0],
        forumPosts: activities[1],
        announcements: activities[2],
        newUsers: activities[3],
        totalActivities: activities.reduce((sum, count) => sum + count, 0),
        period: period || '7d',
      };
    } catch (error) {
      throw new Error(`Failed to fetch activity stats: ${error.message}`);
    }
  }

  async getRecentActivities(limit: number = 50) {
    try {
      // Get recent submissions
      const recentSubmissions = await this.submissionRepository
        .createQueryBuilder('submission')
        .leftJoinAndSelect('submission.student', 'student')
        .leftJoinAndSelect('submission.assignment', 'assignment')
        .select([
          'submission.id',
          'submission.createdAt',
          'student.name',
          'student.email',
          'assignment.title'
        ])
        .orderBy('submission.createdAt', 'DESC')
        .limit(Math.floor(limit / 3))
        .getMany();

      // Get recent forum posts
      const recentPosts = await this.forumPostRepository
        .createQueryBuilder('post')
        .leftJoinAndSelect('post.author', 'author')
        .select([
          'post.id',
          'post.title',
          'post.createdAt',
          'author.name',
          'author.email'
        ])
        .orderBy('post.createdAt', 'DESC')
        .limit(Math.floor(limit / 3))
        .getMany();

      // Get recent announcements
      const recentAnnouncements = await this.announcementRepository
        .createQueryBuilder('announcement')
        .leftJoinAndSelect('announcement.author', 'author')
        .select([
          'announcement.id',
          'announcement.title',
          'announcement.createdAt',
          'author.name',
          'author.email'
        ])
        .orderBy('announcement.createdAt', 'DESC')
        .limit(Math.floor(limit / 3))
        .getMany();

      // Combine and format activities
      const activities = [
        ...recentSubmissions.map(s => ({
          type: 'submission',
          id: s.id,
          title: `Assignment submission: ${s.assignment?.title}`,
          user: s.student?.name,
          timestamp: s.createdAt,
        })),
        ...recentPosts.map(p => ({
          type: 'forum_post',
          id: p.id,
          title: `Forum post: ${p.title}`,
          user: p.author?.name,
          timestamp: p.createdAt,
        })),
        ...recentAnnouncements.map(a => ({
          type: 'announcement',
          id: a.id,
          title: `Announcement: ${a.title}`,
          user: a.author?.name,
          timestamp: a.createdAt,
        })),
      ];

      // Sort by timestamp and limit
      return activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);

    } catch (error) {
      throw new Error(`Failed to fetch recent activities: ${error.message}`);
    }
  }

  async getDashboardData() {
    try {
      const [systemStats, userStats, activityStats] = await Promise.all([
        this.getSystemStats(),
        this.getUserStats('30d'),
        this.getActivityStats('7d'),
      ]);

      return {
        overview: systemStats.overview,
        userGrowth: userStats.growth,
        recentActivity: activityStats,
        keyMetrics: {
          activeCoursesPercentage: systemStats.courses.activePercentage,
          submissionRate: systemStats.assignments.submissionRate,
          gradingCompletionRate: systemStats.assignments.gradingCompletionRate,
        },
      };
    } catch (error) {
      throw new Error(`Failed to fetch dashboard data: ${error.message}`);
    }
  }

  async getSystemHealth() {
    try {
      const dbStatus = await this.userRepository.count();
      
      return {
        status: 'healthy',
        database: {
          status: dbStatus >= 0 ? 'connected' : 'disconnected',
          responseTime: Date.now() % 100, // Simulated response time
        },
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async getUserReports(startDate?: string, endDate?: string, format?: string) {
    try {
      let whereCondition = {};
      if (startDate && endDate) {
        whereCondition = { 
          createdAt: Between(new Date(startDate), new Date(endDate)) 
        };
      }

      const users = await this.userRepository.find({
        where: whereCondition,
        select: ['id', 'name', 'email', 'role', 'createdAt', 'isActive'],
        order: { createdAt: 'DESC' },
      });

      if (format === 'csv') {
        // Return CSV format instructions
        return {
          data: users,
          format: 'csv',
          headers: ['ID', 'Name', 'Email', 'Role', 'Created At', 'Status'],
        };
      }

      return {
        data: users,
        total: users.length,
        period: { startDate, endDate },
      };
    } catch (error) {
      throw new Error(`Failed to generate user reports: ${error.message}`);
    }
  }

  async getCourseReports(startDate?: string, endDate?: string, format?: string) {
    try {
      let whereCondition = {};
      if (startDate && endDate) {
        whereCondition = { 
          createdAt: Between(new Date(startDate), new Date(endDate)) 
        };
      }

      const courses = await this.courseRepository.find({
        where: whereCondition,
        relations: ['lecturer', 'enrollments'],
        select: {
          id: true,
          title: true,
          code: true,
          description: true,
          isActive: true,
          createdAt: true,
          lecturer: {
            id: true,
            name: true,
            email: true,
          },
        },
        order: { createdAt: 'DESC' },
      });

      const coursesWithStats = courses.map(course => ({
        ...course,
        enrollmentCount: course.enrollments?.length || 0,
      }));

      return {
        data: coursesWithStats,
        total: coursesWithStats.length,
        period: { startDate, endDate },
      };
    } catch (error) {
      throw new Error(`Failed to generate course reports: ${error.message}`);
    }
  }

  async getEngagementAnalytics(period?: string) {
    const dateRange = this.getDateRange(period || '30d');
    
    try {
      const [submissions, forumPosts, announcements] = await Promise.all([
        this.submissionRepository
          .createQueryBuilder('submission')
          .select("DATE_TRUNC('day', submission.createdAt)", 'date')
          .addSelect('COUNT(*)', 'count')
          .where('submission.createdAt >= :start AND submission.createdAt <= :end', {
            start: dateRange.start,
            end: dateRange.end,
          })
          .groupBy("DATE_TRUNC('day', submission.createdAt)")
          .orderBy("DATE_TRUNC('day', submission.createdAt)", 'ASC')
          .getRawMany(),
        
        this.forumPostRepository
          .createQueryBuilder('post')
          .select("DATE_TRUNC('day', post.createdAt)", 'date')
          .addSelect('COUNT(*)', 'count')
          .where('post.createdAt >= :start AND post.createdAt <= :end', {
            start: dateRange.start,
            end: dateRange.end,
          })
          .groupBy("DATE_TRUNC('day', post.createdAt)")
          .orderBy("DATE_TRUNC('day', post.createdAt)", 'ASC')
          .getRawMany(),

        this.announcementRepository
          .createQueryBuilder('announcement')
          .select("DATE_TRUNC('day', announcement.createdAt)", 'date')
          .addSelect('COUNT(*)', 'count')
          .where('announcement.createdAt >= :start AND announcement.createdAt <= :end', {
            start: dateRange.start,
            end: dateRange.end,
          })
          .groupBy("DATE_TRUNC('day', announcement.createdAt)")
          .orderBy("DATE_TRUNC('day', announcement.createdAt)", 'ASC')
          .getRawMany(),
      ]);

      return {
        submissions: submissions.map(s => ({ date: s.date, count: parseInt(s.count) })),
        forumPosts: forumPosts.map(p => ({ date: p.date, count: parseInt(p.count) })),
        announcements: announcements.map(a => ({ date: a.date, count: parseInt(a.count) })),
        period: period || '30d',
      };
    } catch (error) {
      throw new Error(`Failed to fetch engagement analytics: ${error.message}`);
    }
  }

  async getPerformanceAnalytics(period?: string) {
    try {
      const gradeStats = await this.gradeRepository
        .createQueryBuilder('grade')
        .select('AVG(grade.value)', 'average')
        .addSelect('MIN(grade.value)', 'minimum')
        .addSelect('MAX(grade.value)', 'maximum')
        .addSelect('COUNT(*)', 'total')
        .getRawOne();

      const gradeDistribution = await this.gradeRepository
        .createQueryBuilder('grade')
        .select(`
          CASE 
            WHEN grade.value >= 90 THEN 'A'
            WHEN grade.value >= 80 THEN 'B'
            WHEN grade.value >= 70 THEN 'C'
            WHEN grade.value >= 60 THEN 'D'
            ELSE 'F'
          END
        `, 'grade_letter')
        .addSelect('COUNT(*)', 'count')
        .groupBy(`
          CASE 
            WHEN grade.value >= 90 THEN 'A'
            WHEN grade.value >= 80 THEN 'B'
            WHEN grade.value >= 70 THEN 'C'
            WHEN grade.value >= 60 THEN 'D'
            ELSE 'F'
          END
        `)
        .getRawMany();

      return {
        summary: {
          averageGrade: gradeStats?.average ? parseFloat(gradeStats.average).toFixed(2) : 0,
          minimumGrade: gradeStats?.minimum || 0,
          maximumGrade: gradeStats?.maximum || 0,
          totalGrades: gradeStats?.total || 0,
        },
        distribution: gradeDistribution.map(d => ({
          grade: d.grade_letter,
          count: parseInt(d.count),
        })),
        period: period || 'all-time',
      };
    } catch (error) {
      throw new Error(`Failed to fetch performance analytics: ${error.message}`);
    }
  }

  private getDateRange(period?: string) {
    if (!period) return null;

    const now = new Date();
    const ranges = {
      '7d': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      '30d': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      '90d': new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
      '1y': new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
    };

    const startDate = ranges[period];
    return startDate ? { start: startDate, end: now } : null;
  }
}
