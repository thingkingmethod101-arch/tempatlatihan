import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Audit } from '../audit/audit.decorator';
import { TutorProfilesService } from './tutor-profiles.service';
import { VerifyTutorDto } from './dto/verify-tutor.dto';

@Controller('tutor-profiles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TutorProfilesController {
  constructor(private service: TutorProfilesService) {}

  @Get()
  @Roles(Role.admin)
  listPending() {
    return this.service.listPending();
  }

  @Patch(':id/verify')
  @Roles(Role.admin)
  @Audit({ aksi: 'verifikasi_tutor', entityType: 'tutor_profile', prismaModel: 'tutorProfile' })
  verify(@Param('id') id: string, @Body() dto: VerifyTutorDto, @CurrentUser() user: any) {
    return this.service.verify(id, dto, user.id);
  }
}