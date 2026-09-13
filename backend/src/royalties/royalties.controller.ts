import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Audit } from '../audit/audit.decorator';
import { RoyaltiesService } from './royalties.service';

@Controller('royalties')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RoyaltiesController {
  constructor(private service: RoyaltiesService) {}

  @Get('me')
  @Roles(Role.tutor)
  getMine(@CurrentUser() user: any) {
    return this.service.getMine(user.id);
  }

  @Get('me/by-content')
  @Roles(Role.tutor)
  getMyBreakdown(@CurrentUser() user: any) {
    return this.service.getByContent(user.id);
  }

  @Get('admin/by-content')
  @Roles(Role.admin)
  getAllBreakdown() {
    return this.service.getByContent();
  }

  @Post('admin/payout/:contentId')
  @Roles(Role.admin)
  @Audit({ aksi: 'proses_payout_royalti', entityType: 'payout', prismaModel: 'payout' })
  payout(@Param('contentId') contentId: string, @CurrentUser() user: any) {
    return this.service.payoutForContent(contentId, user.id);
  }

  @Get('me/tier')
  @Roles(Role.tutor)
  getMyTier(@CurrentUser() user: any) {
    return this.service.getMyTier(user.id);
  }
}