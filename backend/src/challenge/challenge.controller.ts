import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ChallengeService } from './challenge.service';
import { SubmitAnswerDto } from './dto/submit-answer.dto';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class ChallengeController {
  constructor(private service: ChallengeService) {}

  @Post('events/:eventId/register')
  @Roles(Role.siswa)
  register(
    @Param('eventId') eventId: string,
    @CurrentUser() user: any,
    @Body() dto: { alamatPengiriman: string; asalSekolahSaatDaftar: string; kelasSaatDaftar: string },
  ) {
    return this.service.register(eventId, user.id, dto);
  }

  @Post('event-rounds/:roundId/attempts/start')
  @Roles(Role.siswa)
  start(@Param('roundId') roundId: string, @CurrentUser() user: any) {
    return this.service.startAttempt(roundId, user.id);
  }

  @Post('event-attempts/:attemptId/submit-answer')
  @Roles(Role.siswa)
  submitAnswer(@Param('attemptId') attemptId: string, @Body() dto: SubmitAnswerDto, @CurrentUser() user: any) {
    return this.service.submitAnswer(attemptId, user.id, dto);
  }

  @Post('event-attempts/:attemptId/finish')
  @Roles(Role.siswa)
  finish(@Param('attemptId') attemptId: string, @CurrentUser() user: any) {
    return this.service.finish(attemptId, user.id);
  }

  @Get('event-attempts/:attemptId/result')
  @Roles(Role.siswa)
  result(@Param('attemptId') attemptId: string, @CurrentUser() user: any) {
    return this.service.result(attemptId, user.id);
  }

  @Get('event-rounds/unlocks/me')
  @Roles(Role.siswa)
  listMyUnlocks(@CurrentUser() user: any) {
    return this.service.listMyUnlocks(user.id);
  }

  @Get('event-rounds/:roundId/payment-status')
  @Roles(Role.siswa)
  paymentStatus(@Param('roundId') roundId: string, @CurrentUser() user: any) {
    return this.service.getRoundPaymentStatus(roundId, user.id);
  }

  @Post('event-rounds/:roundId/pay')
  @Roles(Role.siswa)
  pay(@Param('roundId') roundId: string, @CurrentUser() user: any) {
    return this.service.payForRound(roundId, user.id);
  }

  @Get('event-rounds/:roundId/access-status')
  @Roles(Role.siswa)
  accessStatus(@Param('roundId') roundId: string, @CurrentUser() user: any) {
    return this.service.getAccessStatus(roundId, user.id);
  }

  @Get('events/:eventId/my-registration')
  @Roles(Role.siswa)
  myRegistration(@Param('eventId') eventId: string, @CurrentUser() user: any) {
    return this.service.getMyRegistration(eventId, user.id);
  }

  @Get('events/mine/registered')
  @Roles(Role.siswa)
  myRegisteredEvents(@CurrentUser() user: any) {
    return this.service.listMyRegisteredEvents(user.id);
  }

  @Get('events/mine/history')
  @Roles(Role.siswa)
  myEventHistory(@CurrentUser() user: any) {
    return this.service.listMyEventHistory(user.id);
  }

  @Post('event-rounds/:roundId/finalize-ranking')
  @Roles(Role.admin)
  finalizeRanking(@Param('roundId') roundId: string) {
    return this.service.generateRankingJuara(roundId);
  }
}