import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventStatus, ModerationStatus } from '@prisma/client';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateScoringConfigDto } from './dto/update-scoring-config.dto';
import { CreateEventRoundDto } from './dto/create-event-round.dto';
import { AddQuestionToPoolDto } from './dto/add-question-to-pool.dto';

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateEventDto) {
    return this.prisma.event.create({
      data: {
        nama: dto.nama,
        tipe: dto.tipe,
        mode: dto.mode,
        jenjang: dto.jenjang,
        skillNodeId: dto.skillNodeId,
        jadwal: dto.jadwal ? new Date(dto.jadwal) : undefined,
        syaratLolos: dto.syaratLolos,
        biaya: dto.biaya,
        reward: dto.reward,
      },
    });
  }

  listPublished() {
    return this.prisma.event.findMany({
      where: { status: EventStatus.published },
      include: { rounds: true },
    });
  }

  async detail(id: string, requester?: { role?: string } | null) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: { rounds: true },
    });
    if (!event) throw new NotFoundException('Event tidak ditemukan');

    const isAdmin = requester?.role === 'admin';
    if (event.status !== 'published' && !isAdmin) {
      // Sengaja pakai 404, bukan 403 -- supaya orang luar tidak tahu event draft ini
      // "ada tapi dilarang", cukup tampak seolah memang tidak ada.
      throw new NotFoundException('Event tidak ditemukan');
    }

    return event;
  }

  async publish(id: string) {
    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event) throw new NotFoundException('Event tidak ditemukan');
    return this.prisma.event.update({ where: { id }, data: { status: EventStatus.published } });
  }

  async updateScoringConfig(id: string, dto: UpdateScoringConfigDto) {
    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event) throw new NotFoundException('Event tidak ditemukan');
    return this.prisma.event.update({
      where: { id },
      data: { scoringConfig: { benar: dto.benar, salah: dto.salah, kosong: dto.kosong } },
    });
  }

  createRound(eventId: string, dto: CreateEventRoundDto) {
    return this.prisma.eventRound.create({
      data: {
        eventId,
        namaBabak: dto.namaBabak,
        tierId: dto.tierId,
        isFree: dto.isFree ?? false,
        isFinal: dto.isFinal ?? false,
        biaya: dto.biaya ?? undefined,
        urutan: dto.urutan ?? 1,
        passingGrade: dto.passingGrade ?? undefined,
        jadwalMulai: dto.jadwalMulai ? new Date(dto.jadwalMulai) : undefined,
        durasiMenit: dto.durasiMenit,
      },
    });
  }

  updateGrupWaLink(id: string, grupWaLink: string) {
    return this.prisma.event.update({ where: { id }, data: { grupWaLink } });
  }

  listAll() {
    return this.prisma.event.findMany({
      include: { rounds: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  listPoolForRound(roundId: string) {
    return this.prisma.eventQuestionPool.findMany({
      where: { eventRoundId: roundId },
      include: { question: true },
    });
  }

  async listAttemptsForRound(roundId: string) {
    const round = await this.prisma.eventRound.findUnique({ where: { id: roundId } });
    if (!round) throw new NotFoundException('Babak tidak ditemukan');
    const biayaRound = round.biaya ? Number(round.biaya) : 0;

    const attempts = await this.prisma.eventAttempt.findMany({
      where: { eventRoundId: roundId, status: 'selesai' },
      include: { user: { select: { id: true, nama: true, kontak: true } } },
    });

    const enriched = await Promise.all(
      attempts.map(async (a) => {
        let statusBayar: 'gratis' | 'sudah_bayar' | 'belum_bayar' = 'gratis';
        if (biayaRound > 0) {
          const paid = await this.prisma.transaction.findFirst({
            where: { targetType: 'event_round', targetId: roundId, userId: a.user.id, status: 'lunas' },
          });
          statusBayar = paid ? 'sudah_bayar' : 'belum_bayar';
        }
        return {
          id: a.id,
          userId: a.user.id,
          nama: a.user.nama,
          kontak: a.user.kontak,
          skorFinal100: a.skorFinal100,
          durasiPengerjaanDetik: a.durasiPengerjaanDetik,
          submittedAt: a.submittedAt,
          statusBayar,
          gelar: a.gelar,
        };
      }),
    );

    enriched.sort((x, y) => {
      const skorX = x.skorFinal100 ?? -1;
      const skorY = y.skorFinal100 ?? -1;
      if (skorY !== skorX) return skorY - skorX;
      const waktuX = x.durasiPengerjaanDetik ?? Infinity;
      const waktuY = y.durasiPengerjaanDetik ?? Infinity;
      return waktuX - waktuY;
    });

    return enriched.map((row, i) => ({ ranking: i + 1, ...row }));
  }

  async unlockAttempt(roundId: string, userId: string, adminId: string) {
    return this.prisma.attemptUnlock.upsert({
      where: { userId_eventRoundId: { userId, eventRoundId: roundId } },
      update: { createdBy: adminId, createdAt: new Date() },
      create: { userId, eventRoundId: roundId, createdBy: adminId },
    });
  }

  async addQuestionToPool(roundId: string, dto: AddQuestionToPoolDto, curatorId: string) {
    const question = await this.prisma.question.findUnique({ where: { id: dto.questionId } });
    if (!question) throw new NotFoundException('Soal tidak ditemukan');
    if (question.statusModerasi !== ModerationStatus.disetujui) {
      throw new BadRequestException('Soal harus berstatus disetujui sebelum dimasukkan ke event');
    }

    return this.prisma.eventQuestionPool.create({
      data: { eventRoundId: roundId, questionId: dto.questionId, dikurasiOleh: curatorId },
    });
  }
}