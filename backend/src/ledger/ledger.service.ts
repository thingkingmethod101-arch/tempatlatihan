import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { STORAGE_ADAPTER } from '../storage/storage.module';
import type { StorageAdapter } from '../storage/storage-adapter.interface';
import * as ExcelJS from 'exceljs';

@Injectable()
export class LedgerService {
  constructor(
    private prisma: PrismaService,
    @Inject(STORAGE_ADAPTER) private storage: StorageAdapter,
  ) {}

  private async resolveBukti(fileAssetId: string | null): Promise<string | null> {
    if (!fileAssetId) return null;
    const fileAsset = await this.prisma.fileAsset.findUnique({ where: { id: fileAssetId } });
    if (!fileAsset) return null;
    const signed = await this.storage.getSignedUrl(fileAsset.path, 3600);
    return signed.available ? (signed.url ?? null) : null;
  }

  async createEntry(adminId: string, dto: { keterangan: string; tipe: string; jumlah: number; buktiFileAssetId?: string; kodeAkun?: string }) {
    return this.prisma.ledgerEntry.create({
      data: {
        keterangan: dto.keterangan,
        tipe: dto.tipe,
        jumlah: dto.jumlah,
        buktiFileAssetId: dto.buktiFileAssetId,
        kodeAkun: dto.kodeAkun,
        createdBy: adminId,
      },
    });
  }

  async attachBukti(sumber: 'manual' | 'transaksi', id: string, buktiFileAssetId: string) {
    if (sumber === 'manual') {
      return this.prisma.ledgerEntry.update({ where: { id }, data: { buktiFileAssetId } });
    }
    return this.prisma.transaction.update({ where: { id }, data: { buktiFileAssetId } });
  }

  async listCombined() {
    const manualEntries = await this.prisma.ledgerEntry.findMany({ orderBy: { tanggal: 'desc' } });
    const manualResolved = await Promise.all(
      manualEntries.map(async (e) => ({
        id: e.id,
        sumber: 'manual' as const,
        tanggal: e.tanggal,
        keterangan: e.keterangan,
        tipe: e.tipe,
        jumlah: Number(e.jumlah),
        kodeAkun: e.kodeAkun,
        buktiUrl: await this.resolveBukti(e.buktiFileAssetId),
      })),
    );

    const paidTransactions = await this.prisma.transaction.findMany({
      where: { status: 'lunas' },
      include: { user: { select: { nama: true } } },
      orderBy: { paidAt: 'desc' },
    });
    const transactionResolved = await Promise.all(
      paidTransactions.map(async (t) => {
        let namaProduk: string = t.targetType;
        if (t.targetType === 'content_pricing') {
          const pricing = await this.prisma.contentPricing.findUnique({ where: { id: t.targetId } });
          namaProduk = pricing ? `Modul (${pricing.durasiBulan} bulan)` : 'Modul';
        } else if (t.targetType === 'event_registration') {
          const reg = await this.prisma.eventRegistration.findUnique({ where: { id: t.targetId }, include: { event: true } });
          namaProduk = reg ? `Pendaftaran Event: ${reg.event.nama}` : 'Event';
        } else if (t.targetType === 'event_round') {
          const round = await this.prisma.eventRound.findUnique({ where: { id: t.targetId }, include: { event: true } });
          namaProduk = round ? `Babak: ${round.namaBabak} (${round.event.nama})` : 'Babak';
        }
        return {
          id: t.id,
          sumber: 'transaksi' as const,
          tanggal: t.paidAt,
          keterangan: `${namaProduk} — ${t.user.nama}`,
          tipe: 'masuk',
          jumlah: Number(t.amount) + (t.kodeUnik ?? 0),
          buktiUrl: await this.resolveBukti(t.buktiFileAssetId),
        };
      }),
    );

    return [...manualResolved, ...transactionResolved].sort(
      (a, b) => new Date(b.tanggal ?? 0).getTime() - new Date(a.tanggal ?? 0).getTime(),
    );
  }

