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
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ForumsService } from './forums.service';
import { CreateForumPostDto } from './dto/create-forum-post.dto';
import { UpdateForumPostDto } from './dto/update-forum-post.dto';
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

  // CREATE FORUM POST
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createForumPostDto: CreateForumPostDto, @GetUser() user: User) {
    try {
      console.log('📝 Creating forum post:', {
        title: createForumPostDto.title,
        courseId: createForumPostDto.courseId,
        userId: user.id
      });
      
      const post = await this.forumsService.create(createForumPostDto, user);
      
      console.log('✅ Forum post created successfully:', post.id);
      
      return {
        success: true,
        message: 'Forum post berhasil dibuat',
        data: post,
      };
    } catch (error) {
      console.error('❌ Error creating forum post:', error.message);
      throw error;
    }
  }

  // GET FORUM POSTS BY COURSE
  @Get('course/:courseId')
  async findByCourse(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Query() queryDto: QueryForumPostsDto,
    @GetUser() user: User,
  ) {
    try {
      console.log('🔍 Fetching forum posts for course:', courseId);
      
      const result = await this.forumsService.findByCourse(courseId, queryDto, user);
      
      console.log(`✅ Found ${result.data.length} forum posts`);
      
      return {
        success: true,
        ...result,
      };
    } catch (error) {
      console.error('❌ Error fetching forum posts:', error.message);
      throw error;
    }
  }

  // GET SINGLE FORUM POST
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string, @GetUser() user: User) {
    try {
      console.log('🔍 Fetching forum post:', id);
      
      const post = await this.forumsService.findOne(id, user);
      
      console.log('✅ Forum post found:', post.title);
      
      return {
        success: true,
        data: post,
      };
    } catch (error) {
      console.error('❌ Error fetching forum post:', error.message);
      throw error;
    }
  }

  // UPDATE FORUM POST
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateForumPostDto: UpdateForumPostDto,
    @GetUser() user: User,
  ) {
    try {
      console.log('✏️ Updating forum post:', id);
      
      const post = await this.forumsService.update(id, updateForumPostDto, user);
      
      console.log('✅ Forum post updated successfully');
      
      return {
        success: true,
        message: 'Forum post berhasil diperbarui',
        data: post,
      };
    } catch (error) {
      console.error('❌ Error updating forum post:', error.message);
      throw error;
    }
  }

  // DELETE FORUM POST
  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string, @GetUser() user: User) {
    try {
      console.log('🗑️ Deleting forum post:', id);
      
      const result = await this.forumsService.remove(id, user);
      
      console.log('✅ Forum post deleted successfully');
      
      return {
        success: true,
        ...result,
      };
    } catch (error) {
      console.error('❌ Error deleting forum post:', error.message);
      throw error;
    }
  }

  // TOGGLE PIN POST (Lecturer/Admin only)
  @Patch(':id/pin')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.LECTURER)
  async togglePin(@Param('id', ParseUUIDPipe) id: string, @GetUser() user: User) {
    try {
      console.log('📌 Toggling pin for forum post:', id);
      
      const result = await this.forumsService.togglePin(id, user);
      
      console.log('✅ Forum post pin toggled successfully');
      
      return {
        success: true,
        ...result,
      };
    } catch (error) {
      console.error('❌ Error toggling pin:', error.message);
      throw error;
    }
  }

  // TOGGLE LOCK POST (Lecturer/Admin only)
  @Patch(':id/lock')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.LECTURER)
  async toggleLock(@Param('id', ParseUUIDPipe) id: string, @GetUser() user: User) {
    try {
      console.log('🔒 Toggling lock for forum post:', id);
      
      const result = await this.forumsService.toggleLock(id, user);
      
      console.log('✅ Forum post lock toggled successfully');
      
      return {
        success: true,
        ...result,
      };
    } catch (error) {
      console.error('❌ Error toggling lock:', error.message);
      throw error;
    }
  }

  // TOGGLE LIKE POST
  @Post(':id/like')
  async toggleLike(@Param('id', ParseUUIDPipe) id: string, @GetUser() user: User) {
    try {
      console.log('❤️ Toggling like for forum post:', id);
      
      const result = await this.forumsService.toggleLike(id, user);
      
      console.log('✅ Forum post like toggled successfully');
      
      return {
        success: true,
        ...result,
      };
    } catch (error) {
      console.error('❌ Error toggling like:', error.message);
      throw error;
    }
  }
}