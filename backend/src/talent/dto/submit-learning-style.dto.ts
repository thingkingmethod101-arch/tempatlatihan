import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { AlasanTidakSuka, PreferensiGaya } from '@prisma/client';

export class SubmitLearningStyleDto {
  @IsString() skillNodeId: string;
  @IsBoolean() suka: boolean;
  @IsOptional() @IsEnum(AlasanTidakSuka) alasanTidakSuka?: AlasanTidakSuka;
  @IsOptional() @IsEnum(PreferensiGaya) preferensiGaya?: PreferensiGaya;
}