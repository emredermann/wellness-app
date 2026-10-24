import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';

const TOKEN_KEY = 'wl_access_token';
const USER_KEY = 'wl_user';

/**
 * Token kalıcılık katmanı.
 *
 * - `persistent = true`  ("Beni hatırla")  -> localStorage (tarayıcı kapansa da kalır)
 * - `persistent = false`                   -> oturum çerezi (session cookie, tarayıcı kapanınca silinir)
 *
 * Çerez `SameSite=Strict` ve HTTPS üzerinde `Secure` olarak yazılır.
 * Not: JS ile yazılan çerez HttpOnly olamaz; en yüksek güvenlik için backend'in
 * HttpOnly refresh-token çerezi set etmesi önerilir.
 */
@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  private readonly document = inject(DOCUMENT);

  private get storage(): Storage | null {
    try {
      return this.document.defaultView?.localStorage ?? null;
    } catch {
      return null; // Safari private mode vb.
    }
  }

  getToken(): string | null {
    return this.storage?.getItem(TOKEN_KEY) ?? this.readCookie(TOKEN_KEY);
  }

  setToken(token: string, persistent: boolean): void {
    this.clearToken();
    if (persistent && this.storage) {
      this.storage.setItem(TOKEN_KEY, token);
    } else {
      this.writeCookie(TOKEN_KEY, token);
    }
  }

  clearToken(): void {
    this.storage?.removeItem(TOKEN_KEY);
    this.deleteCookie(TOKEN_KEY);
  }

  /** Kullanıcı özetini (UI için) cache'ler; hassas veri içermemelidir. */
  getUser<T>(): T | null {
    const raw = this.storage?.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  setUser(user: unknown): void {
    this.storage?.setItem(USER_KEY, JSON.stringify(user));
  }

  clearAll(): void {
    this.clearToken();
    this.storage?.removeItem(USER_KEY);
  }

  // ---- Cookie yardımcıları ----

  private readCookie(name: string): string | null {
    const match = this.document.cookie
      .split('; ')
      .find((c) => c.startsWith(`${name}=`));
    return match ? decodeURIComponent(match.substring(name.length + 1)) : null;
  }

  private writeCookie(name: string, value: string): void {
    const secure = this.document.location?.protocol === 'https:' ? '; Secure' : '';
    this.document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; SameSite=Strict${secure}`;
  }

  private deleteCookie(name: string): void {
    this.document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Strict`;
  }
}
