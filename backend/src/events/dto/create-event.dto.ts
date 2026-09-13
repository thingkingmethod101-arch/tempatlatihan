import { IsDateString, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { EventMode } from '@prisma/client';

export class CreateEventDto {
  @IsString() nama: string;
  @IsString() tipe: string;
  @IsEnum(EventMode) mode: EventMode;
  @IsString() jenjang: string;
  @IsString() skillNodeId: string;
  @IsOptional() @IsDateString() jadwal?: string;
  @IsOptional() @IsString() syaratLolos?: string;
  @IsOptional() @IsNumber() biaya?: number;
  @IsOptional() @IsString() reward?: string;
}