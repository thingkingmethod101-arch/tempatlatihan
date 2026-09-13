import { Module } from '@nestjs/common';
import { StudySessionsService } from './study-sessions.service';
import { StudySessionsController } from './study-sessions.controller';

@Module({
  providers: [StudySessionsService],
  controllers: [StudySessionsController],
})
export class StudySessionsModule {}