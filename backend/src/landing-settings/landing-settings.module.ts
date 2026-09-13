import { Module } from '@nestjs/common';
import { StorageModule } from '../storage/storage.module';
import { LandingSettingsService } from './landing-settings.service';
import { LandingSettingsController } from './landing-settings.controller';

@Module({
  imports: [StorageModule],
  providers: [LandingSettingsService],
  controllers: [LandingSettingsController],
})
export class LandingSettingsModule {}