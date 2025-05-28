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
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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
import { MaterialType } from '../entities/course-material.entity';

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
  @UseInterceptors(FileInterceptor('file', {
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB
    },
    fileFilter: (req, file, cb) => {
      // Allow all file types for now, validation will be done in service
      cb(null, true);
    },
  }))
  async createCourseMaterial(
    @Param('id', ParseUUIDPipe) courseId: string,
    @Body() createMaterialDto: CreateCourseMaterialDto,
    @UploadedFile() file: Express.Multer.File,
    @GetUser() user: User,
  ) {
    try {
      // Validate required fields
      if (!createMaterialDto.title || createMaterialDto.title.trim() === '') {
        throw new BadRequestException('Judul materi wajib diisi');
      }

      if (!createMaterialDto.type) {
        throw new BadRequestException('Tipe materi wajib dipilih');
      }

      // Convert string numbers to actual numbers
      if (createMaterialDto.week) {
        const weekNum = typeof createMaterialDto.week === 'string' 
          ? parseInt(createMaterialDto.week, 10) 
          : createMaterialDto.week;
        
        if (isNaN(weekNum) || weekNum < 1) {
          throw new BadRequestException('Minggu harus berupa angka dan minimal 1');
        }
        createMaterialDto.week = weekNum;
      } else {
        createMaterialDto.week = 1;
      }

      if (createMaterialDto.orderIndex) {
        const orderNum = typeof createMaterialDto.orderIndex === 'string' 
          ? parseInt(createMaterialDto.orderIndex, 10) 
          : createMaterialDto.orderIndex;
        
        if (isNaN(orderNum) || orderNum < 1) {
          throw new BadRequestException('Urutan harus berupa angka dan minimal 1');
        }
        createMaterialDto.orderIndex = orderNum;
      } else {
        createMaterialDto.orderIndex = 1;
      }

      // Convert boolean strings
      if (createMaterialDto.isVisible !== undefined) {
        if (typeof createMaterialDto.isVisible === 'string') {
          createMaterialDto.isVisible = createMaterialDto.isVisible === 'true' || createMaterialDto.isVisible === '1';
        }
      } else {
        createMaterialDto.isVisible = true;
      }

      // Validate URL for link type
      if (createMaterialDto.type === MaterialType.LINK && !createMaterialDto.url) {
        throw new BadRequestException('URL wajib diisi untuk tipe link');
      }

      // Validate file for non-link types
      if (createMaterialDto.type !== MaterialType.LINK && !file) {
        throw new BadRequestException('File wajib diupload untuk tipe materi ini');
      }

      return this.coursesService.createCourseMaterial(
        courseId,
        createMaterialDto,
        user,
        file,
      );
    } catch (error) {
      console.error('Error creating course material:', error);
      throw error;
    }
  }

  @Patch(':courseId/materials/:materialId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.LECTURER)
  @UseInterceptors(FileInterceptor('file', {
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB
    },
    fileFilter: (req, file, cb) => {
      // Allow all file types for now
      cb(null, true);
    },
  }))
  async updateCourseMaterial(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('materialId', ParseUUIDPipe) materialId: string,
    @Body() updateMaterialDto: UpdateCourseMaterialDto,
    @UploadedFile() file: Express.Multer.File,
    @GetUser() user: User,
  ) {
    try {
      // Convert string numbers to actual numbers if provided
      if (updateMaterialDto.week !== undefined) {
        const weekNum = typeof updateMaterialDto.week === 'string' 
          ? parseInt(updateMaterialDto.week, 10) 
          : updateMaterialDto.week;
        
        if (isNaN(weekNum) || weekNum < 1) {
          throw new BadRequestException('Minggu harus berupa angka dan minimal 1');
        }
        updateMaterialDto.week = weekNum;
      }

      if (updateMaterialDto.orderIndex !== undefined) {
        const orderNum = typeof updateMaterialDto.orderIndex === 'string' 
          ? parseInt(updateMaterialDto.orderIndex, 10) 
          : updateMaterialDto.orderIndex;
        
        if (isNaN(orderNum) || orderNum < 1) {
          throw new BadRequestException('Urutan harus berupa angka dan minimal 1');
        }
        updateMaterialDto.orderIndex = orderNum;
      }

      // Convert boolean strings
      if (updateMaterialDto.isVisible !== undefined) {
        if (typeof updateMaterialDto.isVisible === 'string') {
          updateMaterialDto.isVisible = updateMaterialDto.isVisible === 'true' || updateMaterialDto.isVisible === '1';
        }
      }

      return this.coursesService.updateCourseMaterial(
        courseId,
        materialId,
        updateMaterialDto,
        user,
        file,
      );
    } catch (error) {
      console.error('Error updating course material:', error);
      throw error;
    }
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
