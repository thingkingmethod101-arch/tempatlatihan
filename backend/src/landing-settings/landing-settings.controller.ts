import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { LandingSettingsService } from './landing-settings.service';

@Controller('landing-settings')
export class LandingSettingsController {
  constructor(private service: LandingSettingsService) {}

  @Get()
  get() {
    return this.service.get();
  }

  @Patch()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  update(@Body() dto: { heroImageId?: string; testImageId?: string; galleryImageId?: string }) {
    return this.service.update(dto);
  }
}