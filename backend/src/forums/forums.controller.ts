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
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User, UserRole } from '../entities/user.entity';

@Controller('forums')
@UseGuards(JwtAuthGuard)
export class ForumsController {
  constructor(private readonly forumsService: ForumsService) {}

  // GET MY DISCUSSIONS
  @Get('my-discussions')
  async getMyDiscussions(@GetUser() user: User, @Query() queryDto: QueryForumPostsDto) {
    try {
      const result = await this.forumsService.getMyDiscussions(user, queryDto);
      
      return {
        success: true,
        message: 'Diskusi berhasil diambil',
        ...result,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new InternalServerErrorException({
        success: false,
        message: 'Gagal mengambil diskusi',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // ✅ FIXED: CREATE FORUM POST - Better validation and error handling
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
      // ✅ ENHANCED: Better validation with detailed error messages
      const validationErrors: string[] = [];

      // Validate title - required for root posts, optional for replies
      if (!createForumPostDto.parentId) {
        if (!createForumPostDto.title || !createForumPostDto.title.trim()) {
          validationErrors.push('Judul post wajib diisi untuk post utama');
        }
      }

      // Validate content - always required
      if (!createForumPostDto.content || !createForumPostDto.content.trim()) {
        validationErrors.push('Konten post wajib diisi');
      }

      // ✅ CRITICAL FIX: Validate courseId with better error messages
      if (!createForumPostDto.courseId) {
        validationErrors.push('Course ID wajib diisi');
      } else if (typeof createForumPostDto.courseId !== 'string') {
        validationErrors.push('Course ID harus berupa string');
      } else if (!createForumPostDto.courseId.trim()) {
        validationErrors.push('Course ID tidak boleh kosong');
      } else {
        // Validate UUID format more thoroughly
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(createForumPostDto.courseId.trim())) {
          validationErrors.push('Course ID harus berupa UUID yang valid');
        }
      }

      // Validate parentId if provided
      if (createForumPostDto.parentId) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(createForumPostDto.parentId)) {
          validationErrors.push('Parent ID harus berupa UUID yang valid');
        }
      }

      if (validationErrors.length > 0) {
        throw new BadRequestException({
          message: validationErrors,
          error: 'Bad Request',
          statusCode: 400,
        });
      }
      
      const post = await this.forumsService.create(createForumPostDto, user);
      
      return {
        success: true,
        message: 'Forum post berhasil dibuat',
        data: post,
      };
    } catch (error) {
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
      // Validate courseId format
      if (!courseId || courseId.length < 10) {
        throw new BadRequestException('Invalid course ID format');
      }
      
      const result = await this.forumsService.findByCourse(courseId, queryDto, user);
      
      return {
        success: true,
        message: 'Forum posts berhasil diambil',
        ...result,
      };
    } catch (error) {
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
      const post = await this.forumsService.findOne(id, user);
      
      return {
        success: true,
        message: 'Forum post berhasil diambil',
        data: post,
      };
    } catch (error) {
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
      const replies = await this.forumsService.getPostReplies(id, queryDto, user);
      
      return {
        success: true,
        message: 'Replies berhasil diambil',
        data: replies,
      };
    } catch (error) {
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
      if (!replyData.content?.trim()) {
        throw new BadRequestException('Konten balasan wajib diisi');
      }
      
      const reply = await this.forumsService.createReply(id, replyData, user);
      
      return {
        success: true,
        message: 'Balasan berhasil dibuat',
        data: reply,
      };
    } catch (error) {
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
      await this.forumsService.markAsViewed(id, user);
      
      return {
        success: true,
        message: 'Post telah ditandai sebagai dilihat',
      };
    } catch (error) {
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
      const result = await this.forumsService.markAsAnswer(id, replyId, user);
      
      return {
        success: true,
        ...result,
      };
    } catch (error) {
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
      const post = await this.forumsService.update(id, updateForumPostDto, user);
      
      return {
        success: true,
        message: 'Forum post berhasil diperbarui',
        data: post,
      };
    } catch (error) {
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
      const result = await this.forumsService.remove(id, user);
      
      return {
        success: true,
        ...result,
      };
    } catch (error) {
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
      const result = await this.forumsService.togglePin(id, user);
      
      return {
        success: true,
        ...result,
      };
    } catch (error) {
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
      const result = await this.forumsService.toggleLock(id, user);
      
      return {
        success: true,
        ...result,
      };
    } catch (error) {
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

  // ✅ FIXED: TOGGLE LIKE POST - Proper implementation
  @Post(':id/like')
  async toggleLike(@Param('id', ParseUUIDPipe) id: string, @GetUser() user: User) {
    try {
      const result = await this.forumsService.toggleLike(id, user);
      
      return {
        success: true,
        ...result,
      };
    } catch (error) {
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
      const result = await this.forumsService.toggleLike(replyId, user);
      
      return {
        success: true,
        ...result,
      };
    } catch (error) {
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
      const reply = await this.forumsService.update(replyId, updateData, user);
      
      return {
        success: true,
        message: 'Balasan berhasil diperbarui',
        data: reply,
      };
    } catch (error) {
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
      const result = await this.forumsService.remove(replyId, user);
      
      return {
        success: true,
        message: 'Balasan berhasil dihapus',
      };
    } catch (error) {
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
