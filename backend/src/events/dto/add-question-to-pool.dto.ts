import { IsString } from 'class-validator';

export class AddQuestionToPoolDto {
  @IsString() questionId: string;
}