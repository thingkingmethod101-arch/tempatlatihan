import { Body, Controller, Get, Param, Patch, Post, UseGuards, Delete } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Audit } from '../audit/audit.decorator';
import { QuestionsService } from './questions.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { ModerateQuestionDto } from './dto/moderate-question.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('questions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class QuestionsController {
  constructor(private service: QuestionsService) {}

  // PENTING: endpoint ini menampilkan isCorrect -- HANYA boleh diakses admin/tutor.
  // Siswa TIDAK PERNAH memanggil endpoint ini (lihat modul `challenge` untuk versi aman siswa).
  @Get()
  @Roles(Role.admin, Role.tutor)
  list() {
    return this.service.list();
  }

  @Get('me')
  @Roles(Role.admin, Role.tutor)
  listMine(@CurrentUser() user: any) {
    return this.service.listMine(user.id);
  }

  @Post()
  @Roles(Role.admin, Role.tutor)
  create(@Body() dto: CreateQuestionDto, @CurrentUser() user: any) {
    return this.service.create(dto, user.id);
  }

  @Patch(':id/moderate')
  @Roles(Role.admin)
  @Audit({ aksi: 'kurasi_soal', entityType: 'question', prismaModel: 'question' })
  moderate(@Param('id') id: string, @Body() dto: ModerateQuestionDto) {
    return this.service.moderate(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  adminDelete(@Param('id') id: string) {
    return this.service.adminDelete(id);
  }

  @Get('admin/pending-count')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  countPending() {
    return this.service.countPending();
  }
}