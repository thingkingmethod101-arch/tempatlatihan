import { Controller, Get, Param, UseGuards, Patch, Body, Query } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UsersService } from './users.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private service: UsersService) {}

  @Get('me')
  @Roles(Role.siswa, Role.orang_tua, Role.tutor, Role.admin, Role.sekolah)
  getMe(@CurrentUser() user: any) {
    return this.service.getMe(user.id);
  }

  @Patch('me')
  @Roles(Role.siswa, Role.orang_tua, Role.tutor, Role.admin, Role.sekolah)
  updateMe(@CurrentUser() user: any, @Body() dto: { nama?: string; kontak?: string; kelas?: string; alamat?: string }) {
    return this.service.updateMe(user.id, dto);
  }

  @Get()
  @Roles(Role.admin)
  listAll(@Query('role') role?: string) {
    return this.service.listAll(role);
  }

  @Get(':id')
  @Roles(Role.admin)
  getDetail(@Param('id') id: string) {
    return this.service.getDetail(id);
  }

  @Patch(':id')
  @Roles(Role.admin)
  adminUpdate(@Param('id') id: string, @Body() dto: { nama?: string; kelas?: string; schoolId?: string; alamat?: string }) {
    return this.service.adminUpdate(id, dto);
  }

  @Patch(':id/active')
  @Roles(Role.admin)
  setActive(@Param('id') id: string, @Body() dto: { aktif: boolean }) {
    return this.service.setActive(id, dto.aktif);
  }
}