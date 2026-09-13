import { IsArray, IsString } from 'class-validator';

export class CreateCareerMappingDto {
  @IsString() skillNodeId: string;
  @IsArray() saranJurusan: string[];
  @IsArray() saranKarier: string[];
}