import { Type } from 'class-transformer';
import {
  IsArray, IsBoolean, IsEnum, IsIn, IsInt, IsNumber, IsOptional, IsString, ValidateIf, ValidateNested, MaxLength, IsNotEmpty, IsUrl,
} from 'class-validator';
import { ContentType } from '@prisma/client';

class QuestionOptionInputDto {
  @IsString() urutan: string;
  @IsEnum(ContentType) tipe: ContentType;
  @IsString() konten: string;
  @IsOptional() isCorrect?: boolean;
}

class ChapterQuestionInputDto {
  @IsOptional() @IsString() questionText?: string;
  @IsOptional() @IsString() questionImageUrl?: string;

  @IsArray() @ValidateNested({ each: true }) @Type(() => QuestionOptionInputDto)
  options: QuestionOptionInputDto[];
}

class ChapterInputDto {
  @IsString() judul: string;
  @IsInt() urutan: number;
  @IsOptional() @IsBoolean() isFree?: boolean;

  @IsIn(['viewer_pdf', 'latihan_soal', 'video_youtube'])
  tipe: 'viewer_pdf' | 'latihan_soal' | 'video_youtube';

  @ValidateIf((o) => o.tipe === 'viewer_pdf')
  @IsString()
  materiFileAssetId?: string;

  @ValidateIf((o) => o.tipe === 'video_youtube')
  @IsUrl()
  videoUrl?: string;

  @ValidateIf((o) => o.tipe === 'latihan_soal')
  @IsArray() @ValidateNested({ each: true }) @Type(() => ChapterQuestionInputDto)
  questions?: ChapterQuestionInputDto[];
}

class PricingInputDto {
  @IsInt() durasiBulan: number;
  @IsNumber() harga: number;
  @IsOptional() @IsIn(['video', 'materi', 'bundle'])
  paket?: 'video' | 'materi' | 'bundle';
}

export class CreateContentDto {
  @IsString() skillNodeId: string;
  @IsString() tierId: string;

  @IsArray() @ValidateNested({ each: true }) @Type(() => ChapterInputDto)
  chapters: ChapterInputDto[];

  @IsArray() @ValidateNested({ each: true }) @Type(() => PricingInputDto)
  pricing: PricingInputDto[];

  @IsString() @IsNotEmpty() @MaxLength(1500)
  deskripsi: string;

  @IsString() @IsNotEmpty()
  judul: string;

  @IsOptional() @IsString()
  thumbnailFileAssetId?: string;


}