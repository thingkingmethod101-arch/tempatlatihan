import { IsEnum, IsOptional, IsString } from 'class-validator';
import { TutorVerificationStatus } from '@prisma/client';

export class VerifyTutorDto {
  @IsEnum(TutorVerificationStatus)
  keputusan: TutorVerificationStatus; // 'disetujui' | 'ditolak'

  @IsOptional() @IsString()
  catatan?: string;
}