import { IsInt } from 'class-validator';

export class UpdateScoringConfigDto {
  @IsInt() benar: number;
  @IsInt() salah: number;
  @IsInt() kosong: number;
}