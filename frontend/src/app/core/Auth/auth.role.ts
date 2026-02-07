import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class RoleGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(route: any): boolean {
    const expectedRole = route.data['role'];
    const userRole = this.auth.getRole();

    if (userRole === expectedRole) {
      return true;
    }

    // ถ้า role ไม่ตรง → เด้ง dashboard
    this.router.navigate(['/dashboard']);
    return false;
  }
}
