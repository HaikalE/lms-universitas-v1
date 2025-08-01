import { Module, OnModuleInit } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationGateway } from './websocket.gateway';
import { NotificationsModule } from '../notifications/notifications.module';
import { NotificationsService } from '../notifications/notifications.service';
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
  providers: [
    NotificationGateway,
    {
      provide: 'NOTIFICATION_GATEWAY_INJECTION',
      useFactory: (gateway: NotificationGateway, service: NotificationsService) => {
        // Inject gateway into service to avoid circular dependency
        service.setNotificationGateway(gateway);
        return true;
      },
      inject: [NotificationGateway, NotificationsService],
    },
  ],
  exports: [NotificationGateway],
})
export class WebSocketModule implements OnModuleInit {
  constructor(
    private readonly notificationGateway: NotificationGateway,
    private readonly notificationsService: NotificationsService,
  ) {}

  onModuleInit() {
    // Ensure the gateway is properly injected into the service
    this.notificationsService.setNotificationGateway(this.notificationGateway);
  }
}
