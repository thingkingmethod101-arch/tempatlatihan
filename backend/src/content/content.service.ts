import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ModerationStatus } from '@prisma/client';
import { STORAGE_ADAPTER } from '../storage/storage.module';
import type { StorageAdapter } from '../storage/storage-adapter.interface';
import { CreateContentDto } from './dto/create-content.dto';
import { ModerateContentDto } from './dto/moderate-content.dto';
import { FilesService } from '../files/files.service';
import { TalentService } from '../talent/talent.service';

@Injectable()
export class ContentService {
  constructor(
    private prisma: PrismaService,
    @Inject(STORAGE_ADAPTER) private storage: StorageAdapter,
    private filesService: FilesService,
    private talentService: TalentService,
  ) {}

  async create(userId: string, userRole: string, dto: CreateContentDto) {
    if (userRole === 'tutor') {
      const tutorProfile = await this.prisma.tutorProfile.findUnique({ where: { userId } });
      if (!tutorProfile) throw new NotFoundException('Profil tutor tidak ditemukan untuk akun ini');
      if (tutorProfile.statusVerifikasi !== 'disetujui') {
        throw new ForbiddenException('Akun tutor kamu belum diverifikasi admin');
      }
    }

    const content = await this.prisma.content.create({
      data: {
        ownerId: userId,
        judul: dto.judul,
        tipe: 'modul',
        skillNodeId: dto.skillNodeId,
        deskripsi: dto.deskripsi,
        thumbnailFileAssetId: dto.thumbnailFileAssetId,
        pricing: { create: dto.pricing.map((p) => ({ durasiBulan: p.durasiBulan, harga: p.harga, paket: p.paket })) },
      },
    });

    for (const chapterDto of dto.chapters) {
      const chapter = await this.prisma.contentChapter.create({
        data: {
          contentId: content.id,
          judul: chapterDto.judul,
          urutan: chapterDto.urutan,
          isFree: chapterDto.isFree ?? false,
          tipe: chapterDto.tipe,
          materiFileAssetId: chapterDto.tipe === 'viewer_pdf' ? chapterDto.materiFileAssetId : undefined,
          videoUrl: chapterDto.tipe === 'video_youtube' ? chapterDto.videoUrl : undefined,
        },
      });

      if (chapterDto.tipe === 'viewer_pdf' && chapterDto.materiFileAssetId) {
        const previewId = await this.filesService.createPdfPreview(chapterDto.materiFileAssetId);
        if (previewId) {
          await this.prisma.contentChapter.update({ where: { id: chapter.id }, data: { previewFileAssetId: previewId } });
        }
      }

      if (chapterDto.tipe === 'latihan_soal' && chapterDto.questions) {
        for (const q of chapterDto.questions) {
          await this.prisma.question.create({
            data: {
              skillNodeId: dto.skillNodeId,
              tierId: dto.tierId,
              questionType: q.questionImageUrl ? 'gambar' : 'teks',
              questionText: q.questionText,
              questionImageUrl: q.questionImageUrl,
              contentChapterId: chapter.id,
              options: {
                create: q.options.map((o) => ({
                  urutan: o.urutan,
                  tipe: o.tipe,
                  konten: o.konten,
                  isCorrect: o.isCorrect ?? false,
                })),
              },
            },
          });
        }
      }
    }

    return this.prisma.content.findUnique({
      where: { id: content.id },
      include: { chapters: { include: { questions: { include: { options: true } } } }, pricing: true },
    });
  }

  async list() {
    const items = await this.prisma.content.findMany({
      where: { statusModerasi: ModerationStatus.disetujui, deletedAt: null },
      include: { chapters: true, pricing: true },
    });
    return Promise.all(items.map(async (c) => ({
      ...c,
      thumbnailUrl: c.thumbnailFileAssetId ? await this.resolveThumbnail(c.thumbnailFileAssetId) : null,
    })));
  }

  private async resolveThumbnail(fileAssetId: string): Promise<string | null> {
    const fileAsset = await this.prisma.fileAsset.findUnique({ where: { id: fileAssetId } });
    if (!fileAsset) return null;
    const signed = await this.storage.getSignedUrl(fileAsset.path, 604800);
    return signed.available ? (signed.url ?? null) : null;
  }

  listPending() {
    return this.prisma.content.findMany({
      where: { statusModerasi: ModerationStatus.menunggu, deletedAt: null },
      include: { chapters: true, pricing: true },
    });
  }

