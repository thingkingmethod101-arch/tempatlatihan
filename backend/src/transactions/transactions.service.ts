import { BadRequestException, Inject, Injectable, NotFoundException,  } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PAYMENT_ADAPTER } from '../payment/payment.module';
import type { PaymentGatewayAdapter } from '../payment/payment-gateway-adapter.interface';
import { AksesSumber, RegistrationStatus, TransactionStatus } from '@prisma/client';
import { CheckoutDto } from './dto/checkout.dto';
import { ReferralService } from '../referral/referral.service';
import { ContentService } from '../content/content.service';

@Injectable()
export class TransactionsService {
  constructor(
    private prisma: PrismaService,
    @Inject(PAYMENT_ADAPTER) private paymentAdapter: PaymentGatewayAdapter,
    private referralService: ReferralService,
    private contentService: ContentService,
  ) {}

  async checkout(userId: string, dto: CheckoutDto) {
    const pricing = await this.prisma.contentPricing.findUnique({
      where: { id: dto.contentPricingId },
      include: { content: { include: { owner: true } } },
    });
    if (!pricing) throw new NotFoundException('Paket harga tidak ditemukan');

    let harga = Number(pricing.harga);
    let referralInfo: { referralCodeId: string; isOwnerUsage: boolean; potongan: number } | null = null;

    if (dto.kodeReferral) {
      referralInfo = await this.referralService.validate(dto.kodeReferral, userId, harga);
      harga = Math.max(0, harga - referralInfo.potongan);
    }

    if (harga <= 0) {
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + pricing.durasiBulan);
      await this.contentService.grantAccessForPaket(userId, pricing.contentId, pricing.paket, expiresAt);
      if (referralInfo) {
        await this.referralService.commitUsage(referralInfo.referralCodeId, userId, referralInfo.isOwnerUsage, referralInfo.potongan);
      }
      return { free: true };
    }

    const existingTransaction = await this.prisma.transaction.findFirst({
      where: { userId, targetType: 'content_pricing', targetId: pricing.id, status: TransactionStatus.pending },
    });
    if (existingTransaction) {
      const totalTransfer = Number(existingTransaction.amount) + (existingTransaction.kodeUnik ?? 0);
      return { transaction: existingTransaction, kodeUnik: existingTransaction.kodeUnik, totalTransfer };
    }

    const kodeUnik = await this.generateUniqueCode();

    const transaction = await this.prisma.transaction.create({
      data: {
        userId,
        targetType: 'content_pricing',
        targetId: pricing.id,
        amount: harga,
        kodeUnik,
        status: TransactionStatus.pending,
      },
    });

    if (referralInfo) {
      await this.referralService.commitUsage(referralInfo.referralCodeId, userId, referralInfo.isOwnerUsage, referralInfo.potongan);
    }

    const payment = await this.paymentAdapter.createPayment(transaction.id, harga);
    const totalTransfer = harga + kodeUnik;

