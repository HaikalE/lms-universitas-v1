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
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { QueryCoursesDto } from './dto/query-courses.dto';
import { CreateCourseMaterialDto } from './dto/create-course-material.dto';
import { UpdateCourseMaterialDto } from './dto/update-course-material.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User, UserRole } from '../entities/user.entity';

@Controller('courses')
@UseGuards(JwtAuthGuard)
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  create(@Body() createCourseDto: CreateCourseDto, @GetUser() user: User) {
    return this.coursesService.create(createCourseDto, user);
  }

  @Get()
  findAll(@Query() queryDto: QueryCoursesDto, @GetUser() user: User) {
    return this.coursesService.findAll(queryDto, user);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @GetUser() user: User) {
    return this.coursesService.findOne(id, user);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.LECTURER)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCourseDto: UpdateCourseDto,
    @GetUser() user: User,
  ) {
    return this.coursesService.update(id, updateCourseDto, user);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id', ParseUUIDPipe) id: string, @GetUser() user: User) {
    return this.coursesService.remove(id, user);
  }

  @Get(':id/stats')
  getCourseStats(@Param('id', ParseUUIDPipe) id: string, @GetUser() user: User) {
    return this.coursesService.getCourseStats(id, user);
  }

  // Course Materials endpoints
  @Get(':id/materials')
  getCourseMaterials(
    @Param('id', ParseUUIDPipe) courseId: string,
    @GetUser() user: User,
  ) {
    return this.coursesService.getCourseMaterials(courseId, user);
  }

  @Post(':id/materials')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.LECTURER)
  createCourseMaterial(
    @Param('id', ParseUUIDPipe) courseId: string,
    @Body() createMaterialDto: CreateCourseMaterialDto,
    @GetUser() user: User,
  ) {
    return this.coursesService.createCourseMaterial(
      courseId,
      createMaterialDto,
      user,
    );
  }

  @Patch(':courseId/materials/:materialId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.LECTURER)
  updateCourseMaterial(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('materialId', ParseUUIDPipe) materialId: string,
    @Body() updateMaterialDto: UpdateCourseMaterialDto,
    @GetUser() user: User,
  ) {
    return this.coursesService.updateCourseMaterial(
      courseId,
      materialId,
      updateMaterialDto,
      user,
    );
  }

  @Delete(':courseId/materials/:materialId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.LECTURER)
  deleteCourseMaterial(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('materialId', ParseUUIDPipe) materialId: string,
    @GetUser() user: User,
  ) {
    return this.coursesService.deleteCourseMaterial(courseId, materialId, user);
  }
}
