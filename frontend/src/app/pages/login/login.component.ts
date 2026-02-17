// import { CommonModule, NgIf } from '@angular/common';
// import { Component, OnInit } from '@angular/core';
// import { FormsModule } from '@angular/forms';
// import { ActivatedRoute, Router,RouterModule  } from '@angular/router';
// import { AuthService } from '../../core/services/auth.service';

// @Component({
//   selector: 'app-login',
//   standalone: true,
//   imports: [FormsModule, NgIf, CommonModule, RouterModule],
//   templateUrl: './login.component.html',
//   styleUrls: ['./login.component.scss'],
// })
// export class LoginComponent implements OnInit {
//   Username: string = '';
//   Password: string = '';
//   errorMessage: string = '';

//   showPassword: boolean = false;
//   showLogoutMessage: boolean = false;

//   constructor(
//     private readonly router: Router,
//     private readonly route: ActivatedRoute,
//     private readonly auth: AuthService
//   ) {}

//   ngOnInit(): void {
//     // ===== แสดงข้อความหลัง logout =====
//     this.route.queryParams.subscribe((params) => {
//       if (params['logoutSuccess'] === 'true') {
//         this.showLogoutMessage = true;

//         setTimeout(() => {
//           this.showLogoutMessage = false;
//         }, 5000);
//       }
//     });

//     // ===== ถ้า login แล้ว → เด้ง dashboard =====
//     if (this.auth.isLoggedIn()) {
//       this.router.navigate(['/dashboard']);
//     }
//   }

//   // ===== Toggle Password =====
//   togglePasswordVisibility() {
//     this.showPassword = !this.showPassword;
//   }

//   // ===== Login =====
// login() {
//   const success = this.auth.login(this.Username, this.Password);

//   if (success) {
//     const role = this.auth.getRole();

//     if (role === 'admin') {
//       this.router.navigate(['/product']);
//     } else {
//       this.router.navigate(['/dashboard']);
//     }
//   } else {
//     this.errorMessage = 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง';
//   }
// }
// }

import { CommonModule, NgIf, isPlatformBrowser } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
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
  showLogoutMessage: boolean = false;

  private platformId = inject(PLATFORM_ID);

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly auth: AuthService
  ) {}

  ngOnInit(): void {
    // ✅ SSR guard: อย่ารัน logic ที่แตะ localStorage บน server
    if (!isPlatformBrowser(this.platformId)) return;

    // ===== แสดงข้อความหลัง logout =====
    this.route.queryParams.subscribe((params) => {
      if (params['logoutSuccess'] === 'true') {
        this.showLogoutMessage = true;

        setTimeout(() => {
          this.showLogoutMessage = false;
        }, 5000);
      }
    });

    // ===== ถ้า login แล้ว → เด้งตาม role =====
    if (this.auth.isLoggedIn()) {
      const role = this.auth.getRole();
      this.router.navigate([role === 'admin' ? '/product' : '/dashboard']);
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

login() {
  this.errorMessage = '';

  this.auth.login(this.Username, this.Password).subscribe({
    next: (res) => {
      // res.role มาจาก backend
      const role = res.role;
      this.router.navigate([role === 'admin' ? '/product' : '/dashboard']);
    },
    error: () => {
      this.errorMessage = 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง';
    },
  });
}
}