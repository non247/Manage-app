import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  private readonly platformId = inject(PLATFORM_ID);

  constructor(
    private readonly auth: AuthService,
    private readonly router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | UrlTree {
    // ✅ SSR: อย่าเด้ง
    if (!isPlatformBrowser(this.platformId)) return true;

    const expectedRole = (
      route.data['role'] as string | undefined
    )?.toLowerCase();

    if (!this.auth.isLoggedIn()) {
      return this.router.createUrlTree(['/login'], {
        queryParams: { returnUrl: state.url },
      });
    }

    if (!expectedRole) return true;

    const role = (this.auth.getRole() || '').toLowerCase();

    if (role === expectedRole) return true;

    const fallback = role === 'admin' ? '/product' : '/dashboard';
    return this.router.createUrlTree([fallback]);
  }
}
