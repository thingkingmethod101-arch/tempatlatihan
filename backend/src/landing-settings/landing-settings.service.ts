import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { STORAGE_ADAPTER } from '../storage/storage.module';
import type { StorageAdapter } from '../storage/storage-adapter.interface';

@Injectable()
export class LandingSettingsService {
  constructor(
    private prisma: PrismaService,
    @Inject(STORAGE_ADAPTER) private storage: StorageAdapter,
  ) {}

  private async resolveUrl(fileAssetId: string | null | undefined): Promise<string | null> {
    if (!fileAssetId) return null;
    const fileAsset = await this.prisma.fileAsset.findUnique({ where: { id: fileAssetId } });
    if (!fileAsset) return null;
    const signed = await this.storage.getSignedUrl(fileAsset.path, 604800);
    return signed.available ? (signed.url ?? null) : null;
  }

  async get() {
    const settings = await this.prisma.landingSettings.findUnique({ where: { id: 'singleton' } });
    return {
      heroImageUrl: await this.resolveUrl(settings?.heroImageId),
      testImageUrl: await this.resolveUrl(settings?.testImageId),
      galleryImageUrl: await this.resolveUrl(settings?.galleryImageId),
    };
  }

  async update(dto: { heroImageId?: string; testImageId?: string; galleryImageId?: string }) {
    return this.prisma.landingSettings.upsert({
      where: { id: 'singleton' },
      update: dto,
      create: { id: 'singleton', ...dto },
    });
  }
}