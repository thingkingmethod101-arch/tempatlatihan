import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { NotifChannel } from '@prisma/client';

interface EnqueueParams {
  userId: string;
  templateKode: string;
  channel: NotifChannel;
  refType?: string;
  refId?: string;
  payload?: Record<string, any>;
}

@Injectable()
export class NotificationService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('notification-dispatch') private queue: Queue,
  ) {}

  async enqueue(params: EnqueueParams) {
    const log = await this.prisma.notificationLog.create({
      data: {
        userId: params.userId,
        templateKode: params.templateKode,
        channel: params.channel,
        refType: params.refType,
        refId: params.refId,
        payload: params.payload,
      },
    });

    await this.queue.add('dispatch', { notificationLogId: log.id });

    return log;
  }
}