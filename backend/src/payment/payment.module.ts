import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { paymentAdapterFactory } from './payment-adapter.factory';

export const PAYMENT_ADAPTER = 'PAYMENT_ADAPTER';

@Module({
  providers: [
    {
      provide: PAYMENT_ADAPTER,
      useFactory: (config: ConfigService) => paymentAdapterFactory(config),
      inject: [ConfigService],
    },
  ],
  exports: [PAYMENT_ADAPTER],
})
export class PaymentModule {}