import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class SubmitAnswerDto {
  @IsString() questionId: string;
  @IsString() optionId: string; // id QuestionOption yang dipilih siswa

  @IsOptional() @IsInt() @Min(0)
  waktuJawabDetik?: number;
}