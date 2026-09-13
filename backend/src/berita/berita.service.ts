import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { STORAGE_ADAPTER } from '../storage/storage.module';
import type { StorageAdapter } from '../storage/storage-adapter.interface';

@Injectable()
export class BeritaService {
  constructor(
    private prisma: PrismaService,
    @Inject(STORAGE_ADAPTER) private storage: StorageAdapter,
  ) {}

  private async resolveGambar(fileAssetId: string | null): Promise<string | null> {
    if (!fileAssetId) return null;
    const fileAsset = await this.prisma.fileAsset.findUnique({ where: { id: fileAssetId } });
    if (!fileAsset) return null;
    const signed = await this.storage.getSignedUrl(fileAsset.path, 604800);
    return signed.available ? (signed.url ?? null) : null;
  }

  async list() {
    const items = await this.prisma.berita.findMany({ orderBy: { createdAt: 'desc' } });
    return Promise.all(
      items.map(async (b) => ({ ...b, gambarUrl: await this.resolveGambar(b.gambarFileAssetId) })),
    );
  }

  async detail(id: string) {
    const item = await this.prisma.berita.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Berita tidak ditemukan');
    return { ...item, gambarUrl: await this.resolveGambar(item.gambarFileAssetId) };
  }

  create(dto: { judul: string; tag?: string; isi: string; gambarFileAssetId?: string }) {
    return this.prisma.berita.create({ data: dto });
  }

  update(id: string, dto: { judul?: string; tag?: string; isi?: string; gambarFileAssetId?: string }) {
    return this.prisma.berita.update({ where: { id }, data: dto });
  }

  async delete(id: string) {
    await this.prisma.berita.delete({ where: { id } });
    return { deleted: true };
  }
}