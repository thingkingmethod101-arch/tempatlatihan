import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSkillNodeDto } from './dto/create-skill-node.dto';
import { CreateTierConfigDto } from './dto/create-tier-config.dto';

@Injectable()
export class ReferenceDataService {
  constructor(private prisma: PrismaService) {}

  createSkillNode(dto: { nama: string; parentSkillId?: string; examContextTags?: string[] }) {
    return this.prisma.skillNode.create({
      data: { nama: dto.nama, parentSkillId: dto.parentSkillId, examContextTags: dto.examContextTags ?? [] },
    });
  }

  listSkillNodes() {
    return this.prisma.skillNode.findMany();
  }

  createTierConfig(dto: { nama: string; xpMultiplier: number; xpBaseDefault: number }) {
    return this.prisma.tierConfig.create({
      data: { nama: dto.nama, xpMultiplier: dto.xpMultiplier, xpBaseDefault: dto.xpBaseDefault },
    });
  }

  async deleteTierConfig(id: string) {
    await this.prisma.tierConfig.delete({ where: { id } });
    return { deleted: true };
  }

  listTierConfigs() {
    return this.prisma.tierConfig.findMany();
  }

  updateSkillNode(id: string, dto: { nama?: string; parentSkillId?: string }) {
    return this.prisma.skillNode.update({ where: { id }, data: dto });
  }

  async deleteSkillNode(id: string) {
    await this.prisma.skillNode.delete({ where: { id } });
    return { deleted: true };
  }
}