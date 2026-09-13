import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class ScholarshipReminderScheduler implements OnModuleInit {
  constructor(@InjectQueue('scholarship-reminder') private queue: Queue) {}

  async onModuleInit() {
    await this.queue.add(
      'check-reminders',
      {},
      {
        repeat: { pattern: '0 8 * * *' }, // tiap hari jam 08:00
        jobId: 'scholarship-reminder-daily',
      },
    );
  }
}