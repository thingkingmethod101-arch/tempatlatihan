import { IsEnum, IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';
import { FilePurpose } from '@prisma/client';

export class PresignDto {
  @IsEnum(FilePurpose)
  purpose: FilePurpose;

  @IsString() @IsNotEmpty()
  mimeType: string;

  @IsInt() @Min(1) @Max(10 * 1024 * 1024) // 10MB
  sizeBytes: number;
}