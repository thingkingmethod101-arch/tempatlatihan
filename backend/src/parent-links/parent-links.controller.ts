import { Body, Controller, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { IsNotEmpty, IsString } from 'class-validator';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ParentLinksService } from './parent-links.service';
import { Audit } from '../audit/audit.decorator';

class RequestLinkDto {
  @IsString() @IsNotEmpty()
  childKontak: string;
}

@Controller('parent-links')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ParentLinksController {
  constructor(private service: ParentLinksService) {}

  @Post()
  @Roles(Role.orang_tua)
  request(@CurrentUser() user: any, @Body() dto: RequestLinkDto) {
    return this.service.requestLink(user.id, dto.childKontak);
  }

  @Patch(':id/approve')
  @Roles(Role.siswa)
  @Audit({ aksi: 'verifikasi_parent_link', entityType: 'parent_child_link', prismaModel: 'parentChildLink' })
  approve(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.approve(id, user.id);
  }

  @Patch(':id/reject')
  @Roles(Role.siswa)
  @Audit({ aksi: 'verifikasi_parent_link', entityType: 'parent_child_link', prismaModel: 'parentChildLink' })
  reject(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.reject(id, user.id);
  }
}