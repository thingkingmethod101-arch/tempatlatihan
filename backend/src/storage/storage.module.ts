import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { storageAdapterFactory } from './storage-adapter.factory';

export const STORAGE_ADAPTER = 'STORAGE_ADAPTER';

@Module({
  providers: [
    {
      provide: STORAGE_ADAPTER,
      useFactory: (config: ConfigService) => storageAdapterFactory(config),
      inject: [ConfigService],
    },
  ],
  exports: [STORAGE_ADAPTER],
})
export class StorageModule {}