import { Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { MaintenanceService } from './maintenance.service';

@Controller('maintenance')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.admin)
export class MaintenanceController {
  constructor(private service: MaintenanceService) {}

  @Post('run-cleanup')
  runCleanup() {
    return this.service.runAll();
  }

  @Get('export')
  async exportData(@Res() res: Response) {
    const data = await this.service.exportAll();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="backup-${new Date().toISOString().slice(0, 10)}.json"`);
    res.send(JSON.stringify(data, null, 2));
  }

  @Post('reset-database')
  resetDatabase() {
    return this.service.resetDatabase();
  }
}