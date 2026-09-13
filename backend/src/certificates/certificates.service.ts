import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

@Injectable()
export class CertificatesService {
  constructor(private prisma: PrismaService) {}

  async issueIfEligible(eventId: string, userId: string) {
    const registration = await this.prisma.eventRegistration.findUnique({
      where: { eventId_userId: { eventId, userId } },
    });
    if (!registration) return null;

    const existing = await this.prisma.sertifikat.findUnique({
      where: { eventRegistrationId: registration.id },
    });
    if (existing) return existing; // sudah pernah terbit, tidak dobel

    const nomorSertifikat = `SERT-${new Date().getFullYear()}-${randomBytes(4).toString('hex').toUpperCase()}`;

    return this.prisma.sertifikat.create({
      data: { eventRegistrationId: registration.id, nomorSertifikat },
    });
  }

  listMine(userId: string) {
    return this.prisma.sertifikat.findMany({
      where: { eventRegistration: { userId } },
      include: { eventRegistration: { include: { event: true } } },
    });
  }


  async getDetail(certId: string, userId: string, role: string) {
    const cert = await this.prisma.sertifikat.findUnique({
      where: { id: certId },
      include: {
        eventRegistration: {
          include: {
            event: true,
            user: { include: { school: true } },
          },
        },
      },
    });
    if (!cert) throw new NotFoundException('Sertifikat tidak ditemukan');

    if (role !== 'admin' && cert.eventRegistration.userId !== userId) {
      throw new ForbiddenException('Kamu tidak punya akses ke sertifikat ini');
    }

    return {
      nomorSertifikat: cert.nomorSertifikat,
      issuedAt: cert.issuedAt,
      namaSiswa: cert.eventRegistration.user.nama,
      kelas: cert.eventRegistration.user.kelas,
      namaSekolah: cert.eventRegistration.user.school?.nama ?? null,
      namaEvent: cert.eventRegistration.event.nama,
      tanggalEvent: cert.eventRegistration.event.jadwal,
    };
  }
  
  async verifyByNomor(nomorSertifikat: string) {
    const cert = await this.prisma.sertifikat.findFirst({
      where: { nomorSertifikat },
      include: { eventRegistration: { include: { user: true, event: true } } },
    });
    if (!cert) return { valid: false };

    return {
      valid: true,
      nomorSertifikat: cert.nomorSertifikat,
      namaSiswa: cert.eventRegistration.user.nama,
      namaEvent: cert.eventRegistration.event.nama,
      tanggalTerbit: cert.issuedAt,
    };
  }
}