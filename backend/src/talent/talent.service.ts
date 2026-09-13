import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCareerMappingDto } from './dto/create-career-mapping.dto';
import { SubmitLearningStyleDto } from './dto/submit-learning-style.dto';


@Injectable()
export class TalentService {
  constructor(private prisma: PrismaService) {}

  // Dipanggil oleh cron nightly DAN endpoint trigger manual admin
  async recomputeTalentSummary() {
    const groups = await this.prisma.submission.groupBy({
      by: ['userId', 'skillNodeId'],
      _count: { _all: true },
    });

    let userSkillDiproses = 0;

    for (const group of groups) {
      const totalSoal = group._count._all;
      const benarCount = await this.prisma.submission.count({
        where: { userId: group.userId, skillNodeId: group.skillNodeId, benar: true },
      });
      const akurasi = totalSoal > 0 ? Math.round((benarCount / totalSoal) * 10000) / 100 : 0;

      await this.prisma.talentSummaryCache.upsert({
        where: { userId_skillNodeId: { userId: group.userId, skillNodeId: group.skillNodeId } },
        update: { akurasi, totalSoal, lastComputedAt: new Date() },
        create: { userId: group.userId, skillNodeId: group.skillNodeId, akurasi, totalSoal },
      });

      userSkillDiproses++;
    }

    await this.recomputeRankings();

    return { userSkillDiproses };
  }

  private async recomputeRankings() {
    const skillNodes = await this.prisma.talentSummaryCache.findMany({
      select: { skillNodeId: true },
      distinct: ['skillNodeId'],
    });

    for (const { skillNodeId } of skillNodes) {
      const rows = await this.prisma.talentSummaryCache.findMany({
        where: { skillNodeId },
        orderBy: { akurasi: 'desc' },
      });

      for (let i = 0; i < rows.length; i++) {
        await this.prisma.talentSummaryCache.update({
          where: { id: rows[i].id },
          data: { ranking: i + 1 },
        });
      }
    }
  }

  async getMySummary(userId: string) {
    const summary = await this.prisma.talentSummaryCache.findMany({
      where: { userId },
      orderBy: { akurasi: 'desc' },
      include: { skillNode: true },
    });

    const topSkillNodeIds = summary.slice(0, 3).map((s) => s.skillNodeId);
    const careerMappings = await this.prisma.talentCareerMapping.findMany({
      where: { skillNodeId: { in: topSkillNodeIds } },
    });

    const hasil: {
      skillNode: string;
      akurasi: number;
      totalSoal: number;
      ranking: number | null;
      rekomendasi: any;
      soalSeringSalah: { questionId: string; teks: string | null }[];
    }[] = [];
    for (const s of summary) {
      const soalSeringSalah = await this.getSoalSeringSalah(userId, s.skillNodeId);
      hasil.push({
        skillNode: s.skillNode.nama,
        akurasi: Number(s.akurasi),
        totalSoal: s.totalSoal,
        ranking: s.ranking,
        rekomendasi: careerMappings.find((c) => c.skillNodeId === s.skillNodeId) ?? null,
        soalSeringSalah,
      });
    }
    return hasil;
  }

  createCareerMapping(dto: CreateCareerMappingDto) {
    return this.prisma.talentCareerMapping.create({ data: dto });
  }

  listCareerMappings() {
    return this.prisma.talentCareerMapping.findMany({ include: { skillNode: true } });
  }

  submitLearningStyle(userId: string, dto: SubmitLearningStyleDto) {
    return this.prisma.learningStyleSurvey.create({
      data: {
        userId,
        skillNodeId: dto.skillNodeId,
        suka: dto.suka,
        alasanTidakSuka: dto.alasanTidakSuka,
        preferensiGaya: dto.preferensiGaya,
      },
    });
  }

  listMyLearningStyle(userId: string) {
    return this.prisma.learningStyleSurvey.findMany({
      where: { userId },
      include: { skillNode: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async recomputeForUserSkill(userId: string, skillNodeId: string) {
    const totalSoal = await this.prisma.submission.count({ where: { userId, skillNodeId } });
    if (totalSoal === 0) return;

    const benarCount = await this.prisma.submission.count({ where: { userId, skillNodeId, benar: true } });
    const akurasi = Math.round((benarCount / totalSoal) * 10000) / 100;

    await this.prisma.talentSummaryCache.upsert({
      where: { userId_skillNodeId: { userId, skillNodeId } },
      update: { akurasi, totalSoal, lastComputedAt: new Date() },
      create: { userId, skillNodeId, akurasi, totalSoal },
    });
  }

  private async getSoalSeringSalah(userId: string, skillNodeId: string, limit = 3) {
    const salah = await this.prisma.submission.findMany({
      where: { userId, skillNodeId, benar: false, questionId: { not: null } },
      orderBy: { createdAt: 'desc' },
      take: limit,
      distinct: ['questionId'],
    });

    const questionIds = salah.map((s) => s.questionId).filter((id): id is string => !!id);
    const questions = await this.prisma.question.findMany({
      where: { id: { in: questionIds } },
      select: { id: true, questionText: true },
    });

    return questionIds.map((qid) => {
      const q = questions.find((x) => x.id === qid);
      return { questionId: qid, teks: q?.questionText ?? null };
    });
  }
  async listLinkedStudents(tutorId: string) {
    const links = await this.prisma.tutorStudentLink.findMany({
      where: { tutorId },
      include: { siswa: { select: { id: true, nama: true, kontak: true } } },
    });
    return links.map((l) => l.siswa);
  }

  async linkStudentsToTutor(tutorKontak: string, siswaKontakList: string[]) {
    const tutor = await this.prisma.user.findUnique({ where: { kontak: tutorKontak } });
    if (!tutor) throw new NotFoundException(`Tutor dengan nomor ${tutorKontak} tidak ditemukan`);

    let berhasil = 0;
    const gagal: string[] = [];

    for (const kontak of siswaKontakList) {
      const siswa = await this.prisma.user.findUnique({ where: { kontak: kontak.trim() } });
      if (!siswa) {
        gagal.push(kontak);
        continue;
      }
      await this.prisma.tutorStudentLink.upsert({
        where: { tutorId_siswaId: { tutorId: tutor.id, siswaId: siswa.id } },
        update: {},
        create: { tutorId: tutor.id, siswaId: siswa.id },
      });
      berhasil++;
    }

    return { berhasil, gagal, totalDiproses: siswaKontakList.length };
  }
}