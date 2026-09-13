import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { MaintenanceService } from './maintenance.service';

@Injectable()
export class MaintenanceCronService {
  constructor(private maintenanceService: MaintenanceService) {}

  // Jam 3 pagi, tanggal 1, tiap 3 bulan (Jan, Apr, Jul, Okt)
  @Cron('0 3 1 1,4,7,10 *')
  async handleQuarterlyCleanup() {
    await this.maintenanceService.runAll();
  }
}