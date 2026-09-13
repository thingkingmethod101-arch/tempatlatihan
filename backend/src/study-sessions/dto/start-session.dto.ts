import { IsInt, IsOptional, IsString } from 'class-validator';

export class StartSessionDto {
  @IsOptional() @IsString() skillNodeId?: string;
  @IsOptional() @IsString() mode?: string;
  @IsOptional() @IsString() presetDipilih?: string;
  @IsOptional() @IsInt() targetSiklus?: number;
}