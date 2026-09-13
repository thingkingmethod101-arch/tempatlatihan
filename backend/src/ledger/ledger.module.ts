import { Module } from '@nestjs/common';
import { StorageModule } from '../storage/storage.module';
import { LedgerService } from './ledger.service';
import { LedgerController } from './ledger.controller';

@Module({
  imports: [StorageModule],
  providers: [LedgerService],
  controllers: [LedgerController],
})
export class LedgerModule {}