import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ConfigService } from '@nestjs/config';
import { StorageAdapter, UploadUrlResult, SignedUrlResult } from './storage-adapter.interface';

export class S3CompatibleStorageAdapter implements StorageAdapter {
  private client: S3Client;
  private bucket: string;

  constructor(config: ConfigService) {
    this.bucket = config.get<string>('STORAGE_BUCKET')!;
    this.client = new S3Client({
      region: config.get<string>('STORAGE_REGION') || 'auto',
      endpoint: config.get<string>('STORAGE_ENDPOINT'),
      forcePathStyle: config.get<string>('STORAGE_FORCE_PATH_STYLE') === 'true',
      credentials: {
        accessKeyId: config.get<string>('STORAGE_ACCESS_KEY_ID')!,
        secretAccessKey: config.get<string>('STORAGE_SECRET_ACCESS_KEY')!,
      },
    });
  }

  async getUploadUrl(path: string, mimeType: string): Promise<UploadUrlResult> {
    try {
      const command = new PutObjectCommand({ Bucket: this.bucket, Key: path, ContentType: mimeType });
      const uploadUrl = await getSignedUrl(this.client, command, { expiresIn: 300 });
      console.log("UPLOAD URL:");
      console.log(uploadUrl);
      return { available: true, uploadUrl, path };
    } catch (err: any) {
      return { available: false, message: `Gagal membuat upload URL: ${err.message}` };
    }
  }

  async getSignedUrl(path: string, expiresInSeconds: number): Promise<SignedUrlResult> {
    try {
      const command = new GetObjectCommand({ Bucket: this.bucket, Key: path });
      const url = await getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
      return { available: true, url };
    } catch (err: any) {
      return { available: false, message: `Gagal membuat signed URL: ${err.message}` };
    }
  }

  async deleteObject(path: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: path }));
  }

  async uploadBuffer(path: string, buffer: Buffer, mimeType: string): Promise<void> {
    await this.client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: path,
      Body: buffer,
      ContentType: mimeType,
    }));
  }
}