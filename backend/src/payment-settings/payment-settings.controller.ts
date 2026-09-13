import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PaymentSettingsService } from './payment-settings.service';

@Controller('payment-settings')
export class PaymentSettingsController {
  constructor(private service: PaymentSettingsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  get() {
    return this.service.get();
  }

  @Patch()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  update(@Body() body: { qrisFileAssetId: string }) {
    return this.service.update(body.qrisFileAssetId);
  }
}