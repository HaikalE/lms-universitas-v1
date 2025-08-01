import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationGateway } from './websocket.gateway';
import { NotificationsModule } from '../notifications/notifications.module';
import { Notification } from '../entities/notification.entity';
import { User } from '../entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, User]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '7d' },
    }),
    NotificationsModule,
  ],
  providers: [NotificationGateway],
  exports: [NotificationGateway],
})
export class WebSocketModule {}
