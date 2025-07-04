import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ForumsController } from './forums.controller';
import { ForumsService } from './forums.service';
import { 
  ForumPost, 
  ForumLike, 
  ForumAttachment, 
  ForumNotification,
  Course,
  User
} from '../entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ForumPost,
      ForumLike,
      ForumAttachment,
      ForumNotification,
      Course,
      User,
    ]),
  ],
  controllers: [ForumsController],
  providers: [ForumsService],
  exports: [ForumsService],
})
export class ForumsModule {}
