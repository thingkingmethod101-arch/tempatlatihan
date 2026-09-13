import { IsArray, IsOptional } from 'class-validator';

export class ApplyScholarshipDto {
  @IsOptional() @IsArray()
  dokumenPendukung?: string[]; // isi dengan fileAssetId dari Fase 3 (purpose: dokumen_beasiswa)
}