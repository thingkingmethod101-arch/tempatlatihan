import { IsEnum } from 'class-validator';
import { ModerationStatus } from '@prisma/client';

export class ModerateQuestionDto {
  @IsEnum(ModerationStatus)
  statusModerasi: ModerationStatus;
}