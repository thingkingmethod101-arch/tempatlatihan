import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CertificatesService } from './certificates.service';

@Controller('certificates')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CertificatesController {
  constructor(private service: CertificatesService) {}

  @Get('me')
  @Roles(Role.siswa)
  listMine(@CurrentUser() user: any) {
    return this.service.listMine(user.id);
  }

  @Post('issue/:eventId/:userId')
  @Roles(Role.admin)
  issue(@Param('eventId') eventId: string, @Param('userId') userId: string) {
    return this.service.issueIfEligible(eventId, userId);
  }

  @Get(':id/detail')
  @Roles(Role.siswa, Role.admin)
  getDetail(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.getDetail(id, user.id, user.role);
  }

  @Get('verify/:nomor')
  verify(@Param('nomor') nomor: string) {
    return this.service.verifyByNomor(nomor);
  }
}