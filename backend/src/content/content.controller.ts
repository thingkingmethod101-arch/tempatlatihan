import { Body, Controller, Get, Param, Patch, Post, UseGuards, Delete } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Audit } from '../audit/audit.decorator';
import { ContentService } from './content.service';
import { CreateContentDto } from './dto/create-content.dto';
import { ModerateContentDto } from './dto/moderate-content.dto';

@Controller('contents')
export class ContentController {
  constructor(private service: ContentService) {}

  @Get()
  list() {
    return this.service.list();
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.tutor, Role.admin)
  listMine(@CurrentUser() user: any) {
    return this.service.listMine(user.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.tutor, Role.admin)
  create(@CurrentUser() user: any, @Body() dto: CreateContentDto) {
    return this.service.create(user.id, user.role, dto);
  }

  @Get('moderation/pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  listPending() {
    return this.service.listPending();
  }

  @Get('purchased/me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.siswa, Role.tutor)
  listPurchased(@CurrentUser() user: any) {
    return this.service.listPurchased(user.id);
  }

  @Get('recommended')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.siswa)
  getRecommended(@CurrentUser() user: any) {
    return this.service.getRecommended(user.id);
  }

  @Get('chapters/:chapterId/preview')
  async getPreview(@Param('chapterId') chapterId: string) {
    return this.service.getChapterPreview(chapterId);
  }

  @Get('admin/delete-requests')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  listDeleteRequests() {
    return this.service.listDeleteRequests();
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  listAllForAdmin() {
    return this.service.listAllForAdmin();
  }

  @Get(':id/my-access-status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.siswa, Role.tutor, Role.orang_tua, Role.sekolah)
  getMyAccessStatus(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.getMyAccessStatus(user.id, id);
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.service.detail(id);
  }

  @Patch(':id/moderate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  @Audit({ aksi: 'moderasi_konten', entityType: 'content', prismaModel: 'content' })
  moderate(@Param('id') id: string, @Body() dto: ModerateContentDto) {
    return this.service.moderate(id, dto);
  }

  @Get('chapters/:chapterId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.siswa, Role.orang_tua, Role.tutor, Role.admin, Role.sekolah)
  getChapter(@Param('chapterId') chapterId: string, @CurrentUser() user: any) {
    return this.service.getChapterForStudent(user.id, user.role, chapterId);
  }

  @Post('chapters/:chapterId/questions/:questionId/check')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.siswa, Role.orang_tua, Role.tutor, Role.admin, Role.sekolah)
  checkAnswer(
    @Param('chapterId') chapterId: string,
    @Param('questionId') questionId: string,
    @Body() dto: { optionId: string },
    @CurrentUser() user: any,
  ) {
    return this.service.checkPracticeAnswer(user.id, user.role, chapterId, questionId, dto.optionId);
  }

  @Post(':id/comments')
  @UseGuards(JwtAuthGuard)
  addComment(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: { isi: string; parentCommentId?: string },
  ) {
    return this.service.addComment(user.id, id, body.isi, body.parentCommentId);
  }

  @Get(':id/comments')
  listComments(@Param('id') id: string) {
    return this.service.listComments(id);
  }

  @Post(':id/rating')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.siswa)
  rate(@CurrentUser() user: any, @Param('id') id: string, @Body() body: { bintang: number }) {
    return this.service.rate(user.id, id, body.bintang);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  adminDelete(@Param('id') id: string) {
    return this.service.adminDelete(id);
  }

  @Post(':id/request-delete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.tutor)
  requestDelete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.requestDelete(id, user.id);
  }

  @Patch(':id/approve-delete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  approveDelete(@Param('id') id: string) {
    return this.service.approveDeleteRequest(id);
  }

  @Patch(':id/reject-delete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  rejectDelete(@Param('id') id: string) {
    return this.service.rejectDeleteRequest(id);
  }

  @Patch(':id/ban')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  ban(@Param('id') id: string) {
    return this.service.banContent(id);
  }

  @Patch(':id/edit')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.tutor, Role.admin)
  updateBasicInfo(@Param('id') id: string, @CurrentUser() user: any, @Body() dto: { judul?: string; deskripsi?: string }) {
    return this.service.updateBasicInfo(id, user.id, user.role, dto);
  }

  @Get('admin/pending-count')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  countPending() {
    return this.service.countPending();
  }
}