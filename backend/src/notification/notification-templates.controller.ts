import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { NotificationTemplatesService } from './notification-templates.service';
import { CreateTemplateDto } from './dto/create-template.dto';

@Controller('notification-templates')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationTemplatesController {
  constructor(private service: NotificationTemplatesService) {}

  @Get()
  @Roles(Role.admin)
  list() {
    return this.service.list();
  }

  @Post()
  @Roles(Role.admin)
  create(@Body() dto: CreateTemplateDto) {
    return this.service.create(dto);
  }
}