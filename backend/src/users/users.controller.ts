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
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { EnrollmentDto } from './dto/enrollment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User, UserRole } from '../entities/user.entity';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  findAll(@Query() queryDto: QueryUsersDto) {
    return this.usersService.findAll(queryDto);
  }

  @Get('students')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.LECTURER)
  findStudents(@Query() queryDto: QueryUsersDto) {
    return this.usersService.findAll({ ...queryDto, role: UserRole.STUDENT });
  }

  @Get('lecturers')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  findLecturers(@Query() queryDto: QueryUsersDto) {
    return this.usersService.findAll({ ...queryDto, role: UserRole.LECTURER });
  }

  @Get('my-courses')
  getMyCourses(@GetUser() user: User) {
    if (user.role === UserRole.STUDENT) {
      return this.usersService.getStudentCourses(user.id);
    } else if (user.role === UserRole.LECTURER) {
      return this.usersService.getLecturerCourses(user.id);
    }
    return [];
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.LECTURER)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.remove(id);
  }

  @Post(':studentId/enroll')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  enrollStudent(
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @Body() enrollmentDto: EnrollmentDto,
  ) {
    return this.usersService.enrollStudentToCourse(
      studentId,
      enrollmentDto.courseId,
    );
  }

  @Delete(':studentId/enroll/:courseId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  unenrollStudent(
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @Param('courseId', ParseUUIDPipe) courseId: string,
  ) {
    return this.usersService.unenrollStudentFromCourse(studentId, courseId);
  }

  @Get(':studentId/courses')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.LECTURER)
  getStudentCourses(@Param('studentId', ParseUUIDPipe) studentId: string) {
    return this.usersService.getStudentCourses(studentId);
  }

  @Get(':lecturerId/lecturer-courses')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  getLecturerCourses(@Param('lecturerId', ParseUUIDPipe) lecturerId: string) {
    return this.usersService.getLecturerCourses(lecturerId);
  }
}
