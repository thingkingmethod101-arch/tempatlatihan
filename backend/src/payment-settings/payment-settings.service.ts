import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentSettingsService {
  constructor(private prisma: PrismaService) {}

  get() {
    return this.prisma.paymentSettings.findFirst();
  }

  async update(qrisFileAssetId: string) {
    const existing = await this.prisma.paymentSettings.findFirst();
    if (existing) {
      return this.prisma.paymentSettings.update({ where: { id: existing.id }, data: { qrisFileAssetId } });
    }
    return this.prisma.paymentSettings.create({ data: { qrisFileAssetId } });
  }
}