import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Audit } from '../audit/audit.decorator';
import { ScholarshipsService } from './scholarships.service';
import { CreateProgramDto } from './dto/create-program.dto';
import { ApplyScholarshipDto } from './dto/apply.dto';
import { VerifyApplicationDto } from './dto/verify-application.dto';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class ScholarshipsController {
  constructor(private service: ScholarshipsService) {}

  @Get('scholarship-programs')
  listPrograms() {
    return this.service.listPrograms();
  }

  @Post('scholarship-programs')
  @Roles(Role.admin)
  createProgram(@Body() dto: CreateProgramDto) {
    return this.service.createProgram(dto);
  }

  @Post('scholarship-programs/:programId/apply')
  @Roles(Role.siswa)
  apply(@Param('programId') programId: string, @CurrentUser() user: any, @Body() dto: ApplyScholarshipDto) {
    return this.service.apply(programId, user.id, dto);
  }

  @Get('scholarship-programs/:programId/applications')
  @Roles(Role.admin)
  listApplicationsForProgram(@Param('programId') programId: string) {
    return this.service.listApplicationsForProgram(programId);
  }

  @Get('scholarship-applications/me')
  @Roles(Role.siswa)
  listMine(@CurrentUser() user: any) {
    return this.service.listMyApplications(user.id);
  }

  @Patch('scholarship-applications/:id/verify')
  @Roles(Role.admin)
  @Audit({ aksi: 'verifikasi_beasiswa', entityType: 'scholarship_application', prismaModel: 'scholarshipApplication' })
  verify(@Param('id') id: string, @Body() dto: VerifyApplicationDto, @CurrentUser() user: any) {
    return this.service.verify(id, dto, user.id);
  }

  // Endpoint testing/ops: memicu pengecekan reminder tanpa nunggu jadwal cron jam 08:00
  @Post('scholarship-programs/trigger-reminder-check')
  @Roles(Role.admin)
  triggerReminderCheck() {
    return this.service.runReminderCheck();
  }
}