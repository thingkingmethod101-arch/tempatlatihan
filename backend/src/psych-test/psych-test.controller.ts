import { Body, Controller, Get, Post, Patch, UseGuards, Delete, Param } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PsychTestService } from './psych-test.service';

@Controller('psych-test')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PsychTestController {
  constructor(private service: PsychTestService) {}

  @Get('questions/admin')
  @Roles(Role.admin)
  listForAdmin() {
    return this.service.listQuestionsForAdmin();
  }

  @Post('questions')
  @Roles(Role.admin)
  createQuestion(@Body() dto: any) {
    return this.service.createQuestion(dto);
  }

  @Get('questions')
  @Roles(Role.siswa)
  listForStudent() {
    return this.service.listQuestionsForStudent();
  }

  @Post('submit')
  @Roles(Role.siswa)
  submit(@CurrentUser() user: any, @Body() body: { jawaban: Record<string, string[]> }) {
    return this.service.submit(user.id, body.jawaban);
  }

  @Get('me/latest')
  @Roles(Role.siswa)
  getLatest(@CurrentUser() user: any) {
    return this.service.getLatest(user.id);
  }

  @Delete('questions/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  deleteQuestion(@Param('id') id: string) {
    return this.service.deleteQuestion(id);
  }

  @Post('questions/bulk-upload')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  bulkUpload(@Body() data: unknown) {
    return this.service.bulkCreateQuestions(data);
  }

  @Post('upgrade')
  @Roles(Role.siswa)
  upgrade(@CurrentUser() user: any) {
    return this.service.upgradeLaporan(user.id);
  }

  @Delete('admin/reset/:userId')
  @Roles(Role.admin)
  resetGratis(@Param('userId') userId: string) {
    return this.service.resetGratisSiswa(userId);
  }

  @Get('verify/:id')
  verifyPublic(@Param('id') id: string) {
    return this.service.verifyPublic(id);
  }

  @Get('settings')
  getSettings() {
    return this.service.getSettings();
  }

  @Patch('settings')
  @Roles(Role.admin)
  updateSettings(@Body() dto: { harga: number }) {
    return this.service.updateSettings(dto.harga);
  }

  @Get('status')
  @Roles(Role.siswa)
  getStatus(@CurrentUser() user: any) {
    return this.service.getStatus(user.id);
  }

  @Get('tutor/student-result/:siswaId')
  @Roles(Role.tutor)
  getResultForTutor(@Param('siswaId') siswaId: string) {
    return this.service.getLatestForUser(siswaId);
  }

  @Get('admin/student-result/:siswaId')
  @Roles(Role.admin)
  getResultForAdmin(@Param('siswaId') siswaId: string) {
    return this.service.getLatestForUser(siswaId);
  }
}