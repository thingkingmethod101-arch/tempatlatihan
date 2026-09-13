import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { NotifChannel } from '@prisma/client';

export class CreateTemplateDto {
  @IsString() kode: string;
  @IsEnum(NotifChannel) channel: NotifChannel;
  @IsString() isiTemplate: string;
  @IsOptional() @IsBoolean() aktif?: boolean;
}