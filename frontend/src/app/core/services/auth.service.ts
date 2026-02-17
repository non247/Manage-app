// import { Injectable, PLATFORM_ID, inject } from '@angular/core';
// import { isPlatformBrowser } from '@angular/common';

// @Injectable({
//   providedIn: 'root',
// })
// export class AuthService {
//   private TOKEN_KEY = 'token';
//   private ROLE_KEY = 'role';
//   private USERS_KEY = 'users';

//   private platformId = inject(PLATFORM_ID);

//   private get isBrowser(): boolean {
//     return isPlatformBrowser(this.platformId);
//   }

//   // =========================
//   // ===== Register =====
//   // =========================
//   register(username: string, password: string, role: string): boolean {
//     if (!this.isBrowser) return false;

//     const users = this.getUsers();

//     // เช็ค username ซ้ำ
//     const userExists = users.find((u: any) => u.username === username);
//     if (userExists) return false;

//     // เพิ่ม user ใหม่
//     users.push({ username, password, role });

//     localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
//     return true;
//   }

//   // =========================
//   // ===== Login =====
//   // =========================
//   login(username: string, password: string): boolean {
//     if (!this.isBrowser) return false;

//     // ===== Mock User (ของเดิม) =====
//     if (username === 'admin' && password === '1234') {
//       localStorage.setItem(this.TOKEN_KEY, 'admin-token');
//       localStorage.setItem(this.ROLE_KEY, 'admin');
//       return true;
//     }

//     if (username === 'user' && password === '1234') {
//       localStorage.setItem(this.TOKEN_KEY, 'user-token');
//       localStorage.setItem(this.ROLE_KEY, 'user');
//       return true;
//     }

//     // ===== User จาก Register =====
//     const users = this.getUsers();
//     const user = users.find(
//       (u: any) => u.username === username && u.password === password
//     );

//     if (user) {
//       localStorage.setItem(this.TOKEN_KEY, 'user-token');
//       localStorage.setItem(this.ROLE_KEY, user.role);
//       return true;
//     }

//     return false;
//   }

//   // =========================
//   // ===== Logout =====
//   // =========================
//   logout() {
//     if (!this.isBrowser) return;
//     localStorage.removeItem(this.TOKEN_KEY);
//     localStorage.removeItem(this.ROLE_KEY);
//   }

//   // =========================
//   // ===== Check Login =====
//   // =========================
//   isLoggedIn(): boolean {
//     if (!this.isBrowser) return false;
//     return !!localStorage.getItem(this.TOKEN_KEY);
//   }

//   // =========================
//   // ===== Get Role =====
//   // =========================
//   getRole(): string | null {
//     if (!this.isBrowser) return null;
//     return localStorage.getItem(this.ROLE_KEY);
//   }

//   // =========================
//   // ===== Get Users =====
//   // =========================
//   getUsers(): any[] {
//     if (!this.isBrowser) return [];
//     return JSON.parse(localStorage.getItem(this.USERS_KEY) || '[]');
//   }
// }
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
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

  private platformId = inject(PLATFORM_ID);
  private get isBrowser() {
    return isPlatformBrowser(this.platformId);
  }

  constructor(private http: HttpClient) {}

  // ✅ Register ส่งแค่ username + password (role ให้ backend default เป็น user)
  register(username: string, password: string): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.api}/register`, { username, password });
  }

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.api}/login`, { username, password })
      .pipe(
        tap((res) => {
          if (!this.isBrowser) return;

          if (res?.token) localStorage.setItem(this.TOKEN_KEY, res.token);
          if (res?.role) localStorage.setItem(this.ROLE_KEY, res.role);
          if (res?.username) localStorage.setItem(this.USERNAME_KEY, res.username);
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
