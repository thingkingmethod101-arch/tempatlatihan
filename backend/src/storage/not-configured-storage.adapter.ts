import { StorageAdapter, UploadUrlResult, SignedUrlResult } from './storage-adapter.interface';

export class NotConfiguredStorageAdapter implements StorageAdapter {
  async getUploadUrl(): Promise<UploadUrlResult> {
    return { available: false, message: 'Penyimpanan file belum dikonfigurasi' };
  }
  async getSignedUrl(): Promise<SignedUrlResult> {
    return { available: false, message: 'Penyimpanan file belum dikonfigurasi' };
  }
  async deleteObject(): Promise<void> {
    // no-op
  }
  async uploadBuffer(): Promise<void> {
    // no-op
  }

}