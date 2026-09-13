import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';

@Injectable()
export class AnnouncementsService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateAnnouncementDto) {
    return this.prisma.announcement.create({
      data: {
        judul: dto.judul,
        isi: dto.isi,
        targetRole: dto.targetRole ?? [],
        targetJenjang: dto.targetJenjang ?? [],
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      },
    });
  }

  listAll() {
    return this.prisma.announcement.findMany({ where: { deletedAt: null }, orderBy: { createdAt: 'desc' } });
  }

  remove(id: string) {
    return this.prisma.announcement.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async listActiveForUser(role: string, jenjang?: string) {
    const now = new Date();
    const announcements = await this.prisma.announcement.findMany({
      where: { deletedAt: null, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
      orderBy: { createdAt: 'desc' },
    });

    return announcements.filter((a) => {
      const roleMatch = a.targetRole.length === 0 || a.targetRole.includes(role as any);
      const jenjangMatch = a.targetJenjang.length === 0 || (jenjang ? a.targetJenjang.includes(jenjang) : true);
      return roleMatch && jenjangMatch;
    });
  }
}