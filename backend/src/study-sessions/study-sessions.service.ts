import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StartSessionDto } from './dto/start-session.dto';

@Injectable()
export class StudySessionsService {
  constructor(private prisma: PrismaService) {}

  start(userId: string, dto: StartSessionDto) {
    return this.prisma.studySession.create({
      data: {
        userId,
        skillNodeId: dto.skillNodeId,
        mode: dto.mode ?? 'santai_fokus',
        presetDipilih: dto.presetDipilih,
        targetSiklus: dto.targetSiklus,
      },
    });
  }

  async completeCycle(id: string, userId: string) {
    const session = await this.prisma.studySession.findUnique({ where: { id } });
    if (!session || session.userId !== userId) throw new NotFoundException('Sesi tidak ditemukan');

    return this.prisma.studySession.update({
      where: { id },
      data: { jumlahSiklusSelesai: session.jumlahSiklusSelesai + 1 },
    });
  }

  async end(id: string, userId: string) {
    const session = await this.prisma.studySession.findUnique({ where: { id } });
    if (!session || session.userId !== userId) throw new NotFoundException('Sesi tidak ditemukan');

    return this.prisma.studySession.update({ where: { id }, data: { endedAt: new Date() } });
  }

  listMine(userId: string) {
    return this.prisma.studySession.findMany({ where: { userId }, orderBy: { startedAt: 'desc' } });
  }

  getPomodoroSettings() {
    return this.prisma.pomodoroSettings.findFirst();
  }

  async updatePomodoroSettings(data: { siklusSebelumIstirahatPanjang?: number; durasiIstirahatPanjangMenit?: number }) {
    const existing = await this.prisma.pomodoroSettings.findFirst();
    if (existing) return this.prisma.pomodoroSettings.update({ where: { id: existing.id }, data });
    return this.prisma.pomodoroSettings.create({ data });
  }
}