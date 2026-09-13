import { Body, Controller, Get, Post, UseGuards, Patch, Delete, Param } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ReferenceDataService } from './reference-data.service';
import { CreateSkillNodeDto } from './dto/create-skill-node.dto';
import { CreateTierConfigDto } from './dto/create-tier-config.dto';

@Controller()
export class ReferenceDataController {
  constructor(private service: ReferenceDataService) {}

  @Get('skill-nodes')
  listSkillNodes() {
    return this.service.listSkillNodes();
  }

  @Post('skill-nodes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  createSkillNode(@Body() dto: { nama: string; parentSkillId?: string; examContextTags?: string[] }) {
    return this.service.createSkillNode(dto);
  }

  @Get('tier-configs')
  listTierConfigs() {
    return this.service.listTierConfigs();
  }

  @Post('tier-configs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  createTierConfig(@Body() dto: CreateTierConfigDto) {
    return this.service.createTierConfig(dto);
  }

  @Delete('tier-configs/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  deleteTierConfig(@Param('id') id: string) {
    return this.service.deleteTierConfig(id);
  }

  @Patch('skill-nodes/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  updateSkillNode(@Param('id') id: string, @Body() dto: { nama?: string; parentSkillId?: string }) {
    return this.service.updateSkillNode(id, dto);
  }

  @Delete('skill-nodes/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  deleteSkillNode(@Param('id') id: string) {
    return this.service.deleteSkillNode(id);
  }
}