import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';

@Controller('announcements')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnnouncementsController {
  constructor(private service: AnnouncementsService) {}

  @Get()
  @Roles(Role.admin)
  listAll() {
    return this.service.listAll();
  }

  @Post()
  @Roles(Role.admin)
  create(@Body() dto: CreateAnnouncementDto) {
    return this.service.create(dto);
  }

  @Delete(':id')
  @Roles(Role.admin)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Get('active/me')
  listActiveForMe(@CurrentUser() user: any, @Query('jenjang') jenjang?: string) {
    return this.service.listActiveForUser(user.role, jenjang);
  }
}