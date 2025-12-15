// import { Component } from '@angular/core';
// import { Router } from '@angular/router';
// import { FormsModule } from '@angular/forms';
// import { NgIf } from '@angular/common';

// @Component({
//   selector: 'app-login',
//   standalone: true,
//   imports: [FormsModule, NgIf],
//   templateUrl: './login.component.html',
//   styleUrl: './login.component.scss'
// })
// export class LoginComponent {
//   Username: string = '';
//   Password: string = '';
//   errorMessage: string = '';

//   constructor(private router: Router) {}

//   togglePasswordVisibility() { // แสดงรหัสผ่าน
//     const input = document.getElementById('passwordinput') as HTMLInputElement;
//     input.type = input.type === 'password' ? 'text' : 'password';
//   }
//   login() {
//     if (this.Username === '' && this.Password === '') {
//       this.router.navigate(['/dashboard']);
//     } else {
//       this.errorMessage = 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง';
//     }
//   }
// }
// // console.log()
import { CommonModule, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, NgIf, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  Username: string = '';
  Password: string = '';
  errorMessage: string = '';

  showPassword: boolean = false;
  showLogoutMessage: boolean = false;

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // ตรวจสอบ query param ว่ามี logoutSuccess หรือไม่
    this.route.queryParams.subscribe((params) => {
      if (params['logoutSuccess'] === 'true') {
        this.showLogoutMessage = true;
        // ซ่อน message หลัง 3 วินาที
        setTimeout(() => {
          this.showLogoutMessage = false;
        }, 5000);
      }
    });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  login() {
    if (this.Username === '' && this.Password === '') {
      this.router.navigate(['/dashboard']);
    } else {
      this.errorMessage = 'Username or password is incorrect.';
    }
  }
}
