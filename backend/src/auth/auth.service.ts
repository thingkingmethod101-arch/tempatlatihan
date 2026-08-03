import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Role, TutorVerificationStatus } from '@prisma/client';

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
    if (existing) throw new ConflictException('Kontak sudah terdaftar');

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        nama: dto.nama,
        kontak: dto.kontak,
        role: dto.role,
        schoolId: dto.schoolId,
        authCredential: { create: { passwordHash, provider: 'password' } },
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
}