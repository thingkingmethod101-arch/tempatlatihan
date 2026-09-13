import { IsDateString, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateProgramDto {
  @IsString() nama: string;
  @IsString() tipe: string; // 'akses_konten' | 'dana_tunai'
  @IsOptional() @IsString() kriteria?: string;
  @IsOptional() @IsInt() kuota?: number;
  @IsOptional() @IsDateString() deadlineAt?: string;
}