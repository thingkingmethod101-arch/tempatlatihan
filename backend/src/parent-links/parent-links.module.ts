import { Module } from '@nestjs/common';
import { TalentModule } from '../talent/talent.module';
import { CertificatesModule } from '../certificates/certificates.module';
import { ParentLinksService } from './parent-links.service';
import { ParentLinksController } from './parent-links.controller';

@Module({
  imports: [TalentModule, CertificatesModule],
  providers: [ParentLinksService],
  controllers: [ParentLinksController],
})
export class ParentLinksModule {}