    return { transaction, payment, kodeUnik, totalTransfer };
  }

  private async generateUniqueCode(): Promise<number> {
    for (let i = 0; i < 20; i++) {
      const code = Math.floor(Math.random() * 900) + 100;
      const clash = await this.prisma.transaction.findFirst({
        where: { kodeUnik: code, status: TransactionStatus.pending },
      });
      if (!clash) return code;
    }
    return Math.floor(Math.random() * 900) + 100;
  }

  async createGenericPayment(userId: string, targetType: string, targetId: string, amount: number) {
    const kodeUnik = await this.generateUniqueCode();
    const transaction = await this.prisma.transaction.create({
      data: { userId, targetType, targetId, amount, kodeUnik, status: TransactionStatus.pending },
    });
    const totalTransfer = amount + kodeUnik;
    return { transaction, kodeUnik, totalTransfer };
  }

  async createForEventRegistration(userId: string, registrationId: string, amount: number) {
    return this.createGenericPayment(userId, 'event_registration', registrationId, amount);
  }

  async listMine(userId: string) {
    const list = await this.prisma.transaction.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
    return list.map((t) => ({
      ...t,
      totalTransfer: t.kodeUnik ? Number(t.amount) + t.kodeUnik : Number(t.amount),
    }));
  }

  async confirmManual(transactionId: string) {
    const transaction = await this.prisma.transaction.findUnique({ where: { id: transactionId } });
    if (!transaction) throw new NotFoundException('Transaksi tidak ditemukan');
    if (transaction.status !== TransactionStatus.pending) {
      throw new BadRequestException('Transaksi ini sudah diproses sebelumnya');
    }

    const updated = await this.prisma.transaction.update({
      where: { id: transactionId },
      data: { status: TransactionStatus.lunas, paidAt: new Date() },
    });

    await this.grantAccessAndRoyalty(updated);

    return updated;
  }

  async createForPsychTest(userId: string) {
    const setting = await this.prisma.psychTestSetting.findFirst();
    const harga = setting ? Number(setting.harga) : 0;
    if (harga <= 0) throw new BadRequestException('Harga tes berbayar belum diatur admin');
    return this.createGenericPayment(userId, 'psych_test', userId, harga);
  }

  private async grantAccessAndRoyalty(transaction: {
    id: string;
    userId: string;
    targetType: string;
    targetId: string;
    amount: any;
  }) {
    if (transaction.targetType === 'event_round') {
      return; // status Transaction.lunas sudah cukup jadi bukti bayar; dicek langsung saat startAttempt
    }

    if (transaction.targetType === 'event_registration') {
      await this.prisma.eventRegistration.update({
        where: { id: transaction.targetId },
        data: { status: RegistrationStatus.terdaftar },
      });
      return;
    }

    if (transaction.targetType === 'psych_test') {
      await this.prisma.psychTestAccess.create({ data: { userId: transaction.userId, dipakai: false } });
      return;
    }

    if (transaction.targetType !== 'content_pricing') return;

    const pricing = await this.prisma.contentPricing.findUnique({
      where: { id: transaction.targetId },
      include: { content: { include: { owner: true } } },
    });
    if (!pricing) return;

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + pricing.durasiBulan);
    await this.contentService.grantAccessForPaket(transaction.userId, pricing.contentId, pricing.paket, expiresAt);

    // Royalti CUMA dibuat kalau pemilik modul adalah tutor -- admin tidak dapat bagi hasil
    if (pricing.content.owner.role !== 'tutor') return;

    const splitKreatorPersen = 70;
    const splitPlatformPersen = 30;
    const hargaAsli = Number(pricing.harga);
    const amount = hargaAsli * (splitKreatorPersen / 100);

    await this.prisma.royaltyLedger.create({
      data: {
        contentId: pricing.contentId,
        tutorId: pricing.content.owner.id,
        studentId: transaction.userId,
        amount,
        tipe: 'per_akses',
        splitKreatorPersen,
        splitPlatformPersen,
      },
    });
  }

  async listPending() {
    const transactions = await this.prisma.transaction.findMany({
      where: { status: TransactionStatus.pending },
      include: { user: { select: { nama: true, kontak: true, role: true } } },
      orderBy: { createdAt: 'asc' },
    });

    return Promise.all(
      transactions.map(async (t) => {
        let namaProduk = t.targetType;
        if (t.targetType === 'content_pricing') {
          const pricing = await this.prisma.contentPricing.findUnique({ where: { id: t.targetId } });
          namaProduk = pricing ? `Modul (${pricing.durasiBulan} bulan)` : 'Modul (tidak ditemukan)';
        }
        if (t.targetType === 'event_registration') {
          const reg = await this.prisma.eventRegistration.findUnique({
            where: { id: t.targetId },
            include: { event: true },
          });
          namaProduk = reg ? `Pendaftaran Event: ${reg.event.nama}` : 'Event (tidak ditemukan)';
        }
        if (t.targetType === 'event_round') {
          const round = await this.prisma.eventRound.findUnique({
            where: { id: t.targetId },
            include: { event: true },
          });
          namaProduk = round ? `Babak: ${round.namaBabak} (${round.event.nama})` : 'Babak (tidak ditemukan)';
        }        
        
        const totalTransfer = t.kodeUnik ? Number(t.amount) + t.kodeUnik : Number(t.amount);
        return { ...t, namaProduk, totalTransfer };
      }),
    );
  }

  async countPending() {
    const menunggu = await this.prisma.transaction.count({ where: { status: { not: TransactionStatus.lunas } } });
    return { transaksiMenunggu: menunggu };
  }
}