import { CommonModule, NgIf, isPlatformBrowser } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import Swal from 'sweetalert2';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, NgIf, CommonModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
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

    // ✅ toast หลัง logout
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

        // ✅ ส่ง state ไป dashboard เพื่อใช้แสดง welcome toast
        this.router.navigate([role === 'admin' ? '/product' : '/dashboard'], {
          state: { loginSuccess: true },
        });
      },
      error: () => {
        this.errorMessage = 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง';
      },
    });
  }
}
