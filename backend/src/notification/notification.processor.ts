import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { NotifStatus } from '@prisma/client';
import { notificationChannelFactory } from './channels/notification-channel.factory';

function renderTemplate(template: string, payload: Record<string, any> = {}): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => (payload[key] !== undefined ? String(payload[key]) : ''));
}

@Processor('notification-dispatch')
export class NotificationProcessor extends WorkerHost {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    super();
  }

  async process(job: Job<{ notificationLogId: string }>) {
    const log = await this.prisma.notificationLog.findUnique({
      where: { id: job.data.notificationLogId },
      include: { user: true },
    });
    if (!log) return;

    const template = await this.prisma.notificationTemplate.findUnique({
      where: { kode: log.templateKode },
    });

    if (!template) {
      await this.prisma.notificationLog.update({
        where: { id: log.id },
        data: { status: NotifStatus.failed, errorMessage: `Template ${log.templateKode} tidak ditemukan` },
      });
      return;
    }

    const message = renderTemplate(template.isiTemplate, (log.payload as Record<string, any>) ?? {});
    const adapter = notificationChannelFactory(log.channel, this.config);
    const destination = log.user.kontak;

    const result = await adapter.send(destination, message);

    await this.prisma.notificationLog.update({
      where: { id: log.id },
      data: result.ok
        ? { status: NotifStatus.sent, sentAt: new Date() }
        : { status: NotifStatus.failed, errorMessage: result.errorMessage },
    });
  }
}