import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ScholarshipsService } from './scholarships.service';

@Processor('scholarship-reminder')
export class ScholarshipReminderProcessor extends WorkerHost {
  constructor(private service: ScholarshipsService) {
    super();
  }

  async process(job: Job) {
    return this.service.runReminderCheck();
  }
}