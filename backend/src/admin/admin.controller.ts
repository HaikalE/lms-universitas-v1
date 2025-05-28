import {
  Controller,
  Get,
  UseGuards,
  Query,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../entities/user.entity';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  async getSystemStats(@GetUser() user: User) {
    return this.adminService.getSystemStats();
  }

  @Get('stats/overview')
  async getOverview(@GetUser() user: User) {
    return this.adminService.getOverviewStats();
  }

  @Get('stats/users')
  async getUserStats(@Query('period') period?: string) {
    return this.adminService.getUserStats(period);
  }

  @Get('stats/courses')
  async getCourseStats(@Query('period') period?: string) {
    return this.adminService.getCourseStats(period);
  }

  @Get('stats/assignments')
  async getAssignmentStats(@Query('period') period?: string) {
    return this.adminService.getAssignmentStats(period);
  }

  @Get('stats/activity')
  async getActivityStats(@Query('period') period?: string) {
    return this.adminService.getActivityStats(period);
  }

  @Get('recent-activities')
  async getRecentActivities(@Query('limit') limit?: number) {
    return this.adminService.getRecentActivities(limit);
  }

  @Get('dashboard')
  async getDashboardData(@GetUser() user: User) {
    return this.adminService.getDashboardData();
  }

  @Get('system-health')
  async getSystemHealth() {
    return this.adminService.getSystemHealth();
  }

  @Get('reports/users')
  async getUserReports(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('format') format?: string,
  ) {
    return this.adminService.getUserReports(startDate, endDate, format);
  }

  @Get('reports/courses')
  async getCourseReports(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('format') format?: string,
  ) {
    return this.adminService.getCourseReports(startDate, endDate, format);
  }

  @Get('analytics/engagement')
  async getEngagementAnalytics(@Query('period') period?: string) {
    return this.adminService.getEngagementAnalytics(period);
  }

  @Get('analytics/performance')
  async getPerformanceAnalytics(@Query('period') period?: string) {
    return this.adminService.getPerformanceAnalytics(period);
  }
}
