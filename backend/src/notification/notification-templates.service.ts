import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTemplateDto } from './dto/create-template.dto';

@Injectable()
export class NotificationTemplatesService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateTemplateDto) {
    return this.prisma.notificationTemplate.create({ data: dto });
  }

  list() {
    return this.prisma.notificationTemplate.findMany();
  }
}