import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { NotificationModule } from '../notification/notification.module';
import { ScholarshipsService } from './scholarships.service';
import { ScholarshipsController } from './scholarships.controller';
import { ScholarshipReminderScheduler } from './scholarship-reminder.scheduler';
import { ScholarshipReminderProcessor } from './scholarship-reminder.processor';

@Module({
  imports: [BullModule.registerQueue({ name: 'scholarship-reminder' }), NotificationModule],
  providers: [ScholarshipsService, ScholarshipReminderScheduler, ScholarshipReminderProcessor],
  controllers: [ScholarshipsController],
})
export class ScholarshipsModule {}