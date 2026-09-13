import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { NotifChannel, ScholarshipStatus } from '@prisma/client';
import { CreateProgramDto } from './dto/create-program.dto';
import { ApplyScholarshipDto } from './dto/apply.dto';
import { VerifyApplicationDto } from './dto/verify-application.dto';

@Injectable()
export class ScholarshipsService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  createProgram(dto: CreateProgramDto) {
    return this.prisma.scholarshipProgram.create({
      data: {
        nama: dto.nama,
        tipe: dto.tipe,
        kriteria: dto.kriteria,
        kuota: dto.kuota,
        deadlineAt: dto.deadlineAt ? new Date(dto.deadlineAt) : undefined,
      },
    });
  }

  listPrograms() {
    return this.prisma.scholarshipProgram.findMany({ where: { status: 'aktif' } });
  }

  async apply(programId: string, userId: string, dto: ApplyScholarshipDto) {
    const program = await this.prisma.scholarshipProgram.findUnique({ where: { id: programId } });
    if (!program) throw new NotFoundException('Program beasiswa tidak ditemukan');

    return this.prisma.scholarshipApplication.create({
      data: {
        programId,
        userId,
        dokumenPendukung: dto.dokumenPendukung ?? [],
      },
    });
  }

  listApplicationsForProgram(programId: string) {
    return this.prisma.scholarshipApplication.findMany({
      where: { programId },
      include: { user: { select: { nama: true, kontak: true } } },
    });
  }

  listMyApplications(userId: string) {
    return this.prisma.scholarshipApplication.findMany({
      where: { userId },
      include: { program: true },
    });
  }

  async verify(id: string, dto: VerifyApplicationDto, adminId: string) {
    const application = await this.prisma.scholarshipApplication.findUnique({ where: { id } });
    if (!application) throw new NotFoundException('Pengajuan tidak ditemukan');

    return this.prisma.scholarshipApplication.update({
      where: { id },
      data: {
        status: dto.status,
        catatan: dto.catatan,
        diverifikasiOleh: adminId,
        verifiedAt: new Date(),
      },
    });
  }

  // Dipanggil oleh cron harian (lihat ScholarshipReminderProcessor) DAN oleh endpoint trigger manual admin.
  async runReminderCheck() {
    const now = new Date();
    const in7Days = new Date();
    in7Days.setDate(in7Days.getDate() + 7);

    const programs = await this.prisma.scholarshipProgram.findMany({
      where: { deadlineAt: { gte: now, lte: in7Days }, status: 'aktif' },
    });

    let reminderDikirim = 0;

    for (const program of programs) {
      const applications = await this.prisma.scholarshipApplication.findMany({
        where: { programId: program.id, status: ScholarshipStatus.pending, reminderSentAt: null },
      });

      for (const application of applications) {
        await this.notificationService.enqueue({
          userId: application.userId,
          templateKode: 'beasiswa_reminder_h7',
          channel: NotifChannel.email,
          refType: 'scholarship_application',
          refId: application.id,
          payload: {
            namaProgram: program.nama,
            deadline: program.deadlineAt?.toLocaleDateString('id-ID') ?? '',
          },
        });

        await this.prisma.scholarshipApplication.update({
          where: { id: application.id },
          data: { reminderSentAt: new Date() },
        });

        reminderDikirim++;
      }
    }

    return { programDicek: programs.length, reminderDikirim };
  }
}