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
  BadRequestException,
  ValidationPipe,
  UsePipes,
  InternalServerErrorException,
  HttpException,
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
  @UsePipes(new ValidationPipe({ 
    whitelist: true, 
    forbidNonWhitelisted: true,
    transform: true,
    validationError: { target: false }
  }))
  async create(@Body() createForumPostDto: CreateForumPostDto, @GetUser() user: User) {
    try {
      console.log('📝 Creating forum post request received:');
      console.log('   - User:', user.id, user.fullName);
      console.log('   - Title:', createForumPostDto.title);
      console.log('   - CourseId:', createForumPostDto.courseId);
      console.log('   - Content length:', createForumPostDto.content?.length || 0);
      console.log('   - ParentId:', createForumPostDto.parentId || 'none (new post)');
      
      // Validate required fields
      if (!createForumPostDto.title?.trim()) {
        throw new BadRequestException('Judul post wajib diisi');
      }
      
      if (!createForumPostDto.content?.trim()) {
        throw new BadRequestException('Konten post wajib diisi');
      }
      
      if (!createForumPostDto.courseId?.trim()) {
        throw new BadRequestException('Course ID wajib diisi');
      }
      
      const post = await this.forumsService.create(createForumPostDto, user);
      
      console.log('✅ Forum post created successfully:');
      console.log('   - Post ID:', post.id);
      console.log('   - Title:', post.title);
      
      return {
        success: true,
        message: 'Forum post berhasil dibuat',
        data: post,
      };
    } catch (error) {
      console.error('❌ Error creating forum post:');
      console.error('   - Error type:', error.constructor.name);
      console.error('   - Error message:', error.message);
      console.error('   - Request data:', createForumPostDto);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new InternalServerErrorException({
        success: false,
        message: 'Gagal membuat forum post',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
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
      console.log('   - User:', user.id, user.role);
      console.log('   - Query params:', queryDto);
      
      // Validate courseId format
      if (!courseId || courseId.length < 10) {
        throw new BadRequestException('Invalid course ID format');
      }
      
      const result = await this.forumsService.findByCourse(courseId, queryDto, user);
      
      console.log(`✅ Found ${result.data.length} forum posts`);
      
      return {
        success: true,
        message: 'Forum posts berhasil diambil',
        ...result,
      };
    } catch (error) {
      console.error('❌ Error fetching forum posts:');
      console.error('   - Error type:', error.constructor.name);
      console.error('   - Error message:', error.message);
      console.error('   - Course ID:', courseId);
      console.error('   - User:', user?.id);
      console.error('   - Stack:', error.stack);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new InternalServerErrorException({
        success: false,
        message: 'Gagal mengambil forum posts',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // GET SINGLE FORUM POST
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string, @GetUser() user: User) {
    try {
      console.log('🔍 Fetching forum post:', id);
      console.log('   - User:', user.id);
      
      const post = await this.forumsService.findOne(id, user);
      
      console.log('✅ Forum post found:', post.title);
      
      return {
        success: true,
        message: 'Forum post berhasil diambil',
        data: post,
      };
    } catch (error) {
      console.error('❌ Error fetching forum post:', error.message);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new InternalServerErrorException({
        success: false,
        message: 'Gagal mengambil forum post',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // GET REPLIES FOR A FORUM POST
  @Get(':id/replies')
  async getPostReplies(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() queryDto: any,
    @GetUser() user: User,
  ) {
    try {
      console.log('💬 Fetching replies for forum post:', id);
      console.log('   - User:', user.id);
      console.log('   - Query params:', queryDto);
      
      const replies = await this.forumsService.getPostReplies(id, queryDto, user);
      
      console.log(`✅ Found ${replies.length} replies`);
      
      return {
        success: true,
        message: 'Replies berhasil diambil',
        data: replies,
      };
    } catch (error) {
      console.error('❌ Error fetching replies:', error.message);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new InternalServerErrorException({
        success: false,
        message: 'Gagal mengambil replies',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // CREATE REPLY FOR A FORUM POST
  @Post(':id/replies')
  async createReply(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() replyData: { content: string; parentId?: string },
    @GetUser() user: User,
  ) {
    try {
      console.log('💬 Creating reply for forum post:', id);
      console.log('   - User:', user.id);
      console.log('   - Content length:', replyData.content?.length || 0);
      console.log('   - Parent reply ID:', replyData.parentId || 'none (direct reply)');
      
      if (!replyData.content?.trim()) {
        throw new BadRequestException('Konten balasan wajib diisi');
      }
      
      const reply = await this.forumsService.createReply(id, replyData, user);
      
      console.log('✅ Reply created successfully:', reply.id);
      
      return {
        success: true,
        message: 'Balasan berhasil dibuat',
        data: reply,
      };
    } catch (error) {
      console.error('❌ Error creating reply:', error.message);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new InternalServerErrorException({
        success: false,
        message: 'Gagal membuat balasan',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // MARK POST AS VIEWED
  @Post(':id/view')
  async markAsViewed(@Param('id', ParseUUIDPipe) id: string, @GetUser() user: User) {
    try {
      console.log('👁️ Marking post as viewed:', id);
      console.log('   - User:', user.id);
      
      await this.forumsService.markAsViewed(id, user);
      
      console.log('✅ Post marked as viewed successfully');
      
      return {
        success: true,
        message: 'Post telah ditandai sebagai dilihat',
      };
    } catch (error) {
      console.error('❌ Error marking post as viewed:', error.message);
      // Don't throw error for view tracking to avoid disrupting user experience
      return {
        success: false,
        message: 'Gagal menandai sebagai dilihat',
      };
    }
  }

  // MARK REPLY AS ANSWER
  @Patch(':id/answer/:replyId')
  async markAsAnswer(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('replyId', ParseUUIDPipe) replyId: string,
    @GetUser() user: User,
  ) {
    try {
      console.log('✅ Marking reply as answer:');
      console.log('   - Post ID:', id);
      console.log('   - Reply ID:', replyId);
      console.log('   - User:', user.id);
      
      const result = await this.forumsService.markAsAnswer(id, replyId, user);
      
      console.log('✅ Reply marked as answer successfully');
      
      return {
        success: true,
        ...result,
      };
    } catch (error) {
      console.error('❌ Error marking reply as answer:', error.message);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new InternalServerErrorException({
        success: false,
        message: 'Gagal menandai jawaban',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
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
      console.log('   - User:', user.id);
      console.log('   - Update data:', updateForumPostDto);
      
      const post = await this.forumsService.update(id, updateForumPostDto, user);
      
      console.log('✅ Forum post updated successfully');
      
      return {
        success: true,
        message: 'Forum post berhasil diperbarui',
        data: post,
      };
    } catch (error) {
      console.error('❌ Error updating forum post:', error.message);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new InternalServerErrorException({
        success: false,
        message: 'Gagal memperbarui forum post',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // DELETE FORUM POST
  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string, @GetUser() user: User) {
    try {
      console.log('🗑️ Deleting forum post:', id);
      console.log('   - User:', user.id);
      
      const result = await this.forumsService.remove(id, user);
      
      console.log('✅ Forum post deleted successfully');
      
      return {
        success: true,
        ...result,
      };
    } catch (error) {
      console.error('❌ Error deleting forum post:', error.message);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new InternalServerErrorException({
        success: false,
        message: 'Gagal menghapus forum post',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // TOGGLE PIN POST (Lecturer/Admin only)
  @Patch(':id/pin')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.LECTURER)
  async togglePin(@Param('id', ParseUUIDPipe) id: string, @GetUser() user: User) {
    try {
      console.log('📌 Toggling pin for forum post:', id);
      console.log('   - User:', user.id, user.role);
      
      const result = await this.forumsService.togglePin(id, user);
      
      console.log('✅ Forum post pin toggled successfully');
      
      return {
        success: true,
        ...result,
      };
    } catch (error) {
      console.error('❌ Error toggling pin:', error.message);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new InternalServerErrorException({
        success: false,
        message: 'Gagal toggle pin',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // TOGGLE LOCK POST (Lecturer/Admin only)
  @Patch(':id/lock')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.LECTURER)
  async toggleLock(@Param('id', ParseUUIDPipe) id: string, @GetUser() user: User) {
    try {
      console.log('🔒 Toggling lock for forum post:', id);
      console.log('   - User:', user.id, user.role);
      
      const result = await this.forumsService.toggleLock(id, user);
      
      console.log('✅ Forum post lock toggled successfully');
      
      return {
        success: true,
        ...result,
      };
    } catch (error) {
      console.error('❌ Error toggling lock:', error.message);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new InternalServerErrorException({
        success: false,
        message: 'Gagal toggle lock',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // TOGGLE LIKE POST
  @Post(':id/like')
  async toggleLike(@Param('id', ParseUUIDPipe) id: string, @GetUser() user: User) {
    try {
      console.log('❤️ Toggling like for forum post:', id);
      console.log('   - User:', user.id);
      
      const result = await this.forumsService.toggleLike(id, user);
      
      console.log('✅ Forum post like toggled successfully');
      
      return {
        success: true,
        ...result,
      };
    } catch (error) {
      console.error('❌ Error toggling like:', error.message);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new InternalServerErrorException({
        success: false,
        message: 'Gagal toggle like',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // LIKE REPLY ENDPOINT  
  @Post('replies/:replyId/like')
  async likeReply(@Param('replyId', ParseUUIDPipe) replyId: string, @GetUser() user: User) {
    try {
      console.log('❤️ Toggling like for reply:', replyId);
      console.log('   - User:', user.id);
      
      const result = await this.forumsService.toggleLike(replyId, user);
      
      console.log('✅ Reply like toggled successfully');
      
      return {
        success: true,
        ...result,
      };
    } catch (error) {
      console.error('❌ Error liking reply:', error.message);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new InternalServerErrorException({
        success: false,
        message: 'Gagal like reply',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // UPDATE REPLY ENDPOINT
  @Patch('replies/:replyId')
  async updateReply(
    @Param('replyId', ParseUUIDPipe) replyId: string,
    @Body() updateData: { content: string },
    @GetUser() user: User,
  ) {
    try {
      console.log('✏️ Updating reply:', replyId);
      console.log('   - User:', user.id);
      
      const reply = await this.forumsService.update(replyId, updateData, user);
      
      console.log('✅ Reply updated successfully');
      
      return {
        success: true,
        message: 'Balasan berhasil diperbarui',
        data: reply,
      };
    } catch (error) {
      console.error('❌ Error updating reply:', error.message);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new InternalServerErrorException({
        success: false,
        message: 'Gagal memperbarui balasan',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // DELETE REPLY ENDPOINT
  @Delete('replies/:replyId')
  async deleteReply(@Param('replyId', ParseUUIDPipe) replyId: string, @GetUser() user: User) {
    try {
      console.log('🗑️ Deleting reply:', replyId);
      console.log('   - User:', user.id);
      
      const result = await this.forumsService.remove(replyId, user);
      
      console.log('✅ Reply deleted successfully');
      
      return {
        success: true,
        message: 'Balasan berhasil dihapus',
      };
    } catch (error) {
      console.error('❌ Error deleting reply:', error.message);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new InternalServerErrorException({
        success: false,
        message: 'Gagal menghapus balasan',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
}