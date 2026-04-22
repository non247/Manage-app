import { CommonModule, NgIf, isPlatformBrowser } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import Swal from 'sweetalert2';
import { AuthService } from '../../core/services/auth.service';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, NgIf, CommonModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  animations: [
    trigger('slideForm', [
      transition(':enter', [
        style({
          transform: 'translateX(-80px) translateZ(0)',
        }),
        animate(
          '420ms cubic-bezier(0.16, 1, 0.3, 1)',
          style({
            transform: 'translateX(0) translateZ(0)',
          })
        ),
      ]),
    ]),
  ],
})
export class LoginComponent implements OnInit {
  Username: string = '';
  Password: string = '';
  errorMessage: string = '';
  showPassword: boolean = false;

  private readonly platformId = inject(PLATFORM_ID);

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly auth: AuthService
  ) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.route.queryParams.subscribe((params) => {
      if (params['logoutSuccess'] === 'true') {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'ออกจากระบบเรียบร้อยแล้ว',
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true,
        });

        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { logoutSuccess: null },
          queryParamsHandling: 'merge',
          replaceUrl: true,
        });
      }
    });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  login() {
    this.errorMessage = '';

    this.auth.login(this.Username, this.Password).subscribe({
      next: (res) => {
        const role = res.role;

        this.router.navigate([role === 'admin' ? '/dashboard' : '/purchase'], {
          state: { loginSuccess: true },
        });
      },
      error: () => {
        this.errorMessage = 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง';
      },
    });
  }
}
