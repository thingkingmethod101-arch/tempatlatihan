import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { NotificationService } from './notification.service';
import { NotificationProcessor } from './notification.processor';
import { NotificationTemplatesService } from './notification-templates.service';
import { NotificationTemplatesController } from './notification-templates.controller';

@Module({
  imports: [BullModule.registerQueue({ name: 'notification-dispatch' })],
  providers: [NotificationService, NotificationProcessor, NotificationTemplatesService],
  controllers: [NotificationTemplatesController],
  exports: [NotificationService],
})
export class NotificationModule {}