import { IsEnum, IsInt, IsNotEmpty, IsString, Min } from 'class-validator';
import { FilePurpose } from '@prisma/client';

export class ConfirmDto {
  @IsString() @IsNotEmpty()
  path: string;

  @IsEnum(FilePurpose)
  purpose: FilePurpose;

  @IsString() @IsNotEmpty()
  mimeType: string;

  @IsInt() @Min(1)
  sizeBytes: number;
}