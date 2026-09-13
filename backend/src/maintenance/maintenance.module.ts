import { Module } from '@nestjs/common';
import { StorageModule } from '../storage/storage.module';
import { MaintenanceService } from './maintenance.service';
import { MaintenanceCronService } from './maintenance-cron.service';
import { MaintenanceController } from './maintenance.controller';

@Module({
  imports: [StorageModule],
  providers: [MaintenanceService, MaintenanceCronService],
  controllers: [MaintenanceController],
})
export class MaintenanceModule {}