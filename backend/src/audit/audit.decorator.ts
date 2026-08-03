import { SetMetadata } from '@nestjs/common';

export interface AuditMetadata {
  aksi: string;          // mis. 'verifikasi_tutor', 'ubah_scoring_config'
  entityType: string;    // nama tabel/domain, mis. 'tutor_profile' (snake_case, buat konsistensi laporan)
  prismaModel: string;   // nama property di PrismaService, mis. 'tutorProfile' (camelCase, harus persis nama model Prisma)
}

export const AUDIT_KEY = 'audit';
export const Audit = (meta: AuditMetadata) => SetMetadata(AUDIT_KEY, meta);