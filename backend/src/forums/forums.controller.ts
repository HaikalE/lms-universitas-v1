import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ForumsService } from './forums.service';
import { CreateForumPostDto } from './dto/create-forum-post.dto';
import { UpdateForumPostDto, MarkBestAnswerDto, ForumAnalyticsDto } from './dto/additional-forum.dto';
import { QueryForumPostsDto } from './dto/query-forum-posts.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User, UserRole } from '../entities/user.entity';

@Controller('forums')
@UseGuards(JwtAuthGuard)
export class ForumsController {
  constructor(private readonly forumsService: ForumsService) {}

  // ============================================
  // CRUD Operations
  // ============================================

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createForumPostDto: CreateForumPostDto, @GetUser() user: User) {
    return this.forumsService.create(createForumPostDto, user);
  }

  @Get('course/:courseId')
  findByCourse(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Query() queryDto: QueryForumPostsDto,
    @GetUser() user: User,
  ) {
    return this.forumsService.findByCourse(courseId, queryDto, user);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @GetUser() user: User) {
    return this.forumsService.findOne(id, user);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateForumPostDto: UpdateForumPostDto,
    @GetUser() user: User,
  ) {
    return this.forumsService.update(id, updateForumPostDto, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string, @GetUser() user: User) {
    return this.forumsService.remove(id, user);
  }

  // ============================================
  // Enhanced Interaction Features
  // ============================================

  @Post(':id/like')
  @HttpCode(HttpStatus.OK)
  toggleLike(@Param('id', ParseUUIDPipe) id: string, @GetUser() user: User) {
    return this.forumsService.toggleLike(id, user);
  }

  @Patch(':id/best-answer')
  @HttpCode(HttpStatus.OK)
  markBestAnswer(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() markBestAnswerDto: MarkBestAnswerDto,
    @GetUser() user: User,
  ) {
    return this.forumsService.markBestAnswer(id, markBestAnswerDto, user);
  }

  // ============================================
  // Moderation Features (Lecturer/Admin Only)
  // ============================================

  @Patch(':id/pin')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.LECTURER)
  @HttpCode(HttpStatus.OK)
  togglePin(@Param('id', ParseUUIDPipe) id: string, @GetUser() user: User) {
    return this.forumsService.togglePin(id, user);
  }

  @Patch(':id/lock')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.LECTURER)
  @HttpCode(HttpStatus.OK)
  toggleLock(@Param('id', ParseUUIDPipe) id: string, @GetUser() user: User) {
    return this.forumsService.toggleLock(id, user);
  }

  // ============================================
  // Analytics & Reporting (Lecturer/Admin Only)
  // ============================================

  @Get('course/:courseId/analytics')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.LECTURER)
  getForumAnalytics(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Query() analyticsDto: ForumAnalyticsDto,
    @GetUser() user: User,
  ) {
    return this.forumsService.getForumAnalytics(courseId, analyticsDto, user);
  }

  // ============================================
  // Search & Discovery Features
  // ============================================

  @Get('course/:courseId/categories')
  async getCategoryCounts(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @GetUser() user: User,
  ) {
    // Get posts by category for this course
    const queryDto = new QueryForumPostsDto();
    queryDto.limit = 1000; // Get all posts to count categories
    
    const result = await this.forumsService.findByCourse(courseId, queryDto, user);
    
    // Count by category
    const categoryCounts = result.data.reduce((acc, post) => {
      acc[post.category] = (acc[post.category] || 0) + 1;
      return acc;
    }, {});

    return categoryCounts;
  }

  @Get('course/:courseId/tags')
  async getPopularTags(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @GetUser() user: User,
  ) {
    // Get all posts to extract popular tags
    const queryDto = new QueryForumPostsDto();
    queryDto.limit = 1000;
    
    const result = await this.forumsService.findByCourse(courseId, queryDto, user);
    
    // Count tag usage
    const tagCounts = {};
    result.data.forEach(post => {
      post.tags?.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    // Sort by popularity and return top 20
    const sortedTags = Object.entries(tagCounts)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 20)
      .map(([tag, count]) => ({ tag, count }));

    return sortedTags;
  }

  // ============================================
  // User Activity & Stats
  // ============================================

  @Get('my-activity')
  async getMyActivity(@GetUser() user: User) {
    // Get user's forum activity across all courses
    const queryDto = new QueryForumPostsDto();
    queryDto.authorId = user.id;
    queryDto.limit = 50;

    // This would need a service method to get posts across all user's courses
    // For now, return a placeholder
    return {
      totalPosts: 0,
      totalReplies: 0,
      totalLikes: 0,
      recentPosts: [],
    };
  }

  @Get('course/:courseId/leaderboard')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.LECTURER)
  async getLeaderboard(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @GetUser() user: User,
  ) {
    // Get forum participation leaderboard
    const analyticsDto = new ForumAnalyticsDto();
    const analytics = await this.forumsService.getForumAnalytics(courseId, analyticsDto, user);
    
    return {
      topContributors: analytics.topUsers,
      totalParticipants: analytics.summary.totalParticipants,
    };
  }

  // ============================================
  // Quick Actions & Shortcuts
  // ============================================

  @Get('course/:courseId/pinned')
  async getPinnedPosts(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @GetUser() user: User,
  ) {
    const queryDto = new QueryForumPostsDto();
    queryDto.isPinned = true;
    queryDto.limit = 10;
    
    return this.forumsService.findByCourse(courseId, queryDto, user);
  }

  @Get('course/:courseId/announcements')
  async getAnnouncements(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @GetUser() user: User,
  ) {
    const queryDto = new QueryForumPostsDto();
    queryDto.isAnnouncement = true;
    queryDto.limit = 20;
    
    return this.forumsService.findByCourse(courseId, queryDto, user);
  }

  @Get('course/:courseId/questions')
  async getQuestions(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Query() queryDto: QueryForumPostsDto,
    @GetUser() user: User,
  ) {
    queryDto.onlyQuestions = true;
    return this.forumsService.findByCourse(courseId, queryDto, user);
  }

  @Get('course/:courseId/unanswered')
  async getUnansweredQuestions(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Query() queryDto: QueryForumPostsDto,
    @GetUser() user: User,
  ) {
    queryDto.unanswered = true;
    queryDto.onlyQuestions = true;
    return this.forumsService.findByCourse(courseId, queryDto, user);
  }

  @Get('course/:courseId/trending')
  async getTrendingPosts(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @GetUser() user: User,
  ) {
    const queryDto = new QueryForumPostsDto();
    queryDto.sortBy = 'likesCount';
    queryDto.sortOrder = 'DESC';
    queryDto.limit = 10;
    
    return this.forumsService.findByCourse(courseId, queryDto, user);
  }

  @Get('course/:courseId/recent')
  async getRecentActivity(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @GetUser() user: User,
  ) {
    const queryDto = new QueryForumPostsDto();
    queryDto.sortBy = 'lastActivityAt';
    queryDto.sortOrder = 'DESC';
    queryDto.limit = 15;
    
    return this.forumsService.findByCourse(courseId, queryDto, user);
  }
}
