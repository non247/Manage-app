// import { Injectable } from '@angular/core';
// import { CanActivate, Router } from '@angular/router';
// import { AuthService } from '../services/auth.service';

// @Injectable({
//   providedIn: 'root',
// })
// export class RoleGuard implements CanActivate {
//   constructor(private auth: AuthService, private router: Router) {}

//   canActivate(route: any): boolean {
//     const expectedRole = route.data['role'];
//     const userRole = this.auth.getRole();

//     if (userRole === expectedRole) {
//       return true;
//     }

//     // ถ้า role ไม่ตรง → เด้ง dashboard
//     this.router.navigate(['/dashboard']);
//     return false;
//   }
// }

// import { Injectable } from '@angular/core';
// import {
//   CanActivate,
//   Router,
//   ActivatedRouteSnapshot,
//   RouterStateSnapshot,
//   UrlTree,
// } from '@angular/router';
// import { AuthService } from '../services/auth.service';

// @Injectable({ providedIn: 'root' })
// export class RoleGuard implements CanActivate {
//   constructor(private auth: AuthService, private router: Router) {}

//   canActivate(
//     route: ActivatedRouteSnapshot,
//     state: RouterStateSnapshot
//   ): boolean | UrlTree {
//     const expectedRole = route.data['role'] as string | undefined;
//     const userRole = this.auth.getRole();

//     // ยังไม่ login
//     if (!userRole) {
//       return this.router.createUrlTree(['/login'], {
//         queryParams: { returnUrl: state.url },
//       });
//     }

//     // route ไม่ได้กำหนด role → ให้ผ่าน (หรือจะ return false ก็ได้ตาม design)
//     if (!expectedRole) return true;

//     // role ตรง
//     if (userRole === expectedRole) return true;

//     // role ไม่ตรง → เด้งไปหน้าที่เหมาะกับ role
//     const fallback = userRole === 'admin' ? '/product' : '/dashboard';
//     return this.router.createUrlTree([fallback]);
//   }
// }

import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {
    const expectedRole = route.data['role'] as string | undefined;

    // ✅ ยังไม่ login ให้ AuthGuard จัดการ (หรือส่ง login ที่นี่ก็ได้)
    if (!this.auth.isLoggedIn()) {
      return this.router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
    }

    // ถ้า route ไม่กำหนด role ก็ผ่าน
    if (!expectedRole) return true;

    const userRole = this.auth.getRole();

    // ✅ normalize role ให้ชัวร์
    const role = (userRole || '').toLowerCase();

    if (role === expectedRole) return true;

    // role ไม่ตรง → ส่งไปหน้าตาม role
    const fallback = role === 'admin' ? '/product' : '/dashboard';
    return this.router.createUrlTree([fallback]);
  }
}
