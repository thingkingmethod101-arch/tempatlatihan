import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getMe(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, nama: true, kontak: true, role: true, kelas: true, schoolId: true },
    });
  }

  async getDetail(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, nama: true, kontak: true, role: true, createdAt: true },
    });
    if (!user) throw new NotFoundException('User tidak ditemukan');
    return user;
  }

  async updateMe(userId: string, dto: { nama?: string; kontak?: string; kelas?: string; alamat?: string }) {
    if (dto.kontak) {
      const existing = await this.prisma.user.findUnique({ where: { kontak: dto.kontak } });
      if (existing && existing.id !== userId) {
        throw new ConflictException('Nomor WA sudah dipakai akun lain');
      }
    }
    return this.prisma.user.update({ where: { id: userId }, data: dto });
  }

  async listAll(role?: string) {
    return this.prisma.user.findMany({
      where: role ? { role: role as any } : undefined,
      select: { id: true, nama: true, kontak: true, role: true, kelas: true, aktif: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async adminUpdate(userId: string, dto: { nama?: string; kelas?: string; schoolId?: string; alamat?: string }) {
    return this.prisma.user.update({ where: { id: userId }, data: dto });
  }

  async setActive(userId: string, aktif: boolean) {
    return this.prisma.user.update({ where: { id: userId }, data: { aktif } });
  }

}