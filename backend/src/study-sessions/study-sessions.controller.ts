import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { StudySessionsService } from './study-sessions.service';
import { StartSessionDto } from './dto/start-session.dto';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class StudySessionsController {
  constructor(private service: StudySessionsService) {}

  @Post('study-sessions/start')
  @Roles(Role.siswa)
  start(@CurrentUser() user: any, @Body() dto: StartSessionDto) {
    return this.service.start(user.id, dto);
  }

  @Patch('study-sessions/:id/complete-cycle')
  @Roles(Role.siswa)
  completeCycle(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.completeCycle(id, user.id);
  }

  @Patch('study-sessions/:id/end')
  @Roles(Role.siswa)
  end(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.end(id, user.id);
  }

  @Get('study-sessions/me')
  @Roles(Role.siswa)
  listMine(@CurrentUser() user: any) {
    return this.service.listMine(user.id);
  }

  @Get('pomodoro-settings')
  getPomodoroSettings() {
    return this.service.getPomodoroSettings();
  }

  @Patch('pomodoro-settings')
  @Roles(Role.admin)
  updatePomodoroSettings(
    @Body() data: { siklusSebelumIstirahatPanjang?: number; durasiIstirahatPanjangMenit?: number },
  ) {
    return this.service.updatePomodoroSettings(data);
  }
}