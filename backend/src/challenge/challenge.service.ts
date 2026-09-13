import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AttemptStatus, RegistrationStatus, TransactionStatus } from '@prisma/client';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { NotificationService } from '../notification/notification.service';
import { NotifChannel } from '@prisma/client';
import { LeaderboardService } from '../leaderboard/leaderboard.service';
import { CertificatesService } from '../certificates/certificates.service';
import { TransactionsService } from '../transactions/transactions.service';
import { EventSessionsService } from '../event-sessions/event-sessions.service';
import { Inject } from '@nestjs/common'; // gabungkan dengan import lain dari '@nestjs/common' yang sudah ada
import { STORAGE_ADAPTER } from '../storage/storage.module';
import type { StorageAdapter } from '../storage/storage-adapter.interface';


@Injectable()
export class ChallengeService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
    private leaderboardService: LeaderboardService,
    private certificatesService: CertificatesService,
    private transactionsService: TransactionsService,
    private eventSessionsService: EventSessionsService,
    @Inject(STORAGE_ADAPTER) private storage: StorageAdapter,
  ) {}

  async register(eventId: string, userId: string, dto: { alamatPengiriman: string; asalSekolahSaatDaftar: string; kelasSaatDaftar: string }) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Event tidak ditemukan');

    const biaya = event.biaya ? Number(event.biaya) : 0;
    const status = biaya > 0 ? RegistrationStatus.menunggu_pembayaran : RegistrationStatus.terdaftar;

    const registration = await this.prisma.eventRegistration.upsert({
      where: { eventId_userId: { eventId, userId } },
      update: { alamatPengiriman: dto.alamatPengiriman, asalSekolahSaatDaftar: dto.asalSekolahSaatDaftar, kelasSaatDaftar: dto.kelasSaatDaftar },
      create: {
        eventId,
        userId,
        status,
        alamatPengiriman: dto.alamatPengiriman,
        asalSekolahSaatDaftar: dto.asalSekolahSaatDaftar,
        kelasSaatDaftar: dto.kelasSaatDaftar,
      },
    });

    if (biaya > 0 && registration.status === RegistrationStatus.menunggu_pembayaran) {
      const existingTransaction = await this.prisma.transaction.findFirst({
        where: { targetType: 'event_registration', targetId: registration.id, status: TransactionStatus.pending },
      });
      if (existingTransaction) {
        const totalTransfer = Number(existingTransaction.amount) + (existingTransaction.kodeUnik ?? 0);
        return { registration, kodeUnik: existingTransaction.kodeUnik, totalTransfer };
      }
      const payment = await this.transactionsService.createForEventRegistration(userId, registration.id, biaya);
      return { registration, kodeUnik: payment.kodeUnik, totalTransfer: payment.totalTransfer };
    }

    if (registration.status === RegistrationStatus.terdaftar) {
      return { registration, grupWaLink: event.grupWaLink ?? null };
    }

    return { registration };
  }

  async startAttempt(roundId: string, userId: string) {
    const round = await this.prisma.eventRound.findUnique({
      where: { id: roundId },
      include: { event: true, questionPool: { include: { question: { include: { options: true } } } } },
    });
    if (!round) throw new NotFoundException('Babak tidak ditemukan');

    if (round.urutan > 1) {
      const roundSebelumnya = await this.prisma.eventRound.findFirst({
        where: { eventId: round.eventId, urutan: round.urutan - 1 },
      });
      if (roundSebelumnya) {
        const attemptTerbaik = await this.prisma.eventAttempt.findFirst({
          where: { userId, eventRoundId: roundSebelumnya.id, status: AttemptStatus.selesai },
          orderBy: { skorFinal100: 'desc' },
        });
        const passingGrade = roundSebelumnya.passingGrade ?? 0;
        if (!attemptTerbaik || (attemptTerbaik.skorFinal100 ?? 0) < passingGrade) {
          throw new ForbiddenException(
            `Kamu belum lolos babak "${roundSebelumnya.namaBabak}" (skor minimal ${passingGrade}, dari 100).`
          );
        }
      }
    }

    const biayaRound = round.biaya ? Number(round.biaya) : 0;
    if (biayaRound > 0) {
      const paidTransaction = await this.prisma.transaction.findFirst({
        where: { targetType: 'event_round', targetId: roundId, userId, status: TransactionStatus.lunas },
      });
      if (!paidTransaction) {
        throw new ForbiddenException('Babak ini berbayar. Silakan bayar dulu sebelum bisa memulai.');
      }
    }

    const sessionCheck = await this.eventSessionsService.checkAccessWindow(roundId, userId);
    if (sessionCheck.hasSessionSystem && (!sessionCheck.hasAssignment || !sessionCheck.withinWindow)) {
      return { allowed: false, reason: 'Belum waktunya kamu mengerjakan babak ini. Tunggu instruksi jadwal dari admin.' };
    }

    const registration = await this.prisma.eventRegistration.findUnique({
      where: { eventId_userId: { eventId: round.eventId, userId } },
    });
    if (!registration || registration.status !== RegistrationStatus.terdaftar) {
      throw new ForbiddenException('Kamu belum terdaftar (atau belum bayar) untuk event ini');
    }

    const ongoing = await this.prisma.eventAttempt.findFirst({
      where: { eventRoundId: roundId, userId, status: AttemptStatus.berlangsung },
    });
    if (ongoing) return this.buildAttemptResponse(ongoing.id, round);

    const completed = await this.prisma.eventAttempt.findFirst({
      where: { eventRoundId: roundId, userId, status: AttemptStatus.selesai },
    });
    if (completed) {
      const unlock = await this.prisma.attemptUnlock.findUnique({
        where: { userId_eventRoundId: { userId, eventRoundId: roundId } },
      });
      if (!unlock) {
        throw new ForbiddenException('Kamu sudah menyelesaikan babak ini. Hubungi admin kalau ingin mengulang.');
      }
      await this.prisma.attemptUnlock.delete({ where: { id: unlock.id } });
    }

    try {
      const attempt = await this.prisma.eventAttempt.create({
        data: { eventRoundId: roundId, userId, status: AttemptStatus.berlangsung },
      });
      return this.buildAttemptResponse(attempt.id, round);
    } catch (err: any) {
      if (err.code === 'P2002') {
        const existing = await this.prisma.eventAttempt.findFirst({
          where: { eventRoundId: roundId, userId, status: AttemptStatus.berlangsung },
        });
        if (existing) return this.buildAttemptResponse(existing.id, round);
      }
      throw err;
    }
  }

  private async buildAttemptResponse(attemptId: string, round: any) {
    const questions = await Promise.all(
      round.questionPool.map(async (pool: any) => {
        let imageUrl: string | null = null;
        if (pool.question.questionImageUrl) {
          const fileAsset = await this.prisma.fileAsset.findUnique({ where: { id: pool.question.questionImageUrl } });
          if (fileAsset) {
            const signed = await this.storage.getSignedUrl(fileAsset.path, 3600);
            imageUrl = signed.available ? (signed.url ?? null) : null;
          }
        }
        return {
          id: pool.question.id,
          questionType: pool.question.questionType,
          questionText: pool.question.questionText,
          questionImageUrl: imageUrl,
          options: pool.question.options.map((o: any) => ({
            id: o.id,
            urutan: o.urutan,
            tipe: o.tipe,
            konten: o.konten,
          })),
        };
      }),
    );

    return { attemptId, durasiMenit: round.durasiMenit, questions };
  }

  async submitAnswer(attemptId: string, userId: string, dto: SubmitAnswerDto) {
    const attempt = await this.prisma.eventAttempt.findUnique({ where: { id: attemptId } });
    if (!attempt || attempt.userId !== userId) throw new NotFoundException('Attempt tidak ditemukan');
    if (attempt.status !== AttemptStatus.berlangsung) {
      throw new BadRequestException('Attempt ini sudah selesai, tidak bisa diubah lagi');
    }

    // PENTING: pastikan soal ini memang ada di pool babak attempt ini
    // (cegah submit soal dari babak/event lain yang merusak perhitungan skor)
    const inPool = await this.prisma.eventQuestionPool.findFirst({
      where: { eventRoundId: attempt.eventRoundId, questionId: dto.questionId },
    });
    if (!inPool) {
      throw new BadRequestException('Soal ini bukan bagian dari babak yang sedang kamu kerjakan');
    }

    const question = await this.prisma.question.findUnique({ where: { id: dto.questionId } });
    if (!question) throw new NotFoundException('Soal tidak ditemukan');

    const option = await this.prisma.questionOption.findUnique({ where: { id: dto.optionId } });
    if (!option || option.questionId !== dto.questionId) {
      throw new BadRequestException('Opsi jawaban tidak valid untuk soal ini');
    }

    const existing = await this.prisma.submission.findFirst({
      where: { eventAttemptId: attemptId, questionId: dto.questionId },
    });

    const data = {
      userId,
      eventAttemptId: attemptId,
      questionId: dto.questionId,
      skillNodeId: question.skillNodeId,
      sourceType: 'event',
      jawabanDipilih: { optionId: dto.optionId },
      benar: option.isCorrect,
      waktuJawabDetik: dto.waktuJawabDetik,
    };

    if (existing) {
      return this.prisma.submission.update({ where: { id: existing.id }, data });
    }
    return this.prisma.submission.create({ data });
  }

  async finish(attemptId: string, userId: string) {
    const attempt = await this.prisma.eventAttempt.findUnique({
      where: { id: attemptId },
      include: {
        eventRound: { include: { event: true, tier: true, questionPool: true } },
        submissions: true,
      },
    });
    if (!attempt || attempt.userId !== userId) throw new NotFoundException('Attempt tidak ditemukan');
    if (attempt.status !== AttemptStatus.berlangsung) {
      return attempt; // sudah selesai sebelumnya
    }

    const scoringConfig = attempt.eventRound.event.scoringConfig as any;
    const totalSoal = attempt.eventRound.questionPool.length;
    const totalDijawab = attempt.submissions.length;
    const benarCount = attempt.submissions.filter((s) => s.benar).length;
    const salahCount = totalDijawab - benarCount;
    const kosongCount = totalSoal - totalDijawab;

    const rawScore =
      benarCount * scoringConfig.benar + salahCount * scoringConfig.salah + kosongCount * scoringConfig.kosong;
    const maxScore = totalSoal * scoringConfig.benar;
    const skorFinal100 = maxScore > 0 ? Math.round((rawScore / maxScore) * 100) : 0;

    const tier = attempt.eventRound.tier;
    const xpDiperoleh = Math.round(tier.xpBaseDefault * Number(tier.xpMultiplier) * (skorFinal100 / 100));

    const durasiPengerjaanDetik = Math.round((Date.now() - attempt.startedAt.getTime()) / 1000);

    const updatedAttempt = await this.prisma.eventAttempt.update({
      where: { id: attemptId },
      data: {
        status: 'selesai',
        submittedAt: new Date(),
        durasiPengerjaanDetik,
        skorFinal100,
        xpDiperoleh,
      },
    });

    await this.notificationService.enqueue({
      userId,
      templateKode: 'event_hasil_terbit',
      channel: NotifChannel.email,
      refType: 'event_attempt',
      refId: attemptId,
      payload: { skor: skorFinal100, xp: xpDiperoleh },
    });

    await this.leaderboardService.regenerateForEvent(attempt.eventRound.eventId);

    if (attempt.eventRound.isFinal) {
      await this.certificatesService.issueIfEligible(attempt.eventRound.eventId, userId);
    }
    return updatedAttempt;


  }

  async result(attemptId: string, userId: string) {
    const attempt = await this.prisma.eventAttempt.findUnique({ where: { id: attemptId } });
    if (!attempt || attempt.userId !== userId) throw new NotFoundException('Attempt tidak ditemukan');
    return attempt;
  }

  async listMyUnlocks(userId: string) {
    const unlocks = await this.prisma.attemptUnlock.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const roundIds = unlocks.map((u) => u.eventRoundId);
    const rounds = await this.prisma.eventRound.findMany({
      where: { id: { in: roundIds } },
      include: { event: true },
    });

    return unlocks.map((u) => {
      const round = rounds.find((r) => r.id === u.eventRoundId);
      return {
        eventRoundId: u.eventRoundId,
        namaBabak: round?.namaBabak,
        namaEvent: round?.event.nama,
        unlockedAt: u.createdAt,
      };
    });
  }

  async getRoundPaymentStatus(roundId: string, userId: string) {
    const round = await this.prisma.eventRound.findUnique({ where: { id: roundId } });
    if (!round) throw new NotFoundException('Babak tidak ditemukan');
    const biaya = round.biaya ? Number(round.biaya) : 0;
    if (biaya <= 0) return { requiresPayment: false };

    const transaction = await this.prisma.transaction.findFirst({
      where: { targetType: 'event_round', targetId: roundId, userId },
      orderBy: { createdAt: 'desc' },
    });

    return {
      requiresPayment: true,
      biaya,
      paid: transaction?.status === TransactionStatus.lunas,
      kodeUnik: transaction?.kodeUnik ?? null,
      totalTransfer: transaction ? Number(transaction.amount) + (transaction.kodeUnik ?? 0) : null,
    };
  }

  async payForRound(roundId: string, userId: string) {
    const round = await this.prisma.eventRound.findUnique({ where: { id: roundId } });
    if (!round) throw new NotFoundException('Babak tidak ditemukan');
    const biaya = round.biaya ? Number(round.biaya) : 0;
    if (biaya <= 0) throw new BadRequestException('Babak ini gratis, tidak perlu membayar');

    const existing = await this.prisma.transaction.findFirst({
      where: { targetType: 'event_round', targetId: roundId, userId },
      orderBy: { createdAt: 'desc' },
    });
    if (existing) {
      return {
        kodeUnik: existing.kodeUnik,
        totalTransfer: Number(existing.amount) + (existing.kodeUnik ?? 0),
        paid: existing.status === TransactionStatus.lunas,
      };
    }

    const payment = await this.transactionsService.createGenericPayment(userId, 'event_round', roundId, biaya);
    return { kodeUnik: payment.kodeUnik, totalTransfer: payment.totalTransfer, paid: false };
  }

  async getAccessStatus(roundId: string, userId: string) {
    const round = await this.prisma.eventRound.findUnique({ where: { id: roundId } });
    if (!round) return { allowed: false, reason: 'Babak tidak ditemukan' };

    if (round.urutan > 1) {
      const roundSebelumnya = await this.prisma.eventRound.findFirst({
        where: { eventId: round.eventId, urutan: round.urutan - 1 },
      });
      if (roundSebelumnya) {
        const attemptTerbaik = await this.prisma.eventAttempt.findFirst({
          where: { userId, eventRoundId: roundSebelumnya.id, status: AttemptStatus.selesai },
          orderBy: { skorFinal100: 'desc' },
        });
        const passingGrade = roundSebelumnya.passingGrade ?? 0;
        if (!attemptTerbaik || (attemptTerbaik.skorFinal100 ?? 0) < passingGrade) {
          return { allowed: false, reason: `Belum lolos babak "${roundSebelumnya.namaBabak}" (skor minimal ${passingGrade})` };
        }
      }
    }

    const sessionCheck = await this.eventSessionsService.checkAccessWindow(roundId, userId);
    if (sessionCheck.hasSessionSystem && (!sessionCheck.hasAssignment || !sessionCheck.withinWindow)) {
      throw new ForbiddenException('Belum waktunya kamu mengerjakan babak ini. Tunggu instruksi jadwal dari admin.');
    }

    const biayaRound = round.biaya ? Number(round.biaya) : 0;
    if (biayaRound > 0) {
      const paid = await this.prisma.transaction.findFirst({
        where: { targetType: 'event_round', targetId: roundId, userId, status: TransactionStatus.lunas },
      });
      if (!paid) return { allowed: false, reason: 'Babak ini berbayar, belum lunas' };
    }

    const registration = await this.prisma.eventRegistration.findUnique({
      where: { eventId_userId: { eventId: round.eventId, userId } },
    });
    if (!registration || registration.status !== RegistrationStatus.terdaftar) {
      return { allowed: false, reason: 'Kamu belum terdaftar di event ini' };
    }

    return { allowed: true, reason: null };
  }

  async getMyRegistration(eventId: string, userId: string) {
    return this.prisma.eventRegistration.findUnique({ where: { eventId_userId: { eventId, userId } } });
  }

  async listMyRegisteredEvents(userId: string) {
    const registrations = await this.prisma.eventRegistration.findMany({
      where: { userId },
      include: { event: { include: { rounds: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return registrations.map((r) => ({
      eventId: r.event.id,
      namaEvent: r.event.nama,
      status: r.status,
      rounds: r.event.rounds.map((rd) => ({
        id: rd.id,
        namaBabak: rd.namaBabak,
        jadwalMulai: rd.jadwalMulai,
        urutan: rd.urutan,
      })),
    }));
  }

  async listMyEventHistory(userId: string) {
    const attempts = await this.prisma.eventAttempt.findMany({
      where: { userId, status: AttemptStatus.selesai },
      include: { eventRound: { include: { event: true } } },
      orderBy: { submittedAt: 'desc' },
    });

    return Promise.all(
      attempts.map(async (a) => {
        const roundBerikutnya = await this.prisma.eventRound.findFirst({
          where: { eventId: a.eventRound.eventId, urutan: a.eventRound.urutan + 1 },
        });

        let status = 'Selesai';
        if (roundBerikutnya) {
          const passingGrade = a.eventRound.passingGrade ?? 0;
          status = (a.skorFinal100 ?? 0) >= passingGrade
            ? `Lolos ke ${roundBerikutnya.namaBabak}`
            : 'Tidak lolos (di bawah passing grade)';
        }

        return {
          eventNama: a.eventRound.event.nama,
          babakNama: a.eventRound.namaBabak,
          tanggal: a.submittedAt,
          skor: a.skorFinal100,
          status,
          gelar: a.gelar,
        };
      }),
    );
  }

  async generateRankingJuara(roundId: string) {
    const round = await this.prisma.eventRound.findUnique({ where: { id: roundId } });
    if (!round) return;

    const roundBerikutnya = await this.prisma.eventRound.findFirst({
      where: { eventId: round.eventId, urutan: round.urutan + 1 },
    });
    if (roundBerikutnya) return;

    const semuaAttempt = await this.prisma.eventAttempt.findMany({
      where: { eventRoundId: roundId, status: AttemptStatus.selesai },
      orderBy: [{ skorFinal100: 'desc' }, { durasiPengerjaanDetik: 'asc' }],
    });

    const GELAR = ['juara_1', 'juara_2', 'juara_3', 'harapan_1', 'harapan_2', 'harapan_3'];

    await this.prisma.$transaction(
      semuaAttempt.map((a, i) =>
        this.prisma.eventAttempt.update({
          where: { id: a.id },
          data: { gelar: i < GELAR.length ? GELAR[i] : null },
        }),
      ),
    );
    return { totalPeserta: semuaAttempt.length };
  }

}