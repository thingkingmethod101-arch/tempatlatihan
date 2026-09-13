import { IsArray, IsOptional, IsString } from 'class-validator';

export class CreateSkillNodeDto {
  @IsString() nama: string;
  @IsOptional() @IsString() parentSkillId?: string;
  @IsOptional() @IsArray() examContextTags?: string[];
}