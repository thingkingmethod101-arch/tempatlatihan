import { IsDateString, IsIn, IsNotEmpty, IsOptional, IsString, MinLength, ValidateIf, IsEmail, IsBoolean } from 'class-validator';
import { Role } from '@prisma/client';

const ALLOWED_PUBLIC_ROLES = [Role.siswa, Role.orang_tua, Role.tutor, Role.sekolah];

export class RegisterDto {
  @IsString() @IsNotEmpty()
  nama: string;

  @IsString() @IsNotEmpty()
  kontak: string; // Nomor WhatsApp

  @IsString() @MinLength(8)
  password: string;

  @IsIn(ALLOWED_PUBLIC_ROLES, { message: 'Role tidak diizinkan untuk registrasi publik' })
  role: Role;

  @IsIn(['L', 'P'], { message: 'Jenis kelamin harus L atau P' })
  jenisKelamin: 'L' | 'P';

  @IsDateString()
  tanggalLahir: string;

  @IsString() @IsNotEmpty()
  alamat: string;

  @IsOptional() @IsString()
  schoolId?: string;

  @ValidateIf((o) => o.role === Role.tutor)
  @IsString() @IsNotEmpty()
  namaLengkap?: string;

  @ValidateIf((o) => o.role === Role.tutor)
  @IsString() @IsNotEmpty()
  jenjangPendidikanTerakhir?: string;

  @IsEmail()
  email: string;

  @IsBoolean()
  setujuSyaratKetentuan: boolean;
}