import { Injectable, ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Role, TutorVerificationStatus } from '@prisma/client';
import { randomBytes, createHash } from 'crypto';

function normalizeWaNumber(raw: string): string {
  const digits = raw.replace(/[\s\-()]/g, '').replace(/^0/, '62').replace(/^\+/, '');
  return '+' + digits.replace(/\D/g, '');
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { kontak: dto.kontak } });
    if (!dto.setujuSyaratKetentuan) {
      throw new BadRequestException('Kamu harus menyetujui Syarat & Ketentuan untuk mendaftar');
    }
    const kontakDipakai = await this.prisma.user.findUnique({ where: { kontak: dto.kontak } });
    if (kontakDipakai) {
      throw new BadRequestException('Nomor WhatsApp ini sudah terdaftar. Silakan gunakan nomor lain atau masuk dengan akun yang sudah ada.');
    }

    if (dto.email) {
      const emailDipakai = await this.prisma.user.findUnique({ where: { email: dto.email } });
      if (emailDipakai) {
        throw new BadRequestException('Email ini sudah terdaftar. Silakan gunakan email lain atau masuk dengan akun yang sudah ada.');
      }
    }
    if (existing) throw new ConflictException('Kontak sudah terdaftar');

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        nama: dto.nama,
        kontak: normalizeWaNumber(dto.kontak),
        role: dto.role,
        schoolId: dto.schoolId,
        jenisKelamin: dto.jenisKelamin,
        tanggalLahir: new Date(dto.tanggalLahir),
        alamat: dto.alamat,
        email: dto.email,
        authCredential: { create: { passwordHash, provider: 'password' } },
        syaratDisetujuiPada: new Date(),
      },
    });

    if (dto.role === Role.tutor) {
      await this.prisma.tutorProfile.create({
        data: {
          userId: user.id,
          namaLengkap: dto.namaLengkap!,
          jenjangPendidikanTerakhir: dto.jenjangPendidikanTerakhir!,
          statusVerifikasi: TutorVerificationStatus.pending,
        },
      });
    }

    return this.issueTokens(user.id, user.role, user.kontak);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { kontak: dto.kontak },
      include: { authCredential: true },
    });
    if (!user?.authCredential?.passwordHash) {
      throw new UnauthorizedException('Kontak atau password salah');
    }
    const valid = await bcrypt.compare(dto.password, user.authCredential.passwordHash);
    if (!valid) throw new UnauthorizedException('Kontak atau password salah');
    if (!user.aktif) throw new UnauthorizedException('Akun ini telah dinonaktifkan, hubungi admin');

    await this.prisma.authCredential.update({
      where: { userId: user.id },
      data: { lastLoginAt: new Date() },
    });

    return this.issueTokens(user.id, user.role, user.kontak);
  }

  async refresh(refreshToken: string) {
    const tokenHash = hashToken(refreshToken);
    const record = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });
    if (!record || record.revokedAt || record.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token tidak valid');
    }
    const user = await this.prisma.user.findUnique({ where: { id: record.userId } });
    if (!user) throw new UnauthorizedException('User tidak ditemukan');

    return { accessToken: this.signAccessToken(user.id, user.role, user.kontak) };
  }

  async logout(refreshToken: string) {
    const tokenHash = hashToken(refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash },
      data: { revokedAt: new Date() },
    });
    return { success: true };
  }

  private signAccessToken(userId: string, role: Role, kontak: string) {
    return this.jwt.sign(
      { sub: userId, role, kontak },
      { secret: this.config.get<string>('JWT_ACCESS_SECRET'), expiresIn: '15m' },
    );
  }

  private async issueTokens(userId: string, role: Role, kontak: string) {
    const accessToken = this.signAccessToken(userId, role, kontak);

    const rawRefreshToken = crypto.randomBytes(40).toString('hex');
    const tokenHash = hashToken(rawRefreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await this.prisma.refreshToken.create({ data: { userId, tokenHash, expiresAt } });

    return { accessToken, refreshToken: rawRefreshToken };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return { message: 'Kalau email terdaftar, link reset sudah dikirim.' };

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await this.prisma.passwordResetToken.create({ data: { userId: user.id, tokenHash, expiresAt } });

    const resetUrl = `${this.config.get('FRONTEND_URL')}/reset-password?token=${rawToken}`;
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.config.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: this.config.get('EMAIL_FROM') || 'noreply@tempatlatihan.com',
        to: email,
        subject: 'Reset Password - Tempat Latihan.com',
        html: `<p>Klik link berikut untuk atur ulang password kamu (berlaku 1 jam):</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
      }),
    });

    return { message: 'Kalau email terdaftar, link reset sudah dikirim.' };
  }

  async resetPassword(token: string, newPassword: string) {
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const record = await this.prisma.passwordResetToken.findUnique({ where: { tokenHash } });
    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new UnauthorizedException('Link reset tidak valid atau sudah kedaluwarsa');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.authCredential.update({ where: { userId: record.userId }, data: { passwordHash } });
    await this.prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } });

    return { success: true };
  }
}