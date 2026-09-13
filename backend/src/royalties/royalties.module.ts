import { Module } from '@nestjs/common';
import { RoyaltiesService } from './royalties.service';
import { RoyaltiesController } from './royalties.controller';

@Module({
  providers: [RoyaltiesService],
  controllers: [RoyaltiesController],
})
export class RoyaltiesModule {}