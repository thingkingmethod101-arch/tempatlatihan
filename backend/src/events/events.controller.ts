import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Audit } from '../audit/audit.decorator';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateScoringConfigDto } from './dto/update-scoring-config.dto';
import { CreateEventRoundDto } from './dto/create-event-round.dto';
import { AddQuestionToPoolDto } from './dto/add-question-to-pool.dto';

@Controller()
export class EventsController {
  constructor(private service: EventsService) {}

  @Get('events')
  listPublished() {
    return this.service.listPublished();
  }

  @Get('events/admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  listAllAdmin() {
    return this.service.listAll();
  }

  @Get('events/:id')
  @UseGuards(OptionalJwtAuthGuard)
  detail(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.detail(id, user);
  }

  @Post('events')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  create(@Body() dto: CreateEventDto) {
    return this.service.create(dto);
  }

  @Patch('events/:id/publish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  publish(@Param('id') id: string) {
    return this.service.publish(id);
  }

  @Patch('events/:id/scoring-config')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  @Audit({ aksi: 'ubah_scoring_config', entityType: 'event', prismaModel: 'event' })
  updateScoringConfig(@Param('id') id: string, @Body() dto: UpdateScoringConfigDto) {
    return this.service.updateScoringConfig(id, dto);
  }

  @Post('events/:eventId/rounds')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  createRound(@Param('eventId') eventId: string, @Body() dto: CreateEventRoundDto) {
    return this.service.createRound(eventId, dto);
  }

  @Get('event-rounds/:roundId/questions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin, Role.tutor)
  listPoolForRound(@Param('roundId') roundId: string) {
    return this.service.listPoolForRound(roundId);
  }

  @Post('event-rounds/:roundId/questions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin, Role.tutor)
  @Audit({ aksi: 'kurasi_soal', entityType: 'event_question_pool', prismaModel: 'eventQuestionPool' })
  addQuestionToPool(
    @Param('roundId') roundId: string,
    @Body() dto: AddQuestionToPoolDto,
    @CurrentUser() user: any,
  ) {
    return this.service.addQuestionToPool(roundId, dto, user.id);
  }

  @Get('event-rounds/:roundId/attempts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  listAttemptsForRound(@Param('roundId') roundId: string) {
    return this.service.listAttemptsForRound(roundId);
  }

  @Post('event-rounds/:roundId/unlock-attempt/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  @Audit({ aksi: 'buka_kunci_attempt', entityType: 'attempt_unlock', prismaModel: 'attemptUnlock' })
  unlockAttempt(
    @Param('roundId') roundId: string,
    @Param('userId') userId: string,
    @CurrentUser() admin: any,
  ) {
    return this.service.unlockAttempt(roundId, userId, admin.id);
  }

  @Patch('events/:id/grup-wa')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  updateGrupWa(@Param('id') id: string, @Body() body: { grupWaLink: string }) {
    return this.service.updateGrupWaLink(id, body.grupWaLink);
  }
}