import { Module } from '@nestjs/common';
import { EmailNotificationProcessor } from './processors/email-notification.processor';
import { NotificationService } from './services/notification.service';

@Module({
  providers: [NotificationService, EmailNotificationProcessor],
})
export class NotificationModule {}
