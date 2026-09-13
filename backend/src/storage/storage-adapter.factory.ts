import { ConfigService } from '@nestjs/config';
import { StorageAdapter } from './storage-adapter.interface';
import { NotConfiguredStorageAdapter } from './not-configured-storage.adapter';
import { S3CompatibleStorageAdapter } from './s3-compatible-storage.adapter';

export function storageAdapterFactory(config: ConfigService): StorageAdapter {
  const provider = config.get<string>('STORAGE_PROVIDER');
  if (provider === 'r2' || provider === 's3' || provider === 'minio') {
    return new S3CompatibleStorageAdapter(config);
  }
  return new NotConfiguredStorageAdapter();
}