import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RiasecMappingService } from '../riasec-mapping/riasec-mapping.service';
import {
  RIASEC_DESKRIPSI_MENDALAM,
  GAYA_INFO,
  analisisKonsentrasiLengkap,
  analisisSilangMapel,
  analisisSilangTalenta,
  buatRencana30_60_90,
} from './laporan-komprehensif';
import { TalentService } from '../talent/talent.service';

@Injectable()
export class PsychTestService {
  constructor(
    private prisma: PrismaService,
    private riasecMapping: RiasecMappingService,
    private talentService: TalentService,
  ) {}

  createQuestion(dto: {
    teks: string;
    allowMultiple: boolean;
    urutan: number;
    options: { teks: string; bobot: Record<string, number> }[];
  }) {
    return this.prisma.psychTestQuestion.create({
      data: {
        teks: dto.teks,
        allowMultiple: dto.allowMultiple,
        urutan: dto.urutan,
        options: { create: dto.options.map((o) => ({ teks: o.teks, bobot: o.bobot })) },
      },
      include: { options: true },
    });
  }

  listQuestionsForAdmin() {
    return this.prisma.psychTestQuestion.findMany({ include: { options: true }, orderBy: { urutan: 'asc' } });
  }

  async listQuestionsForStudent() {
    const questions = await this.prisma.psychTestQuestion.findMany({
      include: { options: true },
      orderBy: { urutan: 'asc' },
    });
    return questions.map((q) => ({
      id: q.id,
      teks: q.teks,
      allowMultiple: q.allowMultiple,
      options: q.options.map((o) => ({ id: o.id, teks: o.teks })),
    }));
  }

  async submit(userId: string, jawaban: Record<string, string[]>, tipeTes: 'gratis' | 'berbayar' = 'gratis') {
    if (tipeTes === 'gratis') {
      const sudahPernah = await this.prisma.psychTestResult.findFirst({ where: { userId, tipeTes: 'gratis' } });
      if (sudahPernah) {
        throw new ForbiddenException('Kamu sudah pernah memakai jatah tes gratis. Silakan bayar untuk mengulang dengan versi lebih lengkap dan presisi.');
      }
    } else {
      const akses = await this.prisma.psychTestAccess.findFirst({ where: { userId, dipakai: false } });
      if (!akses) {
        throw new ForbiddenException('Kamu belum memiliki akses tes berbayar. Silakan lakukan pembayaran terlebih dahulu.');
      }
      await this.prisma.psychTestAccess.update({ where: { id: akses.id }, data: { dipakai: true } });
    }

    const optionIds = Object.values(jawaban).flat();
    const options = await this.prisma.psychTestOption.findMany({ where: { id: { in: optionIds } } });

    const rawScore: Record<string, number> = {};
    for (const opt of options) {
      const bobot = opt.bobot as Record<string, number>;
      for (const [trait, weight] of Object.entries(bobot)) {
        rawScore[trait] = (rawScore[trait] ?? 0) + weight;
      }
    }

    const groups: Record<string, Record<string, number>> = {};
    for (const [trait, val] of Object.entries(rawScore)) {
      const [group] = trait.split('_');
      groups[group] = groups[group] || {};
      groups[group][trait] = val;
    }

    const skorTrait: Record<string, Record<string, number>> = {};
    for (const [group, traits] of Object.entries(groups)) {
      const total = Object.values(traits).reduce((a, b) => a + b, 0);
      skorTrait[group] = {};
      for (const [trait, val] of Object.entries(traits)) {
        skorTrait[group][trait] = total > 0 ? Math.round((val / total) * 1000) / 10 : 0;
      }
    }

    const rekomendasi = this.buildRecommendation(skorTrait);
    const laporanKomprehensif = tipeTes === 'berbayar'
      ? await this.buildLaporanKomprehensif(userId, skorTrait)
      : [];


    if (skorTrait.riasec) {
      const top2 = Object.entries(skorTrait.riasec)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([trait]) => trait.replace('riasec_', '').toUpperCase());
      if (top2.length === 2) {
        const saran = await this.riasecMapping.lookup(top2.join(''));
        if (saran) {
          rekomendasi.push(`Saran Jurusan: ${saran.saranJurusan}`);
          rekomendasi.push(`Saran Karier: ${saran.saranKarir}`);
        }
      }
    }

