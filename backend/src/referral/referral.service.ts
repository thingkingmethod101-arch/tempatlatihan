import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReferralType, ReferralStatus } from '@prisma/client';

function generateKode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let kode = '';
  for (let i = 0; i < 6; i++) kode += chars[Math.floor(Math.random() * chars.length)];
  return kode;
}

@Injectable()
export class ReferralService {
  constructor(private prisma: PrismaService) {}

  async create(dto: { ownerId: string; tipe: 'diskon' | 'cashback'; persenDiskon?: number; maxUsage?: number; jumlahCashback?: number }) {
    let kode = generateKode();
    for (let i = 0; i < 10; i++) {
      const clash = await this.prisma.referralCode.findUnique({ where: { kode } });
      if (!clash) break;
      kode = generateKode();
    }

    return this.prisma.referralCode.create({
      data: {
        kode,
        tipe: dto.tipe as ReferralType,
        ownerId: dto.ownerId,
        persenDiskon: dto.tipe === 'diskon' ? dto.persenDiskon : undefined,
        maxUsage: dto.tipe === 'diskon' ? (dto.maxUsage ?? 10) : 1,
        jumlahCashback: dto.tipe === 'cashback' ? dto.jumlahCashback : undefined,
      },
    });
  }

  async listAll() {
    const codes = await this.prisma.referralCode.findMany({
      include: { usages: true },
      orderBy: { createdAt: 'desc' },
    });
    const owners = await this.prisma.user.findMany({
      where: { id: { in: codes.map((c) => c.ownerId) } },
      select: { id: true, nama: true, kontak: true },
    });
    const semuaUserIdPengguna = codes.flatMap((c) => c.usages.map((u) => u.userId));
    const penggunaUsers = await this.prisma.user.findMany({
      where: { id: { in: semuaUserIdPengguna } },
      select: { id: true, nama: true },
    });

    return codes.map((c) => {
      const owner = owners.find((o) => o.id === c.ownerId);
      const usageOrangLain = c.usages.filter((u) => !u.isOwnerUsage);
      return {
        id: c.id,
        kode: c.kode,
        tipe: c.tipe,
        status: c.status,
        persenDiskon: c.persenDiskon,
        maxUsage: c.maxUsage,
        namaPemilik: owner?.nama ?? '-',
        kontakPemilik: owner?.kontak ?? '-',
        pemilikPernahPakaiSendiri: c.usages.some((u) => u.isOwnerUsage),
        jumlahDipakaiOrangLain: usageOrangLain.length,
        penggunaLain: usageOrangLain.map((u) => penggunaUsers.find((x) => x.id === u.userId)?.nama ?? '-'),
      };
    });
  }

  async getMyCodes(userId: string) {
    const codes = await this.prisma.referralCode.findMany({
      where: { ownerId: userId },
      include: { usages: true },
      orderBy: { createdAt: 'desc' },
    });
    return codes.map((c) => ({
      id: c.id,
      kode: c.kode,
      tipe: c.tipe,
      status: c.status,
      persenDiskon: c.persenDiskon,
      maxUsage: c.maxUsage,
      jumlahDipakaiOrangLain: c.usages.filter((u) => !u.isOwnerUsage).length,
    }));
  }
  listByOwner(ownerId: string) {
    return this.prisma.referralCode.findMany({ where: { ownerId } });
  }
  async validate(kode: string, userId: string, hargaAsli: number) {
    const code = await this.prisma.referralCode.findUnique({ where: { kode: kode.toUpperCase() } });
    if (!code) throw new NotFoundException('Kode referral tidak ditemukan');
    if (code.status !== ReferralStatus.aktif) throw new BadRequestException('Kode referral sudah tidak aktif');
    if (code.tipe !== 'diskon') throw new BadRequestException('Kode ini bukan kode diskon');
    if (this.cekKadaluarsa(code)) {
      throw new BadRequestException('Kode referral ini sudah kadaluarsa (lebih dari 30 hari sejak dibuat)');
    }

    const sudahDipakai = await this.prisma.referralUsage.findUnique({
      where: { referralCodeId_userId: { referralCodeId: code.id, userId } },
    });
    if (sudahDipakai) throw new BadRequestException('Kamu sudah pernah memakai kode ini');

    const isOwnerUsage = code.ownerId === userId;
    if (!isOwnerUsage) {
      const jumlahOrangLain = await this.prisma.referralUsage.count({
        where: { referralCodeId: code.id, isOwnerUsage: false },
      });
      if (code.maxUsage != null && jumlahOrangLain >= code.maxUsage) {
        throw new BadRequestException('Kuota pemakaian kode referral ini sudah penuh');
      }
    }

    const persen = code.persenDiskon ?? 0;
    const potongan = Math.round((hargaAsli * persen) / 100);
    return { referralCodeId: code.id, isOwnerUsage, potongan };
  }

