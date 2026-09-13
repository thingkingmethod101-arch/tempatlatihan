import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LeaderboardService } from './leaderboard.service';

@Controller('events')
@UseGuards(JwtAuthGuard)
export class LeaderboardController {
  constructor(private service: LeaderboardService) {}

  @Get(':eventId/leaderboard')
  getLeaderboard(@Param('eventId') eventId: string) {
    return this.service.getLeaderboard(eventId);
  }
}