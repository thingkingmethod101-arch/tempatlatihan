import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EventSessionsService {
  constructor(private prisma: PrismaService) {}

  createSession(roundId: string, dto: { waktuMulai: string; waktuSelesai: string; kuota: number }) {
    return this.prisma.eventSession.create({
      data: {
        eventRoundId: roundId,
        waktuMulai: new Date(dto.waktuMulai),
        waktuSelesai: new Date(dto.waktuSelesai),
        kuota: dto.kuota,
      },
    });
  }

  async listSessionsForRound(roundId: string) {
    const sessions = await this.prisma.eventSession.findMany({
      where: { eventRoundId: roundId },
      include: { assignments: true },
      orderBy: { waktuMulai: 'asc' },
    });
    return sessions.map((s) => ({
      id: s.id,
      waktuMulai: s.waktuMulai,
      waktuSelesai: s.waktuSelesai,
      kuota: s.kuota,
      terisi: s.assignments.length,
    }));
  }

  async listAssignedForSession(sessionId: string) {
    const assignments = await this.prisma.eventSessionAssignment.findMany({ where: { eventSessionId: sessionId } });
    const userIds = assignments.map((a) => a.userId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, nama: true, kontak: true },
    });
    return users.map((u) => ({ userId: u.id, nama: u.nama, kontak: u.kontak }));
  }

  async listUnassignedParticipants(roundId: string) {
    const round = await this.prisma.eventRound.findUnique({ where: { id: roundId } });
    if (!round) throw new NotFoundException('Babak tidak ditemukan');

    const registrations = await this.prisma.eventRegistration.findMany({
      where: { eventId: round.eventId, status: 'terdaftar' },
      include: { user: { select: { id: true, nama: true, kontak: true } } },
    });

    const assigned = await this.prisma.eventSessionAssignment.findMany({
      where: { eventSession: { eventRoundId: roundId } },
      select: { userId: true },
    });
    const assignedIds = new Set(assigned.map((a) => a.userId));

    return registrations
      .filter((r) => !assignedIds.has(r.userId))
      .map((r) => ({ userId: r.user.id, nama: r.user.nama, kontak: r.user.kontak }));
  }

  async assignParticipant(sessionId: string, userId: string) {
    const session = await this.prisma.eventSession.findUnique({
      where: { id: sessionId },
      include: { assignments: true },
    });
    if (!session) throw new NotFoundException('Sesi tidak ditemukan');
    if (session.assignments.length >= session.kuota) {
      throw new BadRequestException('Kuota sesi ini sudah penuh');
    }

    return this.prisma.eventSessionAssignment.upsert({
      where: { eventSessionId_userId: { eventSessionId: sessionId, userId } },
      update: {},
      create: { eventSessionId: sessionId, userId },
    });
  }

  async removeAssignment(sessionId: string, userId: string) {
    await this.prisma.eventSessionAssignment.deleteMany({ where: { eventSessionId: sessionId, userId } });
    return { removed: true };
  }

  // Dipakai ChallengeService -- SENGAJA tidak pernah mengembalikan jam ke siswa
  async checkAccessWindow(roundId: string, userId: string) {
    const sessionCount = await this.prisma.eventSession.count({ where: { eventRoundId: roundId } });
    if (sessionCount === 0) return { hasSessionSystem: false, hasAssignment: true, withinWindow: true };

    const assignment = await this.prisma.eventSessionAssignment.findFirst({
      where: { userId, eventSession: { eventRoundId: roundId } },
      include: { eventSession: true },
    });
    if (!assignment) return { hasSessionSystem: true, hasAssignment: false, withinWindow: false };

    const now = new Date();
    const withinWindow = now >= assignment.eventSession.waktuMulai && now <= assignment.eventSession.waktuSelesai;
    return { hasSessionSystem: true, hasAssignment: true, withinWindow };
  }

  async getMySessionWindow(roundId: string, userId: string) {
    const assignment = await this.prisma.eventSessionAssignment.findFirst({
      where: { userId, eventSession: { eventRoundId: roundId } },
      include: { eventSession: true },
    });
    if (!assignment) return { hasSession: false };
    return {
      hasSession: true,
      waktuMulai: assignment.eventSession.waktuMulai,
      waktuSelesai: assignment.eventSession.waktuSelesai,
    };
  }

  async updateSession(sessionId: string, dto: { waktuMulai?: string; waktuSelesai?: string; kuota?: number }) {
    return this.prisma.eventSession.update({
      where: { id: sessionId },
      data: {
        waktuMulai: dto.waktuMulai ? new Date(dto.waktuMulai) : undefined,
        waktuSelesai: dto.waktuSelesai ? new Date(dto.waktuSelesai) : undefined,
        kuota: dto.kuota,
      },
    });
  }

  async deleteSession(sessionId: string) {
    await this.prisma.eventSessionAssignment.deleteMany({ where: { eventSessionId: sessionId } });
    await this.prisma.eventSession.delete({ where: { id: sessionId } });
    return { deleted: true };
  }
}