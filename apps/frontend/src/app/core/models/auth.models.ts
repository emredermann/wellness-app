// Kimlik doğrulama (auth) sözleşmeleri.
// Backend auth endpoint'leri bu tiplere göre implement edilmelidir:
//   POST /api/auth/login     body: LoginRequest     -> AuthResponse
//   POST /api/auth/register  body: RegisterRequest  -> AuthResponse

import { User } from './domain.models';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  /** KVKK aydınlatma metni + açık rıza onayı (zorunlu, true olmalı) */
  kvkkConsent: boolean;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

/** JWT payload'ında beklenen standart alanlar */
export interface JwtPayload {
  sub: string;
  email?: string;
  /** Unix epoch (saniye) */
  exp?: number;
  iat?: number;
  [claim: string]: unknown;
}
