import { Body, Controller, Get, Param, Post, ServiceUnavailableException, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { FilesService } from './files.service';
import { PresignDto } from './dto/presign.dto';
import { ConfirmDto } from './dto/confirm.dto';

@Controller('files')
@UseGuards(JwtAuthGuard)
export class FilesController {
  constructor(private service: FilesService) {}

  @Post('presign')
  async presign(@CurrentUser() user: any, @Body() dto: PresignDto) {
    const result = await this.service.presign(user.id, dto);
    if (!result.available) {
      throw new ServiceUnavailableException({
        error: 'STORAGE_NOT_CONFIGURED',
        message: result.message ?? 'Penyimpanan file belum tersedia',
      });
    }
    return result;
  }

  @Post('confirm')
  confirm(@CurrentUser() user: any, @Body() dto: ConfirmDto) {
    return this.service.confirm(user.id, dto);
  }

  @Get(':id/signed-url')
  async getSignedUrl(@CurrentUser() user: any, @Param('id') id: string) {
    const result = await this.service.getSignedReadUrl(id, user);
    if (!result.available) {
      throw new ServiceUnavailableException({
        error: 'STORAGE_NOT_CONFIGURED',
        message: result.message ?? 'Penyimpanan file belum tersedia',
      });
    }
    return result;
  }
}