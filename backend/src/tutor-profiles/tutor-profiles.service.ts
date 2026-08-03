import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { VerifyTutorDto } from './dto/verify-tutor.dto';

@Injectable()
export class TutorProfilesService {
  constructor(private prisma: PrismaService) {}

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
}