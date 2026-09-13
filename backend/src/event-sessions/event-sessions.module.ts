import { Module } from '@nestjs/common';
import { EventSessionsService } from './event-sessions.service';
import { EventSessionsController } from './event-sessions.controller';

@Module({
  providers: [EventSessionsService],
  controllers: [EventSessionsController],
  exports: [EventSessionsService],
})
export class EventSessionsModule {}