// import { Injectable } from '@angular/core';

// @Injectable({
//   providedIn: 'root',
// })
// export class AuthService {
//   private TOKEN_KEY = 'token';
//   private ROLE_KEY = 'role';

//   // ===== Login =====
//   login(username: string, password: string): boolean {
//     // ===== Mock User =====
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

//     return false;
//   }

//   // ===== Logout =====
//   logout() {
//     localStorage.removeItem(this.TOKEN_KEY);
//     localStorage.removeItem(this.ROLE_KEY);
//   }

//   // ===== Check Login =====
//   isLoggedIn(): boolean {
//     return !!localStorage.getItem(this.TOKEN_KEY);
//   }

//   // ===== Get Role =====
//   getRole(): string | null {
//     return localStorage.getItem(this.ROLE_KEY);
//   }
// }

import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private TOKEN_KEY = 'token';
  private ROLE_KEY = 'role';
  private USERS_KEY = 'users'; // เก็บ user ที่สมัคร

  // =========================
  // ===== Register =====
  // =========================
  register(
    username: string,
    password: string,
    role: string
  ): boolean {
    const users = this.getUsers();

    // เช็ค username ซ้ำ
    const userExists = users.find(
      (u: any) => u.username === username
    );

    if (userExists) {
      return false;
    }

    // เพิ่ม user ใหม่
    users.push({ username, password, role });

    localStorage.setItem(
      this.USERS_KEY,
      JSON.stringify(users)
    );

    return true;
  }

  // =========================
  // ===== Login =====
  // =========================
  login(username: string, password: string): boolean {
    // ===== Mock User (ของเดิม) =====
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

    // ===== User จาก Register =====
    const users = this.getUsers();

    const user = users.find(
      (u: any) =>
        u.username === username &&
        u.password === password
    );

    if (user) {
      localStorage.setItem(
        this.TOKEN_KEY,
        'user-token'
      );
      localStorage.setItem(
        this.ROLE_KEY,
        user.role
      );
      return true;
    }

    return false;
  }

  // =========================
  // ===== Logout =====
  // =========================
  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.ROLE_KEY);
  }

  // =========================
  // ===== Check Login =====
  // =========================
  isLoggedIn(): boolean {
    return !!localStorage.getItem(this.TOKEN_KEY);
  }

  // =========================
  // ===== Get Role =====
  // =========================
  getRole(): string | null {
    return localStorage.getItem(this.ROLE_KEY);
  }

  // =========================
  // ===== Get Users =====
  // =========================
  getUsers() {
    return JSON.parse(
      localStorage.getItem(this.USERS_KEY) || '[]'
    );
  }
}
