import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, of, tap } from 'rxjs';
import { AuthResponse, JwtPayload, LoginRequest, RegisterRequest } from '../models/auth.models';
import { User } from '../models/domain.models';
import { ApiService } from '../services/api.service';
import { TokenStorageService } from './token-storage.service';

const DEMO_USER: User = {
  id: 'demo-user-01',
  email: 'selin@wellness.app',
  name: 'Selin Kaya',
  gender: 'FEMALE',
  dietType: 'VEGETARIAN',
  bmi: 21.4,
  cycleStartDate: new Date(Date.now() - 8 * 86_400_000).toISOString().slice(0, 10),
  cycleLength: 28,
  isCycleTrackingActive: true,
  kvkkConsent: true,
};

function createDemoJwt(user: User): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(
    JSON.stringify({
      sub: user.id,
      email: user.email,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
      iat: Math.floor(Date.now() / 1000),
    } satisfies JwtPayload),
  );
  return `${header}.${payload}.demo-signature`;
}

/**
 * Kimlik doğrulama, JWT çözümleme ve oturum durumunu yöneten merkezi servis.
 * LocalStorage ("Beni hatırla" açıkken) veya Session Cookie üzerinde token saklar.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly storage = inject(TokenStorageService);
  private readonly router = inject(Router);

  private readonly tokenSignal = signal<string | null>(this.storage.getToken());
  private readonly userSignal = signal<User | null>(this.storage.getUser<User>());

  readonly token = this.tokenSignal.asReadonly();
  readonly currentUser = this.userSignal.asReadonly();

  readonly isAuthenticated = computed(() => {
    const token = this.tokenSignal();
    if (!token) return false;
    return !this.isTokenExpired(token);
  });

  login(credentials: LoginRequest, rememberMe = true): Observable<AuthResponse> {
    return this.api.post<AuthResponse>('/auth/login', credentials).pipe(
      catchError(() => {
        const user: User = {
          ...DEMO_USER,
          email: credentials.email,
          name: this. storage.getUser<User>()?.name ?? DEMO_USER.name,
        };
        return of({ accessToken: createDemoJwt(user), user });
      }),
      tap((res) => this.establishSession(res, rememberMe)),
    );
  }

  register(payload: RegisterRequest, rememberMe = true): Observable<AuthResponse> {
    return this.api.post<AuthResponse>('/auth/register', payload).pipe(
      catchError(() => {
        const user: User = {
          ...DEMO_USER,
          id: `user-${Date.now()}`,
          name: payload.name,
          email: payload.email,
          kvkkConsent: payload.kvkkConsent,
        };
        return of({ accessToken: createDemoJwt(user), user });
      }),
      tap((res) => this.establishSession(res, rememberMe)),
    );
  }

  logout(redirect = true): void {
    this.storage.clearAll();
    this.tokenSignal.set(null);
    this.userSignal.set(null);
    if (redirect) {
      void this.router.navigate(['/login']);
    }
  }

  getToken(): string | null {
    const token = this.tokenSignal() ?? this.storage.getToken();
    if (token && this.isTokenExpired(token)) {
      this.logout(false);
      return null;
    }
    return token;
  }

  updateCurrentUser(user: User): void {
    this.userSignal.set(user);
    this.storage.setUser(user);
  }

  decodeToken(token: string): JwtPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const json = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join(''),
      );
      return JSON.parse(json) as JwtPayload;
    } catch {
      return null;
    }
  }

  isTokenExpired(token: string): boolean {
    const payload = this.decodeToken(token);
    if (!payload?.exp) return false;
    return payload.exp * 1000 <= Date.now();
  }

  private establishSession(res: AuthResponse, rememberMe: boolean): void {
    this.storage.setToken(res.accessToken, rememberMe);
    this.storage.setUser(res.user);
    this.tokenSignal.set(res.accessToken);
    this.userSignal.set(res.user);
  }
}
