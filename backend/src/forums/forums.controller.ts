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

  @Post()
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
  remove(@Param('id', ParseUUIDPipe) id: string, @GetUser() user: User) {
    return this.forumsService.remove(id, user);
  }

  @Patch(':id/pin')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.LECTURER)
  togglePin(@Param('id', ParseUUIDPipe) id: string, @GetUser() user: User) {
    return this.forumsService.togglePin(id, user);
  }

  @Patch(':id/lock')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.LECTURER)
  toggleLock(@Param('id', ParseUUIDPipe) id: string, @GetUser() user: User) {
    return this.forumsService.toggleLock(id, user);
  }

  @Post(':id/like')
  toggleLike(@Param('id', ParseUUIDPipe) id: string, @GetUser() user: User) {
    return this.forumsService.toggleLike(id, user);
  }
}
