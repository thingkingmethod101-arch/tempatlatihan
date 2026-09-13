import { Module } from '@nestjs/common';
import { TutorProfilesService } from './tutor-profiles.service';
import { TutorProfilesController } from './tutor-profiles.controller';
import { StorageModule } from '../storage/storage.module';

@Module({
  providers: [TutorProfilesService],
  controllers: [TutorProfilesController],
  imports: [StorageModule],
})
export class TutorProfilesModule {}