import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ScholarshipStatus } from '@prisma/client';

export class VerifyApplicationDto {
  @IsEnum(ScholarshipStatus) status: ScholarshipStatus; // 'disetujui' | 'ditolak'
  @IsOptional() @IsString() catatan?: string;
}