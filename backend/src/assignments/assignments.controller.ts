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

  // ✅ FIX: Submission endpoints with file upload support
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

  // Grading endpoints
  @Post('submissions/:submissionId/grade')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.LECTURER)
  gradeSubmission(
    @Param('submissionId', ParseUUIDPipe) submissionId: string,
    @Body() createGradeDto: CreateGradeDto,
    @GetUser() user: User,
  ) {
    return this.assignmentsService.gradeSubmission(
      submissionId,
      createGradeDto,
      user,
    );
  }

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
