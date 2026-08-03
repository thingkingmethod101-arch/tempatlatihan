import { Module } from '@nestjs/common';
import { ParentLinksService } from './parent-links.service';
import { ParentLinksController } from './parent-links.controller';

@Module({
  providers: [ParentLinksService],
  controllers: [ParentLinksController],
})
export class ParentLinksModule {}