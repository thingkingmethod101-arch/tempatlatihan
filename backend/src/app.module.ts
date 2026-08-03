import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ParentLinksModule } from './parent-links/parent-links.module';
import { AuditModule } from './audit/audit.module';
import { TutorProfilesModule } from './tutor-profiles/tutor-profiles.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    ParentLinksModule,
    AuditModule,
    TutorProfilesModule,
  ],
  controllers: [AppController],
})
export class AppModule {}