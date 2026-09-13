import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Audit } from '../audit/audit.decorator';
import { TransactionsService } from './transactions.service';
import { CheckoutDto } from './dto/checkout.dto';

@Controller('transactions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TransactionsController {
  constructor(private service: TransactionsService) {}

  @Post()
  @Roles(Role.siswa, Role.orang_tua, Role.tutor)
  checkout(@CurrentUser() user: any, @Body() dto: CheckoutDto) {
    return this.service.checkout(user.id, dto);
  }

  @Get('me')
  @Roles(Role.siswa, Role.orang_tua, Role.tutor, Role.sekolah, Role.admin)
  listMine(@CurrentUser() user: any) {
    return this.service.listMine(user.id);
  }

  @Patch(':id/confirm-manual')
  @Roles(Role.admin)
  @Audit({ aksi: 'konfirmasi_pembayaran_manual', entityType: 'transaction', prismaModel: 'transaction' })
  confirmManual(@Param('id') id: string) {
    return this.service.confirmManual(id);
  }

  @Get('admin/pending')
  @Roles(Role.admin)
  listPending() {
    return this.service.listPending();
  }

  @Post('psych-test')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.siswa)
  checkoutPsychTest(@CurrentUser() user: any) {
    return this.service.createForPsychTest(user.id);
  }

  @Get('admin/pending-count')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  countPending() {
    return this.service.countPending();
  }

}