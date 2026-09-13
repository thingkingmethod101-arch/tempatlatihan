import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TalentService } from './talent.service';
import { TalentController } from './talent.controller';
import { TalentRecomputeScheduler } from './talent-recompute.scheduler';
import { TalentRecomputeProcessor } from './talent-recompute.processor';

@Module({
  imports: [BullModule.registerQueue({ name: 'talent-recompute' })],
  providers: [TalentService, TalentRecomputeScheduler, TalentRecomputeProcessor],
  controllers: [TalentController],
  exports: [TalentService],
})
export class TalentModule {}