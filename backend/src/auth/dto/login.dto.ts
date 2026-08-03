import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsString() @IsNotEmpty()
  kontak: string;

  @IsString() @IsNotEmpty()
  password: string;
}