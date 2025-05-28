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
  UsePipes,
  ValidationPipe,
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
      console.log('📁 File received by multer:', {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size
      });
      cb(null, true);
    },
  }))
  async createCourseMaterial(
    @Param('id', ParseUUIDPipe) courseId: string,
    @Body() body: any,
    @UploadedFile() file: Express.Multer.File,
    @GetUser() user: User,
  ) {
    try {
      console.log('🔍 Debug - Request body:', body);
      console.log('🔍 Debug - File received:', file ? {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size
      } : 'No file');
      console.log('🔍 Debug - Course ID:', courseId);

      // Manual validation and DTO construction
      const createMaterialDto: CreateCourseMaterialDto = {
        title: body.title,
        description: body.description,
        type: body.type,
        url: body.url,
        week: body.week,
        orderIndex: body.orderIndex,
        isVisible: body.isVisible,
      };

      // Validate required fields
      if (!createMaterialDto.title || createMaterialDto.title.trim() === '') {
        console.error('❌ Validation error: Title is required');
        throw new BadRequestException('Judul materi wajib diisi');
      }

      if (!createMaterialDto.type) {
        console.error('❌ Validation error: Type is required');
        throw new BadRequestException('Tipe materi wajib dipilih');
      }

      console.log('🔍 Debug - Material type:', createMaterialDto.type);

      // Validate and convert week
      if (createMaterialDto.week !== undefined && createMaterialDto.week !== null && createMaterialDto.week !== "") {
        const weekNum = typeof createMaterialDto.week === 'string' 
          ? parseInt(createMaterialDto.week as string, 10) 
          : createMaterialDto.week;
        
        console.log('🔍 Debug - Week conversion:', { original: createMaterialDto.week, converted: weekNum });
        
        if (isNaN(weekNum) || weekNum < 1) {
          console.error('❌ Validation error: Invalid week number:', weekNum);
          throw new BadRequestException('Minggu harus berupa angka dan minimal 1');
        }
        createMaterialDto.week = weekNum;
      } else {
        console.log('🔍 Debug - Setting default week: 1');
        createMaterialDto.week = 1;
      }

      // Validate and convert orderIndex
      if (createMaterialDto.orderIndex !== undefined && createMaterialDto.orderIndex !== null && createMaterialDto.orderIndex !== "") {
        const orderNum = typeof createMaterialDto.orderIndex === 'string' 
          ? parseInt(createMaterialDto.orderIndex as string, 10) 
          : createMaterialDto.orderIndex;
        
        console.log('🔍 Debug - OrderIndex conversion:', { original: createMaterialDto.orderIndex, converted: orderNum });
        
        if (isNaN(orderNum) || orderNum < 1) {
          console.error('❌ Validation error: Invalid order index:', orderNum);
          throw new BadRequestException('Urutan harus berupa angka dan minimal 1');
        }
        createMaterialDto.orderIndex = orderNum;
      } else {
        console.log('🔍 Debug - Setting default orderIndex: 1');
        createMaterialDto.orderIndex = 1;
      }

      // Convert boolean strings
      if (createMaterialDto.isVisible !== undefined && createMaterialDto.isVisible !== null && createMaterialDto.isVisible !== "") {
        if (typeof createMaterialDto.isVisible === 'string') {
          createMaterialDto.isVisible = createMaterialDto.isVisible === 'true' || createMaterialDto.isVisible === '1';
        }
        console.log('🔍 Debug - IsVisible conversion:', { original: body.isVisible, converted: createMaterialDto.isVisible });
      } else {
        console.log('🔍 Debug - Setting default isVisible: true');
        createMaterialDto.isVisible = true;
      }

      // Validate URL for link type
      if (createMaterialDto.type === MaterialType.LINK) {
        if (!createMaterialDto.url || createMaterialDto.url.trim() === '') {
          console.error('❌ Validation error: URL required for link type');
          throw new BadRequestException('URL wajib diisi untuk tipe link');
        }
        // Basic URL validation
        try {
          new URL(createMaterialDto.url);
          console.log('✅ URL validation passed:', createMaterialDto.url);
        } catch {
          console.error('❌ Validation error: Invalid URL format:', createMaterialDto.url);
          throw new BadRequestException('Format URL tidak valid');
        }
      }

      // Validate file for non-link types
      if (createMaterialDto.type !== MaterialType.LINK && !file) {
        console.error('❌ Validation error: File required for non-link type:', createMaterialDto.type);
        throw new BadRequestException('File wajib diupload untuk tipe materi ini');
      }

      console.log('✅ All validations passed, creating material:', createMaterialDto);

      const result = await this.coursesService.createCourseMaterial(
        courseId,
        createMaterialDto,
        user,
        file,
      );

      console.log('✅ Material created successfully:', result.id);
      return result;

    } catch (error) {
      console.error('❌ Error creating course material:', error);
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
      cb(null, true);
    },
  }))
  async updateCourseMaterial(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('materialId', ParseUUIDPipe) materialId: string,
    @Body() body: any,
    @UploadedFile() file: Express.Multer.File,
    @GetUser() user: User,
  ) {
    try {
      console.log('🔍 Debug - Update body:', body);
      console.log('🔍 Debug - Update file:', file ? file.originalname : 'No file');

      const updateMaterialDto: UpdateCourseMaterialDto = {
        title: body.title,
        description: body.description,
        type: body.type,
        url: body.url,
        week: body.week,
        orderIndex: body.orderIndex,
        isVisible: body.isVisible,
      };

      // Convert string numbers to actual numbers if provided
      if (updateMaterialDto.week !== undefined && updateMaterialDto.week !== null && updateMaterialDto.week !== "") {
        const weekNum = typeof updateMaterialDto.week === 'string' 
          ? parseInt(updateMaterialDto.week as string, 10) 
          : updateMaterialDto.week;
        
        if (isNaN(weekNum) || weekNum < 1) {
          throw new BadRequestException('Minggu harus berupa angka dan minimal 1');
        }
        updateMaterialDto.week = weekNum;
      }

      if (updateMaterialDto.orderIndex !== undefined && updateMaterialDto.orderIndex !== null && updateMaterialDto.orderIndex !== "") {
        const orderNum = typeof updateMaterialDto.orderIndex === 'string' 
          ? parseInt(updateMaterialDto.orderIndex as string, 10) 
          : updateMaterialDto.orderIndex;
        
        if (isNaN(orderNum) || orderNum < 1) {
          throw new BadRequestException('Urutan harus berupa angka dan minimal 1');
        }
        updateMaterialDto.orderIndex = orderNum;
      }

      // Convert boolean strings
      if (updateMaterialDto.isVisible !== undefined && updateMaterialDto.isVisible !== null && updateMaterialDto.isVisible !== "") {
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
      console.error('❌ Error updating course material:', error);
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
