import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ParentLinksModule } from './parent-links/parent-links.module';
import { AuditModule } from './audit/audit.module';
import { TutorProfilesModule } from './tutor-profiles/tutor-profiles.module';
import { FilesModule } from './files/files.module';
import { ReferenceDataModule } from './reference-data/reference-data.module';
import { QuestionsModule } from './questions/questions.module';
import { EventsModule } from './events/events.module';
import { ChallengeModule } from './challenge/challenge.module';
import { BullModule } from '@nestjs/bullmq';
import { NotificationModule } from './notification/notification.module';
import { ContentModule } from './content/content.module';
import { TransactionsModule } from './transactions/transactions.module';
import { ScholarshipsModule } from './scholarships/scholarships.module';
import { TalentModule } from './talent/talent.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { CertificatesModule } from './certificates/certificates.module';
import { AnnouncementsModule } from './announcements/announcements.module';
import { StudySessionsModule } from './study-sessions/study-sessions.module';
import { RoyaltiesModule } from './royalties/royalties.module';
import { UsersModule } from './users/users.module';
import { PaymentSettingsModule } from './payment-settings/payment-settings.module';
import { PsychTestModule } from './psych-test/psych-test.module';
import { EventSessionsModule } from './event-sessions/event-sessions.module';
import { LedgerModule } from './ledger/ledger.module';
import { ScheduleModule } from '@nestjs/schedule';
import { MaintenanceModule } from './maintenance/maintenance.module';
import { BeritaModule } from './berita/berita.module';
import { LandingSettingsModule } from './landing-settings/landing-settings.module';
import { ReferralModule } from './referral/referral.module';

const redisUrl = new URL(process.env.REDIS_URL ?? 'redis://localhost:6379');

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    ParentLinksModule,
    AuditModule,
    TutorProfilesModule,
    FilesModule,
    ReferenceDataModule,
    QuestionsModule,
    EventsModule,
    ChallengeModule,
    BullModule.forRoot({
      connection: {
        host: redisUrl.hostname,
        port: Number(redisUrl.port) || 6379,
        maxRetriesPerRequest: null,
      },
    }),
    NotificationModule,
    ContentModule,
    TransactionsModule,
    ScholarshipsModule,
    TalentModule,
    LeaderboardModule,
    CertificatesModule,
    AnnouncementsModule,
    StudySessionsModule,
    RoyaltiesModule,
    UsersModule,
    PaymentSettingsModule,
    PsychTestModule,
    EventSessionsModule,
    LedgerModule,
    ScheduleModule.forRoot(),
    MaintenanceModule,
    BeritaModule,
    LandingSettingsModule,
    ReferralModule,
  ],
  controllers: [AppController],
})
export class AppModule {}