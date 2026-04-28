import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';

type LoginResponse = {
  token: string;
  role: string;
  username?: string;
  email?: string;
  userId?: number;
};

type RegisterResponse = {
  ok?: boolean;
  user?: {
    Id?: number;
    Username?: string;
    Role?: string;
    Email?: string;
  };
  message?: string;
};

type ForgotPasswordResponse = {
  message?: string;
};

type ResetPasswordResponse = {
  message?: string;
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'token';
  private readonly ROLE_KEY = 'role';
  private readonly USERNAME_KEY = 'username';
  private readonly EMAIL_KEY = 'email';
  private readonly api = 'https://manage-app-5koc.onrender.com/api/auth';

  private readonly platformId = inject(PLATFORM_ID);
  private get isBrowser() {
    return isPlatformBrowser(this.platformId);
  }

  private readonly _isLoggedIn$ = new BehaviorSubject<boolean>(false);
  readonly isLoggedIn$ = this._isLoggedIn$.asObservable();

  constructor(private readonly http: HttpClient) {
    this.initFromStorage();
  }

  private initFromStorage() {
    if (!this.isBrowser) return;
    this._isLoggedIn$.next(!!localStorage.getItem(this.TOKEN_KEY));
  }

  // ✅ Register
  register(
    username: string,
    password: string,
    email: string
  ): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.api}/register`, {
      username,
      password,
      email,
    });
  }

  // ✅ Login (กรอก username หรือ email ก็ได้)
  login(username: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.api}/login`, { username, password })
      .pipe(
        tap((res) => {
          if (!this.isBrowser) return;

          if (res?.token) localStorage.setItem(this.TOKEN_KEY, res.token);
          if (res?.role) localStorage.setItem(this.ROLE_KEY, res.role);
          if (res?.username) {
            localStorage.setItem(this.USERNAME_KEY, res.username);
          }
          if (res?.email) {
            localStorage.setItem(this.EMAIL_KEY, res.email);
          }

          this._isLoggedIn$.next(!!res?.token);
        })
      );
  }

  // ✅ Forgot Password
  forgotPassword(email: string): Observable<ForgotPasswordResponse> {
    return this.http.post<ForgotPasswordResponse>(
      `${this.api}/forgot-password`,
      {
        email,
      }
    );
  }

  // ✅ Reset Password
  resetPassword(
    token: string,
    password: string
  ): Observable<ResetPasswordResponse> {
    return this.http.post<ResetPasswordResponse>(`${this.api}/reset-password`, {
      token,
      password,
    });
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

  getEmail(): string | null {
    if (!this.isBrowser) return null;
    return localStorage.getItem(this.EMAIL_KEY);
  }

  logout() {
    if (!this.isBrowser) return;
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.ROLE_KEY);
    localStorage.removeItem(this.USERNAME_KEY);
    localStorage.removeItem(this.EMAIL_KEY);
    this._isLoggedIn$.next(false);
  }
}
