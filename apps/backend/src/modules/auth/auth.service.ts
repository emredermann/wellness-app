import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { DietType } from '../../generated/prisma/enums.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { calculateBmiValue } from '../cycle/utils/cycle-calculator.util.js';
import { JwtUserPayload } from './decorators/current-user.decorator.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { hashPassword, verifyPassword } from './utils/password.util.js';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
}

export interface KvkkConsentAuditLog {
  event: 'KVKK_EXPLICIT_CONSENT_GRANTED';
  userId: string;
  email: string;
  kvkkConsent: true;
  consentedAt: string;
  ipAddress?: string;
  userAgent?: string;
  policyVersion: string;
}

export interface RequestClientMeta {
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly kvkkAuditTrail: KvkkConsentAuditLog[] = [];

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto, clientMeta?: RequestClientMeta) {
    if (dto.kvkkConsent !== true) {
      throw new BadRequestException(
        'Kayıt olabilmek için KVKK açık rıza metnini onaylamanız zorunludur.',
      );
    }

    const normalizedEmail = dto.email.trim().toLowerCase();
    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new ConflictException('Bu e-posta adresi ile kayıtlı bir kullanıcı zaten mevcut.');
    }

    const computedBmi =
      dto.bmi ??
      (dto.weightKg && dto.heightCm ? calculateBmiValue(dto.weightKg, dto.heightCm) : undefined);

    const passwordHash = hashPassword(dto.password);
    const consentedAt = new Date();

    const createdUser = await this.prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        name: dto.name.trim(),
        gender: dto.gender ?? null,
        dietType: dto.dietType ?? DietType.REGULAR,
        bmi: computedBmi ?? null,
        cycleStartDate: dto.cycleStartDate ? new Date(dto.cycleStartDate) : null,
        cycleLength: dto.cycleLength ?? 28,
        isCycleTrackingActive: dto.isCycleTrackingActive ?? false,
        kvkkConsent: true,
        kvkkConsentAt: consentedAt,
      },
    });

    const kvkkAudit: KvkkConsentAuditLog = {
      event: 'KVKK_EXPLICIT_CONSENT_GRANTED',
      userId: createdUser.id,
      email: createdUser.email,
      kvkkConsent: true,
      consentedAt: consentedAt.toISOString(),
      ipAddress: clientMeta?.ipAddress,
      userAgent: clientMeta?.userAgent,
      policyVersion: 'KVKK-v1.0-2026',
    };

    this.kvkkAuditTrail.push(kvkkAudit);
    this.logger.log(
      `[KVKK_CONSENT_AUDIT] Kullanıcı açık rıza kaydı oluşturuldu: ${JSON.stringify(kvkkAudit)}`,
    );

    const tokens = await this.generateTokenPair(createdUser.id, createdUser.email);

    return {
      user: this.sanitizeUser(createdUser),
      tokens,
      kvkkAudit,
    };
  }

  async login(dto: LoginDto) {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user || !verifyPassword(dto.password, user.passwordHash)) {
      throw new UnauthorizedException('E-posta adresi veya şifre hatalı.');
    }

    const tokens = await this.generateTokenPair(user.id, user.email);
    this.logger.log(`[AUTH_LOGIN] Kullanıcı girişi başarılı: userId=${user.id}`);

    return {
      user: this.sanitizeUser(user),
      tokens,
    };
  }

  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token zorunludur.');
    }

    try {
      const refreshSecret =
        this.configService.get<string>('JWT_REFRESH_SECRET') ?? 'wellness-dev-refresh-secret';
      const payload = await this.jwtService.verifyAsync<JwtUserPayload>(refreshToken, {
        secret: refreshSecret,
      });

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Geçersiz token tipi; refresh token bekleniyor.');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('Kullanıcı bulunamadı veya oturum geçersiz.');
      }

      return this.generateTokenPair(user.id, user.email);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Geçersiz veya süresi dolmuş refresh token.');
    }
  }

  async generateTokenPair(userId: string, email: string): Promise<AuthTokens> {
    const accessSecret =
      this.configService.get<string>('JWT_ACCESS_SECRET') ?? 'wellness-dev-access-secret';
    const refreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') ?? 'wellness-dev-refresh-secret';
    const accessExpiresInSec = Number(
      this.configService.get<string>('JWT_ACCESS_EXPIRES_IN_SEC') ?? 900,
    );
    const refreshExpiresInSec = Number(
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN_SEC') ?? 604_800,
    );

    const accessPayload: JwtUserPayload = { sub: userId, email, type: 'access' };
    const refreshPayload: JwtUserPayload = { sub: userId, email, type: 'refresh' };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload, {
        secret: accessSecret,
        expiresIn: accessExpiresInSec,
      }),
      this.jwtService.signAsync(refreshPayload, {
        secret: refreshSecret,
        expiresIn: refreshExpiresInSec,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: accessExpiresInSec,
    };
  }

  getKvkkAuditTrail(): ReadonlyArray<KvkkConsentAuditLog> {
    return this.kvkkAuditTrail;
  }

  private sanitizeUser(user: {
    id: string;
    email: string;
    name: string;
    gender: unknown;
    dietType: unknown;
    bmi: unknown;
    cycleStartDate: Date | null;
    cycleLength: number | null;
    isCycleTrackingActive: boolean;
    kvkkConsent: boolean;
    kvkkConsentAt: Date | null;
    createdAt: Date;
  }) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      gender: user.gender,
      dietType: user.dietType,
      bmi: user.bmi !== null && user.bmi !== undefined ? Number(user.bmi) : null,
      cycleStartDate: user.cycleStartDate,
      cycleLength: user.cycleLength,
      isCycleTrackingActive: user.isCycleTrackingActive,
      kvkkConsent: user.kvkkConsent,
      kvkkConsentAt: user.kvkkConsentAt,
      createdAt: user.createdAt,
    };
  }
}