  async commitUsage(referralCodeId: string, userId: string, isOwnerUsage: boolean, discountAmount: number) {
    await this.prisma.referralUsage.create({
      data: { referralCodeId, userId, isOwnerUsage, discountAmount },
    });
  }

  async deleteCode(id: string) {
    await this.prisma.referralUsage.deleteMany({ where: { referralCodeId: id } });
    await this.prisma.referralCode.delete({ where: { id } });
    return { deleted: true };
  }

  async checkOnly(kode: string, userId: string) {
    const code = await this.prisma.referralCode.findUnique({ where: { kode: kode.toUpperCase() } });
    if (!code) throw new NotFoundException('Kode referral tidak ditemukan');
    if (code.status !== ReferralStatus.aktif) throw new BadRequestException('Kode referral sudah tidak aktif');
    if (code.tipe !== 'diskon') throw new BadRequestException('Kode ini bukan kode diskon');

    const sudahDipakai = await this.prisma.referralUsage.findUnique({
      where: { referralCodeId_userId: { referralCodeId: code.id, userId } },
    });
    if (sudahDipakai) throw new BadRequestException('Kamu sudah pernah memakai kode ini');

    return { valid: true, persenDiskon: code.persenDiskon };
  }

  private cekKadaluarsa(kode: { createdAt: Date }) {
    const batasWaktu = new Date(kode.createdAt);
    batasWaktu.setDate(batasWaktu.getDate() + 30);
    return new Date() > batasWaktu;
  }

  async selesaikanCashback(id: string, adminId: string) {
    const code = await this.prisma.referralCode.findUnique({ where: { id }, include: { usages: true } });
    if (!code) throw new NotFoundException('Kode tidak ditemukan');
    if (code.tipe !== 'cashback') throw new BadRequestException('Ini bukan kode cashback');
    if (code.usages.length === 0) throw new BadRequestException('Kode ini belum pernah dipakai');

    const updated = await this.prisma.referralCode.update({ where: { id }, data: { status: ReferralStatus.selesai } });

    if (code.jumlahCashback && Number(code.jumlahCashback) > 0) {
      await this.prisma.ledgerEntry.create({
        data: {
          keterangan: `Cashback referral kode ${code.kode}`,
          tipe: 'keluar',
          jumlah: code.jumlahCashback,
          createdBy: adminId,
        },
      });
    }

    return updated;
  }

  async redeemCashback(kode: string, userId: string) {
    const code = await this.prisma.referralCode.findUnique({
      where: { kode: kode.toUpperCase() },
      include: { usages: true },
    });
    if (!code) throw new NotFoundException('Kode referral tidak ditemukan');
    if (code.tipe !== 'cashback') throw new BadRequestException('Kode ini bukan kode cashback');
    if (this.cekKadaluarsa(code)) {
      throw new BadRequestException('Kode cashback ini sudah kadaluarsa (lebih dari 30 hari sejak dibuat)');
    }
    if (code.status !== 'aktif') throw new BadRequestException('Kode ini sudah tidak aktif/sudah diproses');
    if (code.usages.length > 0) throw new BadRequestException('Kode ini sudah pernah diklaim orang lain');

    await this.prisma.referralUsage.create({
      data: { referralCodeId: code.id, userId, discountAmount: 0 },
    });

    return { message: 'Kode berhasil diklaim! Admin akan segera memproses transfer cashback-nya.' };
  }
}