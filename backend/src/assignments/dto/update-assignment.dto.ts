import { PartialType } from '@nestjs/mapped-types';
import { CreateAssignmentDto } from './create-assignment.dto';
import { IsOptional } from 'class-validator';

export class UpdateAssignmentDto extends PartialType(CreateAssignmentDto) {
  @IsOptional()
  courseId?: string;
}
