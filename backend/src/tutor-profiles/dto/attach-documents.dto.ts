import { IsOptional, IsString } from 'class-validator';

export class AttachDocumentsDto {
  @IsOptional() @IsString()
  dokumenKtpFileAssetId?: string;

  @IsOptional() @IsString()
  dokumenIjazahFileAssetId?: string;

  @IsOptional() @IsString()
  dokumenCvFileAssetId?: string;
}