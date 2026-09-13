import { Body, Controller, Get, Post, UseGuards, ForbiddenException, Param } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { TalentService } from './talent.service';
import { CreateCareerMappingDto } from './dto/create-career-mapping.dto';
import { SubmitLearningStyleDto } from './dto/submit-learning-style.dto';


@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class TalentController {
  constructor(private service: TalentService) {}

  @Get('talent/me')
  @Roles(Role.siswa)
  getMySummary(@CurrentUser() user: any) {
    return this.service.getMySummary(user.id);
  }

  @Post('talent/career-mappings')
  @Roles(Role.admin)
  createCareerMapping(@Body() dto: CreateCareerMappingDto) {
    return this.service.createCareerMapping(dto);
  }

  @Get('talent/career-mappings')
  @Roles(Role.admin)
  listCareerMappings() {
    return this.service.listCareerMappings();
  }

  @Post('learning-style-surveys')
  @Roles(Role.siswa)
  submitLearningStyle(@CurrentUser() user: any, @Body() dto: SubmitLearningStyleDto) {
    return this.service.submitLearningStyle(user.id, dto);
  }

  @Get('learning-style-surveys/me')
  @Roles(Role.siswa)
  listMyLearningStyle(@CurrentUser() user: any) {
    return this.service.listMyLearningStyle(user.id);
  }

  // Endpoint testing/ops: memicu recompute tanpa nunggu jadwal cron nightly
  @Post('talent/trigger-recompute')
  @Roles(Role.admin)
  triggerRecompute() {
    return this.service.recomputeTalentSummary();
  }

  @Get('talent/tutor/my-students')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.tutor)
  listMyStudents(@CurrentUser() user: any) {
    return this.service.listLinkedStudents(user.id);
  }

  @Get('talent/tutor/student-report/:siswaId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.tutor)
  async getStudentReport(@Param('siswaId') siswaId: string, @CurrentUser() user: any) {
    const linked = await this.service.listLinkedStudents(user.id);
    if (!linked.some((s) => s.id === siswaId)) {
      throw new ForbiddenException('Siswa ini bukan bagian dari daftar siswamu');
    }
    return this.service.getMySummary(siswaId);
  }

  @Post('talent/admin/link-students')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  linkStudents(@Body() dto: { tutorKontak: string; siswaKontakList: string[] }) {
    return this.service.linkStudentsToTutor(dto.tutorKontak, dto.siswaKontakList);
  }

  @Get('talent/admin/student-report/:siswaId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  getStudentReportAdmin(@Param('siswaId') siswaId: string) {
    return this.service.getMySummary(siswaId);
  }

}