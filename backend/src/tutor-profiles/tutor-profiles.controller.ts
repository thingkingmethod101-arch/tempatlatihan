import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Audit } from '../audit/audit.decorator';
import { TutorProfilesService } from './tutor-profiles.service';
import { VerifyTutorDto } from './dto/verify-tutor.dto';
import { AttachDocumentsDto } from './dto/attach-documents.dto';

@Controller('tutor-profiles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TutorProfilesController {
  constructor(private service: TutorProfilesService) {}

  @Get()
  @Roles(Role.admin)
  listPending() {
    return this.service.listPending();
  }

  @Get('me')
  @Roles(Role.tutor)
  getMine(@CurrentUser() user: any) {
    return this.service.getMine(user.id);
  }

  @Patch(':id/verify')
  @Roles(Role.admin)
  @Audit({ aksi: 'verifikasi_tutor', entityType: 'tutor_profile', prismaModel: 'tutorProfile' })
  verify(@Param('id') id: string, @Body() dto: VerifyTutorDto, @CurrentUser() user: any) {
    return this.service.verify(id, dto, user.id);
  }

  @Patch('me/documents')
  @Roles(Role.tutor)
  attachDocuments(@CurrentUser() user: any, @Body() dto: AttachDocumentsDto) {
    return this.service.attachDocuments(user.id, dto);
  }

  @Get(':id/documents')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  getDocuments(@Param('id') id: string) {
    return this.service.getDocumentUrls(id);
  }

  @Patch('me/bank-info')
  @Roles(Role.tutor)
  updateBankInfo(@CurrentUser() user: any, @Body() dto: { infoRekening: string; nomorRekening: string }) {
    return this.service.updateBankInfo(user.id, dto.infoRekening, dto.nomorRekening);
  }

  @Patch('me/resubmit')
  @Roles(Role.tutor)
  resubmit(@CurrentUser() user: any) {
    return this.service.resubmit(user.id);
  }

  @Patch(':id/documents/:jenis')
  @Roles(Role.admin)
  deleteDocument(@Param('id') id: string, @Param('jenis') jenis: 'ktp' | 'ijazah' | 'cv') {
    return this.service.deleteDocument(id, jenis);
  }

}