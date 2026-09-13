import { Module } from '@nestjs/common';
import { NotificationModule } from '../notification/notification.module';
import { LeaderboardModule } from '../leaderboard/leaderboard.module';
import { CertificatesModule } from '../certificates/certificates.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { ChallengeService } from './challenge.service';
import { ChallengeController } from './challenge.controller';
import { EventSessionsModule } from '../event-sessions/event-sessions.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [NotificationModule, LeaderboardModule, CertificatesModule, TransactionsModule, EventSessionsModule, StorageModule],
  providers: [ChallengeService],
  controllers: [ChallengeController],
})
export class ChallengeModule {}