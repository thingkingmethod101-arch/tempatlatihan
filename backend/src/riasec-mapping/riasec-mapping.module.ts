import { Module } from '@nestjs/common';
import { RiasecMappingService } from './riasec-mapping.service';
import { RiasecMappingController } from './riasec-mapping.controller';

@Module({
  providers: [RiasecMappingService],
  controllers: [RiasecMappingController],
  exports: [RiasecMappingService],
})
export class RiasecMappingModule {}