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
}