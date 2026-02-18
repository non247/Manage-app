import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';

type LoginResponse = {
  token: string;
  role: string;
  username?: string;
  userId?: number;
};

type RegisterResponse = {
  ok?: boolean;
  user?: { Id?: number; Username?: string; Role?: string };
  message?: string;
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'token';
  private readonly ROLE_KEY = 'role';
  private readonly USERNAME_KEY = 'username';

  private readonly api = 'http://localhost:3000/api/auth';

  private readonly platformId = inject(PLATFORM_ID);
  private get isBrowser() {
    return isPlatformBrowser(this.platformId);
  }

  constructor(private readonly http: HttpClient) {}

  // ✅ Register ส่งแค่ username + password (role ให้ backend default เป็น user)
  register(username: string, password: string): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.api}/register`, {
      username,
      password,
    });
  }

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.api}/login`, { username, password })
      .pipe(
        tap((res) => {
          if (!this.isBrowser) return;

          if (res?.token) localStorage.setItem(this.TOKEN_KEY, res.token);
          if (res?.role) localStorage.setItem(this.ROLE_KEY, res.role);
          if (res?.username)
            localStorage.setItem(this.USERNAME_KEY, res.username);
        })
      );
  }

  isLoggedIn(): boolean {
    if (!this.isBrowser) return false;
    return !!localStorage.getItem(this.TOKEN_KEY);
  }

  getToken(): string | null {
    if (!this.isBrowser) return null;
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getRole(): string | null {
    if (!this.isBrowser) return null;
    return localStorage.getItem(this.ROLE_KEY);
  }

  getUsername(): string | null {
    if (!this.isBrowser) return null;
    return localStorage.getItem(this.USERNAME_KEY);
  }

  logout() {
    if (!this.isBrowser) return;
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.ROLE_KEY);
    localStorage.removeItem(this.USERNAME_KEY);
  }
}
