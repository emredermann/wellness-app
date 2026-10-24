import { BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { DietType, Gender } from '../../generated/prisma/enums.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';

describe('AuthService & KVKK Consent Validation', () => {
  let authService: AuthService;
  let jwtService: JwtService;
  let configService: ConfigService;
  let mockPrisma: {
    user: {
      findUnique: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(() => {
    jwtService = new JwtService();
    configService = new ConfigService({
      JWT_ACCESS_SECRET: 'test-access-secret',
      JWT_REFRESH_SECRET: 'test-refresh-secret',
    });

    mockPrisma = {
      user: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
    };

    authService = new AuthService(
      mockPrisma as unknown as PrismaService,
      jwtService,
      configService,
    );
  });

  describe('RegisterDto KVKK Validation', () => {
    it('kvkkConsent false olduğunda DTO doğrulaması hata vermelidir', async () => {
      const dto = plainToInstance(RegisterDto, {
        email: 'ayse@wellness.local',
        password: 'Password123!',
        name: 'Ayşe Yılmaz',
        kvkkConsent: false,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('kvkkConsent');
    });

    it('kvkkConsent true olduğunda DTO doğrulaması başarılı olmalıdır', async () => {
      const dto = plainToInstance(RegisterDto, {
        email: 'ayse@wellness.local',
        password: 'Password123!',
        name: 'Ayşe Yılmaz',
        kvkkConsent: true,
        gender: Gender.FEMALE,
        dietType: DietType.VEGAN,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('register()', () => {
    it('KVKK onayı olmadan çağrıldığında BadRequestException fırlatmalıdır', async () => {
      await expect(
        authService.register({
          email: 'test@wellness.local',
          password: 'Password123!',
          name: 'Test User',
          kvkkConsent: false,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('geçerli kayıt işleminde KVKK onay zamanını kaydetmeli, audit log üretmeli ve Access+Refresh token dönmelidir', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
        id: '11111111-2222-4333-8444-555555555555',
        ...data,
        createdAt: new Date('2026-10-24T19:00:00Z'),
      }));

      const result = await authService.register(
        {
          email: 'Ayse@Wellness.Local',
          password: 'Password123!',
          name: 'Ayşe Yılmaz',
          kvkkConsent: true,
          weightKg: 58,
          heightCm: 165,
        },
        { ipAddress: '127.0.0.1', userAgent: 'Vitest/1.0' },
      );

      expect(result.user.email).toBe('ayse@wellness.local');
      expect(result.user.kvkkConsent).toBe(true);
      expect(result.user.kvkkConsentAt).toBeInstanceOf(Date);
      expect(result.tokens.accessToken).toBeDefined();
      expect(result.tokens.refreshToken).toBeDefined();
      expect(result.kvkkAudit.event).toBe('KVKK_EXPLICIT_CONSENT_GRANTED');
      expect(authService.getKvkkAuditTrail()).toHaveLength(1);
    });

    it('aynı e-posta ile tekrar kayıt olunduğunda ConflictException fırlatmalıdır', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing-id' });

      await expect(
        authService.register({
          email: 'existing@wellness.local',
          password: 'Password123!',
          name: 'Existing User',
          kvkkConsent: true,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login() & refreshTokens()', () => {
    it('kayıtlı kullanıcı giriş yapabilmeli ve refresh token ile yeni token çifti alabilmelidir', async () => {
      let storedUser: Record<string, unknown> | null = null;
      mockPrisma.user.findUnique.mockImplementation(async () => storedUser);
      mockPrisma.user.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => {
        storedUser = {
          id: '11111111-2222-4333-8444-555555555555',
          ...data,
          createdAt: new Date(),
        };
        return storedUser;
      });

      await authService.register({
        email: 'login@wellness.local',
        password: 'StrongPassword123',
        name: 'Login User',
        kvkkConsent: true,
      });

      const loginResult = await authService.login({
        email: 'login@wellness.local',
        password: 'StrongPassword123',
      });

      expect(loginResult.tokens.accessToken).toBeDefined();

      const refreshed = await authService.refreshTokens(loginResult.tokens.refreshToken);
      expect(refreshed.accessToken).toBeDefined();
      expect(refreshed.refreshToken).toBeDefined();
    });

    it('hatalı şifrede UnauthorizedException fırlatmalıdır', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        authService.login({
          email: 'nonexistent@wellness.local',
          password: 'WrongPassword123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