    const created = await this.prisma.psychTestResult.create({
      data: { userId, jawaban, skorTrait, rekomendasi, tipeTes, laporanKomprehensif },
    });
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { nama: true, jenisKelamin: true, tanggalLahir: true },
    });
    return { ...created, user };
  }

  private buildRecommendation(skorTrait: Record<string, Record<string, number>>): string[] {
    const catatan: string[] = [];
    const RIASEC_NAMA: Record<string, string> = {
      R: 'Realistic',
      I: 'Investigative',
      A: 'Artistic',
      S: 'Social',
      E: 'Enterprising',
      C: 'Conventional',
    };

    if (skorTrait.konsentrasi) {
      const rendah = skorTrait.konsentrasi['konsentrasi_rendah'] ?? 0;
      if (rendah >= 50) {
        catatan.push('Kamu cenderung sulit fokus lama — coba teknik Pomodoro (sesi belajar singkat + istirahat rutin).');
      }
    }
    if (skorTrait.gaya) {
      const top = Object.entries(skorTrait.gaya).sort((a, b) => b[1] - a[1])[0];
      if (top) catatan.push(`Gaya belajar dominan: ${top[0].replace('gaya_', '')} (${top[1]}%).`);
    }
    if (skorTrait.riasec) {
      const top = Object.entries(skorTrait.riasec).sort((a, b) => b[1] - a[1])[0];
      if (top) {
        const kode = top[0].replace('riasec_', '');
        const nama = RIASEC_NAMA[kode] ?? kode;
        catatan.push(`Tipe minat karier dominan: ${nama} (${kode}) — ${top[1]}%. (Kerangka RIASEC: Realistic, Investigative, Artistic, Social, Enterprising, Conventional)`);
      }
    }
    if (skorTrait.mapel) {
      const top3 = Object.entries(skorTrait.mapel).sort((a, b) => b[1] - a[1]).slice(0, 3);
      if (top3.length) {
        catatan.push(`Minat mata pelajaran teratas: ${top3.map(([k, v]) => `${k.replace('mapel_', '')} (${v}%)`).join(', ')}.`);
      }
    }
    return catatan;
  }

  private async buildLaporanKomprehensif(userId: string, skorTrait: Record<string, Record<string, number>>) {
    const bagian: { judul: string; isi: string[] }[] = [];

    const top2Riasec = skorTrait.riasec
      ? Object.entries(skorTrait.riasec).sort((a, b) => b[1] - a[1]).map(([k]) => k.replace('riasec_', ''))
      : [];
    const kodeTertinggi = top2Riasec[0];

    if (kodeTertinggi && RIASEC_DESKRIPSI_MENDALAM[kodeTertinggi]) {
      const d = RIASEC_DESKRIPSI_MENDALAM[kodeTertinggi];
      bagian.push({
        judul: 'Ringkasan Eksekutif',
        isi: [
          `Berdasarkan hasil tes lengkap, tipe kepribadian dominanmu adalah ${d.nama} (${kodeTertinggi}) — kamu ${d.karakter} Laporan ini akan membahas secara rinci profil kepribadianmu di keenam dimensi RIASEC, gaya belajar, tingkat konsentrasi, minat akademik, serta rencana pengembangan diri yang bisa langsung kamu terapkan.`,
        ],
      });
    }

    if (skorTrait.riasec) {
      const semuaUrut = Object.entries(skorTrait.riasec).sort((a, b) => b[1] - a[1]);
      const isiProfil: string[] = [];
      for (const [traitKey, skor] of semuaUrut) {
        const kode = traitKey.replace('riasec_', '');
        const d = RIASEC_DESKRIPSI_MENDALAM[kode];
        if (!d) continue;
        isiProfil.push(
          `${d.nama} (${kode}) — ${skor}%. Kamu ${d.karakter} Kekuatan: kamu ${d.kekuatan} Area berkembang: ${d.areaBerkembang} Contoh aktivitas yang cocok: ${d.contohAktivitas}`
        );
      }
      bagian.push({ judul: 'Profil Kepribadian RIASEC Lengkap (6 Dimensi)', isi: isiProfil });
    }

    if (skorTrait.gaya) {
      const top = Object.entries(skorTrait.gaya).sort((a, b) => b[1] - a[1])[0];
      if (top) {
        const kode = top[0].replace('gaya_', '');
        const info = GAYA_INFO[kode];
        if (info) {
          bagian.push({
            judul: `Gaya Belajar Dominan: ${info.nama} (${top[1]}%)`,
            isi: [info.tips, `Rencana penerapan mingguan: ${info.rencanaMingguan}`],
          });
        }
      }
    }

    if (skorTrait.konsentrasi) {
      const tinggi = skorTrait.konsentrasi['konsentrasi_tinggi'] ?? 0;
      const rendah = skorTrait.konsentrasi['konsentrasi_rendah'] ?? 0;
      const analisis = analisisKonsentrasiLengkap(tinggi, rendah);
      bagian.push({
        judul: 'Analisis Tingkat Konsentrasi',
        isi: [analisis.ringkasan, `Rencana aksi: ${analisis.rencanaAksi}`],
      });
    }

    if (skorTrait.mapel) {
      const semuaMapel = Object.entries(skorTrait.mapel).sort((a, b) => b[1] - a[1]);
      const isiMapel = semuaMapel.map(([k, v]) => `${k.replace('mapel_', '').replace(/_/g, ' ')}: ${v}%`);
      bagian.push({
        judul: 'Peta Minat terhadap Semua Mata Pelajaran',
        isi: [`Berikut urutan minatmu terhadap tiap mata pelajaran, dari yang paling diminati: ${isiMapel.join(', ')}.`],
      });
    }

    const isiSilang: string[] = [];
    if (kodeTertinggi && skorTrait.mapel) {
      const topMapel = Object.entries(skorTrait.mapel).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => k.replace('mapel_', ''));
      const silang = analisisSilangMapel(kodeTertinggi, topMapel);
      if (silang) isiSilang.push(silang);
    }
    if (kodeTertinggi) {
      const talentSiswa = await this.talentService.getMySummary(userId).catch(() => []);
      const talentTertinggi = Array.isArray(talentSiswa) && talentSiswa.length > 0
        ? { skillNode: talentSiswa[0].skillNode, akurasi: Number(talentSiswa[0].akurasi) }
        : null;
      const silangTalenta = analisisSilangTalenta(kodeTertinggi, talentTertinggi);
      if (silangTalenta) isiSilang.push(silangTalenta);
    }
    if (isiSilang.length > 0) {
      bagian.push({ judul: 'Analisis Silang (Cross-Reference)', isi: isiSilang });
    }

    if (kodeTertinggi && RIASEC_DESKRIPSI_MENDALAM[kodeTertinggi]) {
      const d = RIASEC_DESKRIPSI_MENDALAM[kodeTertinggi];
      bagian.push({
        judul: 'Rencana Pengembangan Diri (30/60/90 Hari)',
        isi: buatRencana30_60_90(d.nama, d.contohAktivitas),
      });
    }

    bagian.push({
      judul: 'Kesimpulan',
      isi: [
        'Ingat, hasil tes ini adalah titik awal untuk mengenal dirimu lebih baik, bukan vonis akhir yang membatasi pilihanmu. Minat dan kemampuan bisa terus berkembang seiring waktu dan pengalaman. Gunakan laporan ini sebagai peta untuk eksplorasi, bukan sebagai batasan.',
      ],
    });

    return bagian;
  }

  async getLatest(userId: string) {
    const result = await this.prisma.psychTestResult.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } });
    if (!result) return null;
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { nama: true, jenisKelamin: true, tanggalLahir: true },
    });
    return { ...result, user };
  }

  async deleteQuestion(id: string) {
    await this.prisma.psychTestOption.deleteMany({ where: { questionId: id } });
    await this.prisma.psychTestQuestion.delete({ where: { id } });
    return { deleted: true };
  }

  async bulkCreateQuestions(data: unknown) {
    if (!Array.isArray(data)) {
      throw new BadRequestException('Format JSON harus berupa daftar/array pertanyaan');
    }

    let berhasil = 0;
    const gagal: string[] = [];

    for (const item of data) {
      try {
        if (!item || typeof item !== 'object') throw new Error('Item tidak valid');
        const { teks, allowMultiple, urutan, options } = item as any;
        if (!teks || !Array.isArray(options) || options.length === 0) {
          throw new Error('Field wajib (teks/options) kosong');
        }
        await this.createQuestion({
          teks,
          allowMultiple: !!allowMultiple,
          urutan: Number(urutan) || 0,
          options,
        });
        berhasil++;
      } catch (e) {
        gagal.push(JSON.stringify(item).slice(0, 80));
      }
    }

    return { berhasil, gagal, totalDiproses: data.length };
  }

  async upgradeLaporan(userId: string) {
    const akses = await this.prisma.psychTestAccess.findFirst({ where: { userId, dipakai: false } });
    if (!akses) throw new ForbiddenException('Kamu belum memiliki akses berbayar. Silakan bayar terlebih dahulu.');

    const latest = await this.prisma.psychTestResult.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } });
    if (!latest) throw new BadRequestException('Kamu belum pernah mengerjakan tes gratis.');

    const laporanKomprehensif = await this.buildLaporanKomprehensif(userId, latest.skorTrait as any);

    await this.prisma.psychTestAccess.update({ where: { id: akses.id }, data: { dipakai: true } });

    const updated = await this.prisma.psychTestResult.update({
      where: { id: latest.id },
      data: { tipeTes: 'berbayar', laporanKomprehensif },
    });
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { nama: true, jenisKelamin: true, tanggalLahir: true },
    });
    return { ...updated, user };
  }

  async resetGratisSiswa(userId: string) {
    await this.prisma.psychTestResult.deleteMany({ where: { userId } });
    return { reset: true };
  }

  async getStatus(userId: string) {
    const sudahGratis = await this.prisma.psychTestResult.findFirst({ where: { userId, tipeTes: 'gratis' } });
    const setting = await this.prisma.psychTestSetting.findFirst();
    const punyaAksesBerbayar = await this.prisma.psychTestAccess.findFirst({ where: { userId, dipakai: false } });
    return {
      sudahPakaiGratis: !!sudahGratis,
      harga: setting ? Number(setting.harga) : 0,
      punyaAksesBerbayarBelumDipakai: !!punyaAksesBerbayar,
    };
  }
  async getSettings() {
    const setting = await this.prisma.psychTestSetting.findFirst();
    return { harga: setting ? Number(setting.harga) : 0 };
  }

  async updateSettings(harga: number) {
    const existing = await this.prisma.psychTestSetting.findFirst();
    if (existing) {
      return this.prisma.psychTestSetting.update({ where: { id: existing.id }, data: { harga } });
    }
    return this.prisma.psychTestSetting.create({ data: { harga } });
  }


  async verifyPublic(id: string) {
    const result = await this.prisma.psychTestResult.findUnique({
      where: { id },
      include: { user: { select: { nama: true } } },
    });
    if (!result) return null;
    return {
      nama: result.user.nama,
      tanggal: result.createdAt,
      tipeTes: result.tipeTes,
    };
  }

  async getLatestForUser(userId: string) {
    return this.prisma.psychTestResult.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { nama: true, jenisKelamin: true, tanggalLahir: true } } },
    });
  }

}