import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class TalentRecomputeScheduler implements OnModuleInit {
  constructor(@InjectQueue('talent-recompute') private queue: Queue) {}

  async onModuleInit() {
    await this.queue.add(
      'recompute',
      {},
      {
        repeat: { pattern: '0 2 * * *' }, // tiap hari jam 02:00 dini hari
        jobId: 'talent-recompute-nightly',
      },
    );
  }
}