  async exportToExcel(): Promise<Buffer> {
    const rows = await this.listCombined();

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Pembukuan');

    sheet.columns = [
      { header: 'Tanggal', key: 'tanggal', width: 15 },
      { header: 'Keterangan', key: 'keterangan', width: 45 },
      { header: 'Kode Akun', key: 'kodeAkun', width: 12 },
      { header: 'Sumber', key: 'sumber', width: 12 },
      { header: 'Tipe', key: 'tipe', width: 10 },
      { header: 'Jumlah (Rp)', key: 'jumlah', width: 16 },
    ];

    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF12325C' } };

    for (const r of rows) {
      sheet.addRow({
        tanggal: r.tanggal ? new Date(r.tanggal).toLocaleDateString('id-ID') : '-',
        keterangan: r.keterangan,
        kodeAkun: (r as any).kodeAkun ?? '-',
        sumber: r.sumber === 'manual' ? 'Manual' : 'Otomatis',
        tipe: r.tipe === 'masuk' ? 'Masuk' : 'Keluar',
        jumlah: r.jumlah,
      });
    }

    const totalMasuk = rows.filter((r) => r.tipe === 'masuk').reduce((s, r) => s + r.jumlah, 0);
    const totalKeluar = rows.filter((r) => r.tipe === 'keluar').reduce((s, r) => s + r.jumlah, 0);

    sheet.addRow({});
    const rowMasuk = sheet.addRow({ keterangan: 'TOTAL UANG MASUK', jumlah: totalMasuk });
    rowMasuk.font = { bold: true };
    const rowKeluar = sheet.addRow({ keterangan: 'TOTAL UANG KELUAR', jumlah: totalKeluar });
    rowKeluar.font = { bold: true };
    const rowSelisih = sheet.addRow({ keterangan: 'SELISIH (MASUK - KELUAR)', jumlah: totalMasuk - totalKeluar });
    rowSelisih.font = { bold: true, color: { argb: totalMasuk - totalKeluar >= 0 ? 'FF0E9C82' : 'FFB91C1C' } };

    sheet.getColumn('jumlah').numFmt = '#,##0';

    const ringkasan = await this.getRingkasanPerKode();
    const sheetRingkasan = workbook.addWorksheet('Ringkasan per Kode Akun');
    sheetRingkasan.columns = [
      { header: 'Kode Akun', key: 'kodeAkun', width: 12 },
      { header: 'Nama Kategori', key: 'nama', width: 35 },
      { header: 'Tipe', key: 'tipe', width: 10 },
      { header: 'Jumlah Entri', key: 'jumlahEntri', width: 12 },
      { header: 'Total (Rp)', key: 'total', width: 16 },
    ];
    sheetRingkasan.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheetRingkasan.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF12325C' } };
    for (const r of ringkasan) {
      sheetRingkasan.addRow({
        kodeAkun: r.kodeAkun,
        nama: r.nama,
        tipe: r.tipe === 'masuk' ? 'Masuk' : 'Keluar',
        jumlahEntri: r.jumlahEntri,
        total: r.total,
      });
    }
    sheetRingkasan.getColumn('total').numFmt = '#,##0';

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  listKodeAkun() {
    return this.prisma.kodeAkunReference.findMany({ orderBy: { kode: 'asc' } });
  }

  createKodeAkun(kode: string, nama: string) {
    return this.prisma.kodeAkunReference.create({ data: { kode, nama } });
  }

  async deleteKodeAkun(id: string) {
    await this.prisma.kodeAkunReference.delete({ where: { id } });
    return { deleted: true };
  }

  async getRingkasanPerKode() {
    const [entries, referensi] = await Promise.all([
      this.prisma.ledgerEntry.findMany({ where: { kodeAkun: { not: null } } }),
      this.prisma.kodeAkunReference.findMany(),
    ]);

    const grouped = new Map<string, { kodeAkun: string; nama: string; tipe: string; total: number; jumlahEntri: number }>();
    for (const e of entries) {
      const kode = e.kodeAkun!;
      if (!grouped.has(kode)) {
        const ref = referensi.find((r) => r.kode === kode);
        grouped.set(kode, {
          kodeAkun: kode,
          nama: ref?.nama ?? '(belum didefinisikan di tabel referensi)',
          tipe: e.tipe,
          total: 0,
          jumlahEntri: 0,
        });
      }
      const g = grouped.get(kode)!;
      g.total += Number(e.jumlah);
      g.jumlahEntri++;
    }

    return Array.from(grouped.values()).sort((a, b) => b.total - a.total);
  }
}