import { IsArray, IsDateString, IsOptional, IsString } from 'class-validator';
import { Role } from '@prisma/client';

export class CreateAnnouncementDto {
  @IsString() judul: string;
  @IsString() isi: string;
  @IsOptional() @IsArray() targetRole?: Role[];
  @IsOptional() @IsArray() targetJenjang?: string[];
  @IsOptional() @IsDateString() expiresAt?: string;
}