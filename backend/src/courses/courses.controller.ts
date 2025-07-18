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
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { QueryCoursesDto } from './dto/query-courses.dto';
import { CreateCourseMaterialDto } from './dto/create-course-material.dto';
import { UpdateCourseMaterialDto } from './dto/update-course-material.dto';
import { 
  EnrollStudentDto, 
  EnrollMultipleStudentsDto, 
  QueryCourseStudentsDto,
  AddStudentByEmailDto 
} from './dto/enroll-student.dto';
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

// DTO untuk lecturer management
interface AddLecturerDto {
  lecturerId: string;
}

@Controller('courses')
@UseGuards(JwtAuthGuard)
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @UsePipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    exceptionFactory: (errors) => {
      const messages = errors.map(error => {
        // Get first constraint message
        const constraints = Object.values(error.constraints || {});
        return constraints[0] || `Field ${error.property} is invalid`;
      });
      
      console.log('🚨 Course creation validation errors:', {
        errors: messages,
        receivedData: errors.map(e => ({ property: e.property, value: e.value }))
      });
      
      throw new BadRequestException({
        message: messages,
        error: 'Validation Failed',
        statusCode: 400
      });
    }
  }))
  async create(@Body() createCourseDto: CreateCourseDto, @GetUser() user: User) {
    try {
      console.log('📚 Creating course with validated data:', {
        ...createCourseDto,
        createdBy: user.id
      });

      // Additional business logic validation
      if (!createCourseDto.lecturerId || createCourseDto.lecturerId.trim() === '') {
        throw new BadRequestException('Dosen pengampu wajib dipilih dari dropdown yang tersedia');
      }

      const result = await this.coursesService.create(createCourseDto, user);
      
      console.log('✅ Course created successfully:', {
        id: result.id,
        name: result.name,
        code: result.code
      });
      
      return result;
    } catch (error) {
      console.error('❌ Error in course creation controller:', {
        error: error.message,
        dto: createCourseDto,
        userId: user.id
      });
      
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      // Handle other specific errors
      if (error.message && error.message.includes('duplicate key')) {
        throw new BadRequestException('Kode mata kuliah sudah digunakan. Silakan gunakan kode yang berbeda.');
      }
      
      if (error.message && error.message.includes('lecturer not found')) {
        throw new BadRequestException('Dosen yang dipilih tidak ditemukan. Silakan pilih dosen lain dari dropdown.');
      }
      
      // Generic error
      throw new BadRequestException('Terjadi kesalahan saat membuat mata kuliah. Silakan periksa data dan coba lagi.');
    }
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
  @UsePipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    exceptionFactory: (errors) => {
      const messages = errors.map(error => {
        const constraints = Object.values(error.constraints || {});
        return constraints[0] || `Field ${error.property} is invalid`;
      });
      
      console.log('🚨 Course update validation errors:', {
        errors: messages,
        receivedData: errors.map(e => ({ property: e.property, value: e.value }))
      });
      
      throw new BadRequestException({
        message: messages,
        error: 'Validation Failed',
        statusCode: 400
      });
    }
  }))
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCourseDto: UpdateCourseDto,
    @GetUser() user: User,
  ) {
    try {
      console.log('📝 Updating course:', {
        courseId: id,
        updates: updateCourseDto,
        updatedBy: user.id
      });

      // Additional validation for lecturerId if provided
      if (updateCourseDto.lecturerId !== undefined && 
          (!updateCourseDto.lecturerId || updateCourseDto.lecturerId.trim() === '')) {
        throw new BadRequestException('Dosen pengampu wajib dipilih dari dropdown yang tersedia');
      }

      const result = await this.coursesService.update(id, updateCourseDto, user);
      
      console.log('✅ Course updated successfully:', {
        id: result.id,
        name: result.name
      });
      
      return result;
    } catch (error) {
      console.error('❌ Error in course update controller:', {
        error: error.message,
        courseId: id,
        dto: updateCourseDto,
        userId: user.id
      });
      
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      // Handle specific errors
      if (error.message && error.message.includes('duplicate key')) {
        throw new BadRequestException('Kode mata kuliah sudah digunakan. Silakan gunakan kode yang berbeda.');
      }
      
      if (error.message && error.message.includes('lecturer not found')) {
        throw new BadRequestException('Dosen yang dipilih tidak ditemukan. Silakan pilih dosen lain dari dropdown.');
      }
      
      if (error.message && error.message.includes('not found')) {
        throw new BadRequestException('Mata kuliah tidak ditemukan.');
      }
      
      // Generic error
      throw new BadRequestException('Terjadi kesalahan saat memperbarui mata kuliah. Silakan periksa data dan coba lagi.');
    }
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

  // ===============================
  // LECTURER MANAGEMENT ENDPOINTS
  // ===============================
  
  @Post(':id/lecturers')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async addLecturerToCourse(
    @Param('id', ParseUUIDPipe) courseId: string,
    @Body() addLecturerDto: AddLecturerDto,
    @GetUser() user: User,
  ) {
    return this.coursesService.addLecturerToCourse(courseId, addLecturerDto.lecturerId, user);
  }

  @Delete(':id/lecturers/:lecturerId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async removeLecturerFromCourse(
    @Param('id', ParseUUIDPipe) courseId: string,
    @Param('lecturerId', ParseUUIDPipe) lecturerId: string,
    @GetUser() user: User,
  ) {
    return this.coursesService.removeLecturerFromCourse(courseId, lecturerId, user);
  }

  @Get(':id/lecturers/available')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getAvailableLecturers(
    @Param('id', ParseUUIDPipe) courseId: string,
    @GetUser() user: User,
  ) {
    return this.coursesService.getAvailableLecturers(courseId, user);
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
        size: file.size,
        fieldname: file.fieldname
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
    console.log('🔍 === CREATE MATERIAL DEBUG START ===');
    console.log('📝 Request body keys:', Object.keys(body));
    console.log('📝 Request body values:', JSON.stringify(body, null, 2));
    console.log('📁 File info:', file ? {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      fieldname: file.fieldname,
      buffer: file.buffer ? `Buffer(${file.buffer.length} bytes)` : 'No buffer'
    } : 'No file uploaded');
    console.log('👤 User:', { id: user.id, role: user.role });
    console.log('📚 Course ID:', courseId);

    try {
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
        title: body.title?.trim(),
        description: body.description?.trim(),
        type: body.type as MaterialType,
        url: body.url?.trim(),
        week: validateAndConvertNumber(body.week, 'Minggu', 1),
        orderIndex: validateAndConvertNumber(body.orderIndex, 'Urutan', 1),
        isVisible: validateAndConvertBoolean(body.isVisible),
      };

      console.log('✅ Processed DTO:', JSON.stringify(createMaterialDto, null, 2));

      // Validate required fields
      if (!createMaterialDto.title || createMaterialDto.title === '') {
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
        throw new BadRequestException(`Tipe materi harus salah satu dari: ${Object.values(MaterialType).join(', ')}`);
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

      console.log('🔍 Material type validation:', {
        type: createMaterialDto.type,
        isLink: createMaterialDto.type === MaterialType.LINK,
        hasFile: !!file,
        hasUrl: !!createMaterialDto.url
      });

      // Enhanced validation for URL/file based on type
      if (createMaterialDto.type === MaterialType.LINK) {
        if (!createMaterialDto.url || createMaterialDto.url === '') {
          console.error('❌ Validation error: URL required for link type');
          throw new BadRequestException('URL wajib diisi untuk tipe link');
        }
        
        // Basic URL validation
        try {
          new URL(createMaterialDto.url);
          console.log('✅ URL validation passed:', createMaterialDto.url);
        } catch (urlError) {
          console.error('❌ Validation error: Invalid URL format:', createMaterialDto.url, urlError.message);
          throw new BadRequestException('Format URL tidak valid. Pastikan URL dimulai dengan http:// atau https://');
        }

        // For link type, file is not required
        if (file) {
          console.log('⚠️ Warning: File uploaded for LINK type, will be ignored');
        }
      } else {
        // For non-link types, file is required
        if (!file) {
          console.error('❌ Validation error: File required for non-link type:', createMaterialDto.type);
          const typeNames = {
            [MaterialType.PDF]: 'PDF',
            [MaterialType.VIDEO]: 'Video',
            [MaterialType.DOCUMENT]: 'Dokumen',
            [MaterialType.PRESENTATION]: 'Presentasi'
          };
          const typeName = typeNames[createMaterialDto.type] || createMaterialDto.type;
          throw new BadRequestException(`File ${typeName.toLowerCase()} wajib diupload untuk tipe materi ${typeName}`);
        }

        // Validate file type based on material type  
        const allowedMimeTypes = {
          [MaterialType.PDF]: ['application/pdf'],
          [MaterialType.VIDEO]: [
            'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 
            'video/webm', 'video/x-flv', 'video/3gpp'
          ],
          [MaterialType.DOCUMENT]: [
            'application/msword', 
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
            'application/vnd.oasis.opendocument.text'
          ],
          [MaterialType.PRESENTATION]: [
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'application/vnd.oasis.opendocument.presentation'
          ]
        };

        const allowed = allowedMimeTypes[createMaterialDto.type];
        if (allowed && !allowed.includes(file.mimetype)) {
          console.error('❌ File type validation failed:', {
            uploadedType: file.mimetype,
            allowedTypes: allowed,
            materialType: createMaterialDto.type
          });
          throw new BadRequestException(`Tipe file tidak sesuai. Untuk materi ${createMaterialDto.type}, gunakan file: ${allowed.join(', ')}`);
        }

        console.log('✅ File validation passed:', {
          type: file.mimetype,
          size: file.size,
          name: file.originalname
        });
      }

      console.log('✅ All validations passed, creating material...');

      const result = await this.coursesService.createCourseMaterial(
        courseId,
        createMaterialDto,
        user,
        file,
      );

      console.log('✅ Material created successfully:', {
        id: result.id,
        title: result.title,
        type: result.type
      });
      console.log('🔍 === CREATE MATERIAL DEBUG END ===');
      
      return result;

    } catch (error) {
      console.error('❌ Error creating course material:', {
        message: error.message,
        stack: error.stack,
        body,
        hasFile: !!file
      });
      console.log('🔍 === CREATE MATERIAL DEBUG END (ERROR) ===');
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
      console.log('📁 Update file received:', {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size
      });
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
    console.log('🔍 === UPDATE MATERIAL DEBUG START ===');
    console.log('📝 Update body:', JSON.stringify(body, null, 2));
    console.log('📁 Update file:', file ? file.originalname : 'No file');
    console.log('📚 Course ID:', courseId, 'Material ID:', materialId);

    try {
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
        title: body.title?.trim(),
        description: body.description?.trim(),
        type: body.type as MaterialType,
        url: body.url?.trim(),
        week: validateAndConvertNumber(body.week, 'Minggu', 1),
        orderIndex: validateAndConvertNumber(body.orderIndex, 'Urutan', 1),
        isVisible: validateAndConvertBoolean(body.isVisible),
      };

      // Validate material type enum if provided
      if (updateMaterialDto.type && !Object.values(MaterialType).includes(updateMaterialDto.type)) {
        throw new BadRequestException(`Tipe materi harus salah satu dari: ${Object.values(MaterialType).join(', ')}`);
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

      console.log('✅ Processed update DTO:', JSON.stringify(updateMaterialDto, null, 2));

      const result = await this.coursesService.updateCourseMaterial(
        courseId,
        materialId,
        updateMaterialDto,
        user,
        file,
      );

      console.log('✅ Material updated successfully:', result.id);
      console.log('🔍 === UPDATE MATERIAL DEBUG END ===');
      
      return result;
    } catch (error) {
      console.error('❌ Error updating course material:', {
        message: error.message,
        courseId,
        materialId,
        body,
        hasFile: !!file
      });
      console.log('🔍 === UPDATE MATERIAL DEBUG END (ERROR) ===');
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

  // Student Management Endpoints
  @Get(':id/students')
  getCourseStudents(
    @Param('id', ParseUUIDPipe) courseId: string,
    @Query() queryDto: QueryCourseStudentsDto,
    @GetUser() user: User,
  ) {
    return this.coursesService.getCourseStudents(courseId, queryDto, user);
  }

  @Post(':id/students/enroll')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.LECTURER)
  enrollStudent(
    @Param('id', ParseUUIDPipe) courseId: string,
    @Body() enrollStudentDto: EnrollStudentDto,
    @GetUser() user: User,
  ) {
    return this.coursesService.enrollStudent(courseId, enrollStudentDto, user);
  }

  @Post(':id/students/enroll-multiple')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.LECTURER)
  enrollMultipleStudents(
    @Param('id', ParseUUIDPipe) courseId: string,
    @Body() enrollMultipleDto: EnrollMultipleStudentsDto,
    @GetUser() user: User,
  ) {
    return this.coursesService.enrollMultipleStudents(courseId, enrollMultipleDto, user);
  }

  @Post(':id/students/add-by-email')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.LECTURER)
  addStudentByEmail(
    @Param('id', ParseUUIDPipe) courseId: string,
    @Body() addStudentDto: AddStudentByEmailDto,
    @GetUser() user: User,
  ) {
    return this.coursesService.addStudentByEmail(courseId, addStudentDto, user);
  }

  @Delete(':id/students/:studentId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.LECTURER)
  removeStudentFromCourse(
    @Param('id', ParseUUIDPipe) courseId: string,
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @GetUser() user: User,
  ) {
    return this.coursesService.removeStudentFromCourse(courseId, studentId, user);
  }

  @Get(':id/students/available')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.LECTURER)
  getAvailableStudents(
    @Param('id', ParseUUIDPipe) courseId: string,
    @GetUser() user: User,
  ) {
    return this.coursesService.getAvailableStudents(courseId, user);
  }
}
