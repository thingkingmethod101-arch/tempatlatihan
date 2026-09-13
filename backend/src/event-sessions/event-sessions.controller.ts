import { Body, Controller, Delete, Get, Param, Post, UseGuards, Patch } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { EventSessionsService } from './event-sessions.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.admin)
export class EventSessionsController {
  constructor(private service: EventSessionsService) {}

  @Post('event-rounds/:roundId/sessions')
  create(@Param('roundId') roundId: string, @Body() dto: { waktuMulai: string; waktuSelesai: string; kuota: number }) {
    return this.service.createSession(roundId, dto);
  }

  @Get('event-rounds/:roundId/sessions')
  list(@Param('roundId') roundId: string) {
    return this.service.listSessionsForRound(roundId);
  }

  @Get('event-sessions/:sessionId/assigned')
  assigned(@Param('sessionId') sessionId: string) {
    return this.service.listAssignedForSession(sessionId);
  }

  @Get('event-rounds/:roundId/unassigned-participants')
  unassigned(@Param('roundId') roundId: string) {
    return this.service.listUnassignedParticipants(roundId);
  }

  @Post('event-sessions/:sessionId/assign')
  assign(@Param('sessionId') sessionId: string, @Body() body: { userId: string }) {
    return this.service.assignParticipant(sessionId, body.userId);
  }

  @Delete('event-sessions/:sessionId/assign/:userId')
  unassign(@Param('sessionId') sessionId: string, @Param('userId') userId: string) {
    return this.service.removeAssignment(sessionId, userId);
  }

  @Get('event-rounds/:roundId/my-session')
  @Roles(Role.siswa)
  mySession(@Param('roundId') roundId: string, @CurrentUser() user: any) {
    return this.service.getMySessionWindow(roundId, user.id);
  }

  @Patch('event-sessions/:sessionId')
  updateSession(@Param('sessionId') sessionId: string, @Body() dto: { waktuMulai?: string; waktuSelesai?: string; kuota?: number }) {
    return this.service.updateSession(sessionId, dto);
  }

  @Delete('event-sessions/:sessionId')
  deleteSession(@Param('sessionId') sessionId: string) {
    return this.service.deleteSession(sessionId);
  }
}