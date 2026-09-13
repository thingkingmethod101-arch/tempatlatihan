import { IsBoolean, IsDateString, IsInt, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateEventRoundDto {
  @IsString() namaBabak: string;
  @IsString() tierId: string;
  @IsOptional() @IsBoolean() isFree?: boolean;
  @IsOptional() @IsBoolean() isFinal?: boolean;
  @IsOptional() @Type(() => Number) @IsNumber() biaya?: number;
  @IsOptional() @IsDateString() jadwalMulai?: string;
  @IsOptional() @Type(() => Number) @IsInt() urutan?: number;
  @IsOptional() @Type(() => Number) @IsInt() passingGrade?: number;
  @IsInt() @Type(() => Number) durasiMenit: number;
}