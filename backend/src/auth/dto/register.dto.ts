import { IsEnum, IsNotEmpty, IsOptional, IsString, MinLength, ValidateIf } from 'class-validator';
import { Role } from '@prisma/client';

export class RegisterDto {
  @IsString() @IsNotEmpty()
  nama: string;

  @IsString() @IsNotEmpty()
  kontak: string; // email atau nomor WA

  @IsString() @MinLength(8)
  password: string;

  @IsEnum(Role)
  role: Role;

  @IsOptional() @IsString()
  schoolId?: string;

  // wajib diisi kalau role = tutor
  @ValidateIf((o) => o.role === Role.tutor)
  @IsString() @IsNotEmpty()
  namaLengkap?: string;

  @ValidateIf((o) => o.role === Role.tutor)
  @IsString() @IsNotEmpty()
  jenjangPendidikanTerakhir?: string;
}