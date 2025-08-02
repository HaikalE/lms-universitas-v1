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
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AssignmentsService } from './assignments.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
import { QueryAssignmentsDto } from './dto/query-assignments.dto';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { UpdateSubmissionDto } from './dto/update-submission.dto';
import { CreateGradeDto } from './dto/create-grade.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User, UserRole } from '../entities/user.entity';

@Controller('assignments')
@UseGuards(JwtAuthGuard)
export class AssignmentsController {
  private readonly logger = new Logger(AssignmentsController.name);

  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.LECTURER)
  create(@Body() createAssignmentDto: CreateAssignmentDto, @GetUser() user: User) {
    return this.assignmentsService.create(createAssignmentDto, user);
  }

  @Get()
  findAll(@Query() queryDto: QueryAssignmentsDto, @GetUser() user: User) {
    return this.assignmentsService.findAll(queryDto, user);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @GetUser() user: User) {
    return this.assignmentsService.findOne(id, user);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.LECTURER)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAssignmentDto: UpdateAssignmentDto,
    @GetUser() user: User,
  ) {
    return this.assignmentsService.update(id, updateAssignmentDto, user);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.LECTURER)
  remove(@Param('id', ParseUUIDPipe) id: string, @GetUser() user: User) {
    return this.assignmentsService.remove(id, user);
  }

  // ✅ Submission endpoints with file upload support
  @Post(':id/submit')
  @UseGuards(RolesGuard)
  @Roles(UserRole.STUDENT)
  @UseInterceptors(FileInterceptor('file', {
    dest: './uploads',
    limits: {
      fileSize: 100 * 1024 * 1024, // 100MB max file size
    },
  }))
  submitAssignment(
    @Param('id', ParseUUIDPipe) assignmentId: string,
    @Body() createSubmissionDto: CreateSubmissionDto,
    @UploadedFile() file: Express.Multer.File,
    @GetUser() user: User,
  ) {
    return this.assignmentsService.submitAssignment(
      assignmentId,
      createSubmissionDto,
      user,
      file,
    );
  }

  @Patch(':id/submit')
  @UseGuards(RolesGuard)
  @Roles(UserRole.STUDENT)
  @UseInterceptors(FileInterceptor('file', {
    dest: './uploads',
    limits: {
      fileSize: 100 * 1024 * 1024, // 100MB max file size
    },
  }))
  updateSubmission(
    @Param('id', ParseUUIDPipe) assignmentId: string,
    @Body() updateSubmissionDto: UpdateSubmissionDto,
    @UploadedFile() file: Express.Multer.File,
    @GetUser() user: User,
  ) {
    return this.assignmentsService.updateSubmission(
      assignmentId,
      updateSubmissionDto,
      user,
      file,
    );
  }

  @Get(':id/submissions')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.LECTURER)
  getAssignmentSubmissions(
    @Param('id', ParseUUIDPipe) assignmentId: string,
    @GetUser() user: User,
  ) {
    return this.assignmentsService.getAssignmentSubmissions(assignmentId, user);
  }

  // 🎯 NEW: Get pending submissions for lecturer dashboard
  @Get('submissions/pending')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.LECTURER)
  async getPendingSubmissions(
    @Query('limit') limit: string = '10',
    @Query('courseId') courseId?: string,
    @Query('sortBy') sortBy: string = 'submittedAt',
    @Query('sortOrder') sortOrder: 'ASC' | 'DESC' = 'DESC',
    @GetUser() user: User,
  ) {
    try {
      this.logger.log(`📝 Getting pending submissions for lecturer: ${user.id}`);
      
      const params = {
        limit: parseInt(limit) || 10,
        courseId,
        sortBy,
        sortOrder,
      };
      
      const result = await this.assignmentsService.getPendingSubmissions(user, params);
      
      this.logger.log(`✅ Found ${result.data?.length || 0} pending submissions`);
      return result;
    } catch (error) {
      this.logger.error(`❌ Error getting pending submissions: ${error.message}`);
      throw error;
    }
  }

  // 🎯 NEW: Get submission detail with enhanced info
  @Get('submissions/:submissionId/detail')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.LECTURER)
  async getSubmissionDetail(
    @Param('submissionId', ParseUUIDPipe) submissionId: string,
    @GetUser() user: User,
  ) {
    try {
      this.logger.log(`🔍 Getting submission detail: ${submissionId}`);
      const result = await this.assignmentsService.getSubmissionDetail(submissionId, user);
      this.logger.log(`✅ Submission detail retrieved for: ${result.student?.fullName}`);
      return result;
    } catch (error) {
      this.logger.error(`❌ Error getting submission detail: ${error.message}`);
      throw error;
    }
  }

  // Enhanced grading endpoints
  @Post('submissions/:submissionId/grade')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.LECTURER)
  async gradeSubmission(
    @Param('submissionId', ParseUUIDPipe) submissionId: string,
    @Body() createGradeDto: CreateGradeDto,
    @GetUser() user: User,
  ) {
    try {
      // Enhanced validation for quick grading
      if (typeof createGradeDto.score !== 'number' || createGradeDto.score < 0 || createGradeDto.score > 100) {
        throw new BadRequestException('Score must be a number between 0 and 100');
      }

      this.logger.log(`🎯 Quick grading submission: ${submissionId} with score: ${createGradeDto.score}`);
      
      const result = await this.assignmentsService.gradeSubmission(
        submissionId,
        createGradeDto,
        user,
      );
      
      this.logger.log(`✅ Submission graded successfully: ${submissionId}`);
      return result;
    } catch (error) {
      this.logger.error(`❌ Error grading submission: ${error.message}`);
      throw error;
    }
  }

  // 🎯 NEW: Bulk grading for multiple submissions
  @Post('submissions/bulk-grade')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.LECTURER)
  async bulkGradeSubmissions(
    @Body() bulkGradeDto: {
      grades: Array<{
        submissionId: string;
        score: number;
        feedback?: string;
      }>;
    },
    @GetUser() user: User,
  ) {
    try {
      this.logger.log(`📊 Bulk grading ${bulkGradeDto.grades.length} submissions`);
      
      // Validate bulk data
      for (const grade of bulkGradeDto.grades) {
        if (typeof grade.score !== 'number' || grade.score < 0 || grade.score > 100) {
          throw new BadRequestException(`Invalid score for submission ${grade.submissionId}: must be between 0-100`);
        }
      }
      
      const result = await this.assignmentsService.bulkGradeSubmissions(bulkGradeDto.grades, user);
      
      this.logger.log(`✅ Bulk grading completed: ${result.success.length} success, ${result.failed.length} failed`);
      return result;
    } catch (error) {
      this.logger.error(`❌ Error in bulk grading: ${error.message}`);
      throw error;
    }
  }

  // 🎯 NEW: Save draft grade (auto-save functionality)
  @Patch('submissions/:submissionId/draft')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.LECTURER)
  async saveDraftGrade(
    @Param('submissionId', ParseUUIDPipe) submissionId: string,
    @Body() draftData: {
      score?: number;
      feedback?: string;
      isDraft: boolean;
    },
    @GetUser() user: User,
  ) {
    try {
      this.logger.log(`💾 Saving draft grade for submission: ${submissionId}`);
      
      const result = await this.assignmentsService.saveDraftGrade(submissionId, draftData, user);
      
      this.logger.log(`✅ Draft grade saved for submission: ${submissionId}`);
      return { message: 'Draft saved successfully', data: result };
    } catch (error) {
      this.logger.error(`❌ Error saving draft grade: ${error.message}`);
      throw error;
    }
  }

  // 📊 NEW: Get grading statistics for lecturer dashboard
  @Get('grading/stats')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.LECTURER)
  async getGradingStats(@GetUser() user: User) {
    try {
      this.logger.log(`📊 Getting grading statistics for lecturer: ${user.id}`);
      
      const result = await this.assignmentsService.getGradingStats(user);
      
      this.logger.log(`✅ Grading stats retrieved: ${result.totalPending} pending, ${result.totalGraded} graded`);
      return result;
    } catch (error) {
      this.logger.error(`❌ Error getting grading stats: ${error.message}`);
      throw error;
    }
  }

  // Original grade endpoints
  @Get('grades/student/:studentId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.LECTURER, UserRole.STUDENT)
  getStudentGrades(
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @GetUser() user: User,
  ) {
    return this.assignmentsService.getStudentGrades(studentId, user);
  }

  @Get('grades/my-grades')
  @UseGuards(RolesGuard)
  @Roles(UserRole.STUDENT)
  getMyGrades(@GetUser() user: User) {
    return this.assignmentsService.getStudentGrades(user.id, user);
  }
}