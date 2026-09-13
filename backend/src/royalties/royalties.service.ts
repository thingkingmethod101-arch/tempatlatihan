import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RoyaltiesService {
  constructor(private prisma: PrismaService) {}

  async getMine(userId: string) {
    const entries = await this.prisma.royaltyLedger.findMany({
      where: { tutorId: userId },
      include: { content: true },
      orderBy: { createdAt: 'desc' },
    });
    const total = entries.reduce((sum, e) => sum + Number(e.amount), 0);
    return { total, entries };
  }

  // tutorId undefined -> semua tutor (untuk admin). Diisi -> hanya milik tutor itu.
  async getByContent(tutorId?: string) {
    const entries = await this.prisma.royaltyLedger.findMany({
      where: tutorId ? { tutorId } : undefined,
      include: { content: { include: { owner: { include: { tutorProfile: true } } } } },
      orderBy: { createdAt: 'desc' },
    });

    const grouped = new Map<string, any>();
    for (const e of entries) {
      if (!grouped.has(e.contentId)) {
        grouped.set(e.contentId, {
          contentId: e.contentId,
          namaTutor: e.content.owner.nama,
          kontakTutor: e.content.owner.kontak,
          infoRekening: e.content.owner.tutorProfile?.infoRekening ?? null,
          deskripsi: e.content.deskripsi,
          totalKreator: 0,
          totalPlatform: 0,
          totalPenjualan: 0,
          pembeliIds: new Set<string>(),
          semuaSudahDibayar: true,
        });
      }
      const g = grouped.get(e.contentId);
      const kreator = Number(e.amount);
      const totalTransaksi = e.splitKreatorPersen > 0 ? kreator / (e.splitKreatorPersen / 100) : kreator;
      const platform = totalTransaksi - kreator;
      g.totalKreator += kreator;
      g.totalPlatform += platform;
      g.totalPenjualan += totalTransaksi;
      g.pembeliIds.add(e.studentId);
      if (!e.payoutId) g.semuaSudahDibayar = false;
    }

    const result: any[] = [];
    for (const g of grouped.values()) {
      const pembeli = await this.prisma.user.findMany({
        where: { id: { in: [...g.pembeliIds] } },
        select: { id: true, nama: true },
      });
      result.push({
        contentId: g.contentId,
        namaTutor: g.namaTutor,
        kontakTutor: g.kontakTutor,
        infoRekening: g.infoRekening,
        deskripsi: g.deskripsi,
        jumlahPembeli: g.pembeliIds.size,
        pembeli,
        totalPenjualan: Math.round(g.totalPenjualan),
        totalKreator: Math.round(g.totalKreator),
        totalPlatform: Math.round(g.totalPlatform),
        sudahDibayarSemua: g.semuaSudahDibayar,
      });
    }
    return result;
  }

  async payoutForContent(contentId: string, adminId: string) {
    const pendingEntries = await this.prisma.royaltyLedger.findMany({
      where: { contentId, payoutId: null },
      include: { content: { include: { owner: true } } },
    });
    if (pendingEntries.length === 0) {
      throw new NotFoundException('Tidak ada royalti pending untuk konten ini (mungkin sudah dibayar semua)');
    }

    const tutorId = pendingEntries[0].tutorId;
    const namaTutor = pendingEntries[0].content.owner.nama;
    const totalJumlah = pendingEntries.reduce((sum, e) => sum + Number(e.amount), 0);

    const payout = await this.prisma.payout.create({
      data: {
        tutorId,
        jumlah: totalJumlah,
        status: 'selesai',
        periode: new Date().toISOString().slice(0, 7),
      },
    });

    await this.prisma.royaltyLedger.updateMany({
      where: { id: { in: pendingEntries.map((e) => e.id) } },
      data: { payoutId: payout.id },
    });

    await this.prisma.ledgerEntry.create({
      data: {
        keterangan: `Pembayaran royalti ke tutor ${namaTutor}`,
        tipe: 'keluar',
        jumlah: totalJumlah,
        createdBy: adminId,
      },
    });

    return payout;
  }

  async getMyTier(tutorId: string) {
    const entries = await this.prisma.royaltyLedger.findMany({ where: { tutorId } });

    let totalPenjualanSemua = 0;
    for (const e of entries) {
      const kreator = Number(e.amount);
      const totalTransaksi = e.splitKreatorPersen > 0 ? kreator / (e.splitKreatorPersen / 100) : kreator;
      totalPenjualanSemua += totalTransaksi;
    }

    let tier: 'gold' | 'silver' | null = null;
    if (totalPenjualanSemua >= 100_000_000) tier = 'gold';
    else if (totalPenjualanSemua >= 50_000_000) tier = 'silver';

    return { totalPenjualanSemua: Math.round(totalPenjualanSemua), tier };
  }
}