import { Module } from '@nestjs/common';
import { TutorProfilesService } from './tutor-profiles.service';
import { TutorProfilesController } from './tutor-profiles.controller';

@Module({
  providers: [TutorProfilesService],
  controllers: [TutorProfilesController],
})
export class TutorProfilesModule {}