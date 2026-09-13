import { Body, Controller, Get, Post, UseGuards, Patch, Res, Delete, Param } from '@nestjs/common';
import type { Response } from 'express';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { LedgerService } from './ledger.service';

@Controller('ledger')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.admin)
export class LedgerController {
  constructor(private service: LedgerService) {}

  @Get()
  list() {
    return this.service.listCombined();
  }

  @Post()
  create(
    @CurrentUser() user: any,
    @Body() dto: { keterangan: string; tipe: string; jumlah: number; buktiFileAssetId?: string; kodeAkun?: string },
  ) {
    return this.service.createEntry(user.id, dto);
  }

  @Patch('attach-bukti')
  attachBukti(@Body() dto: { sumber: 'manual' | 'transaksi'; id: string; buktiFileAssetId: string }) {
    return this.service.attachBukti(dto.sumber, dto.id, dto.buktiFileAssetId);
  }

  @Get('export')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  async exportExcel(@Res() res: Response) {
    const buffer = await this.service.exportToExcel();
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="pembukuan-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    });
    res.send(buffer);
  }

  @Get('kode-akun')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  listKodeAkun() {
    return this.service.listKodeAkun();
  }

  @Post('kode-akun')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  createKodeAkun(@Body() dto: { kode: string; nama: string }) {
    return this.service.createKodeAkun(dto.kode, dto.nama);
  }

  @Delete('kode-akun/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  deleteKodeAkun(@Param('id') id: string) {
    return this.service.deleteKodeAkun(id);
  }

  @Get('ringkasan-kode-akun')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  getRingkasanPerKode() {
    return this.service.getRingkasanPerKode();
  }
}