import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LeaderboardService {
  constructor(private prisma: PrismaService) {}

  async regenerateForEvent(eventId: string) {
    const rounds = await this.prisma.eventRound.findMany({ where: { eventId }, select: { id: true } });
    const roundIds = rounds.map((r) => r.id);

    const attempts = await this.prisma.eventAttempt.findMany({
      where: { eventRoundId: { in: roundIds }, status: 'selesai', skorFinal100: { not: null } },
    });

    const bestPerUser = new Map<string, number>();
    for (const attempt of attempts) {
      const current = bestPerUser.get(attempt.userId) ?? -1;
      if ((attempt.skorFinal100 ?? 0) > current) {
        bestPerUser.set(attempt.userId, attempt.skorFinal100 ?? 0);
      }
    }

    const ranked = [...bestPerUser.entries()].sort((a, b) => b[1] - a[1]);

    // Regenerasi total: hapus snapshot lama, buat ulang dari data terbaru
    await this.prisma.leaderboardSnapshot.deleteMany({ where: { eventId } });

    for (let i = 0; i < ranked.length; i++) {
      const [userId, skor] = ranked[i];
      await this.prisma.leaderboardSnapshot.create({ data: { eventId, userId, skor, ranking: i + 1 } });
    }

    return { totalPeserta: ranked.length };
  }

  getLeaderboard(eventId: string) {
    return this.prisma.leaderboardSnapshot.findMany({
      where: { eventId },
      orderBy: { ranking: 'asc' },
      include: { user: { select: { nama: true } } },
    });
  }
}