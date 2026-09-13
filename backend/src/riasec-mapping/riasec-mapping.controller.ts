import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RiasecMappingService } from './riasec-mapping.service';

@Controller('riasec-mapping')
export class RiasecMappingController {
  constructor(private service: RiasecMappingService) {}

  @Get()
  list() {
    return this.service.list();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  create(@Body() dto: { kombinasi: string; saranJurusan: string; saranKarir: string }) {
    return this.service.create(dto);
  }

  @Post('bulk-upload')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  bulkUpload(@Body() data: unknown) {
    return this.service.bulkUpload(data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}