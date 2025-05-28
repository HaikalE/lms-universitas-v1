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

// Interface untuk raw request body dari FormData
interface RawMaterialBody {
  title?: string;
  description?: string;
  type?: string;
  url?: string;
  week?: string | number;
  orderIndex?: string | number;
  isVisible?: string | boolean;
}

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
    @Body() body: RawMaterialBody,
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

      // Helper function untuk validate dan convert values
      const validateAndConvertNumber = (value: string | number | undefined, fieldName: string, min: number = 1): number => {
        if (value === undefined || value === null) {
          return min; // default value
        }
        
        // Handle empty string case
        if (typeof value === 'string' && value.trim() === '') {
          return min; // default value
        }
        
        const num = typeof value === 'string' ? parseInt(value, 10) : value;
        if (isNaN(num) || num < min) {
          throw new BadRequestException(`${fieldName} harus berupa angka dan minimal ${min}`);
        }
        return num;
      };

      const validateAndConvertBoolean = (value: string | boolean | undefined): boolean => {
        if (value === undefined || value === null) {
          return true; // default value
        }
        
        // Handle empty string case
        if (typeof value === 'string' && value.trim() === '') {
          return true; // default value
        }
        
        if (typeof value === 'string') {
          return value === 'true' || value === '1';
        }
        return Boolean(value);
      };

      // Manual validation and DTO construction
      const createMaterialDto: CreateCourseMaterialDto = {
        title: body.title,
        description: body.description,
        type: body.type as MaterialType,
        url: body.url,
        week: validateAndConvertNumber(body.week, 'Minggu', 1),
        orderIndex: validateAndConvertNumber(body.orderIndex, 'Urutan', 1),
        isVisible: validateAndConvertBoolean(body.isVisible),
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

      // Validate material type enum
      if (!Object.values(MaterialType).includes(createMaterialDto.type)) {
        console.error('❌ Validation error: Invalid material type:', createMaterialDto.type);
        throw new BadRequestException('Tipe materi harus salah satu dari: pdf, video, document, presentation, link');
      }

      // Validate week - should be a positive number
      if (createMaterialDto.week !== undefined && createMaterialDto.week !== null && (typeof createMaterialDto.week !== 'number' || createMaterialDto.week < 1)) {
        throw new BadRequestException('Minggu harus berupa angka positif');
      }

      // Validate orderIndex - should be a positive number
      if (createMaterialDto.orderIndex !== undefined && createMaterialDto.orderIndex !== null && (typeof createMaterialDto.orderIndex !== 'number' || createMaterialDto.orderIndex < 1)) {
        throw new BadRequestException('Urutan harus berupa angka positif');
      }

      // Validate isVisible - should be a boolean
      if (createMaterialDto.isVisible !== undefined && createMaterialDto.isVisible !== null && typeof createMaterialDto.isVisible !== 'boolean') {
        throw new BadRequestException('Visibilitas harus berupa boolean');
      }

      console.log('🔍 Debug - Material type:', createMaterialDto.type);
      console.log('🔍 Debug - Processed DTO:', createMaterialDto);

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
    @Body() body: RawMaterialBody,
    @UploadedFile() file: Express.Multer.File,
    @GetUser() user: User,
  ) {
    try {
      console.log('🔍 Debug - Update body:', body);
      console.log('🔍 Debug - Update file:', file ? file.originalname : 'No file');

      // Helper function untuk validate dan convert values (optional untuk update)
      const validateAndConvertNumber = (value: string | number | undefined, fieldName: string, min: number = 1): number | undefined => {
        if (value === undefined || value === null) {
          return undefined; // tidak update field ini
        }
        
        // Handle empty string case  
        if (typeof value === 'string' && value.trim() === '') {
          return undefined; // tidak update field ini
        }
        
        const num = typeof value === 'string' ? parseInt(value, 10) : value;
        if (isNaN(num) || num < min) {
          throw new BadRequestException(`${fieldName} harus berupa angka dan minimal ${min}`);
        }
        return num;
      };

      const validateAndConvertBoolean = (value: string | boolean | undefined): boolean | undefined => {
        if (value === undefined || value === null) {
          return undefined; // tidak update field ini
        }
        
        // Handle empty string case
        if (typeof value === 'string' && value.trim() === '') {
          return undefined; // tidak update field ini
        }
        
        if (typeof value === 'string') {
          return value === 'true' || value === '1';
        }
        return Boolean(value);
      };

      const updateMaterialDto: UpdateCourseMaterialDto = {
        title: body.title,
        description: body.description,
        type: body.type as MaterialType,
        url: body.url,
        week: validateAndConvertNumber(body.week, 'Minggu', 1),
        orderIndex: validateAndConvertNumber(body.orderIndex, 'Urutan', 1),
        isVisible: validateAndConvertBoolean(body.isVisible),
      };

      // Validate material type enum if provided
      if (updateMaterialDto.type && !Object.values(MaterialType).includes(updateMaterialDto.type)) {
        throw new BadRequestException('Tipe materi harus salah satu dari: pdf, video, document, presentation, link');
      }

      // Validate week - should be a positive number if provided
      if (updateMaterialDto.week !== undefined && updateMaterialDto.week !== null && (typeof updateMaterialDto.week !== 'number' || updateMaterialDto.week < 1)) {
        throw new BadRequestException('Minggu harus berupa angka positif');
      }

      // Validate orderIndex - should be a positive number if provided
      if (updateMaterialDto.orderIndex !== undefined && updateMaterialDto.orderIndex !== null && (typeof updateMaterialDto.orderIndex !== 'number' || updateMaterialDto.orderIndex < 1)) {
        throw new BadRequestException('Urutan harus berupa angka positif');
      }

      // Validate isVisible - should be a boolean if provided
      if (updateMaterialDto.isVisible !== undefined && updateMaterialDto.isVisible !== null && typeof updateMaterialDto.isVisible !== 'boolean') {
        throw new BadRequestException('Visibilitas harus berupa boolean');
      }

      console.log('🔍 Debug - Processed update DTO:', updateMaterialDto);

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
