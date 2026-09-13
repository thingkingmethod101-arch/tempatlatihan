import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsInt, IsOptional, IsString, ValidateNested } from 'class-validator';
import { ContentType } from '@prisma/client';

class QuestionOptionDto {
  @IsString() urutan: string; // 'A' | 'B' | 'C' | 'D'
  @IsEnum(ContentType) tipe: ContentType;
  @IsString() konten: string;
  @IsOptional() isCorrect?: boolean;
}

export class CreateQuestionDto {
  @IsString() skillNodeId: string;
  @IsString() tierId: string;
  @IsEnum(ContentType) questionType: ContentType;
  @IsOptional() @IsString() questionText?: string;
  @IsOptional() @IsString() questionImageUrl?: string;
  @IsOptional() @IsInt() poinBenar?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionOptionDto)
  options: QuestionOptionDto[];
}