  listMine(userId: string) {
    return this.prisma.content.findMany({
      where: { ownerId: userId },
      include: { chapters: true, pricing: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async detail(id: string) {
    const content = await this.prisma.content.findUnique({
      where: { id },
      include: {
        chapters: true,
        pricing: true,
        ratings: true,
        owner: { select: { id: true, nama: true, kontak: true, role: true } },
      },
    });
    if (!content) throw new NotFoundException('Konten tidak ditemukan');

    let namaPembuat = content.owner.nama;
    let nomorKontak: string | null = null;

    if (content.owner.role === 'tutor') {
      const tutorProfile = await this.prisma.tutorProfile.findUnique({ where: { userId: content.owner.id } });
      if (tutorProfile) {
        namaPembuat = tutorProfile.namaLengkap;
        nomorKontak = tutorProfile.nomorKontak;
      }
    } else {
      namaPembuat = 'Admin TempatLatihan.com';
    }

    const avgRating = content.ratings.length
      ? content.ratings.reduce((sum, r) => sum + r.bintang, 0) / content.ratings.length
      : 0;

    return {
      ...content,
      avgRating: Math.round(avgRating * 10) / 10,
      totalRating: content.ratings.length,
      namaPembuat,
      nomorKontak,
    };
  }

  async moderate(id: string, dto: ModerateContentDto) {
    const content = await this.prisma.content.findUnique({ where: { id } });
    if (!content) throw new NotFoundException('Konten tidak ditemukan');
    return this.prisma.content.update({ where: { id }, data: { statusModerasi: dto.statusModerasi } });
  }

  private async assertAccess(userId: string, userRole: string, chapter: { id: string; contentId: string; isFree: boolean }) {
    if (chapter.isFree) return;
    if (userRole === 'admin') return;

    const content = await this.prisma.content.findUnique({
      where: { id: chapter.contentId },
      select: { ownerId: true },
    });
    if (content && content.ownerId === userId) return;

    const access = await this.prisma.contentAccess.findFirst({
      where: {
        userId,
        AND: [
          { OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
          {
            OR: [
              { contentId: chapter.contentId, contentChapterId: null }, // akses bundle/seluruh konten
              { contentChapterId: chapter.id }, // akses spesifik ke bab ini saja
            ],
          },
        ],
      },
    });
    if (!access) throw new ForbiddenException('Kamu belum membeli akses ke bab ini');
  }

  async getChapterForStudent(userId: string, userRole: string, chapterId: string) {
    const chapter = await this.prisma.contentChapter.findUnique({
      where: { id: chapterId },
      include: { questions: { include: { options: true } } },
    });
    if (!chapter) throw new NotFoundException('Bab tidak ditemukan');

    await this.assertAccess(userId, userRole, chapter);

    if (chapter.tipe === 'video_youtube') {
      return { tipe: 'video_youtube', videoUrl: chapter.videoUrl };
    }

    if (chapter.tipe === 'viewer_pdf') {
      if (!chapter.materiFileAssetId) throw new NotFoundException('Materi belum diupload untuk bab ini');
      const fileAsset = await this.prisma.fileAsset.findUnique({ where: { id: chapter.materiFileAssetId } });
      if (!fileAsset) throw new NotFoundException('File materi tidak ditemukan');

      const signed = await this.storage.getSignedUrl(fileAsset.path, 300);
      return { tipe: 'viewer_pdf', pdfUrl: signed.available ? signed.url : null };
    }

    const riwayatBenar = await this.prisma.submission.findMany({
      where: { userId, sourceType: 'modul_latihan', benar: true, questionId: { in: chapter.questions.map((q) => q.id) } },
      select: { questionId: true },
    });
    const questionIdSudahBenar = new Set(riwayatBenar.map((r) => r.questionId));

    const questions = await Promise.all(
      chapter.questions.map(async (q) => {
        let imageUrl: string | null = null;
        if (q.questionImageUrl) {
          const fileAsset = await this.prisma.fileAsset.findUnique({ where: { id: q.questionImageUrl } });
          if (fileAsset) {
            const signed = await this.storage.getSignedUrl(fileAsset.path, 3600);
            imageUrl = signed.available ? (signed.url ?? null) : null;
          }
        }
        return {
          id: q.id,
          questionText: q.questionText,
          questionImageUrl: imageUrl,
          sudahBenar: questionIdSudahBenar.has(q.id),
          options: q.options.map((o) => ({ id: o.id, urutan: o.urutan, tipe: o.tipe, konten: o.konten })),
        };
      }),
    );

    return { tipe: 'latihan_soal', questions };
  }

  async checkPracticeAnswer(userId: string, userRole: string, chapterId: string, questionId: string, optionId: string) {
    const chapter = await this.prisma.contentChapter.findUnique({ where: { id: chapterId } });
    if (!chapter) throw new NotFoundException('Bab tidak ditemukan');
    await this.assertAccess(userId, userRole, chapter);

    const option = await this.prisma.questionOption.findUnique({ where: { id: optionId } });
    if (!option || option.questionId !== questionId) {
      throw new NotFoundException('Opsi jawaban tidak valid');
    }

    const question = await this.prisma.question.findUnique({ where: { id: questionId } });
    if (question) {
      const existing = await this.prisma.submission.findFirst({
        where: { userId, questionId, sourceType: 'modul_latihan' },
      });
      const data = {
        userId, questionId, skillNodeId: question.skillNodeId, sourceType: 'modul_latihan',
        jawabanDipilih: { optionId }, benar: option.isCorrect,
      };
      await this.talentService.recomputeForUserSkill(userId, question.skillNodeId);
      if (existing) {
        await this.prisma.submission.update({ where: { id: existing.id }, data });
      } else {
        await this.prisma.submission.create({ data });
      }
    }

    return { benar: option.isCorrect };
  }

  async listPurchased(userId: string) {
    const accesses = await this.prisma.contentAccess.findMany({
      where: { userId, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
      select: { contentId: true },
    });
    const contentIds = [...new Set(accesses.map((a) => a.contentId).filter(Boolean))] as string[];
    return this.prisma.content.findMany({
      where: { id: { in: contentIds } },
      include: { chapters: true },
    });
  }

  addComment(userId: string, contentId: string, isi: string, parentCommentId?: string) {
    return this.prisma.contentComment.create({ data: { contentId, userId, isi, parentCommentId } });
  }

  listComments(contentId: string) {
    return this.prisma.contentComment.findMany({
      where: { contentId, parentCommentId: null },
      include: {
        user: { select: { nama: true } },
        replies: { include: { user: { select: { nama: true } } }, orderBy: { createdAt: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  rate(userId: string, contentId: string, bintang: number) {
    return this.prisma.contentRating.upsert({
      where: { contentId_userId: { contentId, userId } },
      update: { bintang },
      create: { contentId, userId, bintang },
    });
  }

  listAllForAdmin() {
    return this.prisma.content.findMany({
      where: { deletedAt: null },
      include: { chapters: true, pricing: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getRecommended(userId: string) {
    const submissions = await this.prisma.submission.findMany({
      where: { userId },
      include: { question: { select: { skillNodeId: true } } },
    });

    const perSkill: Record<string, { benar: number; total: number }> = {};
    for (const s of submissions) {
      const skillId = s.question?.skillNodeId;
      if (!skillId) continue;
      if (!perSkill[skillId]) perSkill[skillId] = { benar: 0, total: 0 };
      perSkill[skillId].total++;
      if (s.benar) perSkill[skillId].benar++;
    }

    const skillTerlemah = Object.entries(perSkill)
      .map(([skillId, v]) => ({ skillId, akurasi: v.total > 0 ? v.benar / v.total : 0 }))
      .sort((a, b) => a.akurasi - b.akurasi)[0];

    if (skillTerlemah) {
      const modules = await this.prisma.content.findMany({
        where: { statusModerasi: 'disetujui', deletedAt: null, skillNodeId: skillTerlemah.skillId },
        include: { chapters: true, pricing: true },
        take: 4,
      });
      if (modules.length > 0) return modules;
    }

    return this.prisma.content.findMany({
      where: { statusModerasi: 'disetujui', deletedAt: null },
      include: { chapters: true, pricing: true },
      orderBy: { createdAt: 'desc' },
      take: 4,
    });
  }

  async adminDelete(contentId: string) {
    const content = await this.prisma.content.findUnique({ where: { id: contentId }, include: { chapters: true } });
    if (!content) throw new NotFoundException('Konten tidak ditemukan');

    const chapterIds = content.chapters.map((c) => c.id);
    const questions = await this.prisma.question.findMany({ where: { contentChapterId: { in: chapterIds } } });
    const questionIds = questions.map((q) => q.id);

    await this.prisma.questionOption.deleteMany({ where: { questionId: { in: questionIds } } });
    await this.prisma.question.deleteMany({ where: { id: { in: questionIds } } });
    await this.prisma.contentChapter.deleteMany({ where: { contentId } });
    await this.prisma.contentComment.deleteMany({ where: { contentId } });
    await this.prisma.contentRating.deleteMany({ where: { contentId } });
    await this.prisma.contentAccess.deleteMany({ where: { contentId } });
    await this.prisma.royaltyLedger.deleteMany({ where: { contentId } });
    await this.prisma.contentPricing.deleteMany({ where: { contentId } });
    await this.prisma.content.delete({ where: { id: contentId } });
    return { deleted: true };
  }

  async getChapterPreview(chapterId: string) {
    const chapter = await this.prisma.contentChapter.findUnique({ where: { id: chapterId } });
    if (!chapter || !chapter.previewFileAssetId) {
      throw new NotFoundException('Preview tidak tersedia untuk bab ini');
    }
    const fileAsset = await this.prisma.fileAsset.findUnique({ where: { id: chapter.previewFileAssetId } });
    if (!fileAsset) throw new NotFoundException('File preview tidak ditemukan');
    const signed = await this.storage.getSignedUrl(fileAsset.path, 300);
    return { pdfUrl: signed.available ? signed.url : null };
  }

  async grantAccessForPaket(userId: string, contentId: string, paket: string | null, expiresAt: Date | null) {
    if (!paket || paket === 'bundle') {
      const existing = await this.prisma.contentAccess.findFirst({
        where: { userId, contentId, contentChapterId: null },
      });
      if (!existing) {
        await this.prisma.contentAccess.create({ data: { userId, contentId, expiresAt, sumber: 'sewa' } });
      }
      return;
    }

    const tipeYangDiizinkan = paket === 'video' ? ['video_youtube'] : ['viewer_pdf', 'latihan_soal'];
    const chapters = await this.prisma.contentChapter.findMany({
      where: { contentId, tipe: { in: tipeYangDiizinkan } },
    });
    for (const ch of chapters) {
      const existing = await this.prisma.contentAccess.findFirst({
        where: { userId, contentChapterId: ch.id },
      });
      if (!existing) {
        await this.prisma.contentAccess.create({
          data: { userId, contentChapterId: ch.id, contentId, expiresAt, sumber: 'sewa' },
        });
      }
    }
  }

  async requestDelete(id: string, userId: string) {
    const content = await this.prisma.content.findUnique({ where: { id } });
    if (!content) throw new NotFoundException('Konten tidak ditemukan');
    if (content.ownerId !== userId) throw new ForbiddenException('Bukan konten milikmu');
    return this.prisma.content.update({ where: { id }, data: { deleteRequestedAt: new Date() } });
  }

  async listDeleteRequests() {
    return this.prisma.content.findMany({
      where: { deleteRequestedAt: { not: null } },
      include: { owner: { select: { nama: true, kontak: true } } },
      orderBy: { deleteRequestedAt: 'asc' },
    });
  }

  async approveDeleteRequest(id: string) {
    return this.adminDelete(id);
  }

  async rejectDeleteRequest(id: string) {
    return this.prisma.content.update({ where: { id }, data: { deleteRequestedAt: null } });
  }

  async banContent(id: string) {
    return this.prisma.content.update({ where: { id }, data: { statusModerasi: 'ditolak' } });
  }

  async getMyAccessStatus(userId: string, contentId: string) {
    const content = await this.prisma.content.findUnique({ where: { id: contentId } });
    if (!content) throw new NotFoundException('Konten tidak ditemukan');
    if (content.ownerId === userId) return { hasBundle: true, hasVideo: true, hasMateri: true };

    const bundleAccess = await this.prisma.contentAccess.findFirst({
      where: {
        userId, contentId, contentChapterId: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });
    if (bundleAccess) return { hasBundle: true, hasVideo: true, hasMateri: true };

    const chapters = await this.prisma.contentChapter.findMany({ where: { contentId } });
    const chapterAccesses = await this.prisma.contentAccess.findMany({
      where: {
        userId,
        contentChapterId: { in: chapters.map((c) => c.id) },
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });
    const chapterIdDimiliki = new Set(chapterAccesses.map((a) => a.contentChapterId));

    const punyaSemuaVideo = chapters
      .filter((c) => c.tipe === 'video_youtube')
      .every((c) => chapterIdDimiliki.has(c.id));
    const punyaSemuaMateri = chapters
      .filter((c) => c.tipe === 'viewer_pdf' || c.tipe === 'latihan_soal')
      .every((c) => chapterIdDimiliki.has(c.id));

    return {
      hasBundle: false,
      hasVideo: chapters.some((c) => c.tipe === 'video_youtube') ? punyaSemuaVideo : false,
      hasMateri: chapters.some((c) => c.tipe === 'viewer_pdf' || c.tipe === 'latihan_soal') ? punyaSemuaMateri : false,
    };
  }

  async updateBasicInfo(id: string, userId: string, userRole: string, dto: { judul?: string; deskripsi?: string }) {
    const content = await this.prisma.content.findUnique({ where: { id } });
    if (!content) throw new NotFoundException('Konten tidak ditemukan');
    if (content.ownerId !== userId && userRole !== 'admin') {
      throw new ForbiddenException('Kamu tidak berhak mengedit konten ini');
    }
    return this.prisma.content.update({ where: { id }, data: dto });
  }

  async countPending() {
    const menunggu = await this.prisma.content.count({ where: { statusModerasi: 'menunggu' } });
    const permohonanHapus = await this.prisma.content.count({ where: { deleteRequestedAt: { not: null } } });
    return { modulMenunggu: menunggu, permohonanHapus };
  }
}