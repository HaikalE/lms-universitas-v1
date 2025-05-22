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
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { QueryNotificationsDto } from './dto/query-notifications.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User, UserRole } from '../entities/user.entity';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  create(@Body() createNotificationDto: CreateNotificationDto, @GetUser() user: User) {
    return this.notificationsService.create(createNotificationDto, user);
  }

  @Get('my-notifications')
  getMyNotifications(@Query() queryDto: QueryNotificationsDto, @GetUser() user: User) {
    return this.notificationsService.getMyNotifications(user, queryDto);
  }

  @Get('unread-count')
  getMyUnreadCount(@GetUser() user: User) {
    return this.notificationsService.getMyUnreadCount(user);
  }

  @Patch(':id/read')
  markAsRead(@Param('id', ParseUUIDPipe) id: string, @GetUser() user: User) {
    return this.notificationsService.markAsRead(id, user);
  }

  @Patch('mark-all-read')
  markAllAsRead(@GetUser() user: User) {
    return this.notificationsService.markAllAsRead(user);
  }

  @Delete(':id')
  deleteNotification(@Param('id', ParseUUIDPipe) id: string, @GetUser() user: User) {
    return this.notificationsService.deleteNotification(id, user);
  }

  @Delete('cleanup/old')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  deleteOldNotifications() {
    return this.notificationsService.deleteOldNotifications();
  }
}
