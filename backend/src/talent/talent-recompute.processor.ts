import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { TalentService } from './talent.service';

@Processor('talent-recompute')
export class TalentRecomputeProcessor extends WorkerHost {
  constructor(private service: TalentService) {
    super();
  }

  async process(job: Job) {
    return this.service.recomputeTalentSummary();
  }
}