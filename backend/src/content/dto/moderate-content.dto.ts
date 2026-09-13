import { IsEnum } from 'class-validator';
import { ModerationStatus } from '@prisma/client';

export class ModerateContentDto {
  @IsEnum(ModerationStatus)
  statusModerasi: ModerationStatus;
}