import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { STORAGE_ADAPTER } from '../storage/storage.module';
import type { StorageAdapter } from '../storage/storage-adapter.interface';
import { FilePurpose, FileVisibility } from '@prisma/client';
import { PresignDto } from './dto/presign.dto';
import { ConfirmDto } from './dto/confirm.dto';

const PRIVATE_PURPOSES: FilePurpose[] = [
  FilePurpose.ktp,
  FilePurpose.ijazah,
  FilePurpose.dokumen_beasiswa,
];

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

@Injectable()
export class FilesService {
  constructor(
    private prisma: PrismaService,
    @Inject(STORAGE_ADAPTER) private storage: StorageAdapter,
  ) {}

  async presign(userId: string, dto: PresignDto) {
    if (!ALLOWED_MIME_TYPES.includes(dto.mimeType)) {
      throw new BadRequestException(`Tipe file ${dto.mimeType} tidak diizinkan`);
    }
    if (dto.sizeBytes > MAX_SIZE_BYTES) {
      throw new BadRequestException(`Ukuran file melebihi batas ${MAX_SIZE_BYTES / 1024 / 1024}MB`);
    }

    const ext = dto.mimeType.split('/')[1];
    const path = `${dto.purpose}/${userId}/${randomUUID()}.${ext}`;

    return this.storage.getUploadUrl(path, dto.mimeType);
  }

  async confirm(userId: string, dto: ConfirmDto) {
    const visibility = PRIVATE_PURPOSES.includes(dto.purpose) ? FileVisibility.private : FileVisibility.public;

    return this.prisma.fileAsset.create({
      data: {
        ownerId: userId,
        bucket: process.env.STORAGE_BUCKET ?? 'unknown',
        path: dto.path,
        mimeType: dto.mimeType,
        sizeBytes: dto.sizeBytes,
        visibility,
        purpose: dto.purpose,
      },
    });
  }

  async getSignedReadUrl(fileId: string, requester: { id: string; role: string }) {
    const file = await this.prisma.fileAsset.findUnique({ where: { id: fileId } });
    if (!file) throw new NotFoundException('File tidak ditemukan');

    if (file.visibility === FileVisibility.private) {
      const isOwner = file.ownerId === requester.id;
      const isAdmin = requester.role === 'admin';
      if (!isOwner && !isAdmin) {
        throw new ForbiddenException('Kamu tidak punya akses ke file ini');
      }
    }

    return this.storage.getSignedUrl(file.path, 300);
  }

  async createPdfPreview(fullFileAssetId: string): Promise<string | null> {
    const { PDFDocument } = await import('pdf-lib');

    const fullAsset = await this.prisma.fileAsset.findUnique({ where: { id: fullFileAssetId } });
    if (!fullAsset) return null;

    const signed = await this.storage.getSignedUrl(fullAsset.path, 300);
    if (!signed.available || !signed.url) return null;

    const res = await fetch(signed.url);
    const fullBytes = await res.arrayBuffer();

    const fullPdf = await PDFDocument.load(fullBytes);
    const totalHalaman = fullPdf.getPageCount();
    const jumlahDiambil = Math.min(5, totalHalaman);

    const previewPdf = await PDFDocument.create();
    const halamanDisalin = await previewPdf.copyPages(fullPdf, Array.from({ length: jumlahDiambil }, (_, i) => i));
    halamanDisalin.forEach((p) => previewPdf.addPage(p));
    const previewBytes = await previewPdf.save();

    const previewPath = fullAsset.path.replace(/(\.pdf)?$/i, '') + '-preview.pdf';
    await this.storage.uploadBuffer(previewPath, Buffer.from(previewBytes), 'application/pdf');

    const previewAsset = await this.prisma.fileAsset.create({
      data: {
        path: previewPath,
        purpose: fullAsset.purpose,
        mimeType: 'application/pdf',
        sizeBytes: previewBytes.length,
        ownerId: fullAsset.ownerId,
        bucket: fullAsset.bucket,
        visibility: fullAsset.visibility,
      },
    });

    return previewAsset.id;
  }
}