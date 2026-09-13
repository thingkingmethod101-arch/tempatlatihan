import { Module } from '@nestjs/common';
import { ReferenceDataService } from './reference-data.service';
import { ReferenceDataController } from './reference-data.controller';

@Module({
  providers: [ReferenceDataService],
  controllers: [ReferenceDataController],
})
export class ReferenceDataModule {}