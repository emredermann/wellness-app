import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { JwtUserPayload } from '../decorators/current-user.decorator.js';

/**
 * Bearer token mevcutsa doğrular ve request.user'a ekler; yoksa hata fırlatmadan devam eder.
 */
@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { user?: JwtUserPayload }>();
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    if (type !== 'Bearer' || !token) {
      return true;
    }

    try {
      const secret =
        this.configService.get<string>('JWT_ACCESS_SECRET') ?? 'wellness-dev-access-secret';
      const payload = await this.jwtService.verifyAsync<JwtUserPayload>(token, { secret });
      if (!payload.type || payload.type === 'access') {
        request.user = payload;
      }
    } catch {
      // Opsiyonel guard: geçersiz token durumunda anonim olarak devam et
    }
    return true;
  }
}
