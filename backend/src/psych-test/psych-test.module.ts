import { Module } from '@nestjs/common';
import { TalentModule } from '../talent/talent.module';
import { PsychTestService } from './psych-test.service';
import { PsychTestController } from './psych-test.controller';
import { RiasecMappingModule } from '../riasec-mapping/riasec-mapping.module';

@Module({
  imports: [RiasecMappingModule, TalentModule],
  providers: [PsychTestService],
  controllers: [PsychTestController],
})
export class PsychTestModule {}