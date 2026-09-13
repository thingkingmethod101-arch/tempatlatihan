import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { STORAGE_ADAPTER } from '../storage/storage.module';
import type { StorageAdapter } from '../storage/storage-adapter.interface';

@Injectable()
export class MaintenanceService {
  private readonly logger = new Logger(MaintenanceService.name);

  constructor(
    private prisma: PrismaService,
    @Inject(STORAGE_ADAPTER) private storage: StorageAdapter,
  ) {}

  private async deleteFileSafely(fileAssetId: string) {
    const fileAsset = await this.prisma.fileAsset.findUnique({ where: { id: fileAssetId } });
    if (!fileAsset) return;
    try {
      await this.storage.deleteObject(fileAsset.path);
    } catch (e) {
      this.logger.warn(`Gagal hapus file fisik ${fileAsset.path}: ${e}`);
    }
    await this.prisma.fileAsset.delete({ where: { id: fileAssetId } }).catch(() => {});
  }

  async purgeOldBuktiPembayaran() {
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - 3);

    const oldLedger = await this.prisma.ledgerEntry.findMany({
      where: { buktiFileAssetId: { not: null }, tanggal: { lt: cutoff } },
    });
    for (const e of oldLedger) {
      await this.deleteFileSafely(e.buktiFileAssetId!);
      await this.prisma.ledgerEntry.update({ where: { id: e.id }, data: { buktiFileAssetId: null } });
    }

    const oldTransactions = await this.prisma.transaction.findMany({
      where: { buktiFileAssetId: { not: null }, paidAt: { lt: cutoff } },
    });
    for (const t of oldTransactions) {
      await this.deleteFileSafely(t.buktiFileAssetId!);
      await this.prisma.transaction.update({ where: { id: t.id }, data: { buktiFileAssetId: null } });
    }

    return { ledgerDibersihkan: oldLedger.length, transaksiDibersihkan: oldTransactions.length };
  }

  async purgeRejectedContent() {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);

    const rejectedContents = await this.prisma.content.findMany({
      where: { statusModerasi: 'ditolak', updatedAt: { lt: cutoff } },
      include: { chapters: true },
    });
    for (const content of rejectedContents) {
      for (const chapter of content.chapters) {
        if (chapter.materiFileAssetId) await this.deleteFileSafely(chapter.materiFileAssetId);
      }
      await this.prisma.content.delete({ where: { id: content.id } }).catch(() => {});
    }

    const rejectedQuestions = await this.prisma.question.findMany({
      where: { statusModerasi: 'ditolak', updatedAt: { lt: cutoff } },
    });
    for (const q of rejectedQuestions) {
      if (q.questionImageUrl) await this.deleteFileSafely(q.questionImageUrl);
      await this.prisma.question.delete({ where: { id: q.id } }).catch(() => {});
    }

    return { kontenDihapus: rejectedContents.length, soalDihapus: rejectedQuestions.length };
  }

  async runAll() {
    const bukti = await this.purgeOldBuktiPembayaran();
    const konten = await this.purgeRejectedContent();
    this.logger.log(`Pembersihan selesai: ${JSON.stringify({ bukti, konten })}`);
    return { bukti, konten };
  }

  async exportAll() {
    const [users, events, eventRounds, registrations, contents, transactions, ledgerEntries, certificates] =
      await Promise.all([
        this.prisma.user.findMany({
          select: {
            id: true, nama: true, kontak: true, role: true, kelas: true, schoolId: true,
            jenisKelamin: true, tanggalLahir: true, alamat: true, createdAt: true,
          },
        }),
        this.prisma.event.findMany(),
        this.prisma.eventRound.findMany(),
        this.prisma.eventRegistration.findMany(),
        this.prisma.content.findMany({ include: { chapters: true, pricing: true } }),
        this.prisma.transaction.findMany(),
        this.prisma.ledgerEntry.findMany(),
        this.prisma.sertifikat.findMany(),
      ]);

    return {
      exportedAt: new Date().toISOString(),
      users, events, eventRounds, registrations, contents, transactions, ledgerEntries, certificates,
    };
  }

  async resetDatabase() {
    await this.prisma.school.updateMany({ data: { picUserId: null } });

    await this.prisma.$transaction([
      this.prisma.questionOption.deleteMany({}),
      this.prisma.submission.deleteMany({}),
      this.prisma.eventQuestionPool.deleteMany({}),
      this.prisma.contentComment.deleteMany({}),
      this.prisma.contentRating.deleteMany({}),
      this.prisma.contentAccess.deleteMany({}),
      this.prisma.royaltyLedger.deleteMany({}),
      this.prisma.payout.deleteMany({}),
      this.prisma.contentPricing.deleteMany({}),
      this.prisma.sertifikat.deleteMany({}),
      this.prisma.leaderboardSnapshot.deleteMany({}),
      this.prisma.eventSessionAssignment.deleteMany({}),
      this.prisma.eventSession.deleteMany({}),
      this.prisma.eventAttempt.deleteMany({}),
      this.prisma.eventRegistration.deleteMany({}),
      this.prisma.attemptUnlock.deleteMany({}),
      this.prisma.referralUsage.deleteMany({}),
      this.prisma.question.deleteMany({}),
      this.prisma.contentChapter.deleteMany({}),
      this.prisma.eventRound.deleteMany({}),
      this.prisma.referralCode.deleteMany({}),
      this.prisma.transaction.deleteMany({}),
      this.prisma.ledgerEntry.deleteMany({}),
      this.prisma.scholarshipApplication.deleteMany({}),
      this.prisma.talentSummaryCache.deleteMany({}),
      this.prisma.talentCareerMapping.deleteMany({}),
      this.prisma.learningStyleSurvey.deleteMany({}),
      this.prisma.studySession.deleteMany({}),
      this.prisma.psychTestOption.deleteMany({}),
      this.prisma.psychTestResult.deleteMany({}),
      this.prisma.berita.deleteMany({}),
      this.prisma.auditLog.deleteMany({}),
      this.prisma.notificationLog.deleteMany({}),
      this.prisma.parentChildLink.deleteMany({}),
      this.prisma.passwordResetToken.deleteMany({}),
      this.prisma.content.deleteMany({}),
      this.prisma.event.deleteMany({}),
      this.prisma.scholarshipProgram.deleteMany({}),
      this.prisma.psychTestQuestion.deleteMany({}),
      // this.prisma.landingSettings.deleteMany({}), // Sengaja dikomentari — lihat catatan di panduan.
    ]);

    await this.prisma.fileAsset.deleteMany({});
    await this.prisma.refreshToken.deleteMany({});
    await this.prisma.authCredential.deleteMany({ where: { user: { role: { not: 'admin' } } } });
    await this.prisma.tutorProfile.deleteMany({ where: { user: { role: { not: 'admin' } } } });

    const hasil = await this.prisma.user.deleteMany({ where: { role: { not: 'admin' } } });
    return { akunTerhapus: hasil.count };
  }
}