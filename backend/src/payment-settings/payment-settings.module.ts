import { Module } from '@nestjs/common';
import { PaymentSettingsService } from './payment-settings.service';
import { PaymentSettingsController } from './payment-settings.controller';

@Module({
  providers: [PaymentSettingsService],
  controllers: [PaymentSettingsController],
})
export class PaymentSettingsModule {}