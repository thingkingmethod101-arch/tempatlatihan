import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { ModerateQuestionDto } from './dto/moderate-question.dto';
import { STORAGE_ADAPTER } from '../storage/storage.module';
import type { StorageAdapter } from '../storage/storage-adapter.interface';

@Injectable()
export class QuestionsService {
  constructor(
    private prisma: PrismaService,
    @Inject(STORAGE_ADAPTER) private storage: StorageAdapter,
  ) {}

  create(dto: CreateQuestionDto, userId: string) {
    return this.prisma.question.create({
      data: {
        skillNodeId: dto.skillNodeId,
        tierId: dto.tierId,
        questionType: dto.questionType,
        questionText: dto.questionText,
        questionImageUrl: dto.questionImageUrl,
        poinBenar: dto.poinBenar ?? 10,
        createdBy: userId,
        options: {
          create: dto.options.map((o) => ({
            urutan: o.urutan,
            tipe: o.tipe,
            konten: o.konten,
            isCorrect: o.isCorrect ?? false,
          })),
        },
      },
      include: { options: true },
    });
  }

  async list() {
    const questions = await this.prisma.question.findMany({
      where: { deletedAt: null },
      include: { options: true },
    });
    return Promise.all(
      questions.map(async (q) => {
        let imageUrl: string | null = null;
        if (q.questionImageUrl) {
          const fileAsset = await this.prisma.fileAsset.findUnique({ where: { id: q.questionImageUrl } });
          if (fileAsset) {
            const signed = await this.storage.getSignedUrl(fileAsset.path, 3600);
            imageUrl = signed.available ? (signed.url ?? null) : null;
          }
        }
        return { ...q, questionImageUrl: imageUrl };
      }),
    );
  }

  listMine(userId: string) {
    return this.prisma.question.findMany({
      where: { createdBy: userId, deletedAt: null },
      include: { options: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async moderate(id: string, dto: ModerateQuestionDto) {
    const question = await this.prisma.question.findUnique({ where: { id } });
    if (!question) throw new NotFoundException('Soal tidak ditemukan');

    return this.prisma.question.update({
      where: { id },
      data: { statusModerasi: dto.statusModerasi },
    });
  }

  async adminDelete(questionId: string) {
    await this.prisma.eventQuestionPool.deleteMany({ where: { questionId } });
    await this.prisma.questionOption.deleteMany({ where: { questionId } });
    await this.prisma.question.delete({ where: { id: questionId } });
    return { deleted: true };
  }

  async countPending() {
    const menunggu = await this.prisma.question.count({ where: { statusModerasi: 'menunggu' } });
    return { soalMenunggu: menunggu };
  }
  
}