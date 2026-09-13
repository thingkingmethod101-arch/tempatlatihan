import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { VerifyTutorDto } from './dto/verify-tutor.dto';
import { STORAGE_ADAPTER } from '../storage/storage.module';
import type { StorageAdapter } from '../storage/storage-adapter.interface';

@Injectable()
export class TutorProfilesService {
  constructor(
    private prisma: PrismaService,
    @Inject(STORAGE_ADAPTER) private storage: StorageAdapter,
  ) {}

  listPending() {
    return this.prisma.tutorProfile.findMany({
      where: { statusVerifikasi: 'pending' },
      include: { user: { select: { nama: true, kontak: true } } },
    });
  }

  async verify(id: string, dto: VerifyTutorDto, adminId: string) {
    const profile = await this.prisma.tutorProfile.findUnique({ where: { id } });
    if (!profile) throw new NotFoundException('Profil tutor tidak ditemukan');

    return this.prisma.tutorProfile.update({
      where: { id },
      data: {
        statusVerifikasi: dto.keputusan,
        diverifikasiOleh: adminId,
        verifiedAt: new Date(),
        catatanVerifikasi: dto.catatan,
      },
    });
  }

  getMine(userId: string) {
    return this.prisma.tutorProfile.findUnique({ where: { userId } });
  }

  async getDocumentUrls(id: string) {
    const profile = await this.prisma.tutorProfile.findUnique({ where: { id } });
    if (!profile) throw new NotFoundException('Profil tutor tidak ditemukan');

    const resolve = async (fileAssetId: string | null) => {
      if (!fileAssetId) return null;
      const fileAsset = await this.prisma.fileAsset.findUnique({ where: { id: fileAssetId } });
      if (!fileAsset) return null;
      const signed = await this.storage.getSignedUrl(fileAsset.path, 300);
      return signed.available ? (signed.url ?? null) : null;
    };

    return {
      ktpUrl: await resolve(profile.dokumenKtpFileAssetId),
      ijazahUrl: await resolve(profile.dokumenIjazahFileAssetId),
      cvUrl: await resolve(profile.dokumenCvFileAssetId),
    };
  }

  async attachDocuments(
    userId: string,
    data: { dokumenKtpFileAssetId?: string; dokumenIjazahFileAssetId?: string },
  ) {
    return this.prisma.tutorProfile.update({
      where: { userId },
      data,
    });
  }

  async updateBankInfo(userId: string, infoRekening: string, nomorRekening: string) {
    return this.prisma.tutorProfile.update({ where: { userId }, data: { infoRekening, nomorRekening } });
  }

  async resubmit(userId: string) {
    return this.prisma.tutorProfile.update({
      where: { userId },
      data: { statusVerifikasi: 'pending' },
    });
  }

  async deleteDocument(id: string, jenis: 'ktp' | 'ijazah' | 'cv') {
    const field = jenis === 'ktp' ? 'dokumenKtpFileAssetId' : jenis === 'ijazah' ? 'dokumenIjazahFileAssetId' : 'dokumenCvFileAssetId';
    return this.prisma.tutorProfile.update({ where: { id }, data: { [field]: null } });
  }
}