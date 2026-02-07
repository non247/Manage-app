import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private TOKEN_KEY = 'token';
  private ROLE_KEY = 'role';

  // ===== Login =====
  login(username: string, password: string): boolean {
    // ===== Mock User =====
    if (username === 'admin' && password === '1234') {
      localStorage.setItem(this.TOKEN_KEY, 'admin-token');
      localStorage.setItem(this.ROLE_KEY, 'admin');
      return true;
    }

    if (username === 'user' && password === '1234') {
      localStorage.setItem(this.TOKEN_KEY, 'user-token');
      localStorage.setItem(this.ROLE_KEY, 'user');
      return true;
    }

    return false;
  }

  // ===== Logout =====
  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.ROLE_KEY);
  }

  // ===== Check Login =====
  isLoggedIn(): boolean {
    return !!localStorage.getItem(this.TOKEN_KEY);
  }

  // ===== Get Role =====
  getRole(): string | null {
    return localStorage.getItem(this.ROLE_KEY);
  }
}
