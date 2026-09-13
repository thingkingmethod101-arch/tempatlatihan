import { IsInt, IsNumber, IsString, Min } from 'class-validator';

export class CreateTierConfigDto {
  @IsString() nama: string;
  @IsNumber() xpMultiplier: number;
  @IsInt() @Min(0) xpBaseDefault: number;
}