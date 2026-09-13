import { Module } from '@nestjs/common';
import { PaymentModule } from '../payment/payment.module';
import { ReferralModule } from '../referral/referral.module';
import { ContentModule } from '../content/content.module';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';

@Module({
  imports: [PaymentModule, ReferralModule, ContentModule],
  providers: [TransactionsService],
  controllers: [TransactionsController],
  exports: [TransactionsService],
})
export class TransactionsModule {}