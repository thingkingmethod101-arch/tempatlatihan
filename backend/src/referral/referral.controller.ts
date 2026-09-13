import { Body, Controller, Get, Param, Patch, Post, UseGuards, Delete } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ReferralService } from './referral.service';

@Controller('referral')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReferralController {
  constructor(private service: ReferralService) {}

  @Post()
  @Roles(Role.admin)
  create(@Body() dto: { ownerId: string; tipe: 'diskon' | 'cashback'; persenDiskon?: number; maxUsage?: number }) {
    return this.service.create(dto);
  }

  @Get()
  @Roles(Role.admin)
  listAll() {
    return this.service.listAll();
  }

  @Patch(':id/selesaikan')
  @Roles(Role.admin)
  selesaikan(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.selesaikanCashback(id, user.id);
  }

  @Get('me')
  @Roles(Role.siswa, Role.orang_tua, Role.tutor, Role.sekolah, Role.admin)
  getMine(@CurrentUser() user: any) {
    return this.service.getMyCodes(user.id);
  }

  @Delete(':id')
  @Roles(Role.admin)
  deleteCode(@Param('id') id: string) {
    return this.service.deleteCode(id);
  }

  @Get('check/:kode')
  @Roles(Role.siswa, Role.orang_tua, Role.tutor, Role.sekolah, Role.admin)
  checkOnly(@Param('kode') kode: string, @CurrentUser() user: any) {
    return this.service.checkOnly(kode, user.id);
  }

  @Post('redeem-cashback')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.siswa, Role.tutor, Role.orang_tua)
  redeemCashback(@CurrentUser() user: any, @Body() dto: { kode: string }) {
    return this.service.redeemCashback(dto.kode, user.id);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.tutor, Role.siswa)
  async getMyCodes(@CurrentUser() user: any) {
    const codes = await this.service.listByOwner(user.id);
    return codes.map((c) => {
      const batasWaktu = new Date(c.createdAt);
      batasWaktu.setDate(batasWaktu.getDate() + 30);
      const sisaHari = Math.max(0, Math.ceil((batasWaktu.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
      return { ...c, sisaHari, sudahKadaluarsa: sisaHari === 0 };
    });
  }
}