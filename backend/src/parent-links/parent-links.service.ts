import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LinkStatus, Role } from '@prisma/client';

@Injectable()
export class ParentLinksService {
  constructor(private prisma: PrismaService) {}

  async requestLink(parentId: string, childKontak: string) {
    const child = await this.prisma.user.findUnique({ where: { kontak: childKontak } });
    if (!child || child.role !== Role.siswa) {
      throw new BadRequestException('Akun anak tidak ditemukan atau bukan siswa');
    }
    return this.prisma.parentChildLink.create({
      data: { parentId, childId: child.id, status: LinkStatus.pending },
    });
  }

  async approve(linkId: string, childId: string) {
    const link = await this.prisma.parentChildLink.findUnique({ where: { id: linkId } });
    if (!link) throw new NotFoundException('Link tidak ditemukan');
    if (link.childId !== childId) throw new ForbiddenException('Bukan link untuk akun kamu');

    return this.prisma.parentChildLink.update({
      where: { id: linkId },
      data: { status: LinkStatus.approved, verifiedBy: childId, verifiedAt: new Date() },
    });
  }

  async reject(linkId: string, childId: string) {
    const link = await this.prisma.parentChildLink.findUnique({ where: { id: linkId } });
    if (!link) throw new NotFoundException('Link tidak ditemukan');
    if (link.childId !== childId) throw new ForbiddenException('Bukan link untuk akun kamu');

    return this.prisma.parentChildLink.update({
      where: { id: linkId },
      data: { status: LinkStatus.rejected, verifiedBy: childId, verifiedAt: new Date() },
    });
  }
  
  listMine(userId: string, role: string) {
    if (role === 'orang_tua') {
      return this.prisma.parentChildLink.findMany({
        where: { parentId: userId },
        include: { child: { select: { id: true, nama: true, kontak: true } } },
        orderBy: { createdAt: 'desc' },
      });
    }
    return this.prisma.parentChildLink.findMany({
      where: { childId: userId },
      include: { parent: { select: { id: true, nama: true, kontak: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async assertApprovedLink(parentId: string, childId: string) {
    const link = await this.prisma.parentChildLink.findUnique({
      where: { parentId_childId: { parentId, childId } },
    });
    if (!link || link.status !== 'approved') {
      throw new ForbiddenException('Kamu belum terhubung dengan akun anak ini');
    }
  }